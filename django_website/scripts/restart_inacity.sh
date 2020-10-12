#!/bin/sh

bash /var/www/html/scripts/daphne_starter.sh
bash /var/www/html/scripts/launch_headless_chrome.sh
service apache2 reload