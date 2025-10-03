const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// Página principal con información completa sobre ARM64
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WA-Automate - Playhunt (ARM64 Info)</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container { 
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #25d366, #128c7e);
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
        }
        h1 { 
          color: #25d366; 
          margin: 0 0 10px 0;
          font-size: 32px;
        }
        .subtitle {
          color: #666;
          font-size: 18px;
          margin-bottom: 30px;
        }
        .warning-box {
          background: #fff3cd;
          color: #856404;
          padding: 25px;
          border-radius: 15px;
          margin: 25px 0;
          border-left: 5px solid #ffc107;
        }
        .info-box {
          background: #d1ecf1;
          color: #0c5460;
          padding: 25px;
          border-radius: 15px;
          margin: 25px 0;
          border-left: 5px solid #17a2b8;
        }
        .success-box {
          background: #d4edda;
          color: #155724;
          padding: 25px;
          border-radius: 15px;
          margin: 25px 0;
          border-left: 5px solid #28a745;
        }
        .tech-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          font-family: monospace;
          font-size: 14px;
        }
        .solutions {
          background: #e7f3ff;
          padding: 25px;
          border-radius: 15px;
          margin: 25px 0;
        }
        .solutions h3 {
          color: #0056b3;
          margin-top: 0;
        }
        .solution-item {
          background: white;
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }
        ul {
          text-align: left;
          margin: 20px 0;
          padding-left: 20px;
        }
        li {
          margin: 8px 0;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          background: #25d366;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 25px;
          margin: 10px;
          transition: background 0.3s;
        }
        .button:hover {
          background: #128c7e;
        }
        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          background: #ffc107;
          border-radius: 50%;
          margin-right: 8px;
          animation: blink 2s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📱</div>
          <h1>WA-Automate para ARM64</h1>
          <p class="subtitle">Información sobre compatibilidad y alternativas</p>
        </div>
        
        <div class="warning-box">
          <h3><span class="status-indicator"></span>Estado: Modo Informativo</h3>
          <p><strong>WhatsApp Web requiere Google Chrome, que no está disponible nativamente para arquitectura ARM64.</strong></p>
          <p>Tu servidor está ejecutándose en ARM64, lo que impide el uso directo de Chrome/Chromium necesario para WhatsApp Web automation.</p>
        </div>

        <div class="tech-details">
          <strong>Detalles Técnicos:</strong><br>
          • Arquitectura: ${process.arch}<br>
          • Plataforma: ${process.platform}<br>
          • Node.js: ${process.version}<br>
          • Servidor: ARM64-based (aarch64)<br>
          • Chrome Status: No disponible para ARM64
        </div>

        <div class="info-box">
          <h3>🔍 ¿Por qué no funciona WhatsApp Web en ARM64?</h3>
          <ul>
            <li><strong>Google Chrome:</strong> Solo disponible oficialmente para arquitecturas x86_64</li>
            <li><strong>Chromium ARM64:</strong> Builds no oficiales con compatibilidad limitada</li>
            <li><strong>WhatsApp Web:</strong> Requiere APIs específicas de Chrome</li>
            <li><strong>Puppeteer:</strong> Depende de Chrome/Chromium funcional</li>
          </ul>
        </div>

        <div class="solutions">
          <h3>🛠️ Soluciones Recomendadas</h3>
          
          <div class="solution-item">
            <h4>1. Migrar a Servidor AMD64</h4>
            <p>La solución más directa es usar un servidor con arquitectura x86_64 (AMD64) donde Chrome está oficialmente soportado.</p>
          </div>

          <div class="solution-item">
            <h4>2. WhatsApp Business API</h4>
            <p>Usar la API oficial de WhatsApp Business, que no requiere automatización de navegador.</p>
            <p><a href="https://developers.facebook.com/docs/whatsapp" target="_blank" class="button">Ver Documentación</a></p>
          </div>

          <div class="solution-item">
            <h4>3. Servicios de Terceros</h4>
            <p>Utilizar servicios como Twilio, MessageBird o similar que ofrecen APIs de WhatsApp.</p>
          </div>

          <div class="solution-item">
            <h4>4. Contenedor x86_64</h4>
            <p>Ejecutar un contenedor con emulación x86_64 (rendimiento reducido pero funcional).</p>
          </div>
        </div>

        <div class="success-box">
          <h3>✅ Stack Actual Funcionando</h3>
          <p>El resto de tu stack está funcionando perfectamente:</p>
          <ul>
            <li><strong>N8N:</strong> ✅ Ejecutándose en n8n.playhunt.es</li>
            <li><strong>Ollama:</strong> ✅ Ejecutándose en ollama.playhunt.es</li>
            <li><strong>SSL Certificates:</strong> ✅ Válidos y activos</li>
            <li><strong>Docker Compose:</strong> ✅ Orquestación completa</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a href="/status" class="button">Ver Estado Técnico</a>
          <a href="https://n8n.playhunt.es" target="_blank" class="button">Ir a N8N</a>
          <a href="https://ollama.playhunt.es" target="_blank" class="button">Ir a Ollama</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Endpoints de API
app.get('/status', (req, res) => {
  res.json({ 
    status: 'informational', 
    message: 'WA-Automate information page - ARM64 compatibility details',
    architecture: process.arch,
    platform: process.platform,
    nodeVersion: process.version,
    limitation: 'Chrome not available for ARM64 architecture',
    workingServices: {
      n8n: 'https://n8n.playhunt.es',
      ollama: 'https://ollama.playhunt.es'
    },
    alternatives: [
      'Migrate to AMD64 server',
      'Use WhatsApp Business API',
      'Use third-party services (Twilio, etc)',
      'Run x86_64 container with emulation'
    ]
  });
});

app.get('/architecture', (req, res) => {
  res.json({
    arch: process.arch,
    platform: process.platform,
    nodeVersion: process.version,
    cpus: require('os').cpus().length,
    totalmem: Math.round(require('os').totalmem() / 1024 / 1024 / 1024) + ' GB',
    hostname: require('os').hostname()
  });
});

app.post('/send-message', (req, res) => {
  res.status(501).json({ 
    error: 'WhatsApp functionality not available',
    reason: 'ARM64 architecture limitation - Chrome not available',
    alternatives: [
      'Use WhatsApp Business API',
      'Use Twilio API for WhatsApp',
      'Deploy on AMD64 server'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 WA-Automate Information Server running on port ${PORT}`);
  console.log(`ℹ️  Providing ARM64 compatibility information`);
  console.log(`🌐 Access: http://localhost:${PORT}`);
  console.log(`📋 Architecture: ${process.arch}`);
  console.log(`💡 This server explains ARM64 limitations and provides alternatives`);
});