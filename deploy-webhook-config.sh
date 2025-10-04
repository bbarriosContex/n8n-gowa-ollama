#!/bin/bash

# Script de despliegue para WhatsApp Server Extension
# Este script actualiza y despliega el nuevo servicio de extensión

set -e

echo "🚀 Iniciando despliegue de WhatsApp Server Extension..."

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté funcionando
if ! docker ps >/dev/null 2>&1; then
    print_error "Docker no está funcionando. Por favor, inicia Docker primero."
    exit 1
fi

print_status "Docker está funcionando correctamente."

# Verificar que estemos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "No se encontró docker-compose.yml. Asegúrate de estar en el directorio correcto."
    exit 1
fi

# Backup de la configuración actual si existe
if [ -f "data/webhook-manager/webhook-config.json" ]; then
    print_status "Creando backup de la configuración actual..."
    cp data/webhook-manager/webhook-config.json data/webhook-manager/webhook-config.json.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backup creado."
fi

# Detener servicios existentes de manera segura
print_status "Deteniendo servicios existentes..."
docker-compose down --remove-orphans

# Construir las nuevas imágenes
print_status "Construyendo nuevas imágenes..."
docker-compose build --no-cache wa-server-extension

# Iniciar todos los servicios
print_status "Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 10

# Verificar el estado de los servicios
print_status "Verificando estado de los servicios..."

services=("n8n-playhunt" "wa-automate-playhunt" "webhook-manager-playhunt" "wa-server-extension-playhunt" "ollama-playhunt")
all_healthy=true

for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
        print_success "✅ $service está ejecutándose"
    else
        print_error "❌ $service no está ejecutándose"
        all_healthy=false
    fi
done

# Verificar conectividad de los servicios
print_status "Verificando conectividad..."

# Test wa-server-extension
if curl -s -f http://localhost:8002/health >/dev/null 2>&1; then
    print_success "✅ WhatsApp Server Extension (puerto 8002) responde correctamente"
else
    print_warning "⚠️ WhatsApp Server Extension (puerto 8002) no responde - puede necesitar más tiempo"
fi

# Test webhook-manager
if curl -s -f http://localhost:4000/ >/dev/null 2>&1; then
    print_success "✅ Webhook Manager (puerto 4000) responde correctamente"
else
    print_warning "⚠️ Webhook Manager (puerto 4000) no responde - puede necesitar más tiempo"
fi

# Test wa-automate
if curl -s -f http://localhost:8001/ >/dev/null 2>&1; then
    print_success "✅ WA-Automate (puerto 8001) responde correctamente"
else
    print_warning "⚠️ WA-Automate (puerto 8001) no responde - puede necesitar más tiempo"
fi

# Mostrar logs recientes si hay problemas
if [ "$all_healthy" = false ]; then
    print_warning "Algunos servicios no están funcionando correctamente. Mostrando logs recientes:"
    docker-compose logs --tail=20 wa-server-extension
fi

# Información final
echo
print_success "🎉 Despliegue completado!"
echo
echo "📋 Información de acceso:"
echo "  • WhatsApp API: https://wa.playhunt.es/"
echo "  • Configurador de Webhooks: https://wa.playhunt.es/urls"
echo "  • N8N: https://n8n.playhunt.es/"
echo "  • Ollama: https://ollama.playhunt.es/"
echo
echo "🔐 Credenciales por defecto:"
echo "  • Usuario: admin"
echo "  • Contraseña: playhunt2024"
echo
echo "📝 Para ver logs en tiempo real:"
echo "  • docker-compose logs -f wa-server-extension"
echo "  • docker-compose logs -f webhook-manager"
echo "  • docker-compose logs -f wa-automate"
echo
echo "🔧 Para gestión del sistema:"
echo "  • Reiniciar: docker-compose restart"
echo "  • Detener: docker-compose down"
echo "  • Ver estado: docker-compose ps"

if [ "$all_healthy" = true ]; then
    print_success "✅ Todos los servicios están funcionando correctamente!"
    exit 0
else
    print_warning "⚠️ Algunos servicios pueden necesitar tiempo adicional para iniciarse completamente."
    print_status "Ejecuta 'docker-compose ps' en unos minutos para verificar el estado."
    exit 1
fi