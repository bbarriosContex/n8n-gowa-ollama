#!/bin/bash

################################################################################
# Script de Backup para Playhunt Apps
# Crea backups de datos y configuración
################################################################################

BACKUP_DIR="/var/backups/playhunt-apps"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

echo "🔄 Iniciando backup..."
echo "Fecha: $(date)"
echo "Destino: $BACKUP_DIR"

# Backup de datos
echo "📦 Respaldando datos..."
cd "$SCRIPT_DIR"
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" data/

# Backup de configuración
echo "⚙️ Respaldando configuración..."
cp .env "$BACKUP_DIR/env_$DATE" 2>/dev/null || echo "⚠️ No se encontró .env"
cp docker-compose.yml "$BACKUP_DIR/docker-compose_$DATE.yml"

# Backup de configuraciones de Apache
if [ -d "apache-configs" ]; then
    tar -czf "$BACKUP_DIR/apache-configs_$DATE.tar.gz" apache-configs/
fi

# Eliminar backups antiguos (más de 30 días)
echo "🗑️ Limpiando backups antiguos..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "env_*" -mtime +30 -delete
find "$BACKUP_DIR" -name "docker-compose_*" -mtime +30 -delete

# Mostrar tamaño del backup
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "✅ Backup completado!"
echo "📊 Tamaño total de backups: $BACKUP_SIZE"
echo "📁 Ubicación: $BACKUP_DIR"
echo ""

# Listar últimos backups
echo "📋 Últimos backups:"
ls -lht "$BACKUP_DIR" | head -10
