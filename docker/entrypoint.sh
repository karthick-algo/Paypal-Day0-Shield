#!/bin/sh
set -eu
: "${PORT:=8080}"
python -m app.bootcheck
# TODO(Nov 9): enable once alembic/ migrations exist
[ -f /app/alembic/env.py ] && alembic upgrade head
if [ "${SEED_ON_BOOT:-false}" = "true" ]; then python -m app.seed; fi
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 1 \
  --proxy-headers --forwarded-allow-ips "${TRUSTED_PROXY_IPS:-127.0.0.1}" \
  --no-server-header --timeout-graceful-shutdown 25
