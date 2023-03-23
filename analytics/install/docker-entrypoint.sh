#!/bin/sh

# From https://github.com/matomo-org/docker/blob/master/fpm/docker-entrypoint.sh

set -e

# usage: file_env VAR [DEFAULT]
#    ie: file_env 'XYZ_DB_PASSWORD' 'example'
# (will allow for "$XYZ_DB_PASSWORD_FILE" to fill in the value of
#  "$XYZ_DB_PASSWORD" from a file, especially for Docker's secrets feature)
file_env() {
  local var="$1"
  local fileVar="${var}_FILE"
  local def="${2:-}"
  local varValue=$(env | grep -E "^${var}=" | sed -E -e "s/^${var}=//")
  local fileVarValue=$(env | grep -E "^${fileVar}=" | sed -E -e "s/^${fileVar}=//")
  if [ -n "${varValue}" ] && [ -n "${fileVarValue}" ]; then
    echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
    exit 1
  fi
  if [ -n "${varValue}" ]; then
    export "$var"="${varValue}"
  elif [ -n "${fileVarValue}" ]; then
    export "$var"="$(cat "${fileVarValue}")"
  elif [ -n "${def}" ]; then
    export "$var"="$def"
  fi
  unset "$fileVar"
}

file_env 'MATOMO_DATABASE_HOST'
file_env 'MATOMO_DATABASE_USERNAME'
file_env 'MATOMO_DATABASE_PASSWORD'
file_env 'MATOMO_DATABASE_DBNAME'

if [ ! -e matomo.php ]; then
  tar cf - --one-file-system -C /usr/src/matomo . | tar xf -
  chown -R www-data:www-data .
fi

# Install ExtraTools requirements
composer require -n symfony/yaml:~2.6.0
composer require -n symfony/process:^5.4

# Always enable ExtraTools plugin, even if config.ini.php does not exist
echo "[General]" > /var/www/html/config/common.config.ini.php
echo "always_load_commands_from_plugin=ExtraTools" >> /var/www/html/config/common.config.ini.php

# Update file permissions
mkdir -p /var/www/html/tmp/assets
mkdir -p /var/www/html/tmp/templates_c
chown -R www-data:www-data /var/www/html
find /var/www/html/tmp/assets -type f -exec chmod 644 {} \;
find /var/www/html/tmp/assets -type d -exec chmod 755 {} \;
find /var/www/html/tmp/templates_c -type f -exec chmod 644 {} \;
find /var/www/html/tmp/templates_c -type d -exec chmod 755 {} \;
# php ./console matomo:install --force --install-file=install.json
# php ./console site:add --name=Foo --urls=https://foo.bar

exec "$@"
