const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8003;
const WA_AUTOMATE_URL = process.env.WA_AUTOMATE_URL || 'http://wa-automate-playhunt:3000';
const WEBHOOK_MANAGER_URL = process.env.WEBHOOK_MANAGER_URL || 'http://webhook-manager-playhunt:4000';
const AUTH_USER = process.env.BASIC_AUTH_USER || 'admin';
const AUTH_PASS = process.env.BASIC_AUTH_PASS || 'playhunt2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de autenticación básica
const basicAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="WhatsApp Server"');
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    if (username !== AUTH_USER || password !== AUTH_PASS) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    next();
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir archivos estáticos para la interfaz web
app.use('/urls/static', express.static(path.join(__dirname, 'public')));

// Ruta para la interfaz de configuración de webhooks
app.get('/urls', basicAuth, (req, res) => {
    res.send(getWebhookConfigHTML());
});

// Función que genera el HTML de la interfaz
function getWebhookConfigHTML() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurador de Webhooks - WhatsApp API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            color: #2d3748;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .header p {
            color: #718096;
            font-size: 16px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .card h2 {
            color: #2d3748;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #4a5568;
            font-weight: 600;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s ease;
            background: white;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
            background: #f7fafc;
            color: #4a5568;
            border: 2px solid #e2e8f0;
        }
        
        .btn-secondary:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
        }
        
        .btn-danger {
            background: #e53e3e;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c53030;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(229, 62, 62, 0.3);
        }
        
        .webhook-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }
        
        .webhook-item:hover {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        
        .webhook-url {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #2b6cb0;
            margin-bottom: 10px;
        }
        
        .webhook-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-success { background: #48bb78; }
        .status-error { background: #e53e3e; }
        .status-pending { background: #ed8936; }
        
        .logs-container {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
        
        .log-entry {
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .log-entry:last-child {
            border-bottom: none;
        }
        
        .log-timestamp {
            color: #6c757d;
            font-size: 11px;
            min-width: 150px;
        }
        
        .log-message {
            flex: 1;
            margin-left: 15px;
        }
        
        .log-success { color: #28a745; }
        .log-error { color: #dc3545; }
        .log-info { color: #17a2b8; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #6c757d;
            font-size: 14px;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border-color: #28a745;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border-color: #dc3545;
        }
        
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border-color: #17a2b8;
        }
        
        .tabs {
            display: flex;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 25px;
        }
        
        .tab {
            padding: 15px 25px;
            cursor: pointer;
            background: transparent;
            border: none;
            font-size: 16px;
            font-weight: 600;
            color: #718096;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            color: #667eea;
            border-bottom: 3px solid #667eea;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header, .card {
                padding: 20px;
            }
            
            .webhook-actions {
                flex-direction: column;
            }
            
            .btn {
                justify-content: center;
                margin-bottom: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                🔗 Configurador de Webhooks
            </h1>
            <p>Gestiona las configuraciones de webhooks para WhatsApp API de forma sencilla y visual</p>
        </div>
        
        <!-- Estadísticas -->
        <div class="stats-grid" id="stats-container">
            <div class="stat-card">
                <div class="stat-number" id="total-received">-</div>
                <div class="stat-label">Mensajes Recibidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-sent">-</div>
                <div class="stat-label">Webhooks Enviados</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-errors">-</div>
                <div class="stat-label">Errores</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="webhook-count">-</div>
                <div class="stat-label">URLs Configuradas</div>
            </div>
        </div>
        
        <!-- Tabs -->
        <div class="tabs">
            <button class="tab active" onclick="showTab('config')">⚙️ Configuración</button>
            <button class="tab" onclick="showTab('logs')">📋 Logs</button>
            <button class="tab" onclick="showTab('testing')">🧪 Testing</button>
        </div>
        
        <!-- Tab: Configuración -->
        <div id="config-tab" class="tab-content active">
            <div class="card">
                <h2>⚙️ Configuración General</h2>
                <div class="form-group">
                    <label>Estado del Webhook</label>
                    <select id="webhook-enabled">
                        <option value="true">✅ Habilitado</option>
                        <option value="false">❌ Deshabilitado</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Secreto para Firmas (opcional)</label>
                    <input type="password" id="webhook-secret" placeholder="Secreto para validar webhooks">
                </div>
                
                <div class="form-group">
                    <label>Intentos de Reenvío</label>
                    <input type="number" id="retry-attempts" min="1" max="10" value="3">
                </div>
                
                <div class="form-group">
                    <label>Delay entre Intentos (ms)</label>
                    <input type="number" id="retry-delay" min="100" max="10000" value="1000">
                </div>
                
                <button class="btn btn-primary" onclick="saveGeneralConfig()">
                    💾 Guardar Configuración
                </button>
            </div>
            
            <div class="card">
                <h2>🌐 URLs de Webhook</h2>
                <div class="form-group">
                    <label>Nueva URL de Webhook</label>
                    <input type="url" id="new-webhook-url" placeholder="https://tu-servidor.com/webhook">
                </div>
                
                <button class="btn btn-primary" onclick="addWebhookUrl()">
                    ➕ Añadir URL
                </button>
                
                <div id="webhook-urls-container" style="margin-top: 25px;">
                    <!-- URLs de webhook se cargarán aquí -->
                </div>
            </div>
        </div>
        
        <!-- Tab: Logs -->
        <div id="logs-tab" class="tab-content">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>📋 Logs de Actividad</h2>
                    <div>
                        <button class="btn btn-secondary" onclick="loadLogs()">🔄 Actualizar</button>
                        <button class="btn btn-danger" onclick="clearLogs()">🗑️ Limpiar</button>
                    </div>
                </div>
                
                <div class="logs-container" id="logs-container">
                    <div style="text-align: center; color: #6c757d; padding: 20px;">
                        <div class="loading"></div>
                        <p>Cargando logs...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tab: Testing -->
        <div id="testing-tab" class="tab-content">
            <div class="card">
                <h2>🧪 Pruebas de Webhook</h2>
                <p style="margin-bottom: 20px; color: #718096;">
                    Envía un webhook de prueba para verificar que las configuraciones funcionen correctamente.
                </p>
                
                <div class="form-group">
                    <label>Payload de Prueba (JSON)</label>
                    <textarea id="test-payload" rows="8" placeholder='{"test": true, "message": "Webhook de prueba", "timestamp": "2024-01-01T00:00:00Z"}'></textarea>
                </div>
                
                <button class="btn btn-primary" onclick="sendTestWebhook()">
                    🚀 Enviar Webhook de Prueba
                </button>
                
                <div id="test-results" style="margin-top: 20px;">
                    <!-- Resultados de prueba se mostrarán aquí -->
                </div>
            </div>
        </div>
    </div>

    <script>
        // Variables globales
        let webhookConfig = {};
        let webhookStats = {};
        
        // Función para realizar peticiones autenticadas
        async function apiRequest(url, options = {}) {
            const auth = btoa('admin:playhunt2024'); // Usar las credenciales configuradas
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + auth
                }
            };
            
            return fetch('/urls/api' + url, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });
        }
        
        // Funciones de navegación por tabs
        function showTab(tabName) {
            // Ocultar todos los tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remover clase active de todos los botones
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Mostrar el tab seleccionado
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');
        }
        
        // Cargar configuración inicial
        async function loadConfig() {
            try {
                const response = await apiRequest('/config');
                if (response.ok) {
                    webhookConfig = await response.json();
                    updateConfigUI();
                }
            } catch (error) {
                console.error('Error cargando configuración:', error);
            }
        }
        
        // Actualizar interfaz con la configuración
        function updateConfigUI() {
            document.getElementById('webhook-enabled').value = webhookConfig.enabled?.toString() || 'true';
            document.getElementById('webhook-secret').value = webhookConfig.secret || '';
            document.getElementById('retry-attempts').value = webhookConfig.retryAttempts || 3;
            document.getElementById('retry-delay').value = webhookConfig.retryDelay || 1000;
            
            updateWebhookUrls();
        }
        
        // Actualizar lista de URLs de webhook
        function updateWebhookUrls() {
            const container = document.getElementById('webhook-urls-container');
            
            if (!webhookConfig.urls || webhookConfig.urls.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay URLs configuradas</p>';
                return;
            }
            
            container.innerHTML = webhookConfig.urls.map((url, index) => `
                <div class="webhook-item">
                    <div class="webhook-url">${url}</div>
                    <div class="webhook-actions">
                        <button class="btn btn-secondary" onclick="testWebhookUrl('${url}')">
                            🧪 Probar
                        </button>
                        <button class="btn btn-danger" onclick="removeWebhookUrl(${index})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Guardar configuración general
        async function saveGeneralConfig() {
            const config = {
                enabled: document.getElementById('webhook-enabled').value === 'true',
                secret: document.getElementById('webhook-secret').value,
                retryAttempts: parseInt(document.getElementById('retry-attempts').value),
                retryDelay: parseInt(document.getElementById('retry-delay').value),
                urls: webhookConfig.urls || []
            };
            
            try {
                const response = await apiRequest('/config', {
                    method: 'POST',
                    body: JSON.stringify(config)
                });
                
                if (response.ok) {
                    webhookConfig = config;
                    showAlert('✅ Configuración guardada correctamente', 'success');
                    loadStats();
                } else {
                    showAlert('❌ Error guardando configuración', 'error');
                }
            } catch (error) {
                console.error('Error guardando configuración:', error);
                showAlert('❌ Error guardando configuración', 'error');
            }
        }
        
        // Añadir nueva URL de webhook
        async function addWebhookUrl() {
            const url = document.getElementById('new-webhook-url').value.trim();
            
            if (!url) {
                showAlert('❌ Por favor ingresa una URL válida', 'error');
                return;
            }
            
            if (!webhookConfig.urls) {
                webhookConfig.urls = [];
            }
            
            if (webhookConfig.urls.includes(url)) {
                showAlert('❌ Esta URL ya está configurada', 'error');
                return;
            }
            
            webhookConfig.urls.push(url);
            
            try {
                const response = await apiRequest('/config', {
                    method: 'POST',
                    body: JSON.stringify(webhookConfig)
                });
                
                if (response.ok) {
                    document.getElementById('new-webhook-url').value = '';
                    updateWebhookUrls();
                    loadStats();
                    showAlert('✅ URL añadida correctamente', 'success');
                } else {
                    webhookConfig.urls.pop(); // Revertir cambio
                    showAlert('❌ Error añadiendo URL', 'error');
                }
            } catch (error) {
                console.error('Error añadiendo URL:', error);
                webhookConfig.urls.pop(); // Revertir cambio
                showAlert('❌ Error añadiendo URL', 'error');
            }
        }
        
        // Eliminar URL de webhook
        async function removeWebhookUrl(index) {
            if (!confirm('¿Estás seguro de eliminar esta URL?')) {
                return;
            }
            
            const removedUrl = webhookConfig.urls[index];
            webhookConfig.urls.splice(index, 1);
            
            try {
                const response = await apiRequest('/config', {
                    method: 'POST',
                    body: JSON.stringify(webhookConfig)
                });
                
                if (response.ok) {
                    updateWebhookUrls();
                    loadStats();
                    showAlert('✅ URL eliminada correctamente', 'success');
                } else {
                    webhookConfig.urls.splice(index, 0, removedUrl); // Revertir cambio
                    showAlert('❌ Error eliminando URL', 'error');
                }
            } catch (error) {
                console.error('Error eliminando URL:', error);
                webhookConfig.urls.splice(index, 0, removedUrl); // Revertir cambio
                showAlert('❌ Error eliminando URL', 'error');
            }
        }
        
        // Cargar estadísticas
        async function loadStats() {
            try {
                const response = await apiRequest('/stats');
                if (response.ok) {
                    webhookStats = await response.json();
                    updateStatsUI();
                }
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
            }
        }
        
        // Actualizar estadísticas en la UI
        function updateStatsUI() {
            document.getElementById('total-received').textContent = webhookStats.totalReceived || 0;
            document.getElementById('total-sent').textContent = webhookStats.totalSent || 0;
            document.getElementById('total-errors').textContent = webhookStats.errors || 0;
            document.getElementById('webhook-count').textContent = (webhookConfig.urls || []).length;
        }
        
        // Cargar logs
        async function loadLogs() {
            try {
                const response = await apiRequest('/logs');
                if (response.ok) {
                    const logs = await response.json();
                    updateLogsUI(logs);
                }
            } catch (error) {
                console.error('Error cargando logs:', error);
            }
        }
        
        // Actualizar logs en la UI
        function updateLogsUI(logs) {
            const container = document.getElementById('logs-container');
            
            if (!logs || logs.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No hay logs disponibles</p>';
                return;
            }
            
            container.innerHTML = logs.reverse().map(log => {
                const timestamp = new Date(log.timestamp).toLocaleString();
                const statusClass = log.status === 'success' ? 'log-success' : (log.status === 'error' ? 'log-error' : 'log-info');
                const statusIcon = log.status === 'success' ? '✅' : (log.status === 'error' ? '❌' : 'ℹ️');
                
                return `
                    <div class="log-entry">
                        <div class="log-timestamp">${timestamp}</div>
                        <div class="log-message ${statusClass}">
                            ${statusIcon} ${log.type}: ${log.url || 'Sistema'} 
                            ${log.error ? '- ' + log.error : ''}
                            ${log.statusCode ? '(HTTP ' + log.statusCode + ')' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Limpiar logs
        async function clearLogs() {
            if (!confirm('¿Estás seguro de limpiar todos los logs?')) {
                return;
            }
            
            try {
                const response = await apiRequest('/logs', {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadLogs();
                    showAlert('✅ Logs limpiados correctamente', 'success');
                } else {
                    showAlert('❌ Error limpiando logs', 'error');
                }
            } catch (error) {
                console.error('Error limpiando logs:', error);
                showAlert('❌ Error limpiando logs', 'error');
            }
        }
        
        // Enviar webhook de prueba
        async function sendTestWebhook() {
            let payload;
            try {
                const payloadText = document.getElementById('test-payload').value.trim();
                payload = payloadText ? JSON.parse(payloadText) : {
                    test: true,
                    message: "Webhook de prueba",
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                showAlert('❌ JSON inválido en el payload', 'error');
                return;
            }
            
            try {
                const response = await apiRequest('/test', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    document.getElementById('test-results').innerHTML = `
                        <div class="alert alert-success">
                            ✅ <strong>Webhook enviado correctamente</strong><br>
                            Timestamp: ${result.timestamp}<br>
                            URLs procesadas: ${result.results?.length || 0}
                        </div>
                    `;
                    loadLogs();
                    loadStats();
                } else {
                    const error = await response.json();
                    document.getElementById('test-results').innerHTML = `
                        <div class="alert alert-error">
                            ❌ <strong>Error enviando webhook</strong><br>
                            ${error.error || 'Error desconocido'}
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error enviando webhook de prueba:', error);
                document.getElementById('test-results').innerHTML = `
                    <div class="alert alert-error">
                        ❌ <strong>Error enviando webhook</strong><br>
                        ${error.message}
                    </div>
                `;
            }
        }
        
        // Probar URL específica
        async function testWebhookUrl(url) {
            const payload = {
                test: true,
                message: "Prueba individual de URL",
                timestamp: new Date().toISOString(),
                targetUrl: url
            };
            
            try {
                const response = await apiRequest('/test', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    showAlert(`✅ Webhook enviado correctamente a ${url}`, 'success');
                    loadLogs();
                } else {
                    showAlert(`❌ Error enviando webhook a ${url}`, 'error');
                }
            } catch (error) {
                console.error('Error probando URL:', error);
                showAlert(`❌ Error probando ${url}`, 'error');
            }
        }
        
        // Mostrar alertas
        function showAlert(message, type) {
            // Remover alerta anterior si existe
            const existingAlert = document.querySelector('.alert');
            if (existingAlert) {
                existingAlert.remove();
            }
            
            // Crear nueva alerta
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = message;
            
            // Insertar al principio del contenedor
            const container = document.querySelector('.container');
            container.insertBefore(alert, container.firstChild.nextSibling);
            
            // Remover después de 5 segundos
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }
        
        // Inicializar aplicación
        document.addEventListener('DOMContentLoaded', function() {
            // Cargar datos iniciales
            loadConfig();
            loadStats();
            loadLogs();
            
            // Configurar payload de prueba por defecto
            document.getElementById('test-payload').value = JSON.stringify({
                test: true,
                message: "Webhook de prueba desde configurador",
                timestamp: new Date().toISOString(),
                source: "webhook-configurator"
            }, null, 2);
            
            // Auto-refresh cada 30 segundos
            setInterval(() => {
                loadStats();
                if (document.getElementById('logs-tab').classList.contains('active')) {
                    loadLogs();
                }
            }, 30000);
        });
    </script>
</body>
</html>`;
    
    res.send(html);
});

// API Endpoints que se comunican con el webhook-manager

// Obtener configuración
app.get('/urls/api/config', basicAuth, async (req, res) => {
    try {
        const response = await axios.get(`${WEBHOOK_MANAGER_URL}/api/config`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error obteniendo configuración:', error.message);
        res.status(500).json({ error: 'Error obteniendo configuración' });
    }
});

// Guardar configuración
app.post('/urls/api/config', basicAuth, async (req, res) => {
    try {
        const response = await axios.post(`${WEBHOOK_MANAGER_URL}/api/config`, req.body, {
            headers: {
                'Authorization': req.headers.authorization,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error guardando configuración:', error.message);
        res.status(500).json({ error: 'Error guardando configuración' });
    }
});

// Obtener estadísticas
app.get('/urls/api/stats', basicAuth, async (req, res) => {
    try {
        const response = await axios.get(`${WEBHOOK_MANAGER_URL}/api/stats`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// Obtener logs
app.get('/urls/api/logs', basicAuth, async (req, res) => {
    try {
        const response = await axios.get(`${WEBHOOK_MANAGER_URL}/api/logs`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error obteniendo logs:', error.message);
        res.status(500).json({ error: 'Error obteniendo logs' });
    }
});

// Limpiar logs
app.delete('/urls/api/logs', basicAuth, async (req, res) => {
    try {
        const response = await axios.delete(`${WEBHOOK_MANAGER_URL}/api/logs`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error limpiando logs:', error.message);
        res.status(500).json({ error: 'Error limpiando logs' });
    }
});

// Enviar webhook de prueba
app.post('/urls/api/test', basicAuth, async (req, res) => {
    try {
        const response = await axios.post(`${WEBHOOK_MANAGER_URL}/api/test`, req.body, {
            headers: {
                'Authorization': req.headers.authorization,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error enviando webhook de prueba:', error.message);
        res.status(500).json({ error: 'Error enviando webhook de prueba' });
    }
});

// Proxy para todas las demás rutas al wa-automate
app.use('/', createProxyMiddleware({
    target: WA_AUTOMATE_URL,
    changeOrigin: true,
    onProxyRes: function (proxyRes, req, res) {
        // Añadir headers CORS si es necesario
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With';
    },
    onError: function (err, req, res) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error' });
    }
}));

// Manejo de errores
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Server Extension listening on port ${PORT}`);
    console.log(`📱 WA-Automate URL: ${WA_AUTOMATE_URL}`);
    console.log(`🔗 Webhook Manager URL: ${WEBHOOK_MANAGER_URL}`);
    console.log(`🔐 Auth: ${AUTH_USER}:${AUTH_PASS}`);
    console.log(`🌐 Webhook config available at: http://localhost:${PORT}/urls`);
});
