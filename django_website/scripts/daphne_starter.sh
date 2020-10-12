#!/bin/sh

FILE=/var/log/inacity/daphne_PID
if test -f "$FILE"; then
        kill $(cat "$FILE")
        rm -f "$FILE"
        echo "$FILE found, restarting daphne!"
fi
daphne -b 0.0.0.0 -p 8001 django_website.asgi:application &
echo $! > "$FILE"