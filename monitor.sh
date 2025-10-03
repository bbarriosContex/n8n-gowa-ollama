#!/bin/bash

################################################################################
# Script de Monitoreo para Playhunt Apps
# Verifica el estado de los servicios y muestra métricas
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para verificar si un servicio responde
check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    if curl -f -s -o /dev/null --max-time 5 "$url"; then
        echo -e "${GREEN}✓${NC} $name (Puerto $port) - ${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} $name (Puerto $port) - ${RED}ERROR${NC}"
        return 1
    fi
}

clear
echo "================================================================"
echo "  Monitor de Playhunt Apps"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================================"
echo ""

# Estado de contenedores
echo "📦 ESTADO DE CONTENEDORES"
echo "================================================================"
docker-compose ps
echo ""

# Verificar servicios
echo "🌐 VERIFICACIÓN DE SERVICIOS"
echo "================================================================"
check_service "N8N         " "http://localhost:5678/healthz" "5678"
check_service "WA-Automate " "http://localhost:8002/" "8002"
check_service "Ollama      " "http://localhost:11434/" "11434"
echo ""

# Uso de recursos
echo "💻 USO DE RECURSOS"
echo "================================================================"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# Uso de disco
echo "💾 USO DE DISCO"
echo "================================================================"
echo "Datos de aplicaciones:"
du -sh data/* 2>/dev/null | awk '{printf "  %-20s %s\n", $2, $1}'
echo ""
echo "Espacio total usado:"
du -sh data/ 2>/dev/null
echo ""
echo "Espacio disponible:"
df -h . | tail -1 | awk '{printf "  Usado: %s de %s (%s)\n", $3, $2, $5}'
echo ""

# Verificar certificados SSL
echo "🔒 CERTIFICADOS SSL"
echo "================================================================"
if command -v certbot &> /dev/null; then
    source .env 2>/dev/null
    for domain in $N8N_DOMAIN $WA_DOMAIN $OLLAMA_DOMAIN; do
        if [ -n "$domain" ]; then
            cert_path="/etc/letsencrypt/live/$domain/cert.pem"
            if [ -f "$cert_path" ]; then
                expiry=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
                expiry_epoch=$(date -d "$expiry" +%s)
                now_epoch=$(date +%s)
                days_left=$(( ($expiry_epoch - $now_epoch) / 86400 ))
                
                if [ $days_left -lt 30 ]; then
                    echo -e "  $domain: ${YELLOW}⚠ Expira en $days_left días${NC}"
                else
                    echo -e "  $domain: ${GREEN}✓ Válido ($days_left días)${NC}"
                fi
            else
                echo -e "  $domain: ${RED}✗ No instalado${NC}"
            fi
        fi
    done
else
    echo "  Certbot no instalado"
fi
echo ""

# Últimos logs con errores
echo "📋 ÚLTIMOS ERRORES EN LOGS (últimos 5)"
echo "================================================================"
docker-compose logs --tail=50 2>&1 | grep -i "error\|warning\|fatal" | tail -5 || echo "  No hay errores recientes"
echo ""

# Información de red
echo "🌐 PUERTOS EN USO"
echo "================================================================"
echo "  5678  - N8N"
echo "  8002  - WA-Automate"
echo "  11434 - Ollama"
echo ""
sudo netstat -tulpn 2>/dev/null | grep -E ":(5678|8002|11434) " || ss -tulpn 2>/dev/null | grep -E ":(5678|8002|11434) "
echo ""

# Uptime de contenedores
echo "⏱️  UPTIME DE CONTENEDORES"
echo "================================================================"
docker-compose ps --format "table {{.Name}}\t{{.Status}}"
echo ""

echo "================================================================"
echo "Monitoreando... Presione Ctrl+C para salir"
echo "Para monitoreo continuo use: watch -n 5 ./monitor.sh"
echo "================================================================"
