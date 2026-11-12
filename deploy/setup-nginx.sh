#!/usr/bin/env bash
# Installs nginx and certbot, gets one Let's Encrypt certificate for all four hosts, and enables deploy/nginx/sakooticket.conf.
# Safe to run again; an existing valid certificate is kept. Debian/Ubuntu only.
#
#   sudo bash deploy/setup-nginx.sh [email-for-expiry-notices]
set -euo pipefail

EMAIL="${1:-}"
DOMAINS=(sakooticket.ir www.sakooticket.ir panel.sakooticket.ir adm.sakooticket.ir)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_CONF="$SCRIPT_DIR/nginx/sakooticket.conf"
SITE_AVAILABLE=/etc/nginx/sites-available/sakooticket.conf
SITE_ENABLED=/etc/nginx/sites-enabled/sakooticket.conf
WEBROOT=/var/www/certbot
CERT="/etc/letsencrypt/live/sakooticket.ir/fullchain.pem"

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)." >&2; exit 1; }
[ -f "$SOURCE_CONF" ] || { echo "Missing $SOURCE_CONF" >&2; exit 1; }
command -v apt-get >/dev/null || { echo "This script needs apt (Debian/Ubuntu)." >&2; exit 1; }

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx certbot

mkdir -p "$WEBROOT"

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

# nginx refuses the final config until the certificate exists, so answer the challenge from a plain HTTP config first.
if [ ! -f "$CERT" ]; then
  cat > "$SITE_AVAILABLE" <<EOF
server {
    listen 80;
    server_name ${DOMAINS[*]};
    location ^~ /.well-known/acme-challenge/ {
        root $WEBROOT;
        default_type text/plain;
    }
    location / {
        return 503;
    }
}
EOF
  ln -sf "$SITE_AVAILABLE" "$SITE_ENABLED"
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
fi

CERTBOT_ARGS=(certonly --webroot -w "$WEBROOT" --non-interactive --agree-tos --keep-until-expiring --expand)
for domain in "${DOMAINS[@]}"; do
  CERTBOT_ARGS+=(-d "$domain")
done
if [ -n "$EMAIL" ]; then
  CERTBOT_ARGS+=(--email "$EMAIL")
else
  CERTBOT_ARGS+=(--register-unsafely-without-email)
fi
certbot "${CERTBOT_ARGS[@]}"

# Renewals are picked up without a manual reload.
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

cp "$SOURCE_CONF" "$SITE_AVAILABLE"
ln -sf "$SITE_AVAILABLE" "$SITE_ENABLED"
nginx -t
systemctl enable nginx
systemctl reload-or-restart nginx

certbot renew --dry-run

echo
echo "nginx is serving: ${DOMAINS[*]}"
