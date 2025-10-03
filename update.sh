#!/bin/bash

################################################################################
# Script de Actualización Segura para Playhunt Apps
# Este script actualiza solo lo necesario sin tocar configuraciones existentes
################################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "================================================================"
echo "  Script de Actualización Segura - Playhunt Apps"
echo "================================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "No se encuentra docker-compose.yml"
    print_info "Ejecuta este script desde /var/playhunt-apps/"
    exit 1
fi

# Menú de opciones
echo "¿Qué deseas hacer?"
echo ""
echo "  1) Actualizar imágenes Docker (pull)"
echo "  2) Reiniciar servicios (sin actualizar)"
echo "  3) Actualizar y reiniciar servicios"
echo "  4) Ver estado de servicios"
echo "  5) Ver logs"
echo "  6) Crear backup antes de actualizar"
echo "  7) Verificar actualizaciones disponibles"
echo "  0) Salir"
echo ""
read -p "Selecciona una opción: " OPTION

case $OPTION in
    1)
        print_info "Descargando últimas versiones de imágenes..."
        docker-compose pull
        print_success "Imágenes actualizadas"
        echo ""
        print_warning "Para aplicar los cambios ejecuta: docker-compose up -d"
        ;;
    
    2)
        print_info "Reiniciando servicios..."
        docker-compose restart
        print_success "Servicios reiniciados"
        sleep 5
        docker-compose ps
        ;;
    
    3)
        print_warning "Esto detendrá temporalmente todos los servicios"
        read -p "¿Continuar? (s/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            # Crear backup automático
            print_info "Creando backup de seguridad..."
            ./backup.sh 2>/dev/null || print_warning "No se pudo crear backup"
            
            print_info "Descargando nuevas versiones..."
            docker-compose pull
            
            print_info "Deteniendo servicios..."
            docker-compose down
            
            print_info "Iniciando con nuevas versiones..."
            docker-compose up -d
            
            print_info "Esperando a que los servicios inicien..."
            sleep 10
            
            print_success "Servicios actualizados y reiniciados"
            docker-compose ps
        else
            print_info "Actualización cancelada"
        fi
        ;;
    
    4)
        print_info "Estado de los servicios:"
        echo ""
        docker-compose ps
        echo ""
        ./monitor.sh 2>/dev/null || docker stats --no-stream
        ;;
    
    5)
        print_info "Mostrando logs (Ctrl+C para salir)..."
        echo ""
        docker-compose logs -f
        ;;
    
    6)
        print_info "Creando backup..."
        ./backup.sh
        ;;
    
    7)
        print_info "Verificando actualizaciones disponibles..."
        echo ""
        
        # N8N
        CURRENT_N8N=$(docker inspect n8n-playhunt --format='{{.Config.Image}}' 2>/dev/null || echo "n8nio/n8n:latest")
        print_info "N8N actual: $CURRENT_N8N"
        
        # WA-Automate
        CURRENT_WA=$(docker inspect wa-automate-playhunt --format='{{.Config.Image}}' 2>/dev/null || echo "openwa/wa-automate:latest")
        print_info "WA-Automate actual: $CURRENT_WA"
        
        # Ollama
        CURRENT_OLLAMA=$(docker inspect ollama-playhunt --format='{{.Config.Image}}' 2>/dev/null || echo "ollama/ollama:latest")
        print_info "Ollama actual: $CURRENT_OLLAMA"
        
        echo ""
        print_info "Para ver si hay actualizaciones ejecuta: docker-compose pull"
        ;;
    
    0)
        print_info "Saliendo..."
        exit 0
        ;;
    
    *)
        print_error "Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "================================================================"
print_success "Operación completada"
echo "================================================================"
