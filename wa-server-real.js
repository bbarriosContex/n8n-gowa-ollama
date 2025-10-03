const { create } = require('@open-wa/wa-automate');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

let client = null;
let qrCode = null;
let isConnected = false;
let connectionStatus = 'initializing';

// Asegurar que existe el directorio de sesiones
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

// Página principal con QR
app.get('/', (req, res) => {
  if (qrCode) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WA-Automate - Playhunt</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 500px;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
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
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
          }
          .subtitle { 
            color: #666; 
            margin-bottom: 30px;
            font-size: 16px;
          }
          .qr-container { 
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin: 20px 0;
            border: 2px dashed #25d366;
          }
          .qr-container img {
            max-width: 280px;
            width: 100%;
            height: auto;
          }
          .status {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-weight: 500;
          }
          .instructions {
            text-align: left;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .instructions ol {
            margin: 0;
            padding-left: 20px;
          }
          .instructions li {
            margin: 8px 0;
            line-height: 1.4;
          }
          .refresh-note {
            font-size: 14px;
            color: #666;
            margin-top: 20px;
          }
          .pulse {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        </style>
        <script>
          // Auto-refresh cada 5 segundos
          setTimeout(() => location.reload(), 5000);
          
          // Mostrar tiempo restante
          let countdown = 5;
          const timer = setInterval(() => {
            countdown--;
            const element = document.getElementById('countdown');
            if (element) element.textContent = countdown;
            if (countdown <= 0) clearInterval(timer);
          }, 1000);
        </script>
      </head>
      <body>
        <div class="container">
          <div class="logo">📱</div>
          <h1>WA-Automate</h1>
          <p class="subtitle">Playhunt WhatsApp API</p>
          
          <div class="status">
            ⏳ Esperando conexión... Escanea el código QR
          </div>
          
          <div class="qr-container pulse">
            <img src="data:image/png;base64,${qrCode}" alt="Código QR de WhatsApp" />
          </div>
          
          <div class="instructions">
            <h3>📋 Instrucciones:</h3>
            <ol>
              <li>Abre <strong>WhatsApp</strong> en tu teléfono</li>
              <li>Ve a <strong>Configuración</strong> → <strong>Dispositivos vinculados</strong></li>
              <li>Toca <strong>"Vincular un dispositivo"</strong></li>
              <li>Escanea este código QR con tu teléfono</li>
            </ol>
          </div>
          
          <div class="refresh-note">
            🔄 Actualizando en <span id="countdown">5</span> segundos...
          </div>
        </div>
      </body>
      </html>
    `);
  } else if (isConnected) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WA-Automate - Conectado</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 700px;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          .success-icon {
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
            margin: 0 0 10px 0;
            font-size: 28px;
            text-align: center;
          }
          .success-status {
            background: #d4edda;
            color: #155724;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
            font-size: 18px;
            font-weight: 600;
          }
          .api-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
          }
          .api-section h3 {
            color: #128c7e;
            margin-top: 0;
          }
          .endpoint {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid #25d366;
          }
          .endpoint-method {
            font-weight: bold;
            color: #25d366;
            font-family: monospace;
          }
          .code-block {
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
            line-height: 1.4;
          }
          .test-button {
            background: #25d366;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            margin: 5px;
          }
          .test-button:hover {
            background: #128c7e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>WhatsApp Conectado</h1>
          
          <div class="success-status">
            🎉 ¡WhatsApp Web conectado exitosamente!
          </div>
          
          <div class="api-section">
            <h3>📡 API Endpoints Disponibles</h3>
            
            <div class="endpoint">
              <div><span class="endpoint-method">GET</span> /status</div>
              <div>Estado de la conexión</div>
              <button class="test-button" onclick="testEndpoint('/status')">Probar</button>
            </div>
            
            <div class="endpoint">
              <div><span class="endpoint-method">POST</span> /sendText</div>
              <div>Enviar mensaje de texto</div>
              <button class="test-button" onclick="showSendForm()">Probar</button>
            </div>
            
            <div class="endpoint">
              <div><span class="endpoint-method">GET</span> /chats</div>
              <div>Obtener lista de chats</div>
              <button class="test-button" onclick="testEndpoint('/chats')">Probar</button>
            </div>
          </div>
          
          <div class="api-section">
            <h3>💡 Ejemplo de Uso</h3>
            <div class="code-block">
curl -X POST https://wa.playhunt.es/sendText \\
  -H "Content-Type: application/json" \\
  -d '{
    "chatId": "34XXXXXXXXX@c.us",
    "text": "¡Hola desde la API de WhatsApp!"
  }'
            </div>
          </div>
          
          <div id="result-area" style="margin-top: 20px;"></div>
        </div>
        
        <script>
          function testEndpoint(endpoint) {
            fetch(endpoint)
              .then(r => r.json())
              .then(data => {
                document.getElementById('result-area').innerHTML = 
                  '<div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-top: 15px;"><h4>Resultado:</h4><pre>' + 
                  JSON.stringify(data, null, 2) + '</pre></div>';
              })
              .catch(e => {
                document.getElementById('result-area').innerHTML = 
                  '<div style="background: #fee; padding: 15px; border-radius: 8px; margin-top: 15px; color: red;"><h4>Error:</h4>' + 
                  e.message + '</div>';
              });
          }
          
          function showSendForm() {
            document.getElementById('result-area').innerHTML = 
              '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">' +
              '<h4>Enviar Mensaje</h4>' +
              '<input type="text" id="chatId" placeholder="Número (ej: 34600000000@c.us)" style="width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">' +
              '<input type="text" id="messageText" placeholder="Mensaje a enviar" style="width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">' +
              '<button onclick="sendMessage()" style="background: #25d366; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Enviar</button>' +
              '</div>';
          }
          
          function sendMessage() {
            const chatId = document.getElementById('chatId').value;
            const text = document.getElementById('messageText').value;
            
            fetch('/sendText', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({chatId, text})
            })
            .then(r => r.json())
            .then(data => {
              document.getElementById('result-area').innerHTML += 
                '<div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-top: 15px;"><h4>Resultado:</h4><pre>' + 
                JSON.stringify(data, null, 2) + '</pre></div>';
            });
          }
        </script>
      </body>
      </html>
    `);
  } else {
    res.json({ 
      status: connectionStatus,
      message: 'WhatsApp se está inicializando...',
      timestamp: new Date().toISOString()
    });
  }
});

// API Endpoints
app.get('/status', (req, res) => {
  res.json({
    status: isConnected ? 'connected' : (qrCode ? 'waiting_for_qr' : connectionStatus),
    connected: isConnected,
    hasQR: !!qrCode,
    timestamp: new Date().toISOString()
  });
});

app.post('/sendText', async (req, res) => {
  try {
    const { chatId, text } = req.body;
    
    if (!client || !isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'WhatsApp no está conectado' 
      });
    }
    
    if (!chatId || !text) {
      return res.status(400).json({ 
        success: false, 
        error: 'chatId y text son requeridos' 
      });
    }
    
    const result = await client.sendText(chatId, text);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/chats', async (req, res) => {
  try {
    if (!client || !isConnected) {
      return res.status(400).json({ 
        success: false, 
        error: 'WhatsApp no está conectado' 
      });
    }
    
    const chats = await client.getAllChats();
    res.json({ success: true, chats: chats.slice(0, 20) }); // Limitar a 20 chats
  } catch (error) {
    console.error('Error obteniendo chats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Inicializar WhatsApp
console.log('🚀 Iniciando WA-Automate para ARM64...');
console.log('📱 Configurando WhatsApp Web...');

connectionStatus = 'launching_browser';

create({
  sessionId: 'playhunt-session',
  headless: process.env.DISPLAY ? false : true,
  qrTimeout: 0,
  authTimeout: 0,
  restartOnCrash: true,
  cacheEnabled: false,
  useChrome: true,
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/google-chrome' || '/usr/bin/chromium-browser',
  sessionDataPath: path.join(__dirname, 'sessions'),
  chromiumArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI,VizDisplayCompositor',
    '--disable-ipc-flooding-protection',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-sync',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--window-size=1920,1080',
    process.env.DISPLAY ? `--display=${process.env.DISPLAY}` : '--virtual-time-budget=10000'
  ].filter(Boolean),
  qr: (base64Qr) => {
    console.log('📱 Nuevo código QR generado');
    qrCode = base64Qr;
    isConnected = false;
    connectionStatus = 'waiting_for_qr';
  }
}).then(c => {
  client = c;
  isConnected = true;
  qrCode = null;
  connectionStatus = 'connected';
  
  console.log('✅ WhatsApp conectado exitosamente!');
  console.log('🌐 Servidor disponible en: http://localhost:' + PORT);
  
  c.onStateChanged(state => {
    console.log('📱 Estado de WhatsApp:', state);
    if (state === 'CONNECTED') {
      isConnected = true;
      qrCode = null;
      connectionStatus = 'connected';
    } else if (state === 'DISCONNECTED') {
      isConnected = false;
      connectionStatus = 'disconnected';
    }
  });
  
  c.onMessage(message => {
    console.log('📨 Mensaje recibido:', message.body);
  });
  
}).catch(error => {
  console.error('❌ Error iniciando WhatsApp:', error);
  connectionStatus = 'error';
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WA-Automate iniciado en puerto ${PORT}`);
  console.log(`🌐 Accede a: http://localhost:${PORT}`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

// Shutdown graceful
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando aplicación...');
  if (client) {
    try {
      await client.kill();
    } catch (e) {
      console.log('Error cerrando cliente:', e.message);
    }
  }
  process.exit(0);
});