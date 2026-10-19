#!/bin/bash
set -e

# Render assigns PORT dynamically (usually 10000)
PUBLIC_PORT="${PORT:-10000}"
INTERNAL_API_PORT="8000"

echo "=== Starting ClimateChain BD on Render ==="
echo "Public Port: ${PUBLIC_PORT}"
echo "Internal FastAPI Port: ${INTERNAL_API_PORT}"

# Seed initial climate data if missing
if [ ! -f "data/samples/sylhet-sadar_sample.json" ]; then
  echo "Seeding initial climate data for Sylhet stations..."
  PYTHONPATH=. python3 ml/data/seed_data.py || true
fi

# 1. Start FastAPI backend on 127.0.0.1:8000 in background
echo "Starting FastAPI backend on 127.0.0.1:${INTERNAL_API_PORT}..."
PYTHONPATH=. uvicorn services.api.main:app --host 127.0.0.1 --port ${INTERNAL_API_PORT} &
API_PID=$!

# Wait briefly for FastAPI to initialize
for i in {1..20}; do
  if curl -s "http://127.0.0.1:${INTERNAL_API_PORT}/api/health" > /dev/null 2>&1; then
    echo "FastAPI backend is ready!"
    break
  fi
  echo "Waiting for FastAPI backend ($i/20)..."
  sleep 1
done

# Trap SIGTERM / SIGINT for graceful container shutdown
trap "echo 'Shutting down services...'; kill -TERM $API_PID 2>/dev/null; exit 0" SIGTERM SIGINT

# 2. Start Next.js frontend on public $PORT in foreground
echo "Starting Next.js frontend on 0.0.0.0:${PUBLIC_PORT}..."
cd /app/apps/web
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "${PUBLIC_PORT}"
