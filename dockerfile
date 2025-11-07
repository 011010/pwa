# --- Etapa 1: build ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Compila la app
RUN npm run build

# --- Etapa 2: servidor ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

# Opcional: reemplazar config de Nginx (si usas rutas SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf
