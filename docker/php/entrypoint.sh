#!/bin/sh
set -eu

run() {
    runuser -u www-data -- "$@"
}

echo "Aguardando MySQL em ${DB_HOST:-mysql}..."
i=0
until run php -r '
$h = getenv("DB_HOST") ?: "mysql";
$u = getenv("DB_USERNAME") ?: "linksnabio";
$p = getenv("DB_PASSWORD") ?: "secret";
new PDO("mysql:host={$h};port=3306", $u, $p);
' >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge 30 ]; then
        echo "MySQL não respondeu a tempo." >&2
        exit 1
    fi
    sleep 2
done
echo "MySQL pronto."

echo "Instalando dependências PHP..."
run composer install --no-interaction --prefer-dist --no-progress

if [ ! -f .env ]; then
    echo "Criando .env a partir do exemplo..."
    run cp .env.example .env
fi

if ! grep -q '^APP_KEY=base64:' .env; then
    echo "Gerando APP_KEY..."
    run php artisan key:generate --force --no-interaction
fi

run php artisan migrate --force --no-interaction
run php artisan db:seed --force --no-interaction
run php artisan storage:link --force --no-interaction || true

echo "PHP-FPM iniciado."
exec "$@"
