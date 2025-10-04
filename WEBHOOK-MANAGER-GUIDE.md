# 🚀 Webhook Manager - Configuración Completa

## 📍 **URLs de Acceso**

- **Interfaz de Gestión**: https://wa.playhunt.es/webhooks/
- **Endpoint de Webhook**: https://wa.playhunt.es/webhooks/webhook
- **API REST**: https://wa.playhunt.es/webhooks/api/

**Credenciales**: `admin:playhunt2024`

## ⚙️ **Configuración Aplicada**

### 1. **Apache Virtual Host**
```apache
# Webhook Manager en /webhooks
ProxyPass /webhooks/ http://localhost:4000/
ProxyPassReverse /webhooks/ http://localhost:4000/

# WhatsApp API en el resto de rutas
ProxyPass /webhooks/ !
ProxyPass / http://localhost:8002/
ProxyPassReverse / http://localhost:8002/
```

### 2. **Docker Compose**
```yaml
# Webhook Manager
webhook-manager:
  build: ./webhook-manager
  container_name: webhook-manager-playhunt
  ports: ["4000:4000"]
  environment:
    - WEBHOOK_AUTH_USER=admin
    - WEBHOOK_AUTH_PASS=playhunt2024

# WhatsApp API con webhook configurado
wa-automate:
  environment:
    - WHATSAPP_WEBHOOK=https://wa.playhunt.es/webhooks/webhook
  command:
    - --webhook=https://wa.playhunt.es/webhooks/webhook
```

## 🎯 **Funcionalidades del Webhook Manager**

### **Interfaz Web** (https://wa.playhunt.es/webhooks/)
- ✅ **Panel de control visual** con estadísticas en tiempo real
- ✅ **Configuración de URLs** de destino (múltiples webhooks)
- ✅ **Gestión de secretos HMAC** para seguridad
- ✅ **Logs de actividad** con detalles de errores/éxitos
- ✅ **Configuración de reintentos** y delays
- ✅ **Webhooks de prueba** para testing
- ✅ **Auto-refresh** cada 30 segundos

### **API REST** 
```bash
GET  /webhooks/api/config   # Obtener configuración
POST /webhooks/api/config   # Actualizar configuración
GET  /webhooks/api/stats    # Estadísticas
GET  /webhooks/api/logs     # Logs de actividad
DELETE /webhooks/api/logs   # Limpiar logs
POST /webhooks/api/test     # Enviar webhook de prueba
```

### **Webhook Endpoint**
```bash
POST /webhooks/webhook      # Recibe webhooks de go-whatsapp
```

## 🔄 **Flujo de Funcionamiento**

1. **go-whatsapp** envía eventos → `https://wa.playhunt.es/webhooks/webhook`
2. **Webhook Manager** recibe el evento y:
   - ✅ Registra estadísticas y logs
   - ✅ Valida firma HMAC (si está configurada)
   - ✅ Reenvía a URLs configuradas con reintentos
   - ✅ Mantiene logs de errores/éxitos

## 📊 **Configuración Recomendada**

### **Ejemplo de configuración típica**:
```json
{
  "enabled": true,
  "urls": [
    "https://tu-servidor.com/whatsapp-webhook",
    "https://n8n.playhunt.es/webhook/whatsapp-events"
  ],
  "secret": "tu-secreto-super-seguro",
  "retryAttempts": 3,
  "retryDelay": 1000,
  "events": ["message", "group.participants", "message.ack"]
}
```

### **Para integrar con N8N**:
1. Crear webhook en N8N: `https://n8n.playhunt.es/webhook/whatsapp`
2. Añadir la URL en el Webhook Manager
3. Configurar filtros de eventos según necesidad

## 🧪 **Testing**

### **1. Probar interfaz web**:
```bash
curl -u admin:playhunt2024 -I https://wa.playhunt.es/webhooks/
# Debe retornar HTTP 200
```

### **2. Probar endpoint webhook**:
```bash
curl -X POST https://wa.playhunt.es/webhooks/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "evento de prueba"}'
```

### **3. Probar configuración API**:
```bash
curl -u admin:playhunt2024 \
  https://wa.playhunt.es/webhooks/api/config
```

### **4. Enviar webhook de prueba**:
```bash
curl -u admin:playhunt2024 -X POST \
  https://wa.playhunt.es/webhooks/api/test
```

## 🔧 **Troubleshooting**

### **Verificar servicios**:
```bash
# Estado del webhook manager
docker logs webhook-manager-playhunt

# Estado de go-whatsapp
docker logs wa-automate-playhunt

# Estado de Apache
systemctl status apache2
```

### **Verificar configuración Apache**:
```bash
apache2ctl configtest
tail -f /var/log/apache2/wa.playhunt.es-ssl-access.log
```

### **Verificar conectividad**:
```bash
# Desde el contenedor go-whatsapp al webhook manager
docker exec wa-automate-playhunt curl -I http://webhook-manager:4000/webhook
```

## 📝 **Logs y Monitoreo**

### **Ubicación de logs**:
- **Webhook Manager**: `docker logs webhook-manager-playhunt`
- **Apache**: `/var/log/apache2/wa.playhunt.es-ssl-*.log`
- **go-whatsapp**: `docker logs wa-automate-playhunt`
- **Webhook datos**: `./data/webhook-manager/webhook-logs.json`

### **Métricas disponibles**:
- Total de webhooks recibidos
- Total de webhooks enviados
- Número de errores
- Última actividad
- Tiempo de respuesta de URLs destino

## 🚨 **Seguridad**

### **Configurado**:
- ✅ **Basic Auth** en interfaz web
- ✅ **HTTPS** obligatorio
- ✅ **HMAC signatures** para webhooks
- ✅ **Security headers** en Apache
- ✅ **Validación de entrada** en todos los endpoints

### **Headers de seguridad aplicados**:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 🎉 **¡Sistema Completamente Funcional!**

**URLs principales**:
- 🌐 **Gestión Webhooks**: https://wa.playhunt.es/webhooks/ 
- 📱 **WhatsApp API**: https://wa.playhunt.es/
- 🔄 **N8N**: https://n8n.playhunt.es/
- 🤖 **Ollama**: https://ollama.playhunt.es/

**Credenciales unificadas**: `admin:playhunt2024`

---
**Creado**: 4 de Octubre 2025  
**Estado**: ✅ Totalmente operativo