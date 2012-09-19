var RAPI = require('./api');

RAPI.TestCases={};

/**	
Define a test case for a specific method

@param {string} name the name of the method to test
@param {function} The lambda defining the test

@example
	RAPI.defineTestCase("User.authenticate",function(test){
		var validUser = { email:"test@test.com", username:"TestUser" };
		test.do("User.create").with(validUser).noError();
		test.do("User.authenticate").with(validUser).noError();
		test.do("User.authenticate").with({password:"BOB"},validUser).hasError(/Permission denied/);
	});
	

@for RAPI
@method defineTestCase
@static
**/
RAPI.defineTestCase=function(name,onTest){
	delete RAPI._checksum;

	var method = RAPI.Method.findMethod(name);
	if(!method)
		throw "Invalid test case name specified";

	method.addAfterTemplate("Doc","test/postDocMethod.comb");

	var obj = RAPI.Object.findObject(name);
	obj.addAfterTemplate("Doc","test/postDocObject.comb");

	RAPI.addAfterTemplate("Doc","test/postDocRAPI.comb");

	var test = new RAPI.TestCase(name,onTest);
}

RAPI.TestTask = function(funcName){
	this.funcName=funcName;
	this.inputObject=undefined;
	this.test=[];
}

RAPI.TestTask.prototype.getInputObject=function(){
	return this.inputObject;
}

RAPI.TestTask.prototype.with=function(obj,extend){
	//FIXME for extends
	this.inputObject = obj;
	return this;
}

RAPI.TestTask.prototype.noError=function(){
	this.test.push({ type:"noError"});
	return this;
}

RAPI.TestTask.prototype.inputSameAsOutput=function(){
	this.test.push({ type: "inputSameAsOutput" });
	return this;
}

RAPI.TestTask.prototype.outputNotNull=function(){
	this.test.push({ type:"outputNotNull"});
	return this;
}

RAPI.TestTask.prototype.outputMatches=function(obj){
	this.test.push({ type:"outputMatches", args: arguments });
	return this;
}

RAPI.TestTask.prototype.hasError=function(expectedError){
	if(!expectedError instanceof RegExp)
		throw "hasError only works with a regexp";
	this.test.push({ type:"hasError", expectedError: expectedError });
	return this;
}

RAPI.TestTask.prototype.run=function(onComplete){
				
}

RAPI.TestCase=function(name,onTest){
	this.name=name;
	this.tasks=[];
	onTest(this);	
	
	RAPI.TestCases[name]=this;
}

RAPI.TestCase.prototype.do=function(apiName){
	this.tasks.push(new RAPI.TestTask(apiName));	
	return this.tasks[this.tasks.length-1];
}

RAPI.TestCase.prototype.task=function(onTask){
	this.tasks.push(onTask);	
	return this.tasks[this.tasks.length-1];
}

setTimeout(function(){
		for(var i in RAPI.Objects){
			var object = RAPI.Objects[i];
			for(var j in object.methods){
				var method = object.methods[j];

				if(!RAPI.TestCases[method.getMethod()]){
					console.warn("Missing test case for "+method.getMethod());
				}

			}		
		}
},500);


