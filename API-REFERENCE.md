# 📡 Referencia de APIs - Playhunt Apps

Esta guía contiene ejemplos de uso de las APIs de cada servicio.

---

## 🔵 N8N API

### Base URL
```
https://n8n.playhunt.es/api/v1
```

### Autenticación
```bash
# Obtener API Key en: Settings > API > Create API Key
export N8N_API_KEY="tu_api_key_aqui"
```

### Ejemplos

#### Listar workflows
```bash
curl -X GET https://n8n.playhunt.es/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

#### Activar workflow
```bash
curl -X PATCH https://n8n.playhunt.es/api/v1/workflows/1 \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

#### Ejecutar workflow
```bash
curl -X POST https://n8n.playhunt.es/api/v1/workflows/1/execute \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"data": {"input": "valor"}}'
```

#### Webhook (sin autenticación)
```bash
curl -X POST https://n8n.playhunt.es/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "Hola desde webhook"}'
```

---

## 📱 WA-Automate API

### Base URL
```
https://wa.playhunt.es
```

### 🔗 Gestión de Webhooks
**Interfaz web**: https://wa.playhunt.es/webhooks/
**Credenciales**: `admin:playhunt2024`

#### Configurar webhooks via API
```bash
# Obtener configuración actual
curl -u admin:playhunt2024 https://wa.playhunt.es/webhooks/api/config

# Actualizar configuración
curl -u admin:playhunt2024 -X POST https://wa.playhunt.es/webhooks/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "urls": ["https://tu-servidor.com/webhook"],
    "secret": "tu-secreto",
    "retryAttempts": 3
  }'

# Enviar webhook de prueba
curl -u admin:playhunt2024 -X POST https://wa.playhunt.es/webhooks/api/test
```

### Ejemplos

#### Verificar estado
```bash
curl https://wa.playhunt.es/status
```

#### Enviar mensaje de texto
```bash
curl -X POST https://wa.playhunt.es/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "34600000000@c.us",
    "text": "¡Hola! Este es un mensaje automatizado"
  }'
```

#### Enviar mensaje a grupo
```bash
curl -X POST https://wa.playhunt.es/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "34600000000-1234567890@g.us",
    "text": "Mensaje al grupo"
  }'
```

#### Enviar imagen
```bash
curl -X POST https://wa.playhunt.es/sendImage \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "34600000000@c.us",
    "image": "https://ejemplo.com/imagen.jpg",
    "caption": "Descripción de la imagen"
  }'
```

#### Enviar imagen desde Base64
```bash
curl -X POST https://wa.playhunt.es/sendImage \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "34600000000@c.us",
    "image": "data:image/png;base64,iVBORw0KGgo...",
    "caption": "Imagen desde Base64"
  }'
```

#### Enviar archivo
```bash
curl -X POST https://wa.playhunt.es/sendFile \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "34600000000@c.us",
    "file": "https://ejemplo.com/documento.pdf",
    "filename": "documento.pdf"
  }'
```

#### Enviar ubicación
```bash
curl -X POST https://wa.playhunt.es/sendLocation \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "34600000000@c.us",
    "lat": "40.4168",
    "lng": "-3.7038",
    "description": "Madrid, España"
  }'
```

#### Obtener chats
```bash
curl https://wa.playhunt.es/getAllChats
```

#### Obtener mensajes de un chat
```bash
curl -X POST https://wa.playhunt.es/getMessages \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "34600000000@c.us",
    "limit": 50
  }'
```

#### Verificar si número existe
```bash
curl -X POST https://wa.playhunt.es/checkNumberExists \
  -H "Content-Type: application/json" \
  -d '{
    "number": "34600000000"
  }'
```

---

## 🤖 Ollama API

### Base URL
```
https://ollama.playhunt.es
```

### Ejemplos

#### Listar modelos disponibles
```bash
curl https://ollama.playhunt.es/api/tags
```

#### Generar respuesta (streaming)
```bash
curl -X POST https://ollama.playhunt.es/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "prompt": "¿Por qué el cielo es azul?",
    "stream": false
  }'
```

#### Chat (estilo OpenAI)
```bash
curl -X POST https://ollama.playhunt.es/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "system", "content": "Eres un asistente útil"},
      {"role": "user", "content": "Explica qué es Docker"}
    ],
    "stream": false
  }'
```

#### Embeddings
```bash
curl -X POST https://ollama.playhunt.es/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "prompt": "Texto para obtener embeddings"
  }'
```

#### Descargar modelo
```bash
curl -X POST https://ollama.playhunt.es/api/pull \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mistral"
  }'
```

#### Eliminar modelo
```bash
curl -X DELETE https://ollama.playhunt.es/api/delete \
  -H "Content-Type: application/json" \
  -d '{
    "name": "llama2"
  }'
```

#### Información del modelo
```bash
curl -X POST https://ollama.playhunt.es/api/show \
  -H "Content-Type: application/json" \
  -d '{
    "name": "llama2"
  }'
```

---

## 🔗 Integración N8N + WA-Automate + Ollama

### Ejemplo: Bot de WhatsApp con IA

**Workflow en N8N:**

1. **Webhook** - Recibe mensaje de WhatsApp
   ```
   Método: POST
   URL: https://n8n.playhunt.es/webhook/whatsapp-bot
   ```

2. **HTTP Request (Ollama)** - Procesa con IA
   ```json
   {
     "method": "POST",
     "url": "https://ollama.playhunt.es/api/generate",
     "body": {
       "model": "llama2",
       "prompt": "{{$json.body.text}}",
       "stream": false
     }
   }
   ```

3. **HTTP Request (WA)** - Envía respuesta
   ```json
   {
     "method": "POST",
     "url": "https://wa.playhunt.es/sendText",
     "body": {
       "chatId": "{{$json.body.from}}",
       "text": "{{$node['HTTP Request'].json.response}}"
     }
   }
   ```

### Configurar Webhook en WA-Automate

**Método 1: Interfaz Web (Recomendado)**
1. Ir a: https://wa.playhunt.es/webhooks/
2. Añadir URL: `https://n8n.playhunt.es/webhook/whatsapp-bot`
3. Configurar secreto HMAC (opcional)
4. Habilitar eventos deseados

**Método 2: Via API**
```bash
curl -u admin:playhunt2024 -X POST https://wa.playhunt.es/webhooks/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "urls": ["https://n8n.playhunt.es/webhook/whatsapp-bot"],
    "secret": "mi-secreto-seguro"
  }'
```

**Endpoint webhook configurado automáticamente**: `https://wa.playhunt.es/webhooks/webhook`

---

## 🔐 Seguridad

### Proteger APIs con API Keys

#### N8N
- Configurar en `.env`:
  ```env
  N8N_BASIC_AUTH_ACTIVE=true
  N8N_BASIC_AUTH_USER=admin
  N8N_BASIC_AUTH_PASSWORD=tu_password_seguro
  ```

#### WA-Automate
- Añadir en `.env`:
  ```env
  WA_API_KEY=tu_api_key_secreta
  ```
- Usar en requests:
  ```bash
  -H "X-API-Key: tu_api_key_secreta"
  ```

#### Ollama
- Ollama no tiene autenticación nativa
- Se recomienda usar Apache Auth o proxy reverso con autenticación

---

## 📊 Códigos de respuesta HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Petición exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Petición inválida |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 🧪 Testing

### Probar todas las APIs

```bash
# N8N
curl -I https://n8n.playhunt.es/healthz

# WA-Automate
curl -I https://wa.playhunt.es/status

# Ollama
curl -I https://ollama.playhunt.es/
```

### Scripts de prueba

Crear `test-apis.sh`:
```bash
#!/bin/bash
echo "Probando APIs..."
echo ""

echo "✓ N8N:"
curl -s https://n8n.playhunt.es/healthz | jq .

echo ""
echo "✓ WA-Automate:"
curl -s https://wa.playhunt.es/status | jq .

echo ""
echo "✓ Ollama:"
curl -s https://ollama.playhunt.es/api/tags | jq .
```

---

## 📚 Documentación adicional

- **N8N**: https://docs.n8n.io/api/
- **WA-Automate**: https://docs.openwa.dev/
- **Ollama**: https://github.com/ollama/ollama/blob/main/docs/api.md

---

## 💡 Consejos

1. **Rate Limiting**: Implementa límites de tasa para evitar abuso
2. **Logging**: Registra todas las peticiones para auditoría
3. **Validación**: Valida todos los inputs antes de procesarlos
4. **HTTPS**: Usa siempre HTTPS en producción
5. **Timeouts**: Configura timeouts adecuados para cada servicio
6. **Retry Logic**: Implementa reintentos con backoff exponencial
7. **Monitoring**: Monitorea el uso de APIs y errores

---

**Última actualización**: 2025-10-03
