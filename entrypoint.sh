#!/bin/sh

chown -R $UID:$GID /app/public/files
#chmod -R 666 /app/public

exec su-exec $UID:$GID node server.js