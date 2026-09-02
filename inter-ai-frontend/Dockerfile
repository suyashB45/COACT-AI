# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage — Nginx reverse proxy + static asset server.
# Terminates TLS and proxies /api, /session, /static to the backend service.
# Matches the port mappings, health check, cert volume mounts, and Certbot
# scripts in docker-compose.yml.
FROM nginx:1.27-alpine

# SPA config (TLS, security headers, rate-limited API proxy, WebSocket support)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# HTTP-only fallback config used by the entrypoint when no certs are present
COPY nginx.http.conf /etc/nginx/nginx.http.conf

# Entrypoint selects HTTP vs HTTPS config based on the presence of certs
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Certbot ACME challenge root
RUN mkdir -p /var/www/certbot

# Production bundle
COPY --from=build /app/dist /usr/share/nginx/html

# Run as non-root (last step, so appuser owns all files it needs)
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup && \
    chmod +x /docker-entrypoint.sh && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    chown -R appuser:appgroup /var/www/certbot && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid
USER appuser

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]