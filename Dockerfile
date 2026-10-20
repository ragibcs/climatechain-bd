# ==============================================================================
# ClimateChain BD - Unified Multi-Stage Dockerfile for Render Deployment
# Serves FastAPI Intelligence backend and Next.js Dashboard in a single container
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Next.js Dashboard
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS web-builder

WORKDIR /app/apps/web

# Install all dependencies needed for the Next.js build
COPY apps/web/package*.json ./
RUN npm ci

# Copy frontend source files, ensure public exists, and run Next.js production build
COPY apps/web/ ./
RUN mkdir -p /app/apps/web/public
RUN npm run build

# Prune devDependencies to keep the production layer compact
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Production Unified Runner (Python 3.11 + Node.js 20)
# ------------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    NODE_ENV=production \
    ALLOW_ALL_ORIGINS=true \
    PORT=10000

# Install system dependencies, Node.js 20, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY services/api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend components, risk engine, and seed datasets
COPY ml/ /app/ml/
COPY services/ /app/services/
COPY data/ /app/data/

# Copy built Next.js application from stage 1
COPY --from=web-builder /app/apps/web/package*.json /app/apps/web/
COPY --from=web-builder /app/apps/web/next.config.js /app/apps/web/
COPY --from=web-builder /app/apps/web/public /app/apps/web/public
COPY --from=web-builder /app/apps/web/.next /app/apps/web/.next
COPY --from=web-builder /app/apps/web/node_modules /app/apps/web/node_modules

# Copy startup orchestration script
COPY scripts/start-render.sh /app/scripts/start-render.sh
RUN chmod +x /app/scripts/start-render.sh

# Expose Render standard port (10000) and internal FastAPI port (8000)
EXPOSE 10000 8000

# Container healthcheck querying the proxied health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-10000}/api/health || exit 1

ENTRYPOINT ["/bin/bash", "/app/scripts/start-render.sh"]
