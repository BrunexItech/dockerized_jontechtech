# backend/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /app

# System deps:
# - build-essential & pkg-config: compile native wheels (mysqlclient, reportlab, pillow)
# - default-libmysqlclient-dev: MySQL/MariaDB headers for mysqlclient
# - default-mysql-client: handy for debugging inside the container
# - zlib/libjpeg/freetype: image libs used by Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    default-libmysqlclient-dev \
    default-mysql-client \
    zlib1g-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
 && rm -rf /var/lib/apt/lists/*

# Upgrade pip tooling
RUN python -m pip install --upgrade pip setuptools wheel

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

EXPOSE 8000

# Dev entrypoint
CMD sh -c "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"
