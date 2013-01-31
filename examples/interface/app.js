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


var MessageService = function(name){
	this.name=name;
}

MessageService.prototype.send=function(input,onComplete){
		return onComplete(null,this.name);
}

MessageService.prototype.common=function(input,onComplete){
	return onComplete(null,"common");
}

EmailService=function(){
	MessageService.apply(this,["email"]);	
}
EmailService.prototype=new MessageService();
EmailService.prototype.constructor=EmailService;

SMSService=function(){
	MessageService.apply(this,["sms"]);	
}
SMSService.prototype=new MessageService();
SMSService.prototype.constructor=SMSService;

TwitterService=function(){
	MessageService.apply(this,["twitter"]);	
}
TwitterService.prototype=new MessageService();
TwitterService.prototype.constructor=TwitterService;


Hop.defineInterface("Notification",function(api){
		/* #classname will cause the classname of the extending class to be substituted into the path */
		api.post("send","#classname/send").usage("Sends a message").demand("msg").demand("subject").demand("to");
		
		api.post("common","#classname/common").usage("Sends a message").demand("msg").demand("subject").demand("to");
});

Hop.defineClass("Email",new EmailService(),function(api){
	/*
		This will cause the interface defined above to be applied to this object
		Now EmailService.send will exist on /email/send with all the associated demands, etc.
	*/
	api.extend("Notification");
});  


Hop.defineClass("SMS",new SMSService(),function(api){
	api.extend("Notification");
});  

Hop.defineClass("Twitter",new TwitterService(),function(api){
	api.extend("Notification");
});



Hop.defineTestCase("SMS.send",function(test){
	var msg = { msg:"msg", subject:"subject", to:"to"};
	test.do("SMS.send").with(msg).outputContains("sms");
	test.do("SMS.common").with(msg).outputContains("common");
})

Hop.defineTestCase("Twitter.send",function(test){
	var msg = { msg:"msg", subject:"subject", to:"to"};
	test.do("Twitter.send").with(msg).outputContains("twitter");
	test.do("Twitter.common").with(msg).outputContains("common");
})

Hop.defineTestCase("Email.send",function(test){
	var msg = { msg:"msg", subject:"subject", to:"to"};
	test.do("Email.send").with(msg).outputContains("email");
	test.do("Email.common").with(msg).outputContains("common");
})



Hop.apiHook("/api/",app);

app.listen(3000);

