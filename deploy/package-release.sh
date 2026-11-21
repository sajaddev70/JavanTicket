#!/usr/bin/env bash
# Run on the DEVELOPMENT machine (needs JDK 17). Builds the backend jar and bundles everything the server needs
# into dist/sakooticket-release.tar.gz — no node_modules, build caches, Android code, design files or secrets.
#
#   bash deploy/package-release.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Building backend jar"
./gradlew clean bootJar
JARS=(build/libs/*.jar)
[ "${#JARS[@]}" -eq 1 ] && [ -f "${JARS[0]}" ] || { echo "Expected exactly one jar in build/libs" >&2; exit 1; }

mkdir -p dist
OUT="dist/sakooticket-release.tar.gz"
echo "==> Packaging $OUT"
# COPYFILE_DISABLE keeps macOS metadata (._* files) out of the archive.
COPYFILE_DISABLE=1 tar -czf "$OUT" \
  --exclude='node_modules' --exclude='.next' --exclude='*.tsbuildinfo' --exclude='.DS_Store' \
  --exclude='.env' --exclude='.env.local' --exclude='.env.*.local' \
  Dockerfile .dockerignore docker-compose.yml .env.example DEPLOYMENT.md \
  "${JARS[0]}" \
  deploy \
  frontend/admin frontend/user

# Refuse to ship anything that looks like a secret.
if tar -tzf "$OUT" | grep -E '(^|/)\.env$|server\.txt|\.pem$|\.key$|id_rsa|id_ed25519' ; then
  echo "Archive contains a secret-looking file (listed above); not shipping it." >&2
  rm -f "$OUT"
  exit 1
fi

# Bare file name, so `sha256sum -c` works wherever the two files are copied together.
( cd dist && shasum -a 256 sakooticket-release.tar.gz > sakooticket-release.tar.gz.sha256 )
echo "==> Done: $ROOT/$OUT ($(du -h "$OUT" | cut -f1))"
echo "    sha256: $(cut -d' ' -f1 "$OUT.sha256")"
