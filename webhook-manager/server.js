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
// BASE_PATH para URLs externas, pero Apache hace strip, así que internamente no lo usamos
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

// Datos de configuración (en producción usaría una BD)
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

async function loadConfig() {
    try {
        await fs.ensureDir('/app/data');
        if (await fs.pathExists(configPath)) {
            webhookConfig = await fs.readJson(configPath);
        }
        if (await fs.pathExists(logsPath)) {
            const logs = await fs.readJson(logsPath);
            webhookLogs = logs.slice(-1000); // Mantener últimos 1000 logs
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

async function saveConfig() {
    try {
        await fs.writeJson(configPath, webhookConfig, { spaces: 2 });
        await fs.writeJson(logsPath, webhookLogs.slice(-1000), { spaces: 2 });
    } catch (error) {
        console.error('Error saving config:', error);
    }
}

// Middleware de autenticación básica
function basicAuth(req, res, next) {
    const auth = req.headers.authorization;
    
    if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Webhook Manager"');
        return res.status(401).json({ error: 'Authentication required' });
    }

    const credentials = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    const [username, password] = credentials;

    if (username === AUTH_USER && password === AUTH_PASS) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Webhook Manager"');
        return res.status(401).json({ error: 'Invalid credentials' });
    }
}

// Función para verificar firma HMAC
function verifySignature(payload, signature, secret) {
    if (!secret || !signature) return true; // Sin secreto = sin verificación
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
    
    const receivedSignature = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
    );
}

// Función para reenviar webhook a URLs configuradas
async function forwardWebhook(data, headers) {
    if (!webhookConfig.enabled || webhookConfig.urls.length === 0) {
        return;
    }

    const promises = webhookConfig.urls.map(async (url) => {
        let attempts = 0;
        const maxAttempts = webhookConfig.retryAttempts;

        while (attempts < maxAttempts) {
            try {
                const forwardHeaders = { 'Content-Type': 'application/json' };
                
                // Añadir firma si hay secreto
                if (webhookConfig.secret) {
                    const signature = crypto
                        .createHmac('sha256', webhookConfig.secret)
                        .update(JSON.stringify(data))
                        .digest('hex');
                    forwardHeaders['X-Hub-Signature-256'] = `sha256=${signature}`;
                }

                await axios.post(url, data, {
                    headers: forwardHeaders,
                    timeout: 10000
                });

                webhookStats.totalSent++;
                webhookLogs.push({
                    timestamp: new Date().toISOString(),
                    type: 'forward',
                    url,
                    status: 'success',
                    attempts: attempts + 1
                });
                
                break; // Éxito, salir del bucle de reintentos

            } catch (error) {
                attempts++;
                webhookStats.errors++;
                
                if (attempts >= maxAttempts) {
                    webhookLogs.push({
                        timestamp: new Date().toISOString(),
                        type: 'forward',
                        url,
                        status: 'error',
                        error: error.message,
                        attempts
                    });
                } else {
                    // Esperar antes del siguiente intento
                    await new Promise(resolve => setTimeout(resolve, webhookConfig.retryDelay));
                }
            }
        }
    });

    await Promise.all(promises);
    await saveConfig();
}

// RUTAS DE LA API

// Página principal
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Webhook Manager</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .card { box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: none; }
        .navbar { background: rgba(255,255,255,0.95) !important; backdrop-filter: blur(10px); }
        .stats-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .log-entry { font-family: 'Courier New', monospace; font-size: 0.9em; }
        .status-success { color: #28a745; }
        .status-error { color: #dc3545; }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <span class="navbar-brand mb-0 h1">
                <i class="fas fa-satellite-dish me-2"></i>WhatsApp Webhook Manager
            </span>
            <span class="navbar-text">
                <i class="fas fa-shield-alt me-1"></i>Seguro con SSL
            </span>
        </div>
    </nav>

    <div class="container mt-4">
        <!-- Estadísticas -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-download fa-2x mb-2"></i>
                        <h5 class="card-title">Recibidos</h5>
                        <h3 id="stat-received">-</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-upload fa-2x mb-2"></i>
                        <h5 class="card-title">Enviados</h5>
                        <h3 id="stat-sent">-</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                        <h5 class="card-title">Errores</h5>
                        <h3 id="stat-errors">-</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-clock fa-2x mb-2"></i>
                        <h5 class="card-title">Última actividad</h5>
                        <small id="stat-last">-</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Configuración -->
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-cogs me-2"></i>Configuración de Webhooks</h5>
                    </div>
                    <div class="card-body">
                        <form id="config-form">
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="webhook-enabled">
                                <label class="form-check-label" for="webhook-enabled">
                                    Habilitar reenvío de webhooks
                                </label>
                            </div>

                            <div class="mb-3">
                                <label for="webhook-urls" class="form-label">URLs de destino (una por línea)</label>
                                <textarea class="form-control" id="webhook-urls" rows="4" placeholder="https://tu-servidor.com/webhook&#10;https://otro-servidor.com/api/whatsapp"></textarea>
                            </div>

                            <div class="mb-3">
                                <label for="webhook-secret" class="form-label">Secreto HMAC (opcional)</label>
                                <input type="password" class="form-control" id="webhook-secret" placeholder="Secreto para firmar los webhooks">
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <label for="retry-attempts" class="form-label">Intentos de reenvío</label>
                                    <input type="number" class="form-control" id="retry-attempts" min="1" max="10" value="3">
                                </div>
                                <div class="col-md-6">
                                    <label for="retry-delay" class="form-label">Delay entre intentos (ms)</label>
                                    <input type="number" class="form-control" id="retry-delay" min="100" max="10000" value="1000">
                                </div>
                            </div>

                            <div class="mt-3">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-2"></i>Guardar Configuración
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="testWebhook()">
                                    <i class="fas fa-paper-plane me-2"></i>Enviar Prueba
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-info-circle me-2"></i>Estado del Sistema</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-2">
                            <strong>Endpoint webhook:</strong><br>
                            <code>https://wa.playhunt.es${BASE_PATH_EXTERNAL}/webhook</code>
                        </div>
                        <div class="mb-2">
                            <strong>Método:</strong> <span class="badge bg-success">POST</span>
                        </div>
                        <div class="mb-2">
                            <strong>Estado:</strong> <span id="system-status" class="badge bg-success">Activo</span>
                        </div>
                        <hr>
                        <small class="text-muted">
                            Configura este endpoint en tu servicio de WhatsApp para recibir webhooks automáticamente.
                        </small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Logs -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5><i class="fas fa-list-alt me-2"></i>Logs de Actividad</h5>
                <div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="refreshLogs()">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="clearLogs()">
                        <i class="fas fa-trash"></i> Limpiar
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div id="logs-container" style="max-height: 400px; overflow-y: auto;">
                    <!-- Los logs se cargarán aquí -->
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Configuración de autenticación
        const authHeader = 'Basic ' + btoa('admin:playhunt2024');
        
        // Función para hacer peticiones autenticadas
        async function apiRequest(url, options = {}) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = authHeader;
            options.headers['Content-Type'] = 'application/json';
            
            // Asegurar que la URL tenga el prefijo correcto para el frontend
            if (!url.startsWith('http') && !url.startsWith('/webhooks/')) {
                url = '/webhooks' + url;
            }
            
            console.log('Making request to:', url, 'with options:', options);
            const response = await fetch(url, options);
            console.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error('Error ' + response.status + ': ' + response.statusText);
            }
            return response.json();
        }

        // Cargar configuración actual
        async function loadConfig() {
            try {
                const config = await apiRequest('/api/config');
                document.getElementById('webhook-enabled').checked = config.enabled;
                document.getElementById('webhook-urls').value = config.urls.join('\\n');
                document.getElementById('webhook-secret').value = config.secret;
                document.getElementById('retry-attempts').value = config.retryAttempts;
                document.getElementById('retry-delay').value = config.retryDelay;
            } catch (error) {
                console.error('Error loading config:', error);
            }
        }

        // Cargar estadísticas
        async function loadStats() {
            try {
                const stats = await apiRequest('/api/stats');
                document.getElementById('stat-received').textContent = stats.totalReceived;
                document.getElementById('stat-sent').textContent = stats.totalSent;
                document.getElementById('stat-errors').textContent = stats.errors;
                document.getElementById('stat-last').textContent = stats.lastActivity ? 
                    new Date(stats.lastActivity).toLocaleString() : 'Nunca';
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        // Cargar logs
        async function loadLogs() {
            try {
                const logs = await apiRequest('/api/logs');
                const container = document.getElementById('logs-container');
                container.innerHTML = logs.map(log => \`
                    <div class="log-entry mb-2 p-2 border-start border-3 \${log.status === 'success' ? 'border-success' : 'border-danger'}">
                        <div class="d-flex justify-content-between">
                            <span class="fw-bold">\${log.type}</span>
                            <span class="text-muted">\${new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div>\${log.url || 'Sistema'}</div>
                        <div class="\${log.status === 'success' ? 'status-success' : 'status-error'}">
                            \${log.status === 'success' ? 'Éxito' : log.error || 'Error'}
                            \${log.attempts ? \` (intentos: \${log.attempts})\` : ''}
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Error loading logs:', error);
            }
        }

        // Guardar configuración
        document.getElementById('config-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const config = {
                enabled: document.getElementById('webhook-enabled').checked,
                urls: document.getElementById('webhook-urls').value.split('\\n').filter(url => url.trim()),
                secret: document.getElementById('webhook-secret').value,
                retryAttempts: parseInt(document.getElementById('retry-attempts').value),
                retryDelay: parseInt(document.getElementById('retry-delay').value)
            };

            try {
                await apiRequest('/api/config', {
                    method: 'POST',
                    body: JSON.stringify(config)
                });
                alert('Configuración guardada correctamente');
            } catch (error) {
                alert('Error al guardar la configuración');
            }
        });

        // Enviar webhook de prueba
        async function testWebhook() {
            try {
                console.log('Enviando webhook de prueba...');
                const result = await apiRequest('/api/test', { method: 'POST' });
                console.log('Resultado:', result);
                alert('Webhook de prueba enviado correctamente');
                setTimeout(() => {
                    loadLogs();
                    loadStats();
                }, 1000);
            } catch (error) {
                console.error('Error en testWebhook:', error);
                alert('Error al enviar webhook de prueba: ' + error.message);
            }
        }

        // Actualizar logs
        function refreshLogs() {
            loadLogs();
            loadStats();
        }

        // Limpiar logs
        async function clearLogs() {
            if (confirm('¿Estás seguro de que quieres limpiar todos los logs?')) {
                try {
                    await apiRequest('/api/logs', { method: 'DELETE' });
                    loadLogs();
                    loadStats();
                } catch (error) {
                    alert('Error al limpiar los logs');
                }
            }
        }

        // Cargar datos iniciales
        loadConfig();
        loadStats();
        loadLogs();

        // Auto-refresh cada 30 segundos
        setInterval(() => {
            loadStats();
            loadLogs();
        }, 30000);
    </script>
</body>
</html>
    `);
});

// Endpoint para recibir webhooks de WhatsApp
app.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-hub-signature-256'];
        let payload = req.body;

        // Si es raw, convertir a string
        if (Buffer.isBuffer(payload)) {
            payload = payload.toString('utf8');
        }

        // Si es string, parsearlo
        if (typeof payload === 'string') {
            payload = JSON.parse(payload);
        }

        webhookStats.totalReceived++;
        webhookStats.lastActivity = new Date().toISOString();

        // Log del webhook recibido
        webhookLogs.push({
            timestamp: new Date().toISOString(),
            type: 'received',
            status: 'success',
            event: payload.event || 'unknown',
            source: 'whatsapp'
        });

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
            error: error.message
        });
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API para obtener configuración
app.get('/api/config', basicAuth, (req, res) => {
    res.json(webhookConfig);
});

// API para actualizar configuración
app.post('/api/config', basicAuth, async (req, res) => {
    try {
        webhookConfig = { ...webhookConfig, ...req.body };
        await saveConfig();
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API para obtener estadísticas
app.get('/api/stats', basicAuth, (req, res) => {
    res.json(webhookStats);
});

// API para obtener logs
app.get('/api/logs', basicAuth, (req, res) => {
    res.json(webhookLogs.slice(-100)); // Últimos 100 logs
});

// API para limpiar logs
app.delete('/api/logs', basicAuth, async (req, res) => {
    webhookLogs = [];
    webhookStats = {
        totalReceived: 0,
        totalSent: 0,
        errors: 0,
        lastActivity: null
    };
    await saveConfig();
    res.json({ status: 'success' });
});

// API para enviar webhook de prueba
app.post('/api/test', basicAuth, async (req, res) => {
    try {
        const testData = {
            event: 'test',
            timestamp: new Date().toISOString(),
            payload: {
                message: 'Este es un webhook de prueba desde el Webhook Manager',
                source: 'webhook-manager'
            }
        };

        await forwardWebhook(testData, {});
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inicializar servidor
async function start() {
    await loadConfig();
    
    app.listen(PORT, () => {
        console.log(`🚀 Webhook Manager running on port ${PORT}`);
        console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
        console.log(`🌐 Web interface: http://localhost:${PORT}`);
        console.log(`👤 Credentials: ${AUTH_USER}:${AUTH_PASS}`);
    });
}

start().catch(console.error);