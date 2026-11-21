#!/usr/bin/env bash
# Run on the SERVER as root, from anywhere. Backs up the database, uploaded files, .env and nginx config to
# /root/sakooticket-backups/<timestamp>/ and deletes backups older than KEEP_DAYS (default 14).
# Nothing in the running stack is stopped or changed.
#
#   bash /opt/sakooticket/deploy/backup.sh
#   cron (daily 03:30):  30 3 * * * /opt/sakooticket/deploy/backup.sh >> /var/log/sakooticket-backup.log 2>&1
#
# Restore: see DEPLOYMENT.md, section "Backup and restore".
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE=/root/sakooticket-backups
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$BASE/$STAMP"

umask 077
mkdir -p "$DEST"
chmod 700 "$BASE"

echo "[$(date -Is)] backup -> $DEST"

# Database: custom-format dump made inside the db container with its own credentials.
docker exec sakooticket-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$DEST/db.dump"
[ -s "$DEST/db.dump" ] || { echo "database dump is empty" >&2; exit 1; }

# Uploaded images (named volume), read-only mount through the backend image (already on the server).
docker run --rm --network none --entrypoint tar \
  -v sakooticket_uploads:/data:ro sakooticket-backend -czf - -C /data . > "$DEST/uploads.tar.gz"

# Secrets and web server config.
[ -f "$APP_DIR/.env" ] && cp -p "$APP_DIR/.env" "$DEST/env"
tar -czf "$DEST/etc-nginx.tar.gz" -C /etc nginx
[ -d /etc/letsencrypt ] && tar -czf "$DEST/etc-letsencrypt.tar.gz" -C /etc letsencrypt

( cd "$DEST" && sha256sum ./* > SHA256SUMS )
echo "[$(date -Is)] done: $(du -sh "$DEST" | cut -f1)"

# Retention: only timestamped folders created by this script.
find "$BASE" -mindepth 1 -maxdepth 1 -type d -name '20[0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9][0-9][0-9]' \
  -mtime "+$KEEP_DAYS" -print -exec rm -rf {} +
