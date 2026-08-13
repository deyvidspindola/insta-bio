FROM php:8.4-fpm-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libicu-dev \
        libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php/conf.d/local.ini /usr/local/etc/php/conf.d/local.ini
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ARG USER_ID=1000
ARG GROUP_ID=1000
RUN groupmod -o -g "${GROUP_ID}" www-data \
    && usermod -o -u "${USER_ID}" -g www-data www-data \
    && mkdir -p /tmp/composer \
    && chown -R www-data:www-data /tmp/composer /var/www

ENV COMPOSER_HOME=/tmp/composer \
    COMPOSER_MEMORY_LIMIT=-1

WORKDIR /var/www/html

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
