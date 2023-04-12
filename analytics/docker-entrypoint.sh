#!/bin/sh
# Overwrites the matomo entrypoint.
set -e

ls -la
ls -la /usr/src/matomo

rm -rf *
# if [ ! -e matomo.php ]; then
# 	tar cf - --one-file-system -C /usr/src/matomo . | tar xf -
# fi
tar cf - --one-file-system --owner=33 --group=33 -C /usr/src/matomo . | tar xf -

ls -la /var/www/html

exec "$@"