#!/bin/bash

################################################################################
# Script de Deploy Automatizado para Playhunt Apps
# Autor: GitHub Copilot
# Fecha: 2025-10-03
# 
# Este script automatiza el despliegue de n8n, wa-automate y ollama con:
# - Verificación de dependencias
# - Configuración de subdominios en Apache
# - Instalación de certificados SSL con Let's Encrypt
# - Despliegue de contenedores Docker
################################################################################

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Función para imprimir mensajes
print_info() {
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

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para verificar dependencias
check_dependencies() {
    print_info "Verificando dependencias del sistema..."
    
    local missing_deps=()
    
    # Verificar Docker
    if ! command_exists docker; then
        missing_deps+=("docker")
        print_error "Docker no está instalado"
    else
        print_success "Docker está instalado ($(docker --version))"
    fi
    
    # Verificar Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing_deps+=("docker-compose")
        print_error "Docker Compose no está instalado"
    else
        print_success "Docker Compose está instalado"
    fi
    
    # Verificar Apache
    if ! command_exists apache2 && ! command_exists httpd; then
        missing_deps+=("apache2")
        print_error "Apache no está instalado"
    else
        print_success "Apache está instalado"
    fi
    
    # Verificar Certbot
    if ! command_exists certbot; then
        missing_deps+=("certbot")
        print_error "Certbot no está instalado"
    else
        print_success "Certbot está instalado ($(certbot --version 2>&1 | head -n 1))"
    fi
    
    # Si hay dependencias faltantes, ofrecer instalarlas
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_warning "Faltan las siguientes dependencias: ${missing_deps[*]}"
        read -p "¿Desea instalarlas automáticamente? (s/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            install_dependencies "${missing_deps[@]}"
        else
            print_error "No se pueden continuar sin las dependencias necesarias"
            exit 1
        fi
    fi
}

# Función para instalar dependencias
install_dependencies() {
    local deps=("$@")
    print_info "Instalando dependencias..."
    
    # Actualizar repos
    sudo apt-get update
    
    for dep in "${deps[@]}"; do
        case $dep in
            docker)
                print_info "Instalando Docker..."
                sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                sudo apt-get update
                sudo apt-get install -y docker-ce docker-ce-cli containerd.io
                sudo systemctl enable docker
                sudo systemctl start docker
                sudo usermod -aG docker $USER
                print_success "Docker instalado correctamente"
                ;;
            docker-compose)
                print_info "Instalando Docker Compose..."
                sudo apt-get install -y docker-compose-plugin
                print_success "Docker Compose instalado correctamente"
                ;;
            apache2)
                print_info "Instalando Apache..."
                sudo apt-get install -y apache2
                sudo systemctl enable apache2
                sudo systemctl start apache2
                sudo a2enmod proxy proxy_http proxy_wstunnel ssl rewrite headers
                sudo systemctl restart apache2
                print_success "Apache instalado correctamente"
                ;;
            certbot)
                print_info "Instalando Certbot..."
                sudo apt-get install -y certbot python3-certbot-apache
                print_success "Certbot instalado correctamente"
                ;;
        esac
    done
}

# Función para solicitar información de subdominios
get_domains_info() {
    print_info "Configuración de subdominios"
    echo "================================================================"
    
    # Dominio n8n
    read -p "Ingrese el subdominio para N8N [n8n.playhunt.es]: " N8N_DOMAIN
    N8N_DOMAIN=${N8N_DOMAIN:-n8n.playhunt.es}
    
    # Dominio wa-automate
    read -p "Ingrese el subdominio para WA-Automate [wa.playhunt.es]: " WA_DOMAIN
    WA_DOMAIN=${WA_DOMAIN:-wa.playhunt.es}
    
    # Dominio ollama
    read -p "Ingrese el subdominio para Ollama [ollama.playhunt.es]: " OLLAMA_DOMAIN
    OLLAMA_DOMAIN=${OLLAMA_DOMAIN:-ollama.playhunt.es}
    
    # Email para certificados SSL
    read -p "Ingrese su email para los certificados SSL: " SSL_EMAIL
    
    while [ -z "$SSL_EMAIL" ]; do
        print_error "El email es obligatorio para generar certificados SSL"
        read -p "Ingrese su email para los certificados SSL: " SSL_EMAIL
    done
    
    echo ""
    print_info "Configuración:"
    echo "  - N8N: https://$N8N_DOMAIN"
    echo "  - WA-Automate: https://$WA_DOMAIN"
    echo "  - Ollama: https://$OLLAMA_DOMAIN"
    echo "  - Email SSL: $SSL_EMAIL"
    echo ""
    
    read -p "¿Es correcta esta configuración? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_info "Reiniciando configuración..."
        get_domains_info
        return
    fi
    
    # Guardar en archivo .env
    cat > .env <<EOF
# Dominios
N8N_DOMAIN=$N8N_DOMAIN
WA_DOMAIN=$WA_DOMAIN
OLLAMA_DOMAIN=$OLLAMA_DOMAIN

# Email para SSL
SSL_EMAIL=$SSL_EMAIL

# Configuración general
TIMEZONE=Europe/Madrid

# Webhook URL (opcional)
WA_WEBHOOK_URL=
EOF
    
    print_success "Configuración guardada en .env"
}

# Función para crear configuración de Apache para un subdominio
create_apache_config() {
    local domain=$1
    local port=$2
    local service_name=$3
    
    print_info "Creando configuración de Apache para $domain..."
    
    local config_file="/etc/apache2/sites-available/${domain}.conf"
    
    sudo tee "$config_file" > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $domain
    ServerAdmin $SSL_EMAIL
    
    # Redirección a HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}\$1 [R=301,L]
    
    ErrorLog \${APACHE_LOG_DIR}/${domain}-error.log
    CustomLog \${APACHE_LOG_DIR}/${domain}-access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName $domain
    ServerAdmin $SSL_EMAIL
    
    # Proxy Settings
    ProxyPreserveHost On
    ProxyPass / http://localhost:$port/
    ProxyPassReverse / http://localhost:$port/
    
    # WebSocket Support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:$port/\$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://localhost:$port/\$1 [P,L]
    
    # Headers
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
    
    # SSL Configuration (será configurado por Certbot)
    # SSLEngine on
    # SSLCertificateFile /etc/letsencrypt/live/$domain/fullchain.pem
    # SSLCertificateKeyFile /etc/letsencrypt/live/$domain/privkey.pem
    
    ErrorLog \${APACHE_LOG_DIR}/${domain}-ssl-error.log
    CustomLog \${APACHE_LOG_DIR}/${domain}-ssl-access.log combined
</VirtualHost>
EOF
    
    # Guardar copia en apache-configs
    sudo cp "$config_file" "./apache-configs/${domain}.conf"
    
    # Habilitar sitio
    sudo a2ensite "${domain}.conf"
    
    print_success "Configuración de Apache creada para $domain"
}

# Función para configurar subdominios en Apache
configure_apache() {
    print_info "Configurando subdominios en Apache..."
    
    # Habilitar módulos necesarios de Apache
    print_info "Habilitando módulos de Apache..."
    sudo a2enmod proxy proxy_http proxy_wstunnel ssl rewrite headers
    
    # Crear configuraciones para cada servicio
    create_apache_config "$N8N_DOMAIN" "5678" "n8n"
    create_apache_config "$WA_DOMAIN" "8002" "wa-automate"
    create_apache_config "$OLLAMA_DOMAIN" "11434" "ollama"
    
    # Recargar Apache
    print_info "Recargando Apache..."
    sudo systemctl reload apache2
    
    print_success "Subdominios configurados en Apache"
}

# Función para instalar certificados SSL
install_ssl_certificates() {
    print_info "Instalando certificados SSL..."
    
    local domains=("$N8N_DOMAIN" "$WA_DOMAIN" "$OLLAMA_DOMAIN")
    
    for domain in "${domains[@]}"; do
        print_info "Instalando certificado SSL para $domain..."
        
        # Verificar si el dominio apunta a este servidor
        print_warning "Asegúrese de que $domain apunta a la IP de este servidor"
        read -p "¿Continuar con la instalación del certificado para $domain? (s/n): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            # Instalar certificado con Certbot
            sudo certbot --apache \
                --non-interactive \
                --agree-tos \
                --email "$SSL_EMAIL" \
                --domains "$domain" \
                --redirect
            
            if [ $? -eq 0 ]; then
                print_success "Certificado SSL instalado para $domain"
            else
                print_error "Error al instalar certificado SSL para $domain"
                print_warning "Puede intentar instalarlo manualmente después con: sudo certbot --apache -d $domain"
            fi
        else
            print_warning "Omitiendo certificado SSL para $domain"
        fi
    done
    
    # Configurar renovación automática
    print_info "Configurando renovación automática de certificados..."
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    print_success "Certificados SSL configurados"
}

# Función para desplegar contenedores Docker
deploy_containers() {
    print_info "Desplegando contenedores Docker..."
    
    # Detener contenedores existentes si los hay
    if [ -f "docker-compose.yml" ]; then
        print_info "Deteniendo contenedores existentes..."
        docker-compose down 2>/dev/null || true
    fi
    
    # Construir y levantar contenedores
    print_info "Iniciando contenedores..."
    docker-compose up -d
    
    # Esperar a que los contenedores estén listos
    print_info "Esperando a que los servicios estén listos..."
    sleep 10
    
    # Verificar estado de los contenedores
    print_info "Estado de los contenedores:"
    docker-compose ps
    
    print_success "Contenedores desplegados correctamente"
}

# Función para verificar el estado de los servicios
check_services_status() {
    print_info "Verificando estado de los servicios..."
    echo "================================================================"
    
    # Verificar n8n
    if curl -f -s -o /dev/null "http://localhost:5678/healthz"; then
        print_success "N8N está funcionando correctamente"
        echo "  URL: https://$N8N_DOMAIN"
    else
        print_error "N8N no responde correctamente"
    fi
    
    # Verificar wa-automate
    if curl -f -s -o /dev/null "http://localhost:8002/"; then
        print_success "WA-Automate está funcionando correctamente"
        echo "  URL: https://$WA_DOMAIN"
    else
        print_error "WA-Automate no responde correctamente"
    fi
    
    # Verificar ollama
    if curl -f -s -o /dev/null "http://localhost:11434/"; then
        print_success "Ollama está funcionando correctamente"
        echo "  URL: https://$OLLAMA_DOMAIN"
    else
        print_error "Ollama no responde correctamente"
    fi
    
    echo "================================================================"
}

# Función para mostrar resumen final
show_summary() {
    echo ""
    echo "================================================================"
    print_success "¡Deploy completado exitosamente!"
    echo "================================================================"
    echo ""
    echo "Servicios desplegados:"
    echo "  - N8N:         https://$N8N_DOMAIN"
    echo "  - WA-Automate: https://$WA_DOMAIN"
    echo "  - Ollama:      https://$OLLAMA_DOMAIN"
    echo ""
    echo "Comandos útiles:"
    echo "  - Ver logs:           docker-compose logs -f"
    echo "  - Ver logs de n8n:    docker-compose logs -f n8n"
    echo "  - Detener servicios:  docker-compose down"
    echo "  - Reiniciar servicios: docker-compose restart"
    echo "  - Ver estado:         docker-compose ps"
    echo ""
    echo "Archivos de configuración:"
    echo "  - Docker Compose:     $SCRIPT_DIR/docker-compose.yml"
    echo "  - Variables:          $SCRIPT_DIR/.env"
    echo "  - Apache configs:     $SCRIPT_DIR/apache-configs/"
    echo ""
    echo "Para renovar certificados SSL manualmente:"
    echo "  sudo certbot renew"
    echo ""
    echo "================================================================"
}

# Función principal
main() {
    echo "================================================================"
    echo "  Script de Deploy - Playhunt Apps"
    echo "  N8N + WA-Automate + Ollama"
    echo "================================================================"
    echo ""
    
    # Verificar que se ejecuta como root o con sudo para algunas operaciones
    if [ "$EUID" -ne 0 ]; then
        print_warning "Este script necesita permisos de superusuario para algunas operaciones"
        print_info "Se solicitarán credenciales cuando sea necesario"
    fi
    
    # 1. Verificar dependencias
    check_dependencies
    
    # 2. Solicitar información de subdominios
    if [ ! -f ".env" ]; then
        get_domains_info
    else
        print_info "Archivo .env encontrado. Usando configuración existente..."
        source .env
        print_info "Configuración cargada:"
        echo "  - N8N: https://$N8N_DOMAIN"
        echo "  - WA-Automate: https://$WA_DOMAIN"
        echo "  - Ollama: https://$OLLAMA_DOMAIN"
        echo ""
        read -p "¿Desea usar esta configuración? (s/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            get_domains_info
        fi
    fi
    
    # Cargar variables de entorno
    source .env
    
    # 3. Configurar Apache
    read -p "¿Desea configurar subdominios en Apache? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        configure_apache
    else
        print_warning "Configuración de Apache omitida"
    fi
    
    # 4. Instalar certificados SSL
    read -p "¿Desea instalar certificados SSL? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        install_ssl_certificates
    else
        print_warning "Instalación de certificados SSL omitida"
    fi
    
    # 5. Desplegar contenedores
    read -p "¿Desea desplegar los contenedores Docker? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        deploy_containers
        sleep 5
        check_services_status
    else
        print_warning "Despliegue de contenedores omitido"
    fi
    
    # 6. Mostrar resumen
    show_summary
}

# Ejecutar script principal
main "$@"
