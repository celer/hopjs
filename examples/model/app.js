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
  app.use(express.urlencoded());
  app.use(express.json());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(Hop.expressAPI("/api"));
  app.use(function(req,res,next){
    console.log(req.body);
    next();
  });
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

UserService.list=function(input,onComplete){
	return onComplete(null,users);
}

UserService.load=function(input,onComplete){
	return onComplete(null,users[input.id]);
}


UserService.currentUser=function(input,onComplete,request){
  return onComplete(null,request.session.user);
}

UserService.logout=function(input,onComplete,request){
  delete request.session.user;
  return onComplete(null,true);
}


Hop.defineModel("Role",function(role){
  role.field("customer","Customer","The customer the user has the role on").integer().ID();
  role.field("role","Role","The role the user has").string().values(["Admin","User","SuperAdmin"]);
});


Hop.defineModel("User",function(user){
	user.field("id","UserID","The user's id").integer().ID();
	user.field("name","Username","The user's username").string().regexp(/[A-Za-z0-9\_\-]{3,10}/,"Usernames must be between 3 and 10 characters long, and can only contain alphanumeric characters");
	user.field("email","Email","The user's email address").string();
	user.field("password","Password","The user's password").password();
  user.field("favoriteColor","Favorite color").string().regexp(/[A-Za-z]{3,10}/,"Colors must be between 3 and 10 characters long, and can only contain characters");
  user.field("roles","The roles the user has").isArray().model("Role");
	user.link("self").call("UserService.load");
	user.link("doc","/api/#User.model");
});

ValidatorTest={};
ValidatorTest.test=function(input,onComplete){
	return onComplete(null,true);
}
ValidatorTest.test2=function(input,onComplete){
	return onComplete(null,true);
}
ValidatorTest.test3=function(input,onComplete){
	return onComplete(null,true);
}
ValidatorTest.test4=function(input,onComplete){
	return onComplete(null,true);
}


Hop.defineModel("SubModel2",function(model){
  model.field("string").string().regexp(/[A-Z]{1,4}/);
});

Hop.defineModel("SubModel1",function(model){
  model.field("yetAnotherArrayOfModels").isArray().model("SubModel2"); 
  model.field("number").integer().range(10,20);
});


Hop.defineModel("ValidatorTest",function(model){
	model.field("minMax").integer().range(5,100);
	model.field("array").string().values(["red","blue","green"]);
	model.field("object").values({ R:"Red", B:"Blue", G:"Green" });
	model.field("string").string().regexp(/[A-Z]+/,"REXP");

  
  model.field("arrayOfModels").model("SubModel1").isArray();
  model.field("subModel2").model("SubModel2");

  model.field("arrayOfStrings").string().isArray().regexp(/[A-Z]{2,3}/,"Invalid string specified");
});


Hop.defineModel("HashModel",function(model){
  model.field("subModel1Hash").model("SubModel1").isHash();
  model.field("subModel2Hash").model("SubModel2",["string"]).isHash();
});


Hop.defineModel("ModelArraySizes",function(model){
  model.field("subModelArray").model("SubModel1").isArray(2,4);
});

Hop.defineModel("ValidatorTest2",function(model){
  model.field("subModel1").model("SubModel1",["yetAnotherArrayOfModels","number"]);
  model.field("subModel2").model("SubModel2",["string"]);
});

Hop.defineClass("ValidatorTest",ValidatorTest,function(api){
	api.post("test","/validator/test").demands("minMax","array","object","string","arrayOfModels","subModel2").optionals("arrayOfStrings").useModel("ValidatorTest");
	api.post("test2","/validator/test2").demands("subModel1","subModel2").useModel("ValidatorTest2");
	api.post("test3","/validator/test3").demands("subModelArray").useModel("ModelArraySizes");
	api.post("test4","/validator/test4").demands("subModel1Hash","subModel2Hash").useModel("HashModel");
});


Hop.defineTestCase("ValidatorTest.test: Basic tests",function(test){
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[], subModel2:{} }).noError();
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:"A", subModel2:{} }).errorContains("Invalid type, expected array: arrayOfModels");
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:{}, subModel2:{} }).errorContains("Invalid type, expected array: arrayOfModels");
  test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[], subModel2:{ string: 5} }).errorContains("Invalid value, string expected: subModel2.string");
  test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[], subModel2:{ string: "AZ"} }).noError();
  test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[ { } ], subModel2:{ string: "AZ"} }).noError();
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[], subModel2:{}, arrayOfStrings:[ 1 ] }).errorContains("Invalid value, string expected: arrayOfStrings[0]");
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[], subModel2:{}, arrayOfStrings:[ "AD","DA",1 ] }).errorContains("Invalid value, string expected: arrayOfStrings[2]");
  test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[ { number:10, yetAnotherArrayOfModels:"A"  } ], subModel2:{ string: "AZ"} }).errorContains("Invalid type, expected array: arrayOfModels[0].yetAnotherArrayOfModels");
  test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[ { number:10, yetAnotherArrayOfModels:[ { string:33 }  ]  } ], subModel2:{ string: "AZ"} }).errorContains("Invalid value, string expected: arrayOfModels[0].yetAnotherArrayOfModels[0].string");
  test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[ { number:10, yetAnotherArrayOfModels:[ { string:"AA" }, {string:33}  ]  } ], subModel2:{ string: "AZ"} }).errorContains("Invalid value, string expected: arrayOfModels[0].yetAnotherArrayOfModels[1].string");
  test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[ {}, { number:10, yetAnotherArrayOfModels:[ { string:"AA" }, {string:33}  ]  } ], subModel2:{ string: "AZ"} }).errorContains("Invalid value, string expected: arrayOfModels[1].yetAnotherArrayOfModels[1].string");
  test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R' ,string:"A", arrayOfModels:[ {}, { number:10, yetAnotherArrayOfModels:[ { string:"AA" }, {string:"LL"}  ]  } ], subModel2:{ string: "AZ"} }).noError();
  test.do("ValidatorTest.test").with({ minMax: 2, array: 'red', object: 'R',string:"A",arrayOfModels:[], subModel2:{} }).errorContains("greater than");
	test.do("ValidatorTest.test").with({ minMax: 101, array: 'red', object: 'R',string:"A",arrayOfModels:[], subModel2:{} }).errorContains("less than");
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'sred', object: 'R',string:"A", arrayOfModels:[], subModel2:{}  }).errorContains("values are");
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'X',string:"A",arrayOfModels:[], subModel2:{} }).errorContains("values are");
	test.do("ValidatorTest.test").with({ minMax: 7, array: 'red', object: 'R',string:"3",arrayOfModels:[], subModel2:{} }).errorContains("REXP");
});

Hop.defineTestCase("ValidatorTest.test2",function(test){  
  test.do("ValidatorTest.test2").with({ subModel1:{}, subModel2:{}}).errorContains("Missing required value: subModel1.yetAnotherArrayOfModels");
  test.do("ValidatorTest.test2").with({ subModel1:{ yetAnotherArrayOfModels:[] }, subModel2:{}}).errorContains("Missing required value: subModel1.number");
  test.do("ValidatorTest.test2").with({ subModel1:{ yetAnotherArrayOfModels:[],number:12 }, subModel2:{ }}).errorContains("Missing required value: subModel2.string");
  test.do("ValidatorTest.test2").with({ subModel1:{ yetAnotherArrayOfModels:[],number:12 }, subModel2:{ string:"AA"}}).noError();
});

Hop.defineTestCase("ValidatorTest.test3",function(test){  
  test.do("ValidatorTest.test3").with({ subModelArray:[] }).errorContains("Array must have at least 2 item(s): subModelArray");
  test.do("ValidatorTest.test3").with({ subModelArray:[ { }, { }, { }, { }, { } ] }).errorContains("Array must have no more than 4 item(s): subModelArray");
  test.do("ValidatorTest.test3").with({ subModelArray:[ { }, { } ] }).noError();
});

Hop.defineTestCase("ValidatorTest.test4",function(test){  
  test.do("ValidatorTest.test4").with({ subModel1Hash: {  }, subModel2Hash:{}  }).noError();
  test.do("ValidatorTest.test4").with({ subModel1Hash: { foo:{ number: 7 }}, subModel2Hash:{} }).errorContains("Value must be greater than 10: subModel1Hash[\"foo\"].number");
  test.do("ValidatorTest.test4").with({ subModel1Hash: { foo:{ number: 12 }}, subModel2Hash:{} }).noError();
  test.do("ValidatorTest.test4").with({ subModel1Hash: { foo:{ number: 12 }}, subModel2Hash:{ foo: { } } }).errorContains("Missing required value: subModel2Hash[\"foo\"].string");
});


Hop.defineClass("UserService",UserService,function(api){
	api.usage("Manages users");
	api.post("create","/user").usage("Creates a user").demands("email","name","password").optionals("favoriteColor").useModel("User");
	api.post("authenticate","/user/auth").usage("Authenticates a user").demands("password","name").useModel("User");
	api.get("currentUser","/user/current").usage("Returns the current user").outputModel("User");
  api.get("list","/user").usage("Lists the users");
	api.get("logout","/user/logout").usage("Logs the current user out");
	api.get("load","/user/:id").usage("Load a user").useModel("User");
  api.del("del","/user/:id").usage("Deletes the user").demand("id").inputModel("User");
});

Hop.defineTestCase("UserService.create: Basic tests",function(test){
	var validUser = { email:"test@test.com", name:"TestUser", password:"sillycat" };
	test.do("UserService.create").with(validUser).inputSameAsOutput().saveOutputAs("createdUser");
  test.do("UserService.del").with("createdUser").noError();
  test.do("UserService.create").with(validUser, {favoriteColor:null }).errorContains("Invalid value, string expected: favoriteColor");
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

