FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar código fuente
COPY server.js ./

# Crear directorio para datos
RUN mkdir -p /app/data && chmod 755 /app/data

# Exponer puerto
EXPOSE 4000

# Variables de entorno por defecto
ENV PORT=4000
ENV NODE_ENV=production
ENV WEBHOOK_AUTH_USER=admin
ENV WEBHOOK_AUTH_PASS=playhunt2024

# Comando de inicio
CMD ["node", "server.js"]