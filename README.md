![alt text][logo]

# HopJS 

The RESTful API dynamic web apps crave.

## Introduction

HopJS is a RESTful based declarative API framework for Node.js that:
  * Can generate native APIs for Android, iPhone, iPad, JavaScript, and Shell
  * Generates easy to use browser side API hooks
  * Has a declarative testing interface, which can generate native unit tests in JavaScript and native API frameworks
  * Generates it's own API documentation
  * Supports intelligent server-side caching of results using Redis
  * Supports event based APIs using Socket.io 
  * Enhanced APIs with optional declarative models

[API Documentation](http://celer.github.com/hopjs/doc/)

*First, we simply define the interface you wish to expose*
(either as static methods on an object or as a proper JavaScript class)
```javascript

UserService={};

//All functions backed by HopJS should have a signature of (input,onComplete,request)
UserService.create=function(input,onComplete){
  // Here we would create a new user and call onComplete(err,result) when were done
}

UserService.authenticate=function(input,onComplete){
  // Here we would authenticate a user and call onComplete(err,result) when were done
}

```
*Next, we use Hop to define the interface; this will expose the interface via a RESTful API*

```javascript

//This will create a RESTful set of URLs which expose the following functions:
Hop.defineClass("UserService",UserService,function(api){
  api.post("create","/user").demand("email").demand("username");
  api.post("authenticate","/user/auth").demand("email").demand("username");
});

//Now tell HopJS to expose our API in express.js
Hop.exposeAPI("/api/",app)

```

Now that we've done that we get a few things:
 * We have our RESTful API
 * HopJS generates a client side API we can use in our browser which will have the following definitions:
   * UserService.create(input,onComplete)
   * UserService.authenticate(input,onComplete)

So now our web-site has:
```shell
  # An API for UserService.create 
  POST /api/user
  # An API for UserService.authenticate
  POST /api/user/authenticate
  # Documentation for our API as generated by HopJS with online unit tests
  GET /api/ 
  # A jQuery based client set of stubs for our API
  GET /api/api.js
  # A JSON definition of our API for client side stub generation
  GET /api/api.json
```
[defineClass documenation](http://celer.github.com/hopjs/doc/classes/Hop.Method.html)

*But we can also define the test cases for our new interface!*

```javascript

Hop.defineTestCase("UserService.authenticate",function(test){
    var validUser = { email:"test@test.com", username:"TestUser" };
    test.do("UserService.create").with(validUser).noError();
    test.do("UserService.authenticate").with(validUser).noError();
    test.do("UserService.authenticate").with({password:"BOB"},validUser).hasError(/Permission denied/);
});

```
[defineTestCase documentation](http://celer.github.com/hopjs/doc/classes/Hop.TestTask.html)


*We can unit test our API using the hopjs utility, which will run all the unit tests from the command line:*
```shell
npm install hopjs-remote -g
hopjs --url http://localhost:3000/ --unitTest
```
*We can also run the test in the browser of our choosing*

```shell
hopjs-browser-test --url http://localhost:3000/  --browser firefox
```


*Now let's suppose we wanted an Android set of native client stubs for our API in Java:*

```shell
hopjs-gen --url http://www.website.com:3000/ android --outputDir ./androidApp --package com.website.www
```


*Now let's assume we wanted a native version of the APIs for iOS, and you have OSX and XCode installed:*

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

You can read more about Objective-C APIs here: https://github.com/celer/hopjs/tree/master/gen/apple

You can see a complete working example at: https://github.com/celer/hopjs/tree/master/examples/intro

## Intelligent server-side caching of results

Now lets assume that we've written a killer server-side API, but we haven't done any caching of our results so each 
time we need to do something we're hitting our database. HopJS has the ability to add caching on top of your API quickly
and easily.

```javascript

  /* 
      First let's tell HopJS that we want to use caching  
      log - log what is happening with our server side cache
      redisClient - the redisClient to use - HopJS will create a default one if not specified
  */
  Hop.enableCaching({ log:true, redisClient: myRedisClient });
 
   
  Hop.defineClass("UserService",UserService,function(api){
    api.usage("Manages users");
   
    //Cache user's as they are loaded for 60 seconds, and try to force the client to cache the results as well!
    api.get("load","/user/:id").demand("id").cacheId("/user/:id",60,true);
   
    //Invalidate the cache when a user is deleted 
    api.del("delete","/user/:id").demand("id").cacheInvalidate("/user/:id");
    
    //Cache the search results for 5000
    api.get("list","/user/").optional("sortBy").cacheId("/users/:start/:size/",5000).demand("start").demand("size");
    
    
  });

```

Caching works by associating a unique ID with each result returned from an API call - the trick is that the ID is calculated based upon the object that is used as an input or returned as a result of calling the API call. 

Time for a quick example:


```javascript
  /* 
    Assuming the requested user was found Redis would return the cached object, otherwise HopJS would
    call the underlying API, and also keep a copy of the returned object
    under the id '/user/5' for a duration of 60 sections. HopJS would also add all the extra headers
    to get the HTTP agent on the other end to cache this result for the specified duration as well!

    Essentially
      - If we have the cached object return it
      - If not execute the call and cache the result 

    The id for the cached object is generated by plugging the result objects properties into "/user/:id" to compute "/user/5"

  */
  UserService.load({id:5}) 

  /*
    This would end up deleting the cached object from Redis
  */
  UserService.del({id:5})
```

You can see a complete working example at: https://github.com/celer/hopjs/tree/master/examples/caching

## API Interfaces

HopJS also has the ability to define an API interface which can be used to quickly stub out APIs which share their interfaces:

```javascript

  // This will define an interface which can the be applied to other objects later
  Hop.defineInterface("Notification",function(api){
      //#classname will cause the classname of the extending class to be substituted into the path
      api.post("send","#classname/send").usage("Sends a message").demand("msg").demand("subject").demand("to");
  });

  Hop.defineClass("Email",EmailService,function(api){
    //This will cause the interface defined above to be applied to this object
    // Now EmailService.send will exist on /email/send with all the associated demands, etc.
    api.extend("Notification");
  });  

```
You can see a complete working example at: https://github.com/celer/hopjs/tree/master/examples/interface

## Working with files

Working with files is pretty simple! To send files we can simply tell HopJS how to send the file, either as a raw file, or as an attachmet. We can 
also allow uploads using the .demandFile or the .optionalFile

```javascript
	FileTest.sendFile=function(input,onComplete){
		return onComplete(null,Hop.sendFile("public/pig.png"));
	}	

	FileTest.sendAttachment=function(input,onComplete){
		return onComplete(null,Hop.sendAttachment("public/pig.png","image.png"));
	}

	FileTest.upload=function(input,onComplete){
		return onComplete(null,input);
	}	


	Hop.defineClass("FileTest",FileTest,function(api){
		api.get("sendFile","/file")
		api.get("sendAttachment","/attachment");
		api.post("upload","/upload").demandFile("required").optionalFile("optional");
	});  
```
You can see a complete working example at: https://github.com/celer/hopjs/tree/master/examples/files

## Models

Models can be defined which will enable both validation of inputs but re-use of documenation and type conversion.

```javascript
	Hop.defineModel("User",function(user){
		user.field("id","UserID","The user's id").integer().ID();
		user.field("name","Username","The user's username").string().regexp(/[A-Za-z0-9\_\-]{3,10}/,"Usernames must be between 3 and 10 characters long, and can only contain alphanumeric characters");
		user.field("email","Email","The user's email address").string();
		user.field("password","Password","The user's password").password();
	});
```
Now we can simply indicate a model is used for a call by using .useModel, .inputModel or .outputModel

```javascript
	Hop.defineClass("UserService",UserService,function(api){
		api.usage("Manages users");
		api.post("create","/user").usage("Creates a user").demands("email","name","password").useModel("User");
		api.post("authenticate","/user/auth").usage("Authenticates a user").demands("password","name").useModel("User");
		api.get("currentUser","/user").usage("Returns the current user").outputModel("User");
		api.get("logout","/user/logout").usage("Logs the current user out");
		api.del("del","/user/:id").usage("Deletes the user").demand("id").inputModel("User");
	});
```

You can see a complete working example at: https://github.com/celer/hopjs/tree/master/examples/model

# Notes about REST

 * Our implementation of REST is designed to be used with forms and does not support null values or special types, all values are converted to strings (null=="")
 * Per specification HTTP delete does not allow passing of parameters beyond what are specified in the path

# Known Issues / Todo
 - iPhone API generation works but needs further testing
 - Android API is non-functional after major re-factor
 - A bug in combination-stream, which is utilized by request and form-data prevents the unit tests for expirements/test from passing, see my fork of combination-stream for a fix
 - Curl can't save session cookies so some shell tests won't wor
 - Need to add SSL support
 - Need to add dev key support

[logo]: https://raw.github.com/celer/hopjs/master/static/logo-200.png 
[iphone]: https://raw.github.com/celer/hopjs/master/static/iphone-small.png

