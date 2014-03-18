#!/bin/sh


(cd examples/intro && node app.js)&
APP_PID=$?
sleep 1

HOSTNAME=`hostname -f`


BROWSERS="internet explorer,Windows 7,11;firefox,Linux,27;chrome,Linux,32;safari,OS X 10.8,7" 

IFS=';'
for b in $BROWSERS
do
  IFS=','
  set $b
  BROWSER=$1
  PLATFORM=$2
  VERSION=$3

   
  if ! node_modules/hopjs-remote/bin/hopjs-selenium --url http://localhost:3000/  --browser "$BROWSER" --platform "$PLATFORM" --version "$VERSION" --remote "http://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@localhost:16455/wd/hub" --name "Build: ${TRAVIS_BUILD_NUMBER}" --tunnelid ${TRAVIS_JOB_NUMBER} --build ${TRAVIS_BUILD_NUMBER} --public true
  then
    kill $APP_PID
    exit -1
  fi
  
  

  IFS=';'
done



kill $APP_PID


exit 0
