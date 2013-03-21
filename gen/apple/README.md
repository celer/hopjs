Apple API Generator for HopJS
===============================

This generator was written for Mac OSX 10.7 and IOS 6.0+ and requires XCode to be installed. 

## Introduction

This generator will generate native objective C APIs for Mac OSX and iOS. The API which is generated is
utilized the same way regardless of platform and mirrors the API calling methodology seen in other HopJS 
API stubs, for exampling the calling signature for User.create might look like so:

```objc
/**
	UserService.create

	

	@param {NSDictionary *}	input
	
		@param email The email address for the user (required) 
		@param name The user's name (required) 
		@param password The password for the user (required) 
	
	@param {^(NSString *,id)} onComplete to be called when the call has been completed
	
	@return AFHTTPNetworkOperation or nil

*/
- (id) create: (NSDictionary *) input whenComplete: (void (^)(NSString *error, id result)) onComplete;

```

The call is asynchronous and returns two parameters to the onComplete lambda, error and result. 

## Usage

To utilize the generator: 

1. Make sure you have XCode installed with the various iOS dev tools installed
2. Start your application
3.  Point hopjs-gen at the base URL for your application and follow the steps below:

```shell
hopjs-gen --url http://localhost:3000/ apple --type iostest --outputDir IOSTest --projectName IOSTest
cd IOSTest
make
open IOSTest.xcworkspace
# On the top left of xcode select "IOSTest > iPhone X Simulator" and click the 'Run' button
# If this fails in the project view select *.storyboard and delete the references from the project and re-add them. 
# After that it should just work! 
```
![Image of iphone showing IOSTest][iphone]

## Options

Four kind of applicaitons can be generated: 
 
 * macframework - for embedding in other projects
 * mactest - a test application for using the unit test you defined in your hopjs application
 * iosframework - for embedding in ios projects
 * iostest - a test application for using the unit test you defined in your hopjs application

All of the unit test are run using the native APIs! 

[iphone]: https://raw.github.com/celer/hopjs/master/static/iphone-small.png

