# GO-WhatsApp-Web-MultiDevice API Reference

## 📋 Información General

**go-whatsapp-web-multidevice** NO incluye Swagger/OpenAPI UI integrado, pero tiene documentación completa de API disponible:

- **Documentación API**: [docs/openapi.yml](https://github.com/aldinokemal/go-whatsapp-web-multidevice/blob/main/docs/openapi.yaml)
- **Documentación Online**: [API Specification](https://bump.sh/aldinokemal/doc/go-whatsapp-web-multidevice)
- **Visualizar API**: Usar [SwaggerEditor](https://editor.swagger.io) con el archivo openapi.yml

## 🔗 URLs de Acceso

```bash
# Aplicación Principal
https://wa.playhunt.es/

# Credenciales de Acceso
Usuario: admin
Contraseña: playhunt2024

# Base URL de la API
https://wa.playhunt.es
```

## 📊 Endpoints Principales

### 🔐 **Autenticación y Aplicación**
```
GET  /app/login                     - Login con QR Code
GET  /app/login-with-code           - Login con Código de Emparejamiento
GET  /app/logout                    - Cerrar Sesión
GET  /app/reconnect                 - Reconectar WhatsApp
GET  /app/devices                   - Lista de Dispositivos
GET  /app/status                    - Estado de Conexión
```

### 👤 **Usuario**
```
GET  /user/info                     - Información del Usuario
GET  /user/avatar                   - Avatar del Usuario
POST /user/avatar                   - Cambiar Avatar
POST /user/pushname                 - Cambiar Nombre de Usuario
GET  /user/my/privacy               - Configuraciones de Privacidad
GET  /user/my/groups                - Mis Grupos
GET  /user/my/newsletters           - Mis Newsletters
GET  /user/my/contacts              - Mis Contactos
GET  /user/check                    - Verificar Usuario en WhatsApp
GET  /user/business-profile         - Perfil de Negocio
```

### 📤 **Enviar Mensajes**
```
POST /send/message                  - Enviar Mensaje de Texto
POST /send/image                    - Enviar Imagen
POST /send/file                     - Enviar Archivo
POST /send/video                    - Enviar Video
POST /send/sticker                  - Enviar Sticker
POST /send/contact                  - Enviar Contacto
POST /send/link                     - Enviar Link
POST /send/location                 - Enviar Ubicación
POST /send/audio                    - Enviar Audio
POST /send/poll                     - Enviar Encuesta
POST /send/presence                 - Enviar Presencia
POST /send/chat-presence            - Enviar Indicador de Escritura
```

### 💬 **Gestión de Mensajes**
```
POST /message/:message_id/reaction  - Reaccionar a Mensaje
POST /message/:message_id/revoke    - Revocar Mensaje
POST /message/:message_id/delete    - Eliminar Mensaje
POST /message/:message_id/update    - Editar Mensaje
POST /message/:message_id/read      - Marcar como Leído
POST /message/:message_id/star      - Marcar con Estrella
POST /message/:message_id/unstar    - Quitar Estrella
GET  /message/:message_id/download  - Descargar Multimedia
```

### 👥 **Grupos**
```
POST /group                         - Crear Grupo
POST /group/join-with-link          - Unirse con Link
GET  /group/info-from-link          - Info de Grupo por Link
GET  /group/info                    - Información del Grupo
POST /group/leave                   - Salir del Grupo
GET  /group/participants            - Lista de Participantes
POST /group/participants            - Agregar Participantes
POST /group/participants/remove     - Remover Participantes
POST /group/participants/promote    - Promover a Admin
POST /group/participants/demote     - Degradar Admin
GET  /group/participants/export     - Exportar Participantes (CSV)
GET  /group/participant-requests    - Solicitudes de Ingreso
POST /group/participant-requests/approve - Aprobar Solicitudes
POST /group/participant-requests/reject  - Rechazar Solicitudes
POST /group/photo                   - Cambiar Foto del Grupo
POST /group/name                    - Cambiar Nombre del Grupo
POST /group/locked                  - Bloquear Grupo
POST /group/announce                - Configurar Solo Admins
POST /group/topic                   - Cambiar Descripción
GET  /group/invite-link             - Obtener Link de Invitación
```

### 💬 **Chats**
```
GET  /chats                         - Lista de Chats
GET  /chat/:chat_jid/messages       - Mensajes del Chat
POST /chat/:chat_jid/pin            - Fijar Chat
POST /chat/:chat_jid/label          - Etiquetar Chat
```

### 📰 **Newsletter**
```
POST /newsletter/unfollow           - Dejar de Seguir Newsletter
```

## 📝 Ejemplos de Uso

### 1. **Enviar Mensaje de Texto**
```bash
curl -X POST https://wa.playhunt.es/send/message \
  -u admin:playhunt2024 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "628123456789",
    "message": "Hola desde la API!"
  }'
```

### 2. **Obtener Estado de Conexión**
```bash
curl -X GET https://wa.playhunt.es/app/status \
  -u admin:playhunt2024
```

### 3. **Lista de Chats**
```bash
curl -X GET https://wa.playhunt.es/chats \
  -u admin:playhunt2024
```

### 4. **Información del Usuario**
```bash
curl -X GET https://wa.playhunt.es/user/info \
  -u admin:playhunt2024
```

### 5. **Enviar Imagen**
```bash
curl -X POST https://wa.playhunt.es/send/image \
  -u admin:playhunt2024 \
  -F 'phone=628123456789' \
  -F 'caption=Mi imagen' \
  -F 'image=@/path/to/image.jpg'
```

## 🔔 Webhooks

### Configuración de Webhooks
```bash
# Variables de entorno
WHATSAPP_WEBHOOK=https://tu-app.com/webhook
WHATSAPP_WEBHOOK_SECRET=tu-secreto

# Múltiples webhooks
WHATSAPP_WEBHOOK=https://app1.com/webhook,https://app2.com/webhook
```

### Ejemplo de Webhook (Node.js/Express)
```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.raw({type: 'application/json'}));

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = req.body;
    const secret = 'tu-secreto';

    // Verificar firma
    if (!verifyWebhookSignature(payload, signature, secret)) {
        return res.status(401).send('Unauthorized');
    }

    // Procesar datos
    const data = JSON.parse(payload);
    console.log('Webhook recibido:', data);

    res.status(200).send('OK');
});

function verifyWebhookSignature(payload, signature, secret) {
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

app.listen(3001, () => {
    console.log('Webhook server listening on port 3001');
});
```

## ⚠️ Limitaciones

- **No hay Swagger UI**: La aplicación no incluye interfaz Swagger integrada
- **Alternativas**: Usar SwaggerEditor con el archivo openapi.yml del repositorio
- **Documentación**: Disponible en formato OpenAPI/YAML
- **Autenticación**: Requiere Basic Auth (admin:playhunt2024)

## 📚 Recursos Adicionales

1. **Repositorio**: https://github.com/aldinokemal/go-whatsapp-web-multidevice
2. **Documentación OpenAPI**: [docs/openapi.yml](https://github.com/aldinokemal/go-whatsapp-web-multidevice/blob/main/docs/openapi.yaml)
3. **Webhook Payloads**: [docs/webhook-payload.md](https://github.com/aldinokemal/go-whatsapp-web-multidevice/blob/main/docs/webhook-payload.md)
4. **Visualizador API**: https://editor.swagger.io
5. **Documentación Online**: https://bump.sh/aldinokemal/doc/go-whatsapp-web-multidevice

## 🌟 Características Destacadas

- **ARM64 Compatible**: Funciona perfectamente en servidores ARM64
- **Multi-device**: Soporte para múltiples dispositivos
- **Webhooks**: Notificaciones en tiempo real
- **Stickers**: Conversión automática de imágenes a WebP
- **Compresión**: Automática para imágenes y videos
- **Basic Auth**: Soporte para múltiples credenciales
- **WebSocket**: Conexiones en tiempo real
- **Export**: Exportar contactos/participantes a CSV

---

**✅ Estado del Deployment**: Completamente operativo
**🔐 Acceso**: https://wa.playhunt.es (admin:playhunt2024)
**📊 API Base**: https://wa.playhunt.es