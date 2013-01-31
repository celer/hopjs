/* This example is an extension of the examples/intro */

var express= require('express');
var path = require('path');

var Hop = require("./../../index");

/*
  This is express boiler plate, see http://expressjs.com/guide.html
*/
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

app.engine("jade",require('jade').__express);

app.get("/",function(req,res){
	res.render("index",{Hop:Hop});
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

  users[lastUserId]=user; 
  user.id = lastUserId;

  lastUserId++;

	return onComplete(null,user);
}

UserService.authenticate=function(credentials,onComplete,request){
  for(var i in users){
    var user = users[i];
    if(user.name==credentials.name && user.password==credentials.password){
      request.session.user=user;
      return onComplete(null,user);
    } 
  } 
  return onComplete("Permission denied");
}

UserService.del=function(input,onComplete,request){
  if(users[input.id]!=undefined){
    console.log("Deleted user with id:",input.id);
    delete users[input.id];
    return onComplete(null,true);
  } else {  
    return onComplete(null,false);
  }
}


UserService.currentUser=function(input,onComplete,request){
  return onComplete(null,request.session.user);
}

UserService.logout=function(input,onComplete,request){
  delete request.session.user;
  return onComplete(null,true);
}


Hop.defineModel("User",function(user){
	user.field("id","UserID","The user's id").integer().ID();
	user.field("name","Username","The user's username").string().regexp(/[A-Za-z0-9\_\-]{3,10}/,"Usernames must be between 3 and 10 characters long, and can only contain alphanumeric characters");
	user.field("email","Email","The user's email address").string();
	user.field("password","Password","The user's password").password();
});

ValidatorTest={};
ValidatorTest.test=function(input,onComplete){
	return onComplete(null,true);
}


Hop.defineModel("ValidatorTest",function(model){
	model.field("minMax").range(5,100);
	model.field("array").values(["red","blue","green"]);
	model.field("object").values({ R:"Red", B:"Blue", G:"Green" });
	model.field("string").regexp(/[A-Z]+/,"REXP");
});

Hop.defineClass("ValidatorTest",ValidatorTest,function(api){
	api.post("test","/validator/test").demands("minMax","array","object","string").useModel("ValidatorTest");
});


Hop.defineTestCase("ValidatorTest.test: Basic tests",function(test){

	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A"}).noError();
	test.do("ValidatorTest.test").with({ minMax: 2, array: 'red', object: 'R',string:"A" }).errorContains("greater than");
	test.do("ValidatorTest.test").with({ minMax: 101, array: 'red', object: 'R',string:"A" }).errorContains("less than");
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'sred', object: 'R',string:"A" }).errorContains("values are");
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'X',string:"A" }).errorContains("values are");
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R',string:"3" }).errorContains("REXP");

});


Hop.defineClass("UserService",UserService,function(api){
	api.usage("Manages users");
	api.post("create","/user").usage("Creates a user").demands("email","name","password").useModel("User");
	api.post("authenticate","/user/auth").usage("Authenticates a user").demands("password","name").useModel("User");
	api.get("currentUser","/user").usage("Returns the current user").outputModel("User");
	api.get("logout","/user/logout").usage("Logs the current user out");
  api.del("del","/user/:id").usage("Deletes the user").demand("id").inputModel("User");
});

Hop.defineTestCase("UserService.create: Basic tests",function(test){

	var validUser = { email:"test@test.com", name:"TestUser", password:"sillycat" };

	test.do("UserService.create").with(validUser).inputSameAsOutput().saveOutputAs("createdUser");
  test.do("UserService.del").with("createdUser").noError();

});

Hop.defineTestCase("UserService.create: Advanced",function(test){
	var validUser = { email:"test@test.com", name:"TestUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).inputSameAsOutput().saveOutputAs("createdUser");
	test.do("UserService.create").with(validUser,{name:undefined}).errorContains("Missing parameter");
	test.do("UserService.create").with(validUser,{email:"X"}).errorContains("Invalid email");
	test.do("UserService.create").with(validUser,{name:"@#$"}).errorContains("alphanumeric");

  test.do("UserService.del").with("createdUser").noError();
});


Hop.defineTestCase("UserService.authenticate",function(test){
	var validUser = { email:"test@test.com", name:"AuthUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).inputSameAsOutput().saveOutputAs("createdUser");
  test.do("UserService.logout").noError();
	test.do("UserService.authenticate").with({name:"authuser",password:"badpass"}).errorContains("Permission denied");
  test.do("UserService.currentUser").noError().outputIsNull();
	test.do("UserService.authenticate").with({name:"AuthUser",password:"sillycat"}).noError();
  test.do("UserService.currentUser").outputSameAs("createdUser");
  
  test.do("UserService.del").with("createdUser").noError();
});

Hop.apiHook("/api/",app);

app.listen(3000);

