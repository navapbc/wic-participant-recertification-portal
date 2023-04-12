#!/bin/sh
# Overwrites the matomo entrypoint.
set -e

if [ ! -e matomo.php ]; then
	tar cf - --one-file-system -C /usr/src/matomo . | tar xf -
fi

exec "$@"