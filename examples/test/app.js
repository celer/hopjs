/* This example is an extension of the examples/intro */

var express= require('express');
var path = require('path');

var Hop = require("./../../index");
var HopRemote = require('hopjs-remote');

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

/*
	Things to test
		-> Deep objects / complex objects
		-> Calls with optional params
			-> model validation on optional params
		-> Type conversions
			-> Pass unexpected types into things
		-> Turn on / off client side validation
		-> No redis / w redis
		-> Caching of files responses
		-> functions not getting containing extra params	
		-> well formed URLs
		

*/


UnitTestService={};
UnitTestService.test=function(input,onComplete){
	var output = {};
	for(var i in input){
		output[i]=input[i];
	}
	console.log(output);
	return onComplete(null,output);
}

UnitTestService.testRaw=function(input,onComplete){
	return onComplete(null,input.value);
}

UnitTestService.testGetEach=function(input,onComplete){
	return onComplete(null,input.value);
}
UnitTestService.testDelEach=function(input,onComplete){
	return onComplete(null,input.value);
}
UnitTestService.testPostEach=function(input,onComplete){
	return onComplete(null,input.value);
}
UnitTestService.testPutEach=function(input,onComplete){
	return onComplete(null,input.value);
}

UnitTestService.testGet=UnitTestService.test;
UnitTestService.testPut=UnitTestService.test;
UnitTestService.testDelete=UnitTestService.test;
UnitTestService.testPost=UnitTestService.test;
UnitTestService.testGetOptionals=UnitTestService.test;
UnitTestService.testPutOptionals=UnitTestService.test;
UnitTestService.testDeleteOptionals=UnitTestService.test;
UnitTestService.testPostOptionals=UnitTestService.test;
UnitTestService.testDemands=UnitTestService.test;
UnitTestService.testOptionals=UnitTestService.test;

UnitTestService.testGetWithModel=UnitTestService.test;
UnitTestService.testPutWithModel=UnitTestService.test;
UnitTestService.testDeleteWithModel=UnitTestService.test;
UnitTestService.testPostWithModel=UnitTestService.test;
UnitTestService.testGetOptionalsWithModel=UnitTestService.test;
UnitTestService.testPutOptionalsWithModel=UnitTestService.test;
UnitTestService.testDeleteOptionalsWithModel=UnitTestService.test;
UnitTestService.testPostOptionalsWithModel=UnitTestService.test;

UnitTestService.testForm=function(input,onComplete){

	console.log(input);

	return onComplete(null,input);
}

UnitTestService.sendTemplate=function(input,onComplete){
	return onComplete(null,Hop.render("test",{Title:"Title"}));
}

UnitTestService.sendHeaders=function(input,onComplete,req){
	HopRemote.remoteAPI("http://localhost:3000/",function(err,api){
		if(err) return onComplete(err);
		if(api){
			api.UnitTestService.testHeaders({},function(err,res){
				return onComplete(err,res);
			},{ headers: { cookie: "foo=3", authorization:"kittens=true"}, ip: req.ip});
		}	else return onComplete("No error and no API");
	});
}

UnitTestService.testHeaders=function(input,onComplete,req){
	if(!req.cookies['foo']==3)
		return onComplete("Missing foo cookie");
	if(!req.headers['authorization']=='kittens=true')
		return onComplete("Missing authorization header");
	if(!req.headers['x-forwarded-for'])
		return onComplete("Missing X Forwarded For Header");
	return onComplete(null, true);
}

UnitTestService.dualComplete=function(input,onComplete){
	onComplete(null,false);
	onComplete(null,true);
}

UnitTestService.customError=function(input,onComplete){
	return onComplete("INTERNAL ERROR");
}


Hop.defineModel("UnitTestService",function(model){
	model.field("modelFloat").float();
	model.field("modelBool").boolean();
	model.field("modelMinMax").range(5,100).integer();
	model.field("modelArray").values(["red","blue","green"]).string();
	model.field("modelObject").values({ R:"Red", B:"Blue", G:"Green" }).string();
	model.field("modelString").regexp(/[A-Z]+/,"REXP").string();
	model.field("modelStringArray").string().isArray().values(["A","B","C"]);
});

Hop.defineClass("UnitTestService",UnitTestService,function(api){
	api.get("sendTemplate","/template");
	api.post("testHeaders","/testHeaders");
	api.post("sendHeaders","/sendHeaders");
	api.get("dualComplete","/dualComplete");
	api.get("customError","/customError");
  api.get("testRaw","/raw").demand("value");
	api.post("testForm","/form/test").optionals("textValue","selectValue","multipleValue","checkbox1","radio1");
	api.post("testPost","/ts/").demands("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat","modelStringArray").inputModel("UnitTestService");
	api.get("testGet","/ts/").demands("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat","modelStringArray").inputModel("UnitTestService");
	api.put("testPut","/ts/").demands("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat","modelStringArray").inputModel("UnitTestService");
	api.del("testDelete","/ts/:id");
	api.post("testPostOptionals","/ts/optionals").optionals("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat","modelStringArray").inputModel("UnitTestService");
	api.get("testGetOptionals","/ts/optionals").optionals("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat","modelStringArray").inputModel("UnitTestService");
	api.put("testPutOptionals","/ts/optionals").optionals("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat","modelStringArray").inputModel("UnitTestService");

	api.errorHandler(function(method,request,input,error,stack){
		if(error=="INTERNAL ERROR"){
			return "Error";
		} else return null;
	});

  api.each(function(api){  
    api.get("testGetEach","/get/each/raw");
    api.del("testDelEach","/del/each/raw");
    api.post("testPostEach","/post/each/raw");  
    api.put("testPutEach","/put/each/raw");
  },function(method){
    method.demand("foo");
  });
});

function basicTest(method, funcName,test){
	var d=new Date();
	var testValue = {modelStringArray:["A","B"], string:"string",  number:8, float:3.23, object: { a:1, b:"a", c:true, d:{ e:44} },  date: d, booleanTrue: true, booleanFalse:false, nullValue: null, modelMinMax: 6, modelArray:"red", modelObject:"R", modelString:"ADDFD", modelBool:true, modelFloat: 3.232 };
	if(method=="get"){
		var expectedValue = {modelStringArray:["A","B"], string:"string", number:"8", float:"3.23", object: { a:"1", b:"a", c:"true", d:{ e:"44"} },  date: d, booleanTrue: "true", booleanFalse:"false", nullValue: "", modelMinMax: 6, modelBool:true, modelFloat:3.232};
	} else {
		var expectedValue = {modelStringArray:["A","B"], string:"string", number:8, float:3.23, object: { a:1, b:"a", c:true, d:{ e:44} },  date: d, booleanTrue:true, booleanFalse:false, nullValue: null, modelMinMax: 6, modelBool:true, modelFloat:3.232};
	}
	test.do(funcName).with({}).errorContains("Missing parameter:");
	test.do(funcName).with(testValue).outputContains(expectedValue);
	test.do(funcName).with(testValue,{modelMinMax: 2 }).errorContains("Value must be greater than 5");
  test.do(funcName).with(testValue,{modelMinMax: 2}).hasError();
	test.do(funcName).with(testValue,{modelArray: 2 }).errorContains("Valid values are: red, blue, green");
	test.do(funcName).with(testValue,{modelObject: 2 }).errorContains("Valid values are: R, B, G");
	test.do(funcName).with(testValue,{modelString: 2 }).errorContains("REXP");
	test.do(funcName).with(testValue,{modelStringArray: 2 }).errorContains("Invalid value");
	test.do(funcName).with(testValue,{modelStringArray: ['D'] }).errorContains('Valid values are: A, B, C');
	test.do(funcName+"Optionals").with({ }).noError();
	test.do(funcName+"Optionals").with(testValue).outputContains(expectedValue);
  test.do(funcName+"Optionals").with(testValue).outputDoesntContain({kittens:34});
}

Hop.defineTestCase("UnitTestService.testRaw",function(test){
  test.do("UnitTestService.testRaw").with({ value:[1,2,3,4,5] }).outputIsArrayWithLength(5);
  test.do("UnitTestService.testRaw").with({ value:[1,2,3,4,5] }).outputIsArrayWithMinLength(5);
  test.do("UnitTestService.testRaw").with({ value:[1,2,3,4,5] }).outputIsArrayWithMinLength(2);
  test.do("UnitTestService.testRaw").with({ value:[1,2,3,4,5] }).outputIsArrayWithMaxLength(8);
});

Hop.defineTestCase("UnitTestService.testGetEach",function(test){
  test.do("UnitTestService.testGetEach").with({}).errorContains("foo");
  test.do("UnitTestService.testDelEach").with({}).errorContains("foo");
  test.do("UnitTestService.testPostEach").with({}).errorContains("foo");
  test.do("UnitTestService.testPutEach").with({}).errorContains("foo");
});

Hop.defineTestCase("UnitTestService.customError",function(test){
	test.do("UnitTestService.customError").with({}).errorContains("Error");
});

Hop.defineTestCase("UnitTestService.sendTemplate",function(test){
	test.do("UnitTestService.sendTemplate").with({}).outputContains("<h1>Template Title</h1>").noError();
});

Hop.defineTestCase("UnitTestService.sendHeaders",function(test){
	test.do("UnitTestService.sendHeaders").with({}).noError();
});

Hop.defineTestCase("UnitTestService.testGet: Basic tests",function(test){
	basicTest("get","UnitTestService.testGet",test);
});

Hop.defineTestCase("UnitTestService.testDelete: Basic tests",function(test){
	test.do("UnitTestService.testDelete").with({ id:"3" }).inputSameAsOutput();
});

Hop.defineTestCase("UnitTestService.testPut: Basic tests",function(test){
	basicTest("put","UnitTestService.testPut",test);
});

Hop.defineTestCase("UnitTestService.testPost: Basic tests",function(test){
	basicTest("post","UnitTestService.testPost",test);
});



Hop.apiHook("/api/",app);

app.listen(3000);

