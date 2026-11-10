# syntax=docker/dockerfile:1.7

# ---- Stage 1: build the frontend ----
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build python deps into a venv ----
FROM python:3.12-slim AS pybuild
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /opt/venv
COPY backend/requirements.txt /tmp/requirements.txt
RUN /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt

# ---- Stage 3: runtime ----
FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" PYTHONPATH="/app:$PYTHONPATH" \
    APP_ENV=production PAYPAL_ENV=sandbox \
    PORT=8080 DATA_DIR=/data
RUN apt-get update && apt-get install -y --no-install-recommends tini && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -g 10001 app && useradd -u 10001 -g app -M -s /usr/sbin/nologin app && \
    mkdir -p /data /app/data && chown -R app:app /data /app
COPY --from=pybuild --chown=app:app /opt/venv /opt/venv
COPY --from=web --chown=app:app /web/dist /app/static
COPY --chown=app:app backend/app /app/app
COPY --chown=app:app backend/alembic /app/alembic
COPY --chown=app:app backend/alembic.ini /app/alembic.ini
COPY --chown=app:app docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R app:app /data /app
WORKDIR /app
USER 10001:10001
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8080\")}/healthz',timeout=4)" || exit 1
ENTRYPOINT ["/usr/bin/tini","--","/entrypoint.sh"]
