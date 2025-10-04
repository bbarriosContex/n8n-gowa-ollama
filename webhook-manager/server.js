const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;
const BASE_PATH_EXTERNAL = process.env.BASE_PATH || '';
const AUTH_USER = process.env.WEBHOOK_AUTH_USER || 'admin';
const AUTH_PASS = process.env.WEBHOOK_AUTH_PASS || 'playhunt2024';

// Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/json' }));

// Servir archivos estáticos
app.use('/static', express.static(path.join(__dirname, 'public')));

// Datos de configuración
let webhookConfig = {
    enabled: true,
    urls: [],
    secret: '',
    events: ['message', 'group.participants', 'message.ack'],
    retryAttempts: 3,
    retryDelay: 1000
};

let webhookLogs = [];
let webhookStats = {
    totalReceived: 0,
    totalSent: 0,
    errors: 0,
    lastActivity: null
};

// Cargar configuración si existe
const configPath = '/app/data/webhook-config.json';
const logsPath = '/app/data/webhook-logs.json';

const loadConfig = () => {
    try {
        if (fs.existsSync(configPath)) {
            const config = fs.readJsonSync(configPath);
            webhookConfig = { ...webhookConfig, ...config };
            console.log('Configuración cargada:', webhookConfig);
        }
        if (fs.existsSync(logsPath)) {
            webhookLogs = fs.readJsonSync(logsPath) || [];
            // Mantener solo los últimos 100 logs
            webhookLogs = webhookLogs.slice(-100);
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
};

const saveConfig = () => {
    try {
        fs.ensureDirSync('/app/data');
        fs.writeJsonSync(configPath, webhookConfig, { spaces: 2 });
        fs.writeJsonSync(logsPath, webhookLogs.slice(-100), { spaces: 2 });
    } catch (error) {
        console.error('Error guardando configuración:', error);
    }
};

// Middleware de autenticación básica
const basicAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Webhook Manager"');
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    if (username !== AUTH_USER || password !== AUTH_PASS) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    next();
};

// Función para validar webhook signature
const validateWebhookSignature = (payload, signature, secret) => {
    if (!secret || !signature) return true; // Si no hay secreto configurado, aceptar
    
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
        
        const receivedSignature = signature.replace('sha256=', '');
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(receivedSignature, 'hex')
        );
    } catch (error) {
        console.error('Error validating signature:', error);
        return false;
    }
};

// Función para reenviar webhooks
const forwardWebhook = async (payload, headers = {}) => {
    const promises = webhookConfig.urls.map(async (url) => {
        for (let attempt = 1; attempt <= webhookConfig.retryAttempts; attempt++) {
            try {
                const forwardHeaders = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'WhatsApp-Webhook-Forwarder/1.0'
                };

                // Agregar signature si hay secreto configurado
                if (webhookConfig.secret) {
                    const signature = crypto
                        .createHmac('sha256', webhookConfig.secret)
                        .update(JSON.stringify(payload))
                        .digest('hex');
                    forwardHeaders['X-Hub-Signature-256'] = `sha256=${signature}`;
                }

                const response = await axios.post(url, payload, {
                    headers: forwardHeaders,
                    timeout: 10000
                });

                webhookStats.totalSent++;
                
                webhookLogs.push({
                    timestamp: new Date().toISOString(),
                    type: 'forwarded',
                    status: 'success',
                    url: url,
                    statusCode: response.status,
                    attempt: attempt
                });

                console.log(`Webhook enviado a ${url} - Status: ${response.status}`);
                return { url, status: 'success', statusCode: response.status };

            } catch (error) {
                console.error(`Intento ${attempt} fallido para ${url}:`, error.message);
                
                if (attempt === webhookConfig.retryAttempts) {
                    webhookStats.errors++;
                    
                    webhookLogs.push({
                        timestamp: new Date().toISOString(),
                        type: 'forwarded',
                        status: 'error',
                        url: url,
                        error: error.message,
                        attempt: attempt
                    });
                    
                    return { url, status: 'error', error: error.message };
                }
                
                // Esperar antes del siguiente intento
                await new Promise(resolve => setTimeout(resolve, webhookConfig.retryDelay));
            }
        }
    });

    try {
        const results = await Promise.all(promises);
        saveConfig(); // Guardar logs
        return results;
    } catch (error) {
        console.error('Error en forwardWebhook:', error);
        return [];
    }
};

// Detectar tipo de mensaje
const detectMessageType = (message) => {
    if (!message) return 'unknown';
    
    // Verificar si es un mensaje de media basado en las propiedades
    if (message.type === 'image' || message.imageMessage) return 'image';
    if (message.type === 'video' || message.videoMessage) return 'video';
    if (message.type === 'audio' || message.audioMessage) return 'audio';
    if (message.type === 'document' || message.documentMessage) return 'document';
    if (message.type === 'sticker' || message.stickerMessage) return 'sticker';
    
    // Otros tipos de mensajes
    if (message.type === 'contact' || message.contactMessage) return 'contact';
    if (message.type === 'location' || message.locationMessage) return 'location';
    if (message.type === 'text' || message.extendedTextMessage || message.conversation) return 'text';
    
    // Receipts y eventos de grupo
    if (message.type === 'receipt' || message.receiptMessage) return 'receipt';
    if (message.type === 'group_participants') return 'group_participants';
    
    return 'text'; // Default a texto
};

// Procesar mensaje de media
const processMediaMessage = (message) => {
    if (!message) return null;
    
    const mediaInfo = {
        mediaPath: null,
        mimeType: null,
        caption: null,
        fileSize: null
    };
    
    // Extraer información según el tipo de media
    if (message.imageMessage) {
        mediaInfo.mediaPath = message.imageMessage.url || message.imageMessage.directPath;
        mediaInfo.mimeType = message.imageMessage.mimetype;
        mediaInfo.caption = message.imageMessage.caption;
        mediaInfo.fileSize = message.imageMessage.fileLength;
    } else if (message.videoMessage) {
        mediaInfo.mediaPath = message.videoMessage.url || message.videoMessage.directPath;
        mediaInfo.mimeType = message.videoMessage.mimetype;
        mediaInfo.caption = message.videoMessage.caption;
        mediaInfo.fileSize = message.videoMessage.fileLength;
    } else if (message.audioMessage) {
        mediaInfo.mediaPath = message.audioMessage.url || message.audioMessage.directPath;
        mediaInfo.mimeType = message.audioMessage.mimetype;
        mediaInfo.fileSize = message.audioMessage.fileLength;
    } else if (message.documentMessage) {
        mediaInfo.mediaPath = message.documentMessage.url || message.documentMessage.directPath;
        mediaInfo.mimeType = message.documentMessage.mimetype;
        mediaInfo.caption = message.documentMessage.caption;
        mediaInfo.fileSize = message.documentMessage.fileLength;
    } else if (message.stickerMessage) {
        mediaInfo.mediaPath = message.stickerMessage.url || message.stickerMessage.directPath;
        mediaInfo.mimeType = message.stickerMessage.mimetype;
        mediaInfo.fileSize = message.stickerMessage.fileLength;
    }
    
    return mediaInfo.mediaPath ? mediaInfo : null;
};

// Cargar configuración al inicio
loadConfig();

// Rutas de API

// Configuración
app.get('/api/config', basicAuth, (req, res) => {
    res.json(webhookConfig);
});

app.post('/api/config', basicAuth, (req, res) => {
    try {
        webhookConfig = { ...webhookConfig, ...req.body };
        saveConfig();
        res.json({ status: 'updated', config: webhookConfig });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Estadísticas
app.get('/api/stats', basicAuth, (req, res) => {
    res.json(webhookStats);
});

// Logs
app.get('/api/logs', basicAuth, (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(webhookLogs.slice(-limit));
});

app.delete('/api/logs', basicAuth, (req, res) => {
    webhookLogs = [];
    saveConfig();
    res.json({ status: 'cleared' });
});

// Endpoint para mensajes de media
app.get('/api/media', basicAuth, (req, res) => {
    try {
        // Filtrar logs que son mensajes de media
        const mediaMessages = webhookLogs.filter(log => 
            log.type === 'received' && 
            log.messageType && 
            ['image', 'video', 'audio', 'document', 'sticker'].includes(log.messageType)
        );
        
        res.json(mediaMessages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para descargar media
app.get('/api/media/download', basicAuth, async (req, res) => {
    try {
        const mediaPath = req.query.path;
        if (!mediaPath) {
            return res.status(400).json({ error: 'Media path required' });
        }
        
        // Hacer proxy a go-whatsapp para descargar el archivo
        const waResponse = await axios.get(`http://wa-automate-playhunt:3000${mediaPath}`, {
            responseType: 'stream',
            timeout: 30000
        });
        
        // Reenviar headers relevantes
        res.set({
            'Content-Type': waResponse.headers['content-type'] || 'application/octet-stream',
            'Content-Length': waResponse.headers['content-length'],
            'Content-Disposition': waResponse.headers['content-disposition']
        });
        
        waResponse.data.pipe(res);
        
    } catch (error) {
        console.error('Error downloading media:', error);
        res.status(500).json({ error: 'Failed to download media file' });
    }
});

// Webhook principal - sin autenticación para recibir de go-whatsapp
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));
        
        let payload = req.body;
        
        // Verificar signature si hay secreto configurado
        const signature = req.headers['x-hub-signature-256'] || req.headers['x-signature'];
        if (webhookConfig.secret && signature) {
            const isValid = validateWebhookSignature(payload, signature, webhookConfig.secret);
            if (!isValid) {
                console.error('Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        // Si es string, parsearlo
        if (typeof payload === 'string') {
            payload = JSON.parse(payload);
        }

        // Detectar tipo de mensaje y procesar media si aplica
        let messageType = 'unknown';
        let processedMedia = null;
        
        if (payload.message) {
            messageType = detectMessageType(payload.message);
            if (['image', 'video', 'audio', 'document', 'sticker'].includes(messageType)) {
                processedMedia = processMediaMessage(payload.message);
            }
        }

        webhookStats.totalReceived++;
        webhookStats.lastActivity = new Date().toISOString();

        // Log del webhook recibido con información adicional
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'received',
            status: 'success',
            event: payload.event || 'message',
            source: 'whatsapp',
            messageType: messageType,
            from: payload.info?.remoteJid || payload.from,
            messageId: payload.info?.id || payload.messageId
        };
        
        if (processedMedia) {
            logEntry.processedMedia = processedMedia;
        }
        
        webhookLogs.push(logEntry);

        // Reenviar a URLs configuradas si está habilitado
        if (webhookConfig.enabled && webhookConfig.urls.length > 0) {
            await forwardWebhook(payload, req.headers);
        }

        res.status(200).json({ status: 'ok', processed: webhookConfig.enabled });
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        webhookStats.errors++;
        
        webhookLogs.push({
            timestamp: new Date().toISOString(),
            type: 'received',
            status: 'error',
            error: error.message,
            source: 'whatsapp'
        });
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test endpoint
app.get('/api/test', basicAuth, (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        config: webhookConfig,
        stats: webhookStats
    });
});

// Interfaz web
app.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Webhook Manager</title>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body class="bg-light">
    <div class="container-fluid py-3">
        <div class="row">
            <div class="col-12">
                <h1 class="h3 mb-4">🔗 WhatsApp Webhook Manager</h1>
            </div>
        </div>
        
        <!-- Configuración -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">⚙️ Configuración</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Estado:</label>
                            <span id="webhook-status" class="badge bg-secondary">Cargando...</span>
                        </div>
                        <div class="mb-3">
                            <label for="webhook-urls" class="form-label">URLs de Destino:</label>
                            <textarea id="webhook-urls" class="form-control" rows="3" placeholder="https://ejemplo.com/webhook"></textarea>
                            <div class="form-text">Una URL por línea</div>
                        </div>
                        <div class="mb-3">
                            <label for="webhook-secret" class="form-label">Secreto (opcional):</label>
                            <input type="password" id="webhook-secret" class="form-control" placeholder="Secreto para firmar webhooks">
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="webhook-enabled">
                                <label class="form-check-label" for="webhook-enabled">
                                    Habilitar reenvío de webhooks
                                </label>
                            </div>
                        </div>
                        <button id="save-config" class="btn btn-primary">💾 Guardar</button>
                        <button id="test-webhook" class="btn btn-success ms-2">🧪 Test</button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">📊 Estadísticas</h5>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="text-primary">
                                    <strong id="stat-received">0</strong><br>
                                    <small>Recibidos</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="text-success">
                                    <strong id="stat-sent">0</strong><br>
                                    <small>Enviados</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="text-danger">
                                    <strong id="stat-errors">0</strong><br>
                                    <small>Errores</small>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="text-muted text-center">
                            <small>Última actividad: <span id="last-activity">-</span></small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mensajes de Media -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">📱 Mensajes de Media</h5>
                        <button id="refresh-media" class="btn btn-sm btn-outline-primary">🔄 Actualizar</button>
                    </div>
                    <div class="card-body">
                        <div id="media-messages" class="table-responsive">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Logs -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">📋 Logs de Actividad</h5>
                        <div>
                            <button id="refresh-logs" class="btn btn-sm btn-outline-primary">🔄 Actualizar</button>
                            <button id="clear-logs" class="btn btn-sm btn-outline-danger ms-2">🗑️ Limpiar</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="webhook-logs" class="table-responsive">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Configuración de autenticación
        const auth = btoa('admin:playhunt2024');
        
        // Función para hacer requests autenticados
        function apiRequest(url, options = {}) {
            const headers = {
                'Authorization': 'Basic ' + auth,
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            return fetch(url, {
                ...options,
                headers: headers
            });
        }
        
        // Cargar configuración
        function loadConfig() {
            apiRequest('/api/config')
                .then(response => response.json())
                .then(config => {
                    document.getElementById('webhook-enabled').checked = config.enabled;
                    document.getElementById('webhook-urls').value = config.urls.join('\\n');
                    document.getElementById('webhook-secret').value = config.secret || '';
                    document.getElementById('webhook-status').textContent = config.enabled ? 'Habilitado' : 'Deshabilitado';
                    document.getElementById('webhook-status').className = 'badge ' + (config.enabled ? 'bg-success' : 'bg-secondary');
                })
                .catch(error => console.error('Error loading config:', error));
        }
        
        // Cargar estadísticas
        function loadStats() {
            apiRequest('/api/stats')
                .then(response => response.json())
                .then(stats => {
                    document.getElementById('stat-received').textContent = stats.totalReceived || 0;
                    document.getElementById('stat-sent').textContent = stats.totalSent || 0;
                    document.getElementById('stat-errors').textContent = stats.errors || 0;
                    document.getElementById('last-activity').textContent = stats.lastActivity ? 
                        new Date(stats.lastActivity).toLocaleString() : '-';
                })
                .catch(error => console.error('Error loading stats:', error));
        }
        
        // Cargar mensajes de media
        function loadMediaMessages() {
            apiRequest('/api/media')
                .then(response => response.json())
                .then(messages => {
                    const container = document.getElementById('media-messages');
                    
                    if (messages.length === 0) {
                        container.innerHTML = '<p class="text-muted text-center">No hay mensajes de media registrados</p>';
                        return;
                    }
                    
                    let html = '<table class="table table-sm"><thead><tr><th>Fecha</th><th>Tipo</th><th>De</th><th>Archivo</th><th>Acción</th></tr></thead><tbody>';
                    
                    messages.forEach(msg => {
                        const date = new Date(msg.timestamp).toLocaleString();
                        const mediaInfo = msg.processedMedia || {};
                        const downloadBtn = mediaInfo.mediaPath ? 
                            '<button class="btn btn-sm btn-primary" onclick="downloadMedia(\\''+mediaInfo.mediaPath+'\\')">📥 Descargar</button>' : 
                            '-';
                        
                        html += '<tr>';
                        html += '<td>' + date + '</td>';
                        html += '<td><span class="badge bg-info">' + (msg.messageType || 'unknown') + '</span></td>';
                        html += '<td>' + (msg.from || '-') + '</td>';
                        html += '<td>' + (mediaInfo.mimeType || '-') + '</td>';
                        html += '<td>' + downloadBtn + '</td>';
                        html += '</tr>';
                    });
                    
                    html += '</tbody></table>';
                    container.innerHTML = html;
                })
                .catch(error => console.error('Error loading media messages:', error));
        }
        
        // Descargar archivo de media
        function downloadMedia(mediaPath) {
            window.open('/api/media/download?path=' + encodeURIComponent(mediaPath), '_blank');
        }
        
        // Cargar logs
        function loadLogs() {
            apiRequest('/api/logs?limit=20')
                .then(response => response.json())
                .then(logs => {
                    const container = document.getElementById('webhook-logs');
                    
                    if (logs.length === 0) {
                        container.innerHTML = '<p class="text-muted text-center">No hay logs disponibles</p>';
                        return;
                    }
                    
                    let html = '<table class="table table-sm"><thead><tr><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Detalles</th></tr></thead><tbody>';
                    
                    logs.reverse().forEach(log => {
                        const date = new Date(log.timestamp).toLocaleString();
                        const status = log.status === 'success' ? 'success' : 'danger';
                        const badge = '<span class="badge bg-' + status + '">' + log.status + '</span>';
                        
                        let details = log.event || log.url || '-';
                        if (log.error) details = log.error;
                        if (log.messageType) details += ' (' + log.messageType + ')';
                        
                        html += '<tr>';
                        html += '<td>' + date + '</td>';
                        html += '<td>' + log.type + '</td>';
                        html += '<td>' + badge + '</td>';
                        html += '<td>' + details + '</td>';
                        html += '</tr>';
                    });
                    
                    html += '</tbody></table>';
                    container.innerHTML = html;
                })
                .catch(error => console.error('Error loading logs:', error));
        }
        
        // Guardar configuración
        document.getElementById('save-config').addEventListener('click', function() {
            const config = {
                enabled: document.getElementById('webhook-enabled').checked,
                urls: document.getElementById('webhook-urls').value.split('\\n').filter(url => url.trim()),
                secret: document.getElementById('webhook-secret').value.trim()
            };
            
            apiRequest('/api/config', {
                method: 'POST',
                body: JSON.stringify(config)
            })
                .then(response => response.json())
                .then(result => {
                    if (result.status === 'updated') {
                        alert('✅ Configuración guardada');
                        loadConfig();
                    }
                })
                .catch(error => {
                    console.error('Error saving config:', error);
                    alert('❌ Error guardando configuración');
                });
        });
        
        // Test webhook
        document.getElementById('test-webhook').addEventListener('click', function() {
            apiRequest('/api/test')
                .then(response => response.json())
                .then(result => {
                    alert('✅ Test exitoso\\n\\nEstado: ' + result.status + '\\nTimestamp: ' + result.timestamp);
                })
                .catch(error => {
                    console.error('Error testing webhook:', error);
                    alert('❌ Error en el test');
                });
        });
        
        // Limpiar logs
        document.getElementById('clear-logs').addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres limpiar todos los logs?')) {
                apiRequest('/api/logs', { method: 'DELETE' })
                    .then(response => response.json())
                    .then(result => {
                        if (result.status === 'cleared') {
                            alert('✅ Logs limpiados');
                            loadLogs();
                            loadStats();
                        }
                    })
                    .catch(error => {
                        console.error('Error clearing logs:', error);
                        alert('❌ Error limpiando logs');
                    });
            }
        });
        
        // Event listeners para refresh
        document.getElementById('refresh-logs').addEventListener('click', loadLogs);
        document.getElementById('refresh-media').addEventListener('click', loadMediaMessages);
        
        // Cargar datos iniciales
        loadConfig();
        loadStats();
        loadLogs();
        loadMediaMessages();
        
        // Auto-refresh cada 30 segundos
        setInterval(() => {
            loadStats();
            loadLogs();
            loadMediaMessages();
        }, 30000);
    </script>
</body>
</html>
    `;
    
    res.send(html);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Webhook Manager listening on port ${PORT}`);
    console.log(`📝 Auth: ${AUTH_USER}:${AUTH_PASS}`);
    console.log(`⚙️ Config loaded:`, webhookConfig);
});