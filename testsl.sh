#!/bin/sh

if [ "${TRAVIS_JOB_NUMBER}" != "" ]
then

  HOSTNAME=`hostname -f`

  BROWSERS="internet explorer,Windows 7,11;firefox,Linux,27;chrome,Linux,32;safari,OS X 10.9,7" 

  IFS=';'
  for b in $BROWSERS
  do
    killall node

    (cd examples/intro && node app.js)&
    sleep 1

    IFS=','
    set $b
    BROWSER=$1
    PLATFORM=$2
    VERSION=$3

     
    if ! node_modules/hopjs-remote/bin/hopjs-selenium --url http://localhost:3000/  --browser "$BROWSER" --platform "$PLATFORM" --version "$VERSION" --remote "http://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@localhost:16455/wd/hub" --name "Build: ${TRAVIS_BUILD_NUMBER}" --tunnelid ${TRAVIS_JOB_NUMBER} --build ${TRAVIS_BUILD_NUMBER} --public public 
    then
      killall node
      exit -1
    fi
    
    

    IFS=';'
  done

  killall node

fi

exit 0
