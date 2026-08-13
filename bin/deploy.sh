#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-main}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-${HOME}/public_html}"

cd "$APP_DIR"

trap 'php artisan up || true' EXIT

php artisan down --retry=60 || true

git fetch origin
git reset --hard "origin/${BRANCH}"

composer install --no-dev --optimize-autoloader --no-interaction --no-progress

php artisan migrate --force
php artisan optimize:clear
php artisan event:cache
php artisan route:cache
php artisan config:cache
php artisan storage:link --force || true

if [ -d "$APP_DIR/public" ] && [ "$WEB_ROOT" != "$APP_DIR/public" ] && [ -d "$WEB_ROOT" ]; then
  rsync -a --delete \
    --exclude 'index.php' \
    --exclude 'storage' \
    --exclude '.htaccess' \
    "$APP_DIR/public/" "$WEB_ROOT/"

  cat > "$WEB_ROOT/index.php" <<PHP
<?php
require '$APP_DIR/public/index.php';
PHP

  if [ -d "$APP_DIR/storage/app/public" ]; then
    ln -sfn "$APP_DIR/storage/app/public" "$WEB_ROOT/storage"
  fi
fi

php artisan queue:restart || true
php artisan up
