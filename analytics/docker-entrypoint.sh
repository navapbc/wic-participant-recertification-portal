#!/bin/sh
# Overwrites the matomo entrypoint.
set -e

if [ ! -e matomo.php ]; then
	tar cf - --one-file-system --owner=33 --group=33 -C /usr/src/matomo . | tar xf -
fi

exec "$@"