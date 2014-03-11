#!/bin/sh

(cd examples/intro && node app.js)&
APP_PID=$?
sleep 1

HOSTNAME=`hostname -f`

node_modules/hopjs-remote/bin/hopjs-selenium --url http://localhost:3000/  --browser opera --platform Linux --version 12  --remote "http://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@localhost:4445/wd/hub" --name "Build: ${TRAVIS_BUILD_NUMBER}" --tunnelid ${TRAVIS_JOB_NUMBER}
EC=$?


kill $APP_PID


exit $?
