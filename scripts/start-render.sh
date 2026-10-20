#!/usr/bin/env bash
# ==============================================================================
# Start the FastAPI backend and Next.js dashboard inside one container.
# Kept deliberately small: tini (PID 1) reaps children, this script owns
# lifecycle and resilient shutdown, and Next.js stays in the foreground group.
# ==============================================================================
set -Eeuo pipefail

PUBLIC_PORT="${PORT:-10000}"
INTERNAL_API_PORT="${INTERNAL_API_PORT:-8000}"
API_PID=""
WEB_PID=""

log() {
  echo "[climatechain] $*"
}

stop_services() {
  if [[ -n "${WEB_PID}" ]] && kill -0 "${WEB_PID}" 2>/dev/null; then
    log "Stopping Next.js (pid ${WEB_PID})..."
    kill -TERM "${WEB_PID}" 2>/dev/null || true
  fi
  if [[ -n "${API_PID}" ]] && kill -0 "${API_PID}" 2>/dev/null; then
    log "Stopping FastAPI (pid ${API_PID})..."
    kill -TERM "${API_PID}" 2>/dev/null || true
  fi
  wait || true
}

on_signal() {
  log "Received shutdown signal."
  stop_services
  exit 0
}

trap on_signal SIGTERM SIGINT

cd /app

log "=== ClimateChain BD starting ==="
log "Public port: ${PUBLIC_PORT}"
log "Internal API port: ${INTERNAL_API_PORT}"

# The image ships the June 2024 samples. Seed only if a deployment mounts an
# empty data directory; never block startup on a failed upstream request.
if [[ ! -f /app/data/samples/sylhet-sadar_sample.json ]]; then
  log "Sample data missing; attempting to seed historical observations..."
  PYTHONPATH=/app python3 /app/ml/data/seed_data.py \
    || log "WARNING: seed failed; continuing without archived samples."
fi

log "Starting FastAPI on 127.0.0.1:${INTERNAL_API_PORT}..."
PYTHONPATH=/app uvicorn services.api.main:app \
  --host 127.0.0.1 \
  --port "${INTERNAL_API_PORT}" &
API_PID=$!

READY=false
for attempt in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${INTERNAL_API_PORT}/api/health" >/dev/null 2>&1; then
    READY=true
    break
  fi
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    log "ERROR: FastAPI exited before becoming ready." >&2
    wait "${API_PID}" || true
    exit 1
  fi
  log "Waiting for FastAPI (${attempt}/30)..."
  sleep 1
done

if [[ "${READY}" != "true" ]]; then
  log "ERROR: FastAPI did not become healthy within 30 seconds." >&2
  stop_services
  exit 1
fi
log "FastAPI is ready."

log "Starting Next.js on 0.0.0.0:${PUBLIC_PORT}..."
cd /app/apps/web
./node_modules/.bin/next start -H 0.0.0.0 -p "${PUBLIC_PORT}" &
WEB_PID=$!

# Either process exiting means the public service is degraded. Report the
# failure so the platform restarts the container rather than serving a half-up
# stack.
set +e
wait -n "${API_PID}" "${WEB_PID}"
STATUS=$?
set -e

log "A service exited (status ${STATUS}); shutting down the container." >&2
stop_services

if [[ "${STATUS}" -eq 0 ]]; then
  exit 1
fi
exit "${STATUS}"
