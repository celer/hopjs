#!/bin/sh

(cd examples/intro && node app.js)&
APP_PID=$?
sleep 1

HOSTNAME=`hostname -f`

node_modules/hopjs-remote/bin/hopjs-selenium --url http://${HOSTNAME}:3000/  --browser opera --platform Linux --version 12  --remote "http://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@ondemand.saucelabs.com:80/wd/hub" --name "Test with opera"
EC=$?


kill $APP_PID


exit $?
