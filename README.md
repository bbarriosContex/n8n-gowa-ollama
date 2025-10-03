# 🚀 Playhunt Apps - Stack de Automatización

Plataforma completa con N8N, WA-Automate y Ollama desplegados con Docker Compose, configuración automática de subdominios en Apache y certificados SSL.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Servicios Incluidos](#servicios-incluidos)
- [Requisitos Previos](#requisitos-previos)
- [Instalación Rápida](#instalación-rápida)
- [Configuración Manual](#configuración-manual)
- [Uso](#uso)
- [Gestión de Servicios](#gestión-de-servicios)
- [Solución de Problemas](#solución-de-problemas)
- [Mantenimiento](#mantenimiento)
- [Seguridad](#seguridad)
- [Contribuir](#contribuir)

---

## 📖 Descripción

Este proyecto proporciona un stack completo de automatización que incluye:

- **N8N**: Plataforma de automatización de workflows similar a Zapier/Make
- **WA-Automate**: Automatización de WhatsApp con API REST
- **Ollama**: Servidor local de modelos de lenguaje (LLM) para IA

Todo se despliega automáticamente con Docker Compose, configuración de subdominios en Apache y certificados SSL gratuitos de Let's Encrypt.

---

## 🛠️ Servicios Incluidos

### 1. N8N (n8n.playhunt.es)
- **Puerto**: 5678
- **Descripción**: Herramienta de automatización de workflows
- **Características**:
  - Editor visual de workflows
  - 200+ integraciones nativas
  - Webhooks y APIs
  - Ejecución de código personalizado
  - Programación de tareas

### 2. WA-Automate (wa.playhunt.es)
- **Puerto**: 8002
- **Descripción**: API para automatización de WhatsApp
- **Características**:
  - Envío y recepción de mensajes
  - Gestión de grupos
  - Envío de archivos multimedia
  - Webhooks para mensajes entrantes
  - Integración con N8N

### 3. Ollama (ollama.playhunt.es)
- **Puerto**: 11434
- **Descripción**: Servidor de modelos de lenguaje local
- **Características**:
  - Ejecución de LLMs localmente
  - Compatible con Llama 2, Mistral, etc.
  - API REST compatible con OpenAI
  - Sin límites de uso
  - Datos privados y seguros

---

## ✅ Requisitos Previos

### Sistema Operativo
- Ubuntu 20.04 LTS o superior
- Debian 10 o superior
- Otras distribuciones Linux (con ajustes menores)

### Hardware Mínimo
- **CPU**: 4 cores
- **RAM**: 8 GB (16 GB recomendado para Ollama)
- **Disco**: 50 GB libres
- **Opcional**: GPU NVIDIA para Ollama (mejor rendimiento)

### Software (se instala automáticamente si falta)
- Docker 20.10+
- Docker Compose 2.0+
- Apache 2.4+
- Certbot (Let's Encrypt)

### Requisitos de Red
- Servidor con IP pública
- Subdominios apuntando a la IP del servidor:
  - `n8n.playhunt.es` → IP del servidor
  - `wa.playhunt.es` → IP del servidor
  - `ollama.playhunt.es` → IP del servidor
- Puertos abiertos: 80, 443

---

## 🚀 Instalación Rápida

### Paso 1: Clonar o descargar el proyecto

```bash
cd /var
# Si ya tienes los archivos, salta este paso
```

### Paso 2: Configurar DNS

Asegúrate de que tus subdominios apuntan a la IP de tu servidor:

```bash
# Verificar DNS
dig n8n.playhunt.es +short
dig wa.playhunt.es +short
dig ollama.playhunt.es +short
```

Todos deben devolver la IP de tu servidor.

### Paso 3: Ejecutar el script de deploy

```bash
cd /var/playhunt-apps
sudo ./deploy.sh
```

El script te guiará a través de:
1. ✅ Verificación e instalación de dependencias
2. 🔧 Configuración de subdominios
3. 🔒 Instalación de certificados SSL
4. 🐳 Despliegue de contenedores Docker

### Paso 4: Acceder a las aplicaciones

Una vez completado el deploy:

- **N8N**: https://n8n.playhunt.es
- **WA-Automate**: https://wa.playhunt.es
- **Ollama**: https://ollama.playhunt.es

---

## ⚙️ Configuración Manual

Si prefieres configurar manualmente o personalizar la instalación:

### 1. Crear archivo .env

```bash
cp .env.example .env
nano .env
```

Edita los valores según tu configuración:

```env
N8N_DOMAIN=n8n.tudominio.com
WA_DOMAIN=wa.tudominio.com
OLLAMA_DOMAIN=ollama.tudominio.com
SSL_EMAIL=tu@email.com
TIMEZONE=Europe/Madrid
```

### 2. Configurar permisos

```bash
# Asegurar permisos correctos
sudo chown -R 1000:1000 data/n8n
sudo chmod -R 755 data/
```

### 3. Iniciar servicios manualmente

```bash
# Iniciar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 4. Configurar Apache manualmente

```bash
# Copiar configuraciones
sudo cp apache-configs/*.template /etc/apache2/sites-available/

# Habilitar módulos
sudo a2enmod proxy proxy_http proxy_wstunnel ssl rewrite headers

# Habilitar sitios
sudo a2ensite n8n.playhunt.es.conf
sudo a2ensite wa.playhunt.es.conf
sudo a2ensite ollama.playhunt.es.conf

# Recargar Apache
sudo systemctl reload apache2
```

### 5. Instalar certificados SSL manualmente

```bash
# Para cada dominio
sudo certbot --apache -d n8n.playhunt.es
sudo certbot --apache -d wa.playhunt.es
sudo certbot --apache -d ollama.playhunt.es
```

---

## 💻 Uso

### N8N - Crear tu primer workflow

1. Accede a https://n8n.playhunt.es
2. Crea una cuenta (primera vez)
3. Crea un nuevo workflow
4. Arrastra nodos y conecta servicios
5. Activa el workflow

**Ejemplo: Webhook que responde con WhatsApp**
```
Webhook → WA-Automate → Ollama → WA-Automate
```

### WA-Automate - Conectar WhatsApp

1. Accede a https://wa.playhunt.es
2. Escanea el código QR con tu WhatsApp
3. Una vez conectado, usa la API:

```bash
# Enviar mensaje
curl -X POST https://wa.playhunt.es/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "34XXXXXXXXX@c.us",
    "text": "Hola desde WA-Automate!"
  }'
```

### Ollama - Usar modelos de IA

```bash
# Descargar un modelo
docker exec ollama-playhunt ollama pull llama2

# Hacer una consulta
curl https://ollama.playhunt.es/api/generate -d '{
  "model": "llama2",
  "prompt": "¿Por qué el cielo es azul?"
}'
```

### Integración N8N + WA-Automate + Ollama

Ejemplo de workflow en N8N:

1. **Webhook** recibe mensaje de WhatsApp
2. **Ollama** procesa el mensaje con IA
3. **WA-Automate** envía la respuesta

---

## 🔧 Gestión de Servicios

### Comandos Docker Compose

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f n8n

# Reiniciar todos los servicios
docker-compose restart

# Reiniciar un servicio específico
docker-compose restart n8n

# Detener servicios
docker-compose stop

# Iniciar servicios
docker-compose start

# Detener y eliminar contenedores
docker-compose down

# Detener y eliminar contenedores + volúmenes
docker-compose down -v
```

### Actualizar servicios

```bash
# Descargar nuevas versiones
docker-compose pull

# Recrear contenedores con nuevas versiones
docker-compose up -d --force-recreate
```

### Ver uso de recursos

```bash
# Uso de recursos por contenedor
docker stats

# Espacio en disco
docker system df
```

---

## 🐛 Solución de Problemas

### Error: Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
sudo netstat -tulpn | grep :5678

# Matar proceso
sudo kill -9 <PID>
```

### Error: Certificado SSL no se genera

**Causa**: DNS no apunta correctamente al servidor

```bash
# Verificar DNS
dig n8n.playhunt.es +short

# Debe devolver la IP de tu servidor
```

**Solución**: Espera a que la propagación DNS complete (hasta 24h)

### Error: Contenedor no inicia

```bash
# Ver logs del contenedor
docker logs n8n-playhunt

# Ver eventos de Docker
docker events

# Verificar configuración
docker-compose config
```

### Error: N8N no guarda workflows

**Causa**: Permisos incorrectos en volumen

```bash
# Corregir permisos
sudo chown -R 1000:1000 data/n8n
docker-compose restart n8n
```

### Error: WA-Automate desconecta constantemente

**Solución**: Aumentar memoria compartida

```yaml
# En docker-compose.yml
shm_size: 4gb  # Aumentar de 2gb a 4gb
```

### Error: Ollama Out of Memory

**Solución**: Aumentar límites o usar modelo más pequeño

```bash
# Usar modelo más ligero
docker exec ollama-playhunt ollama pull phi

# O aumentar memoria en docker-compose.yml
```

### Ver todos los logs de Apache

```bash
# Logs de error
sudo tail -f /var/log/apache2/*error.log

# Logs de acceso
sudo tail -f /var/log/apache2/*access.log
```

---

## 🔄 Mantenimiento

### Backups

#### Backup automático

```bash
# Crear script de backup
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/playhunt-apps"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de datos
tar -czf $BACKUP_DIR/data_$DATE.tar.gz data/

# Backup de configuración
cp .env $BACKUP_DIR/env_$DATE
cp docker-compose.yml $BACKUP_DIR/docker-compose_$DATE.yml

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completado: $BACKUP_DIR"
```

```bash
# Hacer ejecutable
chmod +x backup.sh

# Programar en cron (diario a las 2 AM)
crontab -e
# Agregar: 0 2 * * * /var/playhunt-apps/backup.sh
```

#### Restaurar backup

```bash
# Detener servicios
docker-compose down

# Restaurar datos
tar -xzf /var/backups/playhunt-apps/data_YYYYMMDD.tar.gz

# Iniciar servicios
docker-compose up -d
```

### Renovación de certificados SSL

Los certificados se renuevan automáticamente. Para forzar renovación:

```bash
# Renovar todos
sudo certbot renew

# Renovar uno específico
sudo certbot renew --cert-name n8n.playhunt.es

# Ver estado de certificados
sudo certbot certificates
```

### Limpiar Docker

```bash
# Eliminar contenedores parados
docker container prune

# Eliminar imágenes no usadas
docker image prune

# Eliminar volúmenes no usados
docker volume prune

# Limpieza completa (¡cuidado!)
docker system prune -a
```

### Actualizar sistema

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Reiniciar servicios
docker-compose restart
```

---

## 🔒 Seguridad

### Mejores prácticas

#### 1. Configurar autenticación en N8N

Edita `.env`:

```env
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=tu_contraseña_segura_aqui
```

Reinicia:
```bash
docker-compose restart n8n
```

#### 2. Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# Ver reglas
sudo ufw status
```

#### 3. Fail2ban (protección contra ataques)

```bash
# Instalar
sudo apt install fail2ban

# Configurar
sudo nano /etc/fail2ban/jail.local
```

```ini
[apache-auth]
enabled = true
port = http,https
logpath = /var/log/apache2/*error.log
```

```bash
# Reiniciar
sudo systemctl restart fail2ban
```

#### 4. Actualizar contraseñas regularmente

```bash
# Generar contraseñas seguras
openssl rand -base64 32
```

#### 5. Monitorear logs

```bash
# Script de monitoreo
watch -n 5 'docker-compose ps && echo "---" && docker stats --no-stream'
```

### Checklist de seguridad

- [ ] Autenticación habilitada en N8N
- [ ] Contraseñas fuertes (20+ caracteres)
- [ ] Firewall configurado (UFW)
- [ ] Fail2ban activo
- [ ] Certificados SSL instalados
- [ ] Backups automáticos configurados
- [ ] Logs monitoreados regularmente
- [ ] Sistema actualizado
- [ ] Acceso SSH con clave (no contraseña)
- [ ] Permisos de archivos correctos

---

## 📁 Estructura del Proyecto

```
/var/playhunt-apps/
├── docker-compose.yml          # Configuración de servicios
├── .env                        # Variables de entorno (crear desde .env.example)
├── .env.example               # Plantilla de configuración
├── deploy.sh                   # Script de deploy automático
├── README.md                   # Esta documentación
│
├── data/                       # Datos persistentes
│   ├── n8n/                   # Datos de N8N (workflows, credenciales)
│   ├── wa-automate/           # Sesiones de WhatsApp
│   └── ollama/                # Modelos de Ollama
│
└── apache-configs/             # Configuraciones de Apache
    ├── n8n.playhunt.es.conf.template
    ├── wa.playhunt.es.conf.template
    └── ollama.playhunt.es.conf.template
```

---

## 🆘 Soporte

### Logs importantes

```bash
# Logs de Docker
docker-compose logs -f

# Logs de Apache
sudo tail -f /var/log/apache2/error.log

# Logs del sistema
sudo journalctl -u docker -f
```

### Información del sistema

```bash
# Versiones
docker --version
docker-compose --version
apache2 -v
certbot --version

# Estado de servicios
systemctl status docker
systemctl status apache2

# Uso de disco
df -h

# Uso de memoria
free -h
```

### Recursos útiles

- [Documentación N8N](https://docs.n8n.io/)
- [WA-Automate GitHub](https://github.com/open-wa/wa-automate-nodejs)
- [Documentación Ollama](https://ollama.ai/docs)
- [Let's Encrypt](https://letsencrypt.org/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

## 📝 Changelog

### v1.0.0 (2025-10-03)
- ✨ Lanzamiento inicial
- 🐳 Docker Compose con N8N, WA-Automate y Ollama
- 🔧 Script de deploy automatizado
- 🔒 Configuración SSL automática
- 📚 Documentación completa

---

## 📄 Licencia

Este proyecto está disponible para uso interno de Playhunt.

---

## 👤 Autor

**Playhunt Team**
- Email: admin@playhunt.es
- Web: https://playhunt.es

---

## 🙏 Agradecimientos

- [N8N](https://n8n.io/) - Workflow Automation
- [Open WA](https://github.com/open-wa/wa-automate-nodejs) - WhatsApp Automation
- [Ollama](https://ollama.ai/) - Local LLM Server
- [Let's Encrypt](https://letsencrypt.org/) - Free SSL Certificates

---

**¿Problemas? ¿Sugerencias?**

Abre un issue o contacta con el equipo de Playhunt.

---

**¡Feliz automatización! 🚀**
