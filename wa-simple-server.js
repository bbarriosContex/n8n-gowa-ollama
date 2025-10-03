const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// Estado simulado
let isConnected = false;
let qrCode = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="; // QR de ejemplo

// Página principal con interfaz mejorada
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WA-Automate - Playhunt</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          background: linear-gradient(135deg, #25d366, #128c7e);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 20px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 500px;
          width: 90%;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: #25d366;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
        }
        h1 { 
          color: #25d366; 
          margin-bottom: 10px;
          font-size: 2.5em;
        }
        .subtitle { 
          color: #666; 
          margin-bottom: 30px;
          font-size: 1.2em;
        }
        .status { 
          padding: 15px; 
          border-radius: 10px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .demo { 
          background: linear-gradient(45deg, #ff6b6b, #ffa500); 
          color: white;
        }
        .qr-section {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 15px;
          margin: 30px 0;
        }
        .qr-placeholder {
          width: 200px;
          height: 200px;
          background: #e9ecef;
          border: 3px dashed #ccc;
          border-radius: 15px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: #666;
        }
        .api-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          text-align: left;
        }
        .endpoint {
          background: #e9ecef;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
          font-family: monospace;
          font-size: 0.9em;
        }
        .btn {
          background: #25d366;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 1em;
          cursor: pointer;
          margin: 10px;
          transition: background 0.3s;
        }
        .btn:hover { background: #128c7e; }
        .warning {
          background: #fff3cd;
          color: #856404;
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
        }
      </style>
      <script>
        function testAPI() {
          fetch('/status')
            .then(r => r.json())
            .then(data => alert('Estado: ' + JSON.stringify(data, null, 2)))
            .catch(e => alert('Error: ' + e.message));
        }
        
        function sendTestMessage() {
          const phone = prompt('Ingresa el número (ej: 34600000000):');
          const message = prompt('Mensaje a enviar:');
          
          if (phone && message) {
            fetch('/sendText', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chatId: phone + '@c.us',
                text: message
              })
            })
            .then(r => r.json())
            .then(data => alert('Resultado: ' + JSON.stringify(data, null, 2)))
            .catch(e => alert('Error: ' + e.message));
          }
        }
        
        // Auto-refresh cada 30 segundos
        setTimeout(() => location.reload(), 30000);
      </script>
    </head>
    <body>
      <div class="container">
        <div class="logo">📱</div>
        <h1>WA-Automate</h1>
        <p class="subtitle">Playhunt WhatsApp API</p>
        
        <div class="status demo">
          🚧 MODO DEMO - Para desarrollo y pruebas
        </div>
        
        <div class="warning">
          <strong>⚠️ Nota:</strong> Esta es una versión de demostración. 
          Para usar WhatsApp real necesitas una imagen Docker con Chrome completo 
          en una arquitectura AMD64.
        </div>
        
        <div class="qr-section">
          <h3>📱 Conexión WhatsApp</h3>
          <div class="qr-placeholder">
            <div style="font-size: 3em;">📱</div>
            <div>QR Code aquí</div>
            <small>(Requiere Chrome)</small>
          </div>
          <p>En la versión real, aquí aparecería el código QR de WhatsApp</p>
        </div>
        
        <div class="api-section">
          <h3>🔌 API Endpoints</h3>
          <div class="endpoint">GET /status - Estado de la conexión</div>
          <div class="endpoint">POST /sendText - Enviar mensaje</div>
          <div class="endpoint">GET /health - Health check</div>
          
          <button class="btn" onclick="testAPI()">🧪 Probar /status</button>
          <button class="btn" onclick="sendTestMessage()">📤 Probar envío</button>
        </div>
        
        <div style="margin-top: 30px; color: #666; font-size: 0.9em;">
          <p>✅ Servidor funcionando correctamente</p>
          <p>🌐 Puerto: ${PORT}</p>
          <p>⏰ Actualización automática en 30s</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Endpoints
app.get('/status', (req, res) => {
  res.json({
    status: 'demo',
    connected: false,
    message: 'Servidor WA-Automate en modo demo',
    server: 'Playhunt',
    timestamp: new Date().toISOString(),
    info: 'Para WhatsApp real necesitas Docker con Chrome en AMD64'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.post('/sendText', async (req, res) => {
  const { chatId, text } = req.body;
  
  if (!chatId || !text) {
    return res.status(400).json({
      success: false,
      error: 'chatId y text son requeridos'
    });
  }
  
  // Simulación de envío
  res.json({
    success: true,
    message: 'Mensaje enviado (DEMO)',
    data: {
      chatId,
      text,
      timestamp: new Date().toISOString(),
      note: 'Este es un modo de demostración. Para envíos reales necesitas WhatsApp conectado.'
    }
  });
});

app.get('/chats', (req, res) => {
  res.json({
    success: true,
    chats: [
      { id: 'demo@c.us', name: 'Chat Demo', lastMessage: 'Mensaje de prueba' }
    ],
    note: 'Datos de demostración'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    available: [
      'GET /',
      'GET /status', 
      'GET /health',
      'POST /sendText',
      'GET /chats'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 WA-Automate Demo Server iniciado');
  console.log('📱 Modo: DEMO (sin WhatsApp real)');
  console.log('🌐 Puerto:', PORT);
  console.log('✅ Servidor listo en: http://localhost:' + PORT);
});

console.log('='.repeat(50));
console.log('  WA-AUTOMATE DEMO SERVER');
console.log('='.repeat(50));
console.log('📋 Estado: Servidor de demostración');
console.log('🔗 URL: https://wa.playhunt.es');
console.log('📱 Para WhatsApp real necesitas:');
console.log('   - Servidor AMD64 (no ARM)');
console.log('   - Docker con Chrome instalado');
console.log('   - Imagen completa de wa-automate');
console.log('='.repeat(50));