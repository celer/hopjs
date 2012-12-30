# HopJS 

The RESTful API dynamic web apps crave.

## Introduction

HopJS is a RESTful based declarative API framework for Node.js that:
  * Supports Android, and Shell client side stub generation
  * Generates easy to use browser side API hooks
  * Has a declartive testing interface, which can generate native unit tests in JavaScript and Shell code
  * Generates it's own API documentation
  * Supports intellgent server-side caching of results using Redis
  * Supports event based APIs using Socket.io 
  * Enhanced APIs with optional declarative models

*First, we simply define the interface you wish to expose*
(either as static methods on an object or as a proper Javascript class)
```javascript

UserService={};

//All functions backed by HopJS should have a signature of (input,onComplete,request)
UserService.create=function(input,onComplete){
  // Here we would create a new user and call onComplete(err,result) when were done
}

UserService.authenicate=function(input,onComplete){
  // Here we would authenticate a user and call onComplete(err,result) when were done
}

```
*Next, we use Hop to define the interface, this will expose the interface via a RESTful API*

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

So now our website has:
```shell
  # An API for UserService.create 
  POST /api/user
  # An API for UserService.authenticate
  POST /api/user/authenticate
  # Documentation for our API as generated by HopJS with online unit tests
  GET /api/ 
  # A jQuery based client set of stubs for our API
  GET /api/api.js
  # A json definition of our API for client side stub generation
  GET /api/api.json
```

*But we can also define the test cases for our new interface!*

```javascript

Hop.defineTestCase("UserService.authenticate",function(test){
    var validUser = { email:"test@test.com", username:"TestUser" };
    test.do("UserService.create").with(validUser).noError();
    test.do("UserService.authenticate").with(validUser).noError();
    test.do("UserService.authenticate").with({password:"BOB"},validUser).hasError(/Permission denied/);
});

```
*Now let's suppose we wanted an Android set of native client stubs for our API in Java:*

```shell
hopjs-gen -url http://www.website.com:3000/ android -outputDir ./androidApp -package com.website.www
```

*Let's also generate a shell script for using our new API*

```shell
# This will create a shell script which uses curl to call our API
hopjs-gen -url http://www.website.com:3000/ shell -output api.sh

./api.sh UserService.create -APIURL http://www.website.com:3000/ --email user@user.com --username foo
```
*We can also generate a unit test for our shell script*
```shell
# This will create a shell script which runs our unit tests on our shell script
hopjs-gen -url http://www.website.com:3000/ shell -unitTest -output test_api.sh

./test_api.sh http://www.website.com:3000/ ./api.sh

```
You can see a complete working example at: https://github.com/celer/hopjs/tree/master/examples/ex1

# Intellegent server-side caching of results

Now lets assume that we've written a killer server-side API, but we haven't done any caching of our results so each 
time we need to do something we're hitting our database. HopJS has the ability to add caching on top of your API quickly
and easily.

```javascript

  //First let's tell HopJS that we want to use caching  
  // log - log what is happening with our serverside cache
  // redisClient - the redisClient to use - HopJS will create a default one if not specified
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

Caching works by associating a unique ID with each result returned from an API call - the trick is that the ID is calculated based upon the object that is used as an input or returned as a result of calling the API call. Time for a quick example:


```javascript
  /* 
    Assuming the requested user was found Redis would return the cached object, otherwise HopJS would
    call the underlying API, and also keep a copy of the returned object
    under the id '/user/5' for a duration of 60 sections. HopJS would also add all the extra headers
    to get the HTTP agent on the other end to cache this result for the specfied duration as well!

    Essentially
      - If we have the cached object return it
      - If not execut the call and cache the result 

    The id for the cached object is generated by plugging the result objects properties into "/user/:id" to compute "/user/5"

  */
  UserService.load({id:5}) 

  /*
    This would end up deleting the cached object from redis
  */
  UserService.del({id:5})
```

You can see a complete working example at: https://github.com/celer/hopjs/tree/master/examples/ex2

# Advanced Topics

## API Interfaces

HopJS also has the ability to define an API interface which can be used to quickly stub out APIs which share their interfaces:

```javascript

  // This will define an interface which can the be applied to other objects later
  Hop.defineInterface("Notification",function(api){
      //#classname will cause the classname of the extending class to be substituded into the path
      api.post("send","#classname/send").usage("Sends a message").demand("msg").demand("subject").demand("to");
  });

  Hop.defineClass("Email",EmailService,function(api){
    //This will cause the interface defined above to be applied to this object
    // Now EmailService.send will exist on /email/send with all the associated demands, etc.
    api.extends("Notification");
  });  

```
## Models

TBD

# Known Issues / Todo
 - Android API is non-functional after major refactor
 - Curl can't save session cookies so some shell tests won't work
 - Need to add SSL support
 - Need to add dev key support
 - DRY for local API calling
 - Figure out a way for unit tests to save intermediate results for later usage or comparison
 - Add more tests

