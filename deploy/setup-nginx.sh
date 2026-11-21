#!/usr/bin/env bash
# Installs nginx + certbot, gets ONE Let's Encrypt SAN certificate for all four hosts, and enables the
# sakooticket configs from deploy/nginx. Debian/Ubuntu only. Safe to run again: a valid certificate is kept,
# configs are replaced with the versions from this repo, and nginx is reloaded only after `nginx -t` passes.
#
#   sudo bash deploy/setup-nginx.sh admin@example.com      # e-mail for expiry notices (recommended)
#   sudo bash deploy/setup-nginx.sh                        # without e-mail
#
# Environment overrides:
#   SKIP_DNS_CHECK=1   do not stop when a domain does not resolve to this server
#   SERVER_IP=x.x.x.x  public IP the domains must resolve to (default 87.107.164.153)
#   STAGING=1          use the Let's Encrypt staging CA (for testing; certificate is NOT trusted by browsers)
set -euo pipefail

EMAIL="${1:-}"
PRIMARY=sakooticket.ir
DOMAINS=(sakooticket.ir www.sakooticket.ir panel.sakooticket.ir adm.sakooticket.ir)
SITE_FILES=(00-sakooticket-common.conf sakooticket.ir.conf www.sakooticket.ir.conf panel.sakooticket.ir.conf adm.sakooticket.ir.conf)
SNIPPET_FILES=(sakooticket-ssl.conf sakooticket-security-headers.conf sakooticket-proxy.conf)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_SITES="$SCRIPT_DIR/nginx/sites"
SRC_SNIPPETS="$SCRIPT_DIR/nginx/snippets"
AVAILABLE=/etc/nginx/sites-available
ENABLED=/etc/nginx/sites-enabled
SNIPPETS=/etc/nginx/snippets
WEBROOT=/var/www/certbot
CACHE_DIR=/var/cache/nginx/sakooticket
CERT="/etc/letsencrypt/live/$PRIMARY/fullchain.pem"
BOOTSTRAP="$AVAILABLE/sakooticket-bootstrap.conf"
BACKUP_DIR=/root/sakooticket-backups/nginx

log()  { printf '\n==> %s\n' "$*"; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run as root (sudo)."
command -v apt-get >/dev/null || die "This script needs apt (Debian/Ubuntu)."
for f in "${SITE_FILES[@]}"; do [ -f "$SRC_SITES/$f" ] || die "Missing $SRC_SITES/$f"; done
for f in "${SNIPPET_FILES[@]}"; do [ -f "$SRC_SNIPPETS/$f" ] || die "Missing $SRC_SNIPPETS/$f"; done

# ---------- 1. packages ----------
log "Installing nginx and certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx certbot dnsutils curl iproute2
systemctl enable nginx

# ---------- 2. backup current nginx config ----------
mkdir -p "$BACKUP_DIR"
chmod 700 /root/sakooticket-backups
BACKUP_FILE="$BACKUP_DIR/etc-nginx-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" -C /etc nginx
log "Backed up /etc/nginx to $BACKUP_FILE"

# ---------- 3. ports 80/443 ----------
log "Checking ports 80 and 443"
if ss -ltnp | grep -E ':(80|443)\s' | grep -v nginx; then
  die "Another program listens on port 80 or 443 (above). Stop or move it first; this script will not touch it."
fi
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

# ---------- 4. DNS ----------
SERVER_IPS="${SERVER_IP:-87.107.164.153} $(hostname -I 2>/dev/null || true)"
log "Checking DNS (this server: $SERVER_IPS)"
DNS_OK=1
for d in "${DOMAINS[@]}"; do
  ips="$(dig +short A "$d" | tr '\n' ' ')"
  match=0
  for ip in $ips; do
    case " $SERVER_IPS " in *" $ip "*) match=1 ;; esac
  done
  if [ "$match" -eq 1 ]; then
    echo "  OK    $d -> $ips"
  else
    echo "  WRONG $d -> ${ips:-<no A record>}"
    DNS_OK=0
  fi
done
if [ "$DNS_OK" -ne 1 ] && [ "${SKIP_DNS_CHECK:-0}" != "1" ]; then
  die "Every domain must have an A record pointing to this server (ArvanCloud CDN proxy OFF) before a certificate can be issued. Fix DNS, wait for it to propagate, and run again (or SKIP_DNS_CHECK=1 if you are sure)."
fi

# ---------- 5. snippets + cache dir ----------
log "Installing snippets"
mkdir -p "$SNIPPETS" "$WEBROOT" "$CACHE_DIR"
chown www-data:www-data "$CACHE_DIR" 2>/dev/null || true
for f in "${SNIPPET_FILES[@]}"; do install -m 644 "$SRC_SNIPPETS/$f" "$SNIPPETS/$f"; done

# Older versions of this repo installed a single sakooticket.conf; disable it so server names are not defined twice.
if [ -L "$ENABLED/sakooticket.conf" ] || [ -f "$ENABLED/sakooticket.conf" ]; then
  rm -f "$ENABLED/sakooticket.conf"
  [ -f "$AVAILABLE/sakooticket.conf" ] && mv "$AVAILABLE/sakooticket.conf" "$AVAILABLE/sakooticket.conf.old"
  echo "  disabled the old single-file sakooticket.conf (kept as $AVAILABLE/sakooticket.conf.old)"
fi

# ---------- 6. certificate ----------
# The final configs reference the certificate, so nginx would refuse them before it exists.
# Until then, a plain HTTP config answers the ACME challenge.
if [ ! -f "$CERT" ]; then
  log "No certificate yet: enabling the temporary HTTP-only config"
  for f in "${SITE_FILES[@]}"; do rm -f "$ENABLED/$f"; done
  cat > "$BOOTSTRAP" <<EOF
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
  ln -sf "$BOOTSTRAP" "$ENABLED/sakooticket-bootstrap.conf"
  nginx -t
  systemctl reload-or-restart nginx
fi

log "Requesting / checking the certificate for: ${DOMAINS[*]}"
CERTBOT_ARGS=(certonly --webroot -w "$WEBROOT" --non-interactive --agree-tos --keep-until-expiring --expand --cert-name "$PRIMARY")
for d in "${DOMAINS[@]}"; do CERTBOT_ARGS+=(-d "$d"); done
if [ -n "$EMAIL" ]; then CERTBOT_ARGS+=(--email "$EMAIL"); else CERTBOT_ARGS+=(--register-unsafely-without-email); fi
[ "${STAGING:-0}" = "1" ] && CERTBOT_ARGS+=(--staging)
certbot "${CERTBOT_ARGS[@]}"

# Renewals (certbot.timer, installed by the certbot package) reload nginx so the new certificate is served.
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOF'
#!/bin/sh
nginx -t && systemctl reload nginx
EOF
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# ---------- 7. final configs ----------
log "Installing site configs"
for f in "${SITE_FILES[@]}"; do
  install -m 644 "$SRC_SITES/$f" "$AVAILABLE/$f"
  ln -sf "$AVAILABLE/$f" "$ENABLED/$f"
done
rm -f "$ENABLED/sakooticket-bootstrap.conf" "$BOOTSTRAP"

if ! nginx -t; then
  # Only this project's links are removed; other sites on the server are left exactly as they were.
  for f in "${SITE_FILES[@]}"; do rm -f "$ENABLED/$f"; done
  die "New configuration rejected (see nginx -t above); the sakooticket sites were disabled again and nginx was not reloaded. Backup of the previous /etc/nginx: $BACKUP_FILE"
fi
systemctl reload-or-restart nginx

# ---------- 8. renewal test ----------
log "Testing automatic renewal (dry run)"
systemctl enable --now certbot.timer 2>/dev/null || true
certbot renew --dry-run --cert-name "$PRIMARY"

log "Done"
certbot certificates --cert-name "$PRIMARY" | sed -n '/Certificate Name/,/Certificate Path/p'
echo "nginx is serving: ${DOMAINS[*]}"
echo "Next: bash deploy/verify.sh"
