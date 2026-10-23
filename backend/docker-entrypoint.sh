#!/bin/sh
set -e

host="${DB_HOST:-mysql}"
port="${DB_PORT:-3306}"
user="${DB_USER:-root}"
pass="${DB_PASSWORD:-root}"

echo "Esperando MySQL en ${host}:${port}..."
until mysqladmin ping -h"$host" -P"$port" -u"$user" -p"$pass" --silent 2>/dev/null; do
  sleep 2
done

echo "MySQL disponible. Iniciando API..."
exec "$@"
