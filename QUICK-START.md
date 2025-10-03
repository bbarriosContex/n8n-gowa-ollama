# 🚀 Guía Rápida - Playhunt Apps

## Instalación en 3 pasos

### 1️⃣ Configurar DNS
Apunta tus subdominios a la IP del servidor:
- `n8n.playhunt.es` → Tu IP
- `wa.playhunt.es` → Tu IP  
- `ollama.playhunt.es` → Tu IP

### 2️⃣ Ejecutar deploy
```bash
cd /var/playhunt-apps
sudo ./deploy.sh
```

### 3️⃣ Acceder
- N8N: https://n8n.playhunt.es
- WA-Automate: https://wa.playhunt.es
- Ollama: https://ollama.playhunt.es

---

## Comandos más usados

### Ver estado
```bash
cd /var/playhunt-apps
docker-compose ps
./monitor.sh
```

### Ver logs
```bash
docker-compose logs -f           # Todos
docker-compose logs -f n8n       # Solo N8N
docker-compose logs -f wa-automate
docker-compose logs -f ollama
```

### Reiniciar servicios
```bash
docker-compose restart           # Todos
docker-compose restart n8n       # Solo N8N
```

### Detener/Iniciar
```bash
docker-compose stop              # Detener
docker-compose start             # Iniciar
docker-compose down              # Detener y eliminar
docker-compose up -d             # Iniciar en background
```

### Backups
```bash
./backup.sh                      # Crear backup
./restore.sh                     # Restaurar backup
```

### Actualizar
```bash
docker-compose pull              # Descargar nuevas versiones
docker-compose up -d --force-recreate  # Recrear con nuevas versiones
```

---

## Solución rápida de problemas

### No puedo acceder a las apps
```bash
# Verificar que están corriendo
docker-compose ps

# Verificar logs
docker-compose logs -f

# Reiniciar
docker-compose restart
```

### Certificado SSL no funciona
```bash
# Verificar DNS
dig n8n.playhunt.es +short

# Reinstalar certificado
sudo certbot --apache -d n8n.playhunt.es
```

### Un contenedor no inicia
```bash
# Ver el error
docker logs n8n-playhunt

# Recrear el contenedor
docker-compose up -d --force-recreate n8n
```

### N8N no guarda workflows
```bash
# Corregir permisos
sudo chown -R 1000:1000 data/n8n
docker-compose restart n8n
```

---

## Archivos importantes

- `docker-compose.yml` - Configuración de servicios
- `.env` - Variables de entorno
- `deploy.sh` - Script de despliegue
- `backup.sh` - Script de backup
- `monitor.sh` - Monitor de estado
- `data/` - Datos persistentes

---

## Puertos

- **5678** - N8N
- **8002** - WA-Automate  
- **11434** - Ollama
- **80/443** - Apache (HTTP/HTTPS)

---

## URLs de documentación

- N8N: https://docs.n8n.io/
- WA-Automate: https://github.com/open-wa/wa-automate-nodejs
- Ollama: https://ollama.ai/docs

---

## Soporte

📧 admin@playhunt.es

Para más detalles ver: **README.md**
