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
	res.render("index");
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
	return onComplete(null,output);
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



Hop.defineModel("UnitTestService",function(model){
	model.field("modelFloat").float();
	model.field("modelBool").boolean();
	model.field("modelMinMax").range(5,100).integer();
	model.field("modelArray").values(["red","blue","green"]).string();
	model.field("modelObject").values({ R:"Red", B:"Blue", G:"Green" }).string();
	model.field("modelString").regexp(/[A-Z]+/,"REXP").string();
});

Hop.defineClass("UnitTestService",UnitTestService,function(api){
	
	api.post("testPost","/ts/").demands("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat").inputModel("UnitTestService");
	api.get("testGet","/ts/").demands("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat").inputModel("UnitTestService");
	api.put("testPut","/ts/").demands("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat").inputModel("UnitTestService");
	api.del("testDelete","/ts/:id");
	api.post("testPostOptionals","/ts/optionals").optionals("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat").inputModel("UnitTestService");
	api.get("testGetOptionals","/ts/optionals").optionals("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat").inputModel("UnitTestService");
	api.put("testPutOptionals","/ts/optionals").optionals("string","number","float","object","date","booleanTrue","booleanFalse","nullValue","modelMinMax","modelArray","modelObject","modelString","modelBool","modelFloat").inputModel("UnitTestService");
});

function basicTest(funcName,test){
	var d=new Date();
	var testValue = {string:"string",  number:8, float:3.23, object: { a:1, b:"a", c:true, d:{ e:44} }, date: d, booleanTrue: true, booleanFalse:false, nullValue: null, modelMinMax: 6, modelArray:"red", modelObject:"R", modelString:"ADDFD", modelBool:true, modelFloat: 3.232 };
	var expectedValue = {string:"string", number:"8", float:"3.23", object: { a:"1", b:"a", c:"true", d:{ e:"44"} }, date: d, booleanTrue: "true", booleanFalse:"false", nullValue: "", modelMinMax: 6, modelBool:true, modelFloat:3.232};
	test.do(funcName).with({}).errorContains("Missing parameter:");
	test.do(funcName).with(testValue).outputContains(expectedValue);
	test.do(funcName).with(testValue,{modelMinMax: 2 }).errorContains("Value must be greater than 5");
	test.do(funcName).with(testValue,{modelArray: 2 }).errorContains("Valid values are: red, blue, green");
	test.do(funcName).with(testValue,{modelObject: 2 }).errorContains("Valid values are: R, B, G");
	test.do(funcName).with(testValue,{modelString: 2 }).errorContains("REXP");
	test.do(funcName+"Optionals").with({ }).noError();
	test.do(funcName+"Optionals").with(testValue).outputContains(expectedValue);
}

Hop.defineTestCase("UnitTestService.testGet: Basic tests",function(test){
	basicTest("UnitTestService.testGet",test);
});

Hop.defineTestCase("UnitTestService.testDelete: Basic tests",function(test){
	test.do("UnitTestService.testDelete").with({ id:"3" }).inputSameAsOutput();
});

Hop.defineTestCase("UnitTestService.testPut: Basic tests",function(test){
	basicTest("UnitTestService.testPut",test);
});

Hop.defineTestCase("UnitTestService.testPost: Basic tests",function(test){
	basicTest("UnitTestService.testPost",test);
});


Hop.apiHook("/api/",app);

app.listen(3000);

