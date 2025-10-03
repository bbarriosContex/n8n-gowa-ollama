# 🚀 Acceso a go-whatsapp-web-multidevice

## 📋 Información de Acceso

### URL Principal
**https://wa.playhunt.es**

### Credenciales de Autenticación Básica
- **Usuario:** admin  
- **Contraseña:** playhunt2024

## 🔐 Como Acceder

### Opción 1: Navegador Web
1. Abrir https://wa.playhunt.es
2. Cuando aparezca el diálogo de autenticación, introducir:
   - Usuario: `admin`
   - Contraseña: `playhunt2024`
3. Acceder a la interfaz de WhatsApp

### Opción 2: cURL (para testing)
```bash
curl -u admin:playhunt2024 https://wa.playhunt.es
```

### Opción 3: Via API
```bash
# Para generar QR y conectar
curl -u admin:playhunt2024 -X POST https://wa.playhunt.es/app/login

# Para enviar mensajes
curl -u admin:playhunt2024 -X POST https://wa.playhunt.es/send/message \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "message": "Hello World"}'
```

## 📱 Proceso de Conexión WhatsApp

1. **Acceder a la interfaz web** con las credenciales
2. **Hacer clic en "Login"** o similar
3. **Escanear el código QR** que aparece con tu WhatsApp móvil
4. **¡Listo!** WhatsApp estará conectado y funcionando

## 🌟 Características Disponibles

- ✅ **Código QR funcional** (compatible ARM64)
- ✅ **Envío de mensajes de texto**
- ✅ **Envío de imágenes**
- ✅ **Envío de documentos**
- ✅ **Auto-mark read** (marcar como leído automáticamente)
- ✅ **API REST completa**
- ✅ **Interface web intuitiva**

## 🔧 Estado Técnico

- **Imagen Docker:** `aldinokemal2104/go-whatsapp-web-multidevice:latest`
- **Arquitectura:** ✅ Compatible ARM64
- **Puerto interno:** 3000
- **Puerto externo:** 8002 (mapeado por Apache a SSL)
- **SSL:** ✅ Activo y válido
- **Healthcheck:** ✅ Funcionando

## ⚡ Ventajas de esta Implementación

1. **Compatible ARM64** - Funciona nativamente en tu servidor
2. **Código real de Go** - Más eficiente que Node.js
3. **API completa** - Todas las funcionalidades WhatsApp
4. **Interfaz web moderna** - Fácil de usar
5. **Autenticación básica** - Seguro contra accesos no autorizados

---
*Generado: $(date)*
*Stack: go-whatsapp-web-multidevice + Docker + Apache SSL*