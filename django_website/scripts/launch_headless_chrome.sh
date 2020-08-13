#!/bin/sh
FILE=./google-chrome_PID
if test -f "$FILE"; then
        kill $(cat ./google-chrome_PID)
        rm -f ./google-chrome_PID
        echo "$FILE found, restarting headless chrome!"
fi
google-chrome --no-sandbox --headless --remote-debugging-port=9222 http://localhost/gsvpanoramacollector/link_browser/default/ &
echo $! > ./google-chrome_PID