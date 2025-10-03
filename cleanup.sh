#!/bin/bash

################################################################################
# Script de Limpieza para Playhunt Apps
# Limpia datos, logs y recursos de Docker
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================================"
echo "  Script de Limpieza - Playhunt Apps"
echo "================================================================"
echo ""
echo "⚠️  ADVERTENCIA: Esta operación puede eliminar datos"
echo ""
echo "Opciones de limpieza:"
echo "  1) Limpiar contenedores detenidos"
echo "  2) Limpiar imágenes no usadas"
echo "  3) Limpiar volúmenes no usados"
echo "  4) Limpiar logs de Docker"
echo "  5) Limpiar backups antiguos (>30 días)"
echo "  6) Limpiar TODO (excepto datos de aplicaciones)"
echo "  7) ⚠️  RESET COMPLETO (eliminar TODO incluyendo datos)"
echo "  0) Cancelar"
echo ""
read -p "Seleccione una opción: " OPTION

case $OPTION in
    1)
        echo -e "${YELLOW}Limpiando contenedores detenidos...${NC}"
        docker container prune -f
        echo -e "${GREEN}✓ Completado${NC}"
        ;;
    2)
        echo -e "${YELLOW}Limpiando imágenes no usadas...${NC}"
        docker image prune -a -f
        echo -e "${GREEN}✓ Completado${NC}"
        ;;
    3)
        echo -e "${YELLOW}Limpiando volúmenes no usados...${NC}"
        docker volume prune -f
        echo -e "${GREEN}✓ Completado${NC}"
        ;;
    4)
        echo -e "${YELLOW}Limpiando logs de Docker...${NC}"
        docker-compose logs --tail=0 > /dev/null 2>&1
        echo -e "${GREEN}✓ Completado${NC}"
        ;;
    5)
        echo -e "${YELLOW}Limpiando backups antiguos...${NC}"
        BACKUP_DIR="/var/backups/playhunt-apps"
        if [ -d "$BACKUP_DIR" ]; then
            find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
            find "$BACKUP_DIR" -name "env_*" -mtime +30 -delete
            find "$BACKUP_DIR" -name "docker-compose_*" -mtime +30 -delete
            echo -e "${GREEN}✓ Completado${NC}"
        else
            echo -e "${YELLOW}No hay backups para limpiar${NC}"
        fi
        ;;
    6)
        echo -e "${YELLOW}Limpieza completa (excepto datos)...${NC}"
        read -p "¿Está seguro? (s/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            docker container prune -f
            docker image prune -a -f
            docker volume prune -f
            docker system prune -f
            echo -e "${GREEN}✓ Limpieza completa realizada${NC}"
        else
            echo "Cancelado"
        fi
        ;;
    7)
        echo -e "${RED}⚠️  RESET COMPLETO - ELIMINARÁ TODOS LOS DATOS${NC}"
        echo "Esto eliminará:"
        echo "  - Todos los contenedores"
        echo "  - Todos los datos de las aplicaciones"
        echo "  - Todas las configuraciones"
        echo ""
        read -p "Escriba 'ELIMINAR TODO' para confirmar: " CONFIRM
        
        if [ "$CONFIRM" = "ELIMINAR TODO" ]; then
            echo -e "${RED}Deteniendo servicios...${NC}"
            docker-compose down -v
            
            echo -e "${RED}Eliminando datos...${NC}"
            rm -rf data/*
            
            echo -e "${RED}Eliminando configuración...${NC}"
            rm -f .env
            
            echo -e "${RED}Limpiando Docker...${NC}"
            docker system prune -a -f --volumes
            
            echo -e "${GREEN}✓ Reset completo realizado${NC}"
            echo ""
            echo "Para volver a instalar ejecute: ./deploy.sh"
        else
            echo "Cancelado - Confirmación incorrecta"
        fi
        ;;
    0)
        echo "Cancelado por el usuario"
        exit 0
        ;;
    *)
        echo -e "${RED}Opción inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo "================================================================"
echo "Limpieza finalizada"
echo "================================================================"

# Mostrar espacio liberado
echo ""
echo "Uso actual de disco:"
df -h . | tail -1
echo ""
echo "Uso de Docker:"
docker system df
