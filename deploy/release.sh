#!/usr/bin/env bash
# Publica uma marca no servidor: build, cópia para uma release versionada, troca do link
# `current`, reinício do serviço e verificação de saúde. Se a verificação falhar, volta
# para a release anterior. Uso (no servidor, dentro do checkout): deploy/release.sh alvorada
set -euo pipefail

BRAND="${1:?informe a marca, por exemplo: deploy/release.sh alvorada}"
ROOT="${COSTURA_ROOT:-/srv/costura}"
KEEP="${COSTURA_KEEP_RELEASES:-5}"
SERVICE="costura@${BRAND}"
ENV_FILE="/etc/costura/${BRAND}.env"

[[ -f "$ENV_FILE" ]] || { echo "Falta $ENV_FILE (copie de deploy/costura.env.example)"; exit 1; }
PORT="$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2)"

stamp="$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD 2>/dev/null || echo local)"
release="$ROOT/$BRAND/releases/$stamp"

# Páginas estáticas gravam SITE_URL e APP_ENV no build, então o build usa o mesmo ambiente da execução.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
npm ci --no-audit --no-fund
node scripts/build-brand.mjs "$BRAND"
mkdir -p "$release"
cp -a ".next-$BRAND/standalone/." "$release/"
mkdir -p "$release/.next/cache"
chown -R costura:costura "$release/.next/cache"

previous="$(readlink -f "$ROOT/$BRAND/current" 2>/dev/null || true)"
ln -sfn "$release" "$ROOT/$BRAND/current"
systemctl restart "$SERVICE"

for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/loja"; then
    echo "Publicado: $BRAND -> $release"
    ls -1dt "$ROOT/$BRAND/releases/"* | tail -n +"$((KEEP + 1))" | xargs -r rm -rf
    exit 0
  fi
  sleep 1
done

echo "Verificação de saúde falhou; voltando para a release anterior." >&2
if [[ -n "$previous" ]]; then
  ln -sfn "$previous" "$ROOT/$BRAND/current"
  systemctl restart "$SERVICE"
fi
exit 1
