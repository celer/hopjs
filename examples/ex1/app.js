var express= require('express');
var path = require('path');

var Hop = require("./../../index");

//All the express.js boiler plate stuff
var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

//We'll use the jade template engine for showing the main page
app.engine("jade",require('jade').__express);

//Let's return an index page
app.get("/",function(req,res){
	res.render("index");
});

//Here is our list of users, in a real app we'd need a db of sorts
var users={};
var lastUserId=0;

//Here is our static class for supporting the user APIs
var UserService = {}

/**
  Here is our create user function that we want to make an API
  
  It validates the user and will add it to our user hash above. 

  Each API function that can be called by HopJS will have the following parameters

  function(input,onComplete,request)
    input - the input object we got from the API call, this shouldn't be null
    onComplete(err,result) - the lambda to call when were done with our work
      err - A string error to be returned
      result - The object or primative to return
    request - the express object as provided by request (optional)
    

*/
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

  lastUserId++;

	return onComplete(null,user);
}

UserService.authenticate=function(credentials,onComplete,request){
  for(var i in users){
    var user = users[i];
    if(user.name==credentials.name && user.password==credentials.password){
      //stick the user in our session
      request.session.user=user;
      return onComplete(null,user);
    } else return onComplete("Permission denied");
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
	api.post("authenticate","/user/auth").demand("password").demand("name");
	api.get("currentUser","/user");
	api.get("logout","/user/logout");
});

/*
  Test for user creation

  This will define a test case for the specified API call, each call can have zero or more test cases
 */
Hop.defineTestCase("UserService.create: Basic tests",function(test){
	var validUser = { email:"test@test.com", name:"TestUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).noError().inputSameAsOutput().outputNotNull();
});

//Notice that we can have multiple test cases for each API call
Hop.defineTestCase("UserService.create: Advanced",function(test){
	var validUser = { email:"test@test.com", name:"TestUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).noError().inputSameAsOutput().outputNotNull();
	test.do("UserService.create").with({name:undefined},validUser).errorContains("parameter 'name'");
	test.do("UserService.create").with({email:"X"},validUser).errorContains("Invalid email");
	test.do("UserService.create").with({name:"@#$"},validUser).errorContains("Invalid name");
});

/**
 * Test for user authentication 
 */
Hop.defineTestCase("UserService.authenticate",function(test){
	var validUser = { email:"test@test.com", name:"AuthUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).noError().inputSameAsOutput().outputNotNull();
  test.do("UserService.logout").noError();
	test.do("UserService.authenticate").with({name:"authuser",password:"badpass"}).errorContains("Permission denied");
  test.do("UserService.currentUser").noError().outputIsNull();
	test.do("UserService.authenticate").with({name:"AuthUser",password:"sillycat"}).noError();
  test.do("UserService.currentUser").noError().outputNotNull();
});

Hop.apiHook("/api/",app);

app.listen(3000);

