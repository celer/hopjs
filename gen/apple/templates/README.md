# Installation steps

1. Install gyp

svn checkout http://gyp.googlecode.com/svn/trunk/ gyp
cd gyp
sudo python setup.py install

2. Install Cocoa Pods (http://cocoapods.org/)

gem install cocoapods
pod setup

3. Generate the gyp file

gyp -depth=.

4. Open the workspace

open *.xcworkspace


