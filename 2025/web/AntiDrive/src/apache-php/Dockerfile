FROM php:8.0.10-apache

COPY php.ini /usr/local/etc/php/

# Enable required PHP modules (similar to XAMPP’s default)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache modules similar to XAMPP
RUN a2enmod rewrite \
    && a2enmod ssl

# Set htdocs like XAMPP
WORKDIR /var/www/html
