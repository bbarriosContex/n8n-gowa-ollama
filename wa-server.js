const { create } = require('@open-wa/wa-automate');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

let client = null;
let qrCode = null;
let isConnected = false;

// Página principal
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
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            background: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .qr-container { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            display: inline-block; 
            margin: 20px 0;
          }
          .status { 
            padding: 10px; 
            border-radius: 5px; 
            margin: 10px 0; 
          }
          .connecting { background: #fff3cd; color: #856404; }
          .connected { background: #d4edda; color: #155724; }
          .error { background: #f8d7da; color: #721c24; }
          h1 { color: #25d366; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 30px; }
        </style>
        <script>
          setTimeout(() => location.reload(), 5000);
        </script>
      </head>
      <body>
        <div class="container">
          <h1>🤖 WA-Automate</h1>
          <p class="subtitle">Playhunt WhatsApp API</p>
          
          <div class="status connecting">
            ⏳ Esperando conexión... Escanea el código QR con WhatsApp
          </div>
          
          <div class="qr-container">
            <img src="data:image/png;base64,${qrCode}" alt="QR Code" style="max-width: 300px;" />
          </div>
          
          <p><strong>Instrucciones:</strong></p>
          <ol style="text-align: left; display: inline-block;">
            <li>Abre WhatsApp en tu teléfono</li>
            <li>Ve a Configuración → Dispositivos vinculados</li>
            <li>Toca "Vincular un dispositivo"</li>
            <li>Escanea este código QR</li>
          </ol>
          
          <p><small>Esta página se actualiza automáticamente cada 5 segundos</small></p>
        </div>
      </body>
      </html>
    `);
  } else if (isConnected) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WA-Automate - Playhunt</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            background: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .status { 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
            background: #d4edda; 
            color: #155724;
          }
          h1 { color: #25d366; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 30px; }
          .api-info { 
            background: #e9ecef; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ WA-Automate</h1>
          <p class="subtitle">Playhunt WhatsApp API</p>
          
          <div class="status">
            🎉 ¡WhatsApp conectado correctamente!
          </div>
          
          <div class="api-info">
            <h3>📡 Endpoints disponibles:</h3>
            <ul>
              <li><code>GET /status</code> - Estado de la conexión</li>
              <li><code>POST /sendText</code> - Enviar mensaje de texto</li>
              <li><code>GET /chats</code> - Obtener lista de chats</li>
              <li><code>GET /</code> - Esta página</li>
            </ul>
            
            <h3>📝 Ejemplo de uso:</h3>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto;">
curl -X POST https://wa.playhunt.es/sendText \\
  -H "Content-Type: application/json" \\
  -d '{
    "chatId": "34XXXXXXXXX@c.us",
    "text": "¡Hola desde la API!"
  }'
            </pre>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    res.json({ 
      status: 'initializing', 
      message: 'WhatsApp se está inicializando...',
      timestamp: new Date().toISOString()
    });
  }
});

// API Endpoints
app.get('/status', (req, res) => {
  res.json({
    status: isConnected ? 'connected' : (qrCode ? 'waiting_for_qr' : 'initializing'),
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
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Error obteniendo chats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Inicializar WhatsApp
console.log('🚀 Iniciando WA-Automate...');
console.log('📱 WhatsApp Web se está cargando...');

create({
  sessionId: 'playhunt-session',
  headless: false,
  qrTimeout: 0,
  authTimeout: 0,
  restartOnCrash: true,
  cacheEnabled: false,
  useChrome: true,
  chromiumArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]
}).then(c => {
  client = c;
  isConnected = true;
  qrCode = null;
  
  console.log('✅ WhatsApp conectado exitosamente!');
  console.log('🌐 Servidor disponible en: http://localhost:' + PORT);
  
  c.onStateChanged(state => {
    console.log('📱 Estado de WhatsApp:', state);
    if (state === 'CONNECTED') {
      isConnected = true;
      qrCode = null;
    }
  });
  
}).catch(error => {
  console.error('❌ Error iniciando WhatsApp:', error);
});

// Manejar código QR
const originalCreate = require('@open-wa/wa-automate').create;
require('@open-wa/wa-automate').create = function(options) {
  const originalOptions = { ...options };
  
  if (!originalOptions.qr) {
    originalOptions.qr = (base64Qr) => {
      console.log('📱 Nuevo código QR generado');
      qrCode = base64Qr;
      isConnected = false;
    };
  }
  
  return originalCreate(originalOptions);
};

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