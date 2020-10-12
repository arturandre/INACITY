#!/bin/sh
FILE=/var/log/inacity/google-chrome_PID
if test -f "$FILE"; then
        kill $(cat "$FILE")
        rm -f "$FILE"
        echo "$FILE found, restarting headless chrome!"
fi
/opt/google/chrome/chrome --no-sandbox --headless --remote-debugging-port=9222 --disable-gpu --disable-plugins http://127.0.0.1/gsvpanoramacollector/link_browser/default/ &
#Debugging
#/opt/google/chrome/chrome --no-sandbox --headless --remote-debugging-port=9222 --disable-gpu --disable-plugins --enable-logging --v=1 http://127.0.0.1/gsvpanoramacollector/link_browser/default/ &
echo $! > "$FILE"
