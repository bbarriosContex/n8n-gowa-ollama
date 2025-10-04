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

// Ruta principal para la interfaz de configuración de webhooks (debe ir antes de static)
app.get('/urls', basicAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'webhook-config.html'));
});

// Servir archivos estáticos para la interfaz web
app.use('/urls', express.static(path.join(__dirname, 'public')));

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

// Enviar webhook de prueba - Implementación interna
app.post('/urls/api/test', basicAuth, async (req, res) => {
    try {
        // Primero obtenemos la configuración actual
        const configResponse = await axios.get(`${WEBHOOK_MANAGER_URL}/api/config`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        
        if (!configResponse.data) {
            return res.status(500).json({ error: 'No se pudo obtener la configuración' });
        }
        
        const config = configResponse.data;
        const testPayload = req.body || {
            test: true,
            message: "Webhook de prueba",
            timestamp: new Date().toISOString(),
            source: "webhook-configurator"
        };
        
        // Enviar directamente al endpoint de webhook del webhook-manager
        const webhookResponse = await axios.post(`${WEBHOOK_MANAGER_URL}/webhook`, testPayload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        res.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            message: 'Webhook de prueba enviado correctamente',
            config: {
                urls: config.urls?.length || 0,
                enabled: config.enabled
            }
        });
    } catch (error) {
        console.error('Error enviando webhook de prueba:', error.message);
        res.status(500).json({ 
            error: 'Error enviando webhook de prueba',
            details: error.message
        });
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