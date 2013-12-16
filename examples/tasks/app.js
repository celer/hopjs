var express= require('express');
var path = require('path');

var Hop = require("./../../index");

var logger = require('tracer').colorConsole();

//Setup logging so we get nice pretty logs
Hop.log=logger.info;
Hop.warn=logger.warn;
Hop.error=logger.error;

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
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

var requireUser=function(req,res,next){
  if(req.session.user){
    next();
  } else {
	  res.render("login",{Hop:Hop});
  }
}

require('./user');
require('./task');

var UserStub = Hop.Object.wrap("User");


app.engine("jade",require('jade').__express);

app.get("/",requireUser,function(req,res){
	res.render("index",{Hop:Hop});
});

app.post("/login",function(req,res){
  UserStub.login(req.body,function(err,user){
    if(user){
      res.redirect("/"); 
    } else {
	    res.render("login",{Hop:Hop,error:err});
    }
  },req,res);
}); 


app.get("/signup",function(req,res){
  res.render("signup",{Hop:Hop});
});

app.post("/signup",function(req,res){
  UserStub.create(req.body,function(err,user){
    if(user){
      UserStub.login(req.body,function(err,user){
        if(err) 
	        res.render("signup",{Hop:Hop,error:err});
        res.redirect("/"); 
      },req,res);
    } else {
	    res.render("signup",{Hop:Hop,error:err});
    }
  },req,res);
});


Hop.apiHook("/api/",app);

app.listen(3000);

