#!/bin/bash

################################################################################
# Script de Restauración para Playhunt Apps
# Restaura backups de datos y configuración
################################################################################

BACKUP_DIR="/var/backups/playhunt-apps"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================================"
echo "  Script de Restauración - Playhunt Apps"
echo "================================================================"
echo ""

# Verificar que existe el directorio de backups
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: No se encontró el directorio de backups: $BACKUP_DIR"
    exit 1
fi

# Listar backups disponibles
echo "📋 Backups disponibles:"
echo ""
ls -lht "$BACKUP_DIR"/data_*.tar.gz 2>/dev/null | nl

echo ""
read -p "Ingrese el número del backup a restaurar (o 'q' para cancelar): " CHOICE

if [ "$CHOICE" = "q" ] || [ "$CHOICE" = "Q" ]; then
    echo "Cancelado por el usuario"
    exit 0
fi

# Obtener el archivo seleccionado
BACKUP_FILE=$(ls -t "$BACKUP_DIR"/data_*.tar.gz | sed -n "${CHOICE}p")

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Selección inválida"
    exit 1
fi

echo ""
echo "📦 Backup seleccionado: $(basename $BACKUP_FILE)"
echo ""
echo "⚠️  ADVERTENCIA: Esta operación sobrescribirá los datos actuales"
read -p "¿Está seguro de continuar? (escriba 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo "Operación cancelada"
    exit 0
fi

# Detener servicios
echo ""
echo "🛑 Deteniendo servicios..."
cd "$SCRIPT_DIR"
docker-compose down

# Backup de seguridad de los datos actuales
echo "💾 Creando backup de seguridad de datos actuales..."
SAFETY_BACKUP="$BACKUP_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$SAFETY_BACKUP" data/ 2>/dev/null

# Restaurar datos
echo "📂 Restaurando datos..."
rm -rf data/
tar -xzf "$BACKUP_FILE"

# Restaurar permisos
echo "🔐 Restaurando permisos..."
chown -R 1000:1000 data/n8n
chmod -R 755 data/

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose up -d

echo ""
echo "================================================================"
echo "✅ Restauración completada!"
echo "================================================================"
echo ""
echo "Backup restaurado: $(basename $BACKUP_FILE)"
echo "Backup de seguridad: $SAFETY_BACKUP"
echo ""
echo "Los servicios están iniciando. Espere unos segundos y verifique:"
echo "  docker-compose ps"
echo "  docker-compose logs -f"
echo ""
