/**
 * Module dependencies.
 */
var RAPI = require("./../../index");


var express= require('express');
var RedisStore = require('connect-redis')(express);
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var sessionStore = new RedisStore();
var path = require('path');

require('./user');

server.listen(3000);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
	
  app.use(express.session({
		store: sessionStore
	}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.engine("jade",require('jade').__express);

app.configure('development', function(){
  app.use(express.errorHandler());
});


app.get("/",function(req,res){
	res.render("index");
});

app.get("/test",function(req,res){
	console.log("TEST");
	setTimeout(function(){
		res.send("foo");
	},5000);
});


app.get("/bar",function(req,res){
	console.log("TEST");
	setTimeout(function(){
		res.send("foo");
	},5000);
});

/*
	Browser 
		-> auth 
			code <- (Store in session)
		-> emit auth (code) 
				(store code in store) 
		-> subscribe (channel) 
				
				
	
	Server
		internalEvent.emit -> find all sockets that are subscribed to said channel and send
					

*/

/*
	map of channels /foo/:fooId
		-> find the channel, see if a auth function exists on the channel
			-> if so run auth function
			-> add suspecific channel /foo/7 and socket

	Every so often go through our list of channels and see if the sockets are still active, if not axe them
*/

RAPI.apiHook("/api/1.0/",app);
RAPI.hookSocketIO(io);

RAPI.makeAndroid("./build/android");
