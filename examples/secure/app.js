var express= require('express');
var path = require('path');
var https = require('https');
var http = require('http');
var fs = require('fs');

var Hop = require("./../../index");

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
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.engine("jade",require('jade').__express);

app.get("/",function(req,res){
	res.render("index");
});

SecureService={
	testCall: function(input,onComplete,req){
		return onComplete(null,input);
	}
}

Hop.defineClass("SecureService",SecureService,function(api){
	api.post("testCall","/secure").demand("username").demand("password").secure();
});

Hop.defineTestCase("SecureService.testCall",function(test){
	test.do("SecureService.testCall").with({ username: "bob", password:"foo"}).errorContains("Permission denied");
});

Hop.apiHook("/api/",app);

http.createServer(app).listen(3000);
https.createServer(httpsOptions,app).listen(3443);
