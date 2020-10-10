#!/bin/sh
FILE=/var/log/inacity/google-chrome_PID
if test -f "$FILE"; then
        kill $(cat "$FILE")
        rm -f "$FILE"
        echo "$FILE found, restarting headless chrome!"
fi
google-chrome --no-sandbox --headless http://localhost/gsvpanoramacollector/link_browser/default/ &
echo $! > "$FILE"
