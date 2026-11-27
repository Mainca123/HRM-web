# Stage 1: Build React + Vite production bundle
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve SPA with Nginx + /api reverse proxy
FROM nginx:1.27-alpine
ENV API_BASE_URL=https://hrm-tmyj.onrender.com

# Nginx tự động thay thế biến ${API_BASE_URL} khi khởi động container
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
