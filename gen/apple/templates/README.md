# Installation steps

1. Install gyp

```shell
svn checkout http://gyp.googlecode.com/svn/trunk/ gyp
cd gyp
sudo python setup.py install
```

2. Install Cocoa Pods (http://cocoapods.org/)

```shell
gem install cocoapods
pod setup
```

3. Run the make file

```shell
make
```

4. Open the workspace

```shell
open *.xcworkspace
```

