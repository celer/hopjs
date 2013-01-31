

var express= require('express');
var path = require('path');

var Hop = require("./../../index");

var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  //app.use(express.csrf());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

Hop.enableCaching({ log:true });
Hop.Cache.clear();

app.engine("jade",require('jade').__express);

app.get("/",function(req,res){
	res.render("index",{Hop: Hop});
});

var users={};
var lastUserId=0;

var UserService = {}

UserService.create=function(user,onComplete){
  if(!/.{3,100}/.test(user.email)){
    return onComplete("Invalid email address specified: "+user.email);
  }
  
  if(!/[A-Za-z0-9]{3,100}/.test(user.name)){
    return onComplete("Invalid name specified: "+user.name);
  }

  //Let's add this user to our list of known users
  users[lastUserId]=user; 
  user.id = lastUserId;

	console.log("Creating user",user);

  lastUserId++;

	return onComplete(null,user);
}

UserService.list=function(input,onComplete){
	var ret=[];
  for(var i in users){
    var user = users[i];
		ret.push(user);
	}
	onComplete(null,ret);
}

UserService.authenticate=function(credentials,onComplete,request){
  for(var i in users){
    var user = users[i];
    if(user.name==credentials.name && user.password==credentials.password){
      console.log("Found user",user,credentials);
      //stick the user in our session
      request.session.user=user;
      return onComplete(null,user);
    } 
  } 
  return onComplete("Invalid name or password");
}


UserService.load=function(input,onComplete,request){
  console.log("Loading user with id:",input.id);
  if(users[input.id]!=undefined){
    var user = users[input.id];
    user.when = (new Date()).getTime();
    return onComplete(null,user);
  } else {  
    // No error but, also no result
    return onComplete(null,null);
  }
}
UserService.loadByParam=UserService.load;

UserService.advancedCaching=UserService.load;

UserService.del=function(input,onComplete,request){
  if(users[input.id]!=undefined){
    console.log("Deleted user with id:",input.id);
    delete users[input.id];
    return onComplete(null,true);
  } else {  
    return onComplete(null,false);
  }
}

UserService.save=function(input,onComplete){
  console.log("Saving user with id:",input.id);
  if(users[input.id]!=undefined){
		for(var paramName in input){	
			if(paramName!="id"){
				if(input[paramName]!=""){
	    		users[input.id][paramName] = input[paramName];	
				} else return onComplete("Missing field: "+paramName);
			}
		}
    return onComplete(null,users[input.id]);
  } else {  
    // No error but, also no result
    return onComplete(null,null);
  }
}

UserService.currentUser=function(input,onComplete,request){
  return onComplete(null,request.session.user);
}

UserService.logout=function(input,onComplete,request){
  delete request.session.user;
  return onComplete(null,true);
}

Hop.defineClass("UserService",UserService,function(api){
	api.usage("Manages users");
	api.post("create","/user").demand("email","The email address for the user").demand("name","The user's name").demand("password","The password for the user");
  api.get("loadByParam","/user/param").demand("id").cacheId("/user/:id",60,true);
	api.post("authenticate","/user/auth").demand("password").demand("name");
	api.get("list","/user");  
	api.get("currentUser","/user/current");
	api.get("logout","/user/logout");
  
  /*
    The .cacheId will create a unique ID that is used to identify the item in our cache 
    by taking the returned result, and pulling the :id parameter out and substituting it
    into the path "/user/:id" - we could also use any other parameter we wanted from the 
    returned object in the path. 

    The duration for how long to cache the item is specified next. Any users
    loaded will be cached for up to 60 sections. 

    The last parameter 'true' is used to indicate if we should also leverage client 
    side caching by adding extra HTTP headers. If so we will try to get the client
    side to cache the object for up to 60 seconds as well. The key thing to know here
    is that we may not easily be able to insure that the client side cache works or 
    can be invalidated.

  */
  api.get("load","/user/:id").demand("id").cacheId("/user/:id",60,true);

	/* 
		When a user is saved we will invalidate the cached copy of the user. We could cache the user
		at this point as well, but the cache will save the error if a one occurs; which isn't something
		we desire. 
	*/	
  api.post("save","/user/:id").demands("name","email","password").cacheInvalidate("/user/:id");  

  /*
    The .cacheInvalidate works much like the .cacheId modifier above. It will
    substitude the input objects paramers into the specified cache path
    to determine which item to delete. 
  */
  api.del("del","/user/:id").demand("id").cacheInvalidate("/user/:id");

    
  /*
    This call uses .cache modifier to provide a more custom caching capability.
    
    In this example we want to always return a fresh instance of the user if they are
    asking for thier own user object. 

    For more details see the documentation under /lib/cache.js 
  */
  api.get("advancedCaching","/caching/advanced/:id").demand("id").cache(function(when,cache,req,input,err,result){
      if(when=="before"){
      /*
        Test to see if a user is logged in, and if the logged in user
        is the same as the user we are requesting to load, if so
        never return a cached copy

        Note that we do not tell the browser to cache the user
        or else upon login we'd still get a cached user.
      */
      if(req.session.user && req.session.user.id==input.id){
          return false;
      } else {  
        /* If the user isn't logged attempt to return the item from the cache */
        return cache.id("/user/:id",60);
      }
    } else if(when=="after"){
      /* We always want to save the result in our cache */
      return cache.id("/user/:id",60);
    }
  });
});

/*
  Test for user creation

  This will define a test case for the specified API call, each call can have zero or more test cases
 */
Hop.defineTestCase("UserService.create: Basic tests",function(test){
	var validUser = { email:"test@test.com", name:"TestUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).inputSameAsOutput().saveOutputAs("createdUser");
  
  test.do("UserService.del").with("createdUser").noError();
});

//Notice that we can have multiple test cases for each API call
Hop.defineTestCase("UserService.create: Advanced",function(test){
	var validUser = { email:"test@test.com", name:"TestUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).inputSameAsOutput().saveOutputAs("createdUser");
	test.do("UserService.create").with(validUser,{name:undefined}).errorContains("Missing parameter");
	test.do("UserService.create").with(validUser,{email:"X"}).errorContains("Invalid email");
	test.do("UserService.create").with(validUser,{name:"@#$"}).errorContains("Invalid name");
  
  test.do("UserService.del").with("createdUser").noError();
});

/**
 * Test for user authentication 
 */
Hop.defineTestCase("UserService.authenticate",function(test){
	var validUser = { email:"test@test.com", name:"AuthUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).inputSameAsOutput().saveOutputAs("createdUser");
  test.do("UserService.logout").noError();
	test.do("UserService.authenticate").with({name:"authuser",password:"badpass"}).errorContains("Invalid name or password");
  test.do("UserService.currentUser").noError().outputIsNull();
	test.do("UserService.authenticate").with({name:"AuthUser",password:"sillycat"}).noError();
  test.do("UserService.currentUser").noError().outputNotNull();

  test.do("UserService.del").with("createdUser").noError();
});

/**
 * Test for user loading / deleting 
 */
Hop.defineTestCase("UserService.load",function(test){
	var validUser = { email:"test@test.com", name:"LoadUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).noError().inputSameAsOutput().saveOutputAs("createdUser");
  test.do("UserService.load").with("createdUser").outputSameAs("#{createdUser}").saveOutputAs("cachedUser");
  test.do("TestService.wait").with({duration:3}).noError();
  test.do("UserService.load").with("cachedUser").outputSameAs("#{cachedUser}");
  test.do("UserService.del").with("cachedUser").noError();

  /* This last attempt to load the user may or may not return a result! 
      
      This is becase we asked the browser to cache the result
      and our prior delete can't invalidate the browsers cached version
      so we might get a result - even though the server side copy has been deleted.

  */    
  test.do("UserService.load").with("cachedUser").noError();
});

/*
	Test case for list
*/
Hop.defineTestCase("UserService.list",function(test){
	var user1 = { email:"test@test.com", name:"user1", password:"sillycat" };
	var user2 = { email:"test@test.com", name:"user2", password:"sillycat" };

	test.do("UserService.create").with(user1).inputSameAsOutput().saveOutputAs("createdUser1");
	test.do("UserService.create").with(user2).inputSameAsOutput().saveOutputAs("createdUser2");
		
	test.do("UserService.list").with({}).outputArrayContains("createdUser1").outputArrayContains("createdUser2");

 
	test.do("UserService.del").with("createdUser1").noError();
	test.do("UserService.del").with("createdUser2").noError();

});

/*
	Test case for saving
*/
Hop.defineTestCase("UserService.save",function(test){
	var user1 = { email:"test@test.com", name:"user1", password:"sillycat" };
	var user2 = { email:"test@test.com", name:"user2", password:"sillycat" };

	test.do("UserService.create").with(user1).inputSameAsOutput().saveOutputAs("createdUser1");
	
	test.do("UserService.save").with("createdUser1",{name: "foo"}).saveOutputAs("savedUser1"); 
	test.do("UserService.load").with("createdUser1").outputSameAs("savedUser1");

 
	test.do("UserService.del").with("createdUser1").noError();

});

/**
 * Test case for advanced caching
 */
Hop.defineTestCase("UserService.load: Advanced caching",function(test){
	var user1 = { email:"test@test.com", name:"user1", password:"sillycat" };
	var user2 = { email:"test@test.com", name:"user2", password:"sillycat" };

	test.do("UserService.create").with(user1).inputSameAsOutput().saveOutputAs("createdUser1");
	test.do("UserService.create").with(user2).inputSameAsOutput().saveOutputAs("createdUser2");

  /*
    We will saved two cached users, each of which will have a "when" value indicating when it 
    actually hit our back-end call. 
  */
  test.do("UserService.advancedCaching").with("createdUser1").inputSameAsOutput().saveOutputAs("cachedUser1");  
  test.do("UserService.advancedCaching").with("createdUser2").inputSameAsOutput().saveOutputAs("cachedUser2");  

  /*
    Now let's login
  */ 
  test.do("UserService.authenticate").with("createdUser1").inputSameAsOutput();
  test.do("UserService.currentUser").with({}).outputNotNull();

  /*
    Now if we hit the cache the .when value for our logged in user should have changed:
  */
  test.do("UserService.advancedCaching").with("cachedUser1").outputPropertyChanged("when"); 

  /*
    And the other user should remain the same
  */
  test.do("UserService.advancedCaching").with("cachedUser2").inputSameAsOutput(); 

  test.do("UserService.del").with("createdUser1");
  test.do("UserService.del").with("createdUser2");

});




Hop.apiHook("/api/",app);

app.listen(3000);

