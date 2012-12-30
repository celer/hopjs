var fs = require('fs');
var Hop = require('../../index.js');

var UserService = function(){
	
}

UserService.prototype.create=function(input,onComplete){
  Hop.log(input);

  if(input && !input.name)
    return onComplete("Invalid username");
	input.id=505;
	return onComplete(null,input);
}

UserService.prototype.delete=function(input,onComplete){
	return onComplete(null,{ bar: true });
}

UserService.prototype.load=function(input,onComplete){
	console.log("loading a  users");
	return onComplete(null,{ name: input.name, when: (new Date().getTime()), id: input.id });
}

UserService.prototype.list=function(input,onComplete){
	var res = [];
	for(var i = 0; i< 50 ;i++){
		res.push({ name: 'bob', email:'bob@bob.com', id: i});
	}
	return onComplete(null,res);
}

UserService.prototype.logout=function(input,onComplete){
	console.log("logout users",arguments);
	return onComplete(null,true);
}

UserService.prototype.testJob=function(input,onComplete,request){
	var count = 0;
	var update = function(){
		if(count < 100){
			count+=4;
			console.log("Doing it",count);
			request.job.setStatus("Doing it",count);
			setTimeout(update,500);
		}	else {
			onComplete(null,new Date().getTime());
		}
	}
	update();
}

UserService.prototype.message=function(input,onComplete){
	return onComplete(null,true);
}	

UserService.prototype.currentUser=function(input,onComplete){
	return onComplete(null,{ foo:true });
}

UserService.prototype.avatarImage=function(input,onComplete,req){
	console.log("AVatar image");
	return onComplete(null, new Hop.File("user.js"));	
}

Hop.defineModel("UserMessage",function(model){
	model.field("id").integer().ID();
	model.field("from").string();
	model.field("to").string();
	model.field("subject").string();
	model.field("sent").date();
	model.field("read").date();
	model.field("message").string();
});

Hop.defineModel("User",function(model){
	model.field("id").integer().ID();
	model.field("name").string();
	model.field("email").string();
	model.field("validFrom").date();
	model.field("validTo").date();
	model.field("enabled").boolean();
});


new Hop.Event.Channel("/user/:username");

var userService = new UserService();
Hop.defineClass("UserService",userService,function(api){
	api.usage("Manages users");
	api.del("delete","/user/:id").demand("id").cacheInvalidate("/user/:id").useModel("User",null).returnsBoolean();
	api.get("list","/user/").optional("sortBy").cacheId("/users/:start/:size/",5000).defaultValues({ sortBy: "username", start:0, size:25 }).demand("start").demand("size").outputModel("User",Array);
	api.get("currentUser","/user/current/").cache(function(cache,req,input){
		if(req.user){
			return cache.id("/user/"+req.user.name);
		} else return null;
	}).outputModel("User");
	api.get("load","/user/:id").demand("id").cacheId("/user/:id",60,true).useModel("User");
	api.post("create","/user").demand("email","Email address").demand("name","name").useModel("User");
	api.post("message","/user/message").demand("message").demand("to").demand("from").demand("subject").emitBefore("/user/:to",function(req,input,err,result){ this.emit(input.message); }).useModel("UserMessage");
	api.get("avatarImage","/user/:id/icon").demand("id").returnsFile().inputModel("User");
	api.get("logout","/logout").cache(function(cache,req,input){
		if(req.user){
			return cache.invalidate("/user/"+req.user.name);
		} else return null;
	});
});

/**
 * Test for user creation
 */
Hop.defineTestCase("UserService.create",function(test){
	var validUser = { email:"test@test.com", name:"TestUser" };
	test.do("UserService.create").with(validUser).noError().inputSameAsOutput().outputNotNull();
	test.do("UserService.delete").with(validUser);
});

/*
Hop.defineTestCase("UserService.authenticate",function(test){
	var validUser = { email:"test@test.com", username:"TestUser" };
	test.do("UserService.create").with(validUser).noError();
	test.do("UserService.authenticate").with(validUser).noError();
	test.do("UserService.authenticate").with({password:"BOB"},validUser).hasError(/Permission denied/);
});*/
