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


var FileTest={};

FileTest.sendFile=function(input,onComplete){
	/*
		This will send the file as a raw file, suitable for displaying an image or directly displaying the file
	*/
	return onComplete(null,Hop.sendFile("public/pig.png"));
}	

FileTest.sendAttachment=function(input,onComplete){
	/*
		This will send the file as an attachment causing most browsers to prompt for downloading the image
	*/
	return onComplete(null,Hop.sendAttachment("public/pig.png","image.png"));
}

FileTest.upload=function(input,onComplete){
	return onComplete(null,input);
}	


Hop.defineClass("FileTest",FileTest,function(api){
	api.get("sendFile","/file")
	api.get("sendAttachment","/attachment");
	/*
		Here we can also demand that a parameter be treated as a file 
	*/
	api.post("upload","/upload").demandFile("required").optionalFile("optional");
});  


Hop.defineTestCase("FileTest.sendFile",function(test){
	test.do("FileTest.sendFile").noError();
});

Hop.defineTestCase("FileTest.sendAttachment",function(test){
	test.do("FileTest.sendAttachment").noError();
});

Hop.defineTestCase("FileTest.upload",function(test){
	test.do("FileTest.upload").with({
																		required: test.fileFromURL("/pig.png")
																		}).outputHasProperty("required.size");
})



Hop.apiHook("/api/",app);

app.listen(3000);

