var express= require('express');
var path = require('path');
var https = require('https');
var http = require('http');
var fs = require('fs');
var os = require('os');

var Hop = require("./../../index");

/* 
	Set up our certificates
*/
var httpsOptions = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem'),
}



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

	/*
		This will tell express to use it's csrf protection: ( http://en.wikipedia.org/wiki/Cross-site_request_forgery )
	*/	
	app.use(express.csrf());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.engine("jade",require('jade').__express);

app.get("/",function(req,res){
	res.render("index",{ _csrf: req.session._csrf, hostname: os.hostname() });
});

SecureService={	
	csrf: function(input,onComplete,req){
		return onComplete(null,true);
	},
	secureCall: function(input,onComplete,req){
		return onComplete(null,input);
	},
	insecureCall: function(input,onComplete,req){
		return onComplete(null,input);
	}
}

Hop.defineClass("SecureService",SecureService,function(api){
	/* 
		We will use this call to get the csrf token for the test scripts - this is generally a really bad idea and defeats the purpose express's CSRF protection	
		
		In a production application a better solution would be to use CSRF protection for all posts and then use an express middleware wrapper	
		to allow the authentication call to be called without a CSRF token and have it return the token so scripting tools may use the 
		CSRF token 
	 	
	*/
	api.get("csrf","/csrf").sendCSRFToken();
	/* This call will only work over HTTPS */
	api.post("secureCall","/secure").demand("username").demand("password").sendCSRFToken().secure();
	api.post("insecureCall","/insecure").demand("username").demand("password").sendCSRFToken();
});

Hop.defineTestCase("SecureService.secureCall",function(test){
	test.do("SecureService.csrf").with({}).noError();
	test.do("SecureService.secureCall").with({ username: "bob", password:"foo"}).errorContains("Permission denied");
});

Hop.defineTestCase("SecureService.insecureCall",function(test){
	test.do("SecureService.csrf").with({}).noError();
	test.do("SecureService.insecureCall").with({ username: "bob", password:"foo"}).inputSameAsOutput();;
});

Hop.apiHook("/api/",app);

http.createServer(app).listen(3000);
https.createServer(httpsOptions,app).listen(3443);
