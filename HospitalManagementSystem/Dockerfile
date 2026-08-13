FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System libraries for Pillow and psycopg
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libjpeg62-turbo \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure the entrypoint is executable (file modes are lost on Windows checkouts)
RUN chmod +x /app/entrypoint.sh

# Non-root user for running the app
RUN addgroup --system django \
    && adduser --system --ingroup django django

RUN mkdir -p /app/staticfiles /app/media /app/logs \
    && chown -R django:django /app

USER django

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
