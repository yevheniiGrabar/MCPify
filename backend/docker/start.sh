#!/bin/sh
set -e

cd /var/www

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Cache config/routes/views for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Seed plans if table is empty
php artisan db:seed --class=PlanSeeder --force 2>/dev/null || true

# Start supervisor (nginx + php-fpm + horizon)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
