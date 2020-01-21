#!/bin/sh
daphne -b 0.0.0.0 -p 8001 django_website.asgi:application &
echo $! > ./daphne_PID