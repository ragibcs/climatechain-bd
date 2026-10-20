# syntax=docker/dockerfile:1.7
# ==============================================================================
# ClimateChain BD - Unified production image
# Serves the FastAPI risk engine and the Next.js dashboard from one container.
# Designed for Render (single web service, dynamic $PORT) but portable to any
# Docker host.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Install frontend dependencies
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS web-deps

WORKDIR /app/apps/web

ENV NEXT_TELEMETRY_DISABLED=1

COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --no-audit --no-fund

# ------------------------------------------------------------------------------
# Stage 2: Build the Next.js dashboard
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS web-builder

WORKDIR /app/apps/web

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=web-deps /app/apps/web/node_modules ./node_modules
COPY apps/web/ ./

# Build first, then remove dev-only packages from the runtime copy.
RUN mkdir -p public \
    && npm run build \
    && npm prune --omit=dev --no-audit --no-fund

# ------------------------------------------------------------------------------
# Stage 3: Unified runtime (Python 3.11 + Node.js 20)
# ------------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    ALLOW_ALL_ORIGINS=true \
    PORT=10000

# Runtime tools: curl for the health probe, tini for correct signal handling.
# Node is copied from the official image instead of piping a setup script into
# bash, which keeps the build reproducible and avoids an extra package repo.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        libatomic1 \
        libstdc++6 \
        tini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=node:20-bookworm-slim /usr/local/bin/node /usr/local/bin/node

# Install Python dependencies before copying application source so normal code
# changes do not invalidate the slow dependency layer.
COPY services/api/requirements.txt /app/services/api/requirements.txt
RUN pip install --no-cache-dir -r /app/services/api/requirements.txt

# Create an unprivileged runtime user and make the application tree writable
# where Next.js and the optional seed script need it.
RUN groupadd --gid 10001 climatechain \
    && useradd --uid 10001 --gid climatechain --create-home \
        --home-dir /home/climatechain --shell /usr/sbin/nologin climatechain \
    && chown climatechain:climatechain /app

# Backend, risk engine, and committed sample datasets.
COPY --chown=climatechain:climatechain ml/ /app/ml/
COPY --chown=climatechain:climatechain services/ /app/services/
COPY --chown=climatechain:climatechain data/ /app/data/

# Built dashboard and its production dependencies.
COPY --chown=climatechain:climatechain --from=web-builder /app/apps/web/package.json /app/apps/web/package-lock.json /app/apps/web/
COPY --chown=climatechain:climatechain --from=web-builder /app/apps/web/next.config.js /app/apps/web/
COPY --chown=climatechain:climatechain --from=web-builder /app/apps/web/public /app/apps/web/public
COPY --chown=climatechain:climatechain --from=web-builder /app/apps/web/.next /app/apps/web/.next
COPY --chown=climatechain:climatechain --from=web-builder /app/apps/web/node_modules /app/apps/web/node_modules

COPY --chown=climatechain:climatechain scripts/start-render.sh /app/scripts/start-render.sh
RUN chmod 0755 /app/scripts/start-render.sh \
    && node --version

USER climatechain

# Public Render port and the loopback-only FastAPI port.
EXPOSE 10000 8000

# The probe goes through the Next.js proxy, so it only passes when both the
# dashboard and the API are serving traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-10000}/api/health" || exit 1

STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/scripts/start-render.sh"]
