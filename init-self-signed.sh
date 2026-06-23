#!/bin/bash

# init-self-signed.sh
# Generates a Self-Signed SSL Certificate for IP address deployments (no domain required).
# This provides HTTPS which is strictly required for camera/microphone access in modern browsers.

ip_address="localhost"
data_path="./certbot"
rsa_key_size=2048

echo "### Starting Self-Signed SSL Setup ###"

# 1. Clean up old certificates
echo "Cleaning up old configuration..."
rm -rf "$data_path/conf/live/coact-ai.com"
mkdir -p "$data_path/conf/live/coact-ai.com"
mkdir -p "$data_path/www"

# 2. Download TLS parameters (security best practices)
if [ ! -f "$data_path/conf/options-ssl-nginx.conf" ]; then
    echo "Downloading TLS parameters..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

# 3. Create Self-Signed Certificate
# Note: Nginx config expects certificates at 'coact-ai.com' folder path, so we use that path even for self-signed.
echo "Generating self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 365 \
  -keyout "$data_path/conf/live/coact-ai.com/privkey.pem" \
  -out "$data_path/conf/live/coact-ai.com/fullchain.pem" \
  -subj "/CN=$ip_address" 2>/dev/null

# 4. Start Nginx
echo "Starting frontend service..."
docker compose up -d frontend

echo "### Setup Complete! ###"
echo "You can now access your site via HTTPS!"
echo "Note: Your browser will say 'Warning: Not Secure' because it's a self-signed certificate."
echo "Click 'Advanced -> Proceed to [IP]' to bypass the warning. Camera will now work permanently."
