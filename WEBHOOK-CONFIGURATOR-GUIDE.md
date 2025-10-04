# Configurador de Webhooks para WhatsApp API - Guía Completa

## 📋 Resumen del Proyecto

Se ha implementado exitosamente una **interfaz web completa** para configurar los webhooks de goWA (Go WhatsApp), accesible desde `wa.playhunt.es/urls`. Esta solución proporciona una interfaz gráfica intuitiva para gestionar webhooks, visualizar logs y realizar pruebas.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **WA-Server-Extension** (Puerto 8002)
   - Servidor proxy que extiende las funcionalidades de wa-automate
   - Sirve la interfaz web de configuración en `/urls`
   - Actúa como proxy para todas las demás rutas hacia wa-automate
   - Gestiona la comunicación con el webhook-manager

2. **WA-Automate** (Puerto 8001)
   - Servicio principal de WhatsApp API
   - Go WhatsApp Web Multidevice
   - Maneja las conexiones de WhatsApp

3. **Webhook-Manager** (Puerto 4000)
   - Gestiona la configuración de webhooks
   - Almacena logs de actividad
   - Procesa y reenvía webhooks a URLs configuradas

4. **Apache Reverse Proxy**
   - wa.playhunt.es → Puerto 8002 (WA-Server-Extension)
   - Maneja SSL y routing externo

## 🌐 Acceso a la Interfaz Web

### URL Principal
```
https://wa.playhunt.es/urls
```

### Credenciales de Acceso
```
Usuario: admin
Contraseña: playhunt2024
```

## 🎛️ Funcionalidades de la Interfaz

### 1. Dashboard de Estadísticas
- **Mensajes Recibidos**: Contador de mensajes procesados
- **Webhooks Enviados**: Total de webhooks reenviados
- **Errores**: Número de errores registrados
- **URLs Configuradas**: Cantidad de URLs de webhook activas

### 2. Pestaña de Configuración (⚙️)

#### Configuración General
- **Estado del Webhook**: Habilitar/Deshabilitar el sistema
- **Secreto para Firmas**: Opcional, para validar webhooks con HMAC
- **Intentos de Reenvío**: Número de reintentos (1-10)
- **Delay entre Intentos**: Tiempo de espera en milisegundos

#### Gestión de URLs
- **Añadir URLs**: Agregar nuevas URLs de destino para webhooks
- **Probar URLs**: Enviar webhooks de prueba a URLs específicas
- **Eliminar URLs**: Remover URLs de la configuración

### 3. Pestaña de Logs (📋)
- **Visualización en Tiempo Real**: Logs actualizados automáticamente
- **Filtrado por Estado**: Éxito, errores, información
- **Detalles Completos**: Timestamp, URL, código de respuesta, errores
- **Limpieza de Logs**: Borrar historial completo

### 4. Pestaña de Testing (🧪)
- **Webhooks de Prueba**: Enviar payloads personalizados
- **Editor JSON**: Configurar payloads de prueba
- **Resultados en Tiempo Real**: Ver respuestas inmediatas
- **Validación**: Verificar configuraciones antes de producción

## 🔧 API Endpoints

Todos los endpoints requieren autenticación básica.

### Configuración
```bash
# Obtener configuración actual
GET /urls/api/config

# Guardar configuración
POST /urls/api/config
Content-Type: application/json
{
  "enabled": true,
  "secret": "mi-secreto",
  "retryAttempts": 3,
  "retryDelay": 1000,
  "urls": ["https://mi-servidor.com/webhook"]
}
```

### Estadísticas
```bash
# Obtener estadísticas
GET /urls/api/stats
```

### Logs
```bash
# Obtener logs
GET /urls/api/logs

# Limpiar todos los logs
DELETE /urls/api/logs
```

### Testing
```bash
# Enviar webhook de prueba
POST /urls/api/test
Content-Type: application/json
{
  "test": true,
  "message": "Webhook de prueba",
  "timestamp": "2024-10-04T17:58:03.593Z"
}
```

## 🚀 Despliegue y Gestión

### Comandos de Docker Compose

#### Iniciar todos los servicios
```bash
cd /var/playhunt-apps
docker-compose up -d
```

#### Ver estado de servicios
```bash
docker-compose ps
```

#### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f wa-server-extension
docker-compose logs -f webhook-manager
docker-compose logs -f wa-automate
```

#### Reiniciar servicios
```bash
# Todos los servicios
docker-compose restart

# Servicio específico
docker-compose restart wa-server-extension
```

#### Reconstruir servicios
```bash
# Reconstruir solo wa-server-extension
docker-compose build --no-cache wa-server-extension
docker-compose up -d wa-server-extension
```

### Script de Despliegue Automático
```bash
# Ejecutar script de despliegue completo
./deploy-webhook-config.sh
```

## 📂 Estructura de Archivos

```
/var/playhunt-apps/
├── wa-server.js                    # Servidor principal de extensión
├── package.json                    # Dependencias Node.js
├── Dockerfile.wa-ext              # Dockerfile para wa-server-extension
├── docker-compose.yml             # Configuración de servicios
├── deploy-webhook-config.sh       # Script de despliegue
├── public/                        # Archivos estáticos de la interfaz web
│   ├── webhook-config.html        # Interfaz principal HTML
│   └── js/
│       └── webhook-config.js      # Lógica JavaScript del frontend
├── data/                          # Datos persistentes
│   ├── webhook-manager/           # Configuración y logs de webhooks
│   │   ├── webhook-config.json    # Configuración actual
│   │   └── webhook-logs.json      # Logs de actividad
│   ├── wa-automate/              # Almacenamiento de WhatsApp
│   └── n8n/                     # Datos de N8N
└── webhook-manager/              # Servicio gestor de webhooks
    ├── server.js                 # Servidor del webhook manager
    └── Dockerfile               # Dockerfile del webhook manager
```

## 🔒 Seguridad

### Autenticación
- **Autenticación Básica HTTP**: Requerida para todos los endpoints
- **Credenciales por defecto**: admin:playhunt2024
- **HTTPS**: Obligatorio a través de Apache con certificados SSL

### Validación de Webhooks
- **Firmas HMAC SHA256**: Opcional, configurable por URL
- **Secretos únicos**: Configurables para cada instalación
- **Validación de origen**: Headers personalizados y User-Agent

## 📈 Monitoreo y Mantenimiento

### Health Checks
```bash
# Verificar salud del wa-server-extension
curl http://localhost:8002/health

# Verificar wa-automate a través del proxy
curl -u admin:playhunt2024 http://localhost:8002/

# Verificar webhook-manager directo
curl -u admin:playhunt2024 http://localhost:4000/
```

### Logs de Sistema
- **Rotación automática**: Los logs se mantienen con un máximo de 100 entradas
- **Backup automático**: Se crean backups de configuración en cada despliegue
- **Monitoreo continuo**: Auto-refresh cada 30 segundos en la interfaz

### Backup de Configuración
```bash
# Los backups se crean automáticamente con timestamp
ls -la data/webhook-manager/webhook-config.json.backup.*
```

## 🔧 Solución de Problemas

### Problemas Comunes

#### 1. Servicios no responden
```bash
# Verificar estado
docker-compose ps

# Reiniciar servicios problemáticos
docker-compose restart wa-server-extension webhook-manager

# Ver logs para diagnosticar
docker-compose logs --tail=50 wa-server-extension
```

#### 2. Interfaz web no carga
- Verificar que los archivos estáticos estén en `/public/`
- Comprobar permisos de archivos
- Revisar logs del wa-server-extension

#### 3. Webhooks no se envían
- Verificar configuración en `/urls`
- Comprobar URLs de destino
- Revisar logs en la pestaña "Logs" de la interfaz
- Verificar conectividad de red

#### 4. Problemas de autenticación
- Verificar credenciales: admin:playhunt2024
- Comprobar headers de autenticación básica
- Revisar configuración de Apache si es acceso externo

## 🎯 Casos de Uso

### Configuración Inicial
1. Acceder a `https://wa.playhunt.es/urls`
2. Introducir credenciales de acceso
3. Configurar URLs de webhook en la pestaña "Configuración"
4. Establecer parámetros de reenvío (intentos, delay)
5. Probar configuración con la pestaña "Testing"

### Monitoreo Operacional
1. Revisar dashboard de estadísticas regularmente
2. Monitorear logs en tiempo real durante operaciones críticas
3. Configurar alertas basadas en métricas de error
4. Realizar pruebas periódicas de conectividad

### Debugging y Troubleshooting
1. Usar la pestaña "Testing" para reproducir problemas
2. Analizar logs detallados para identificar errores
3. Verificar configuración de URLs y secretos
4. Probar conectividad individual de cada URL

## 📊 Métricas y Análisis

La interfaz proporciona métricas en tiempo real:

- **Tasa de éxito**: Porcentaje de webhooks enviados exitosamente
- **Tiempo de respuesta**: Latencia de las URLs de destino
- **Frecuencia de errores**: Identificación de patrones de fallo
- **Actividad temporal**: Historial de uso y picos de tráfico

## 🔄 Actualizaciones Futuras

### Funcionalidades Planificadas
- **Filtros avanzados de logs**: Por fecha, URL, tipo de evento
- **Alertas por email**: Notificaciones automáticas de errores
- **Dashboard de métricas**: Gráficos y tendencias históricas
- **Configuración por API**: Gestión programática de webhooks
- **Multi-tenancy**: Soporte para múltiples configuraciones

## ✅ Conclusión

El **Configurador de Webhooks para WhatsApp API** está completamente implementado y operativo. Proporciona una interfaz completa y profesional para:

- ✅ Configurar webhooks de forma visual e intuitiva
- ✅ Monitorear logs y estadísticas en tiempo real
- ✅ Realizar pruebas y debugging avanzado
- ✅ Gestionar múltiples URLs de destino
- ✅ Mantener seguridad y autenticación robusta

La solución está lista para usar en producción y cumple con todos los requisitos solicitados.

---

**Acceso:** https://wa.playhunt.es/urls  
**Credenciales:** admin:playhunt2024  
**Soporte:** Revisar logs con `docker-compose logs -f wa-server-extension`