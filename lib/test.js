/**
	Testing module

	@module Hop
	@submodule Test
**/
var Hop = require('./api');
var assert = require('assert');

Hop.TestCases={};

/**
	Holds testing utility functions

	*All of the functions in this class must be usable with (function).toString() for embedding*

	@class Hop.TestUtils
**/
Hop.TestUtils={};

/**
	Test to insure that all the input object properties are the same as the output object properties

	* The output object may have more properties then are in the input object
	* The output object must have all of the same properties, with the same value as the input object

	*This function is designed to be usable with (function).toString() for embedding*

	@param {object} input
		The input object
	@param {object} output
		The output object

	@method Hop.TestUtils.objectCovers
	@static
**/
Hop.TestUtils.objectCovers=function(input,output){
	var recurse=function(input,output){
		if(typeof input!=typeof output){
			return false;
		} else {
			for(var inputProp in input){
				if(input!=null && output==null)
					return false;
				else if(typeof input[inputProp]!=typeof output[inputProp])
					return false;
				if(typeof input[inputProp]=="object")
					return recurse(input[inputProp],output[inputProp]);
				else if(input[inputProp]!==output[inputProp])
					return false
			}
			return true; 
		}
	}
	return recurse(input,output);	
}

assert.equal(Hop.TestUtils.objectCovers({a:1},{a:1}),true);
assert.equal(Hop.TestUtils.objectCovers({a:1},{b:1}),false);
assert.equal(Hop.TestUtils.objectCovers({a:1,b:1},{a:1,b:1,c:3}),true);
assert.equal(Hop.TestUtils.objectCovers({a:1, b:{ k:3} },{a:1, b:{ k:3}}),true);
assert.equal(Hop.TestUtils.objectCovers({a:1, b:{ k:3} },{a:1, b:{ k:8}}),false);

/**
	Test to ensure that the output object has a specific property with a specific value

	*This function is designed to be usable with (function).toString() for embedding*

		@param {Object} output
			The output object
		@param {String} propertyName
			The property to test (supports dotted notation)
		@param {Object} [propertyValue]
			The expected object value

		@return bool

	@static
	@method Hop.TestUtils.inputSameAsOutput

**/
Hop.TestUtils.outputHasProperty=function(output,propertyName,propertyValue){
	var propertyStack = propertyName.split(".");
	var findProperty=function(output,propertyStack){
		var prop = propertyStack.shift();
		if(propertyStack.length==0){
			return output[prop];
		} else {
			if(typeof output[prop]=="object")
				return findProperty(output[prop],propertyStack); 
			else return undefined;
		}
	}
	var value = findProperty(output,propertyStack);
	if(typeof propertyValue!="undefined"){
		return value==propertyValue;
	} else {
		return (typeof value!="undefined");
	}
}

assert.equal(Hop.TestUtils.outputHasProperty({a:1},"a",1),true);
assert.equal(Hop.TestUtils.outputHasProperty({a:1},"a"),true);
assert.equal(Hop.TestUtils.outputHasProperty({a:1},"b"),false);
assert.equal(Hop.TestUtils.outputHasProperty({a:1, b:1},"b"),true);
assert.equal(Hop.TestUtils.outputHasProperty({a:1, b:1, c:{d:{e:"hello"}}},"c.d.e"),true);
assert.equal(Hop.TestUtils.outputHasProperty({a:1, b:1, c:{d:{e:"hello"}}},"c.d.e",3),false);
assert.equal(Hop.TestUtils.outputHasProperty({a:1, b:1, c:{d:{e:"hello"}}},"c.k.e"),false);

/**
	Saves a value for later usage as part of a test

	@static
	@method Hop.TestUtils.saveValue
**/
Hop.TestUtils.saveValue=function(name,value){
	if(typeof Hop.TestUtils._savedValues=="undefined")
		Hop.TestUtils._savedValues={};
	Hop.TestUtils._savedValues[name]=value;
}

/**
	Return the value of the named property in the object

	The property name may be in dotted form

	@param {Object} object
	@param {String} property

	@static
	@method Hop.TestUtils.getProperty
**/	
Hop.TestUtils.getProperty=function(object,property){
	with(object){ 
		return eval(property);
	}
}

/**
	Loads a value for later usage as part of a test

	@static
	@method Hop.TestUtils.loadValue
**/
Hop.TestUtils.loadValue=function(name){
	if(typeof Hop.TestUtils._savedValues!="undefined"){
		return Hop.TestUtils._savedValues[name];
	}
	else return undefined;
}

/**
	Clears all saved values, this is called at the completion of a test case

	@static
	@method Hop.TestUtils.clearValues
**/
Hop.TestUtils.clearValues=function(){
	Hop.TestUtils._savedValues={};
}

/**
	Utility function to copy an object, primarly used by .with
	
	@static
	@method Hop.TestUtils.extendTo
**/
Hop.TestUtils.extendTo=function(sourceObj,destObj){
		var result = JSON.parse(JSON.stringify(sourceObj));
		
		var copyProps = function(toObj,fromObj){
			for(var propName in fromObj){
				var prop = fromObj[propName];
				if(typeof prop == "object" && typeof toObj[propName]=="object"){
					copyProps(toObj[propName],fromObj[propName]);	
				} else {
					toObj[propName]=prop; 
				}	
			}
		}
		
		copyProps(result,destObj); 
		return result;
}


/**	
	Define a test case for a specific method

	@param {string} name 
		the name of the method to test, this must be the same as a defined API method, and may also contain a commnet appened after a :
	@param {function} 
		The lambda defining the test

	@example
		Hop.defineTestCase("User.authenticate: Test Authentication",function(test){
			var validUser = { email:"test@test.com", username:"TestUser" };
			test.do("User.create").with(validUser).noError();
			test.do("User.authenticate").with(validUser).noError();
			test.do("User.authenticate").with({password:"BOB"},validUser).containsError("Permission denied");
		});
		
	@for Hop
	@method defineTestCase
	@static
**/
Hop.defineTestCase=function(name,onTest){
	
	if(name.indexOf(":")!=-1){
		var method=name.split(":")[0];
		method = Hop.Method.findMethod(method);
	}	else {
		var method = Hop.Method.findMethod(name);
	}
	
	delete Hop._checksum;

	if(!method)
		throw "Invalid test case name specified, must be named after a defined method";

	method.addAfterTemplate("Doc","test/postDocMethod.comb");

	var obj = Hop.Object.findObject(name);
	obj.addAfterTemplate("Doc","test/postDocObject.comb");

	Hop.addAfterTemplate("Doc","test/postDocHop.comb");

	var test = new Hop.TestCase(name,onTest);
}

/**
	Used to impelement the .do interface for defineTest
 
	so .do("MyClass.myFunc") is implemented by this class 

	@param {string} funcName
		The name of the function this test should call
	
	@class Hop.TestTask
	@constructor
**/
Hop.TestTask = function(funcName){
	this.funcName=funcName;
	this.inputObject=undefined;
	this.test=[];
}

Hop.TestTask.prototype.getInputObject=function(){
	return this.inputObject;
}

/**
	Defines the input to be used for the API call
		
	This may either be a JavaScript Object or a named value (as created by .saveOutputAs) 

	@example
		test.do("Object.method").with({a:1, b:2});
	
	@example
		test.do("Object.method").with("savedValue");
	
	@example
		test.do("Object.method").with("savedValue",{a: 6} );
	

	@param {Mixed} inputValue
		The input value to use. Can be an object or string
	@param {Object} extend
		The object to extend the input value with. Can be an object or string
	
	@chainable
	@method with
**/
Hop.TestTask.prototype.with=function(obj,extend){
	if(typeof obj == "string"){
		if(typeof extend=="object"){
			this.inputObjectFunc='function(){ return Hop.TestUtils.extendTo(Hop.TestUtils.loadValue("'+obj+'"),'+JSON.stringify(extend)+'); }';
		} else {
			this.inputObjectFunc='function(){ return Hop.TestUtils.loadValue("'+obj+'"); }';
		}
		this.inputObject=obj;
	} else if(typeof extend!="undefined"){
		this.inputObject = Hop.TestUtils.extendTo(extend,obj); 
	} else {		
		this.inputObject = obj;
	}
	return this;
}

/**
	Save the output into a name variable for usage later

	@param {string} name
		The name of the value to save

	@chainable
	@method Hop.TestTask.prototype.saveOutputAs
**/
Hop.TestTask.saveOutputAs={ pass:"The output was saved", fail: "The output was not saved" };
Hop.TestTask.prototype.saveOutputAs=function(value){
	var testFunc=function(input,err,output,value){ Hop.TestUtils.saveValue(value,output); return true; }
	this.test.push({ type:"saveOutputAs", testFunc: testFunc.toString(), value:value});
	return this;
}

/**
	Require that the function does not return an error

	*This will not test the result in anyway, since having both a null error and null result is acceptable*
	
	@chainable
	@method noError
**/
Hop.TestTask.noError={ pass:"No error was recieved", fail: "An unexpected error was recieved" };
Hop.TestTask.prototype.noError=function(){
	var testFunc=function(input,err,output){ return (err==null); }
	this.test.push({ type:"noError", testFunc: testFunc.toString()});
	return this;
}

/**
	Require that the specified property has been changed from what was in the input

	*This test will also insure that the error is null and that the result is not null*

	@param {String} value
		The name of the property in the output

	@chainable
	@method outputPropertyChanged
**/
Hop.TestTask.outputPropertyChanged={ pass:"The property changed as expected", fail: "The output property didn't change as expected" };
Hop.TestTask.prototype.outputPropertyChanged=function(value){
	var testFunc=function(input,err,output,value){ return (err==null && input!=null && output!=null && Hop.TestUtils.getProperty(input,value)!=Hop.TestUtils.getProperty(output,value));	}
	this.test.push({ type: "outputPropertyChanged", testFunc: testFunc.toString(), value:value });
	return this;
}

/**
	Require that the input object is contained within the output object

	This will test to insure that the output object minially contains all the same parameters as the input object

	@chainable
	@method inputSameAsOutput
**/
Hop.TestTask.inputSameAsOutput={ pass:"The output was the same as the input", fail: "The output was not the same as the input" };
Hop.TestTask.prototype.inputSameAsOutput=function(){
	var testFunc=function(input,err,output){ return Hop.TestUtils.objectCovers(input,output);	}
	this.test.push({ type: "inputSameAsOutput", testFunc: testFunc.toString() });
	return this;
}

/**
	Test to insure the output is null
	
	@chainable
	@method outputIsNull	
**/
Hop.TestTask.outputIsNull={ pass:"The output was null", fail: "The output was not null" };
Hop.TestTask.prototype.outputIsNull=function(){
	var testFunc=function(input,err,output){ return output==null; }
	this.test.push({ type:"outputIsNull", testFunc: testFunc.toString() });
	return this;
}

/**
	Test to insure the output is not null

	*This test will also insure that the error is null*

	@chainable
	@method outputNotNull
**/
Hop.TestTask.outputNotNull={ pass:"The output was not null", fail: "The output was null, or there was also an error" };
Hop.TestTask.prototype.outputNotNull=function(){
	var testFunc=function(input,err,output){ return (err==null && output!=null); }; 
	this.test.push({ type:"outputNotNull", testFunc: testFunc.toString() });
	return this;
}

/**
	Test to insure that the output contains a specific object

	This test will insure that the output is a superset of the specified object

	@param {Object} value
		The object to compare the output to

	@chainable
	@method outputContains
**/
Hop.TestTask.outputContains={ pass:"The output contains the expected value", fail: "The output did not contain the expected value, or was null" };
Hop.TestTask.prototype.outputContains=function(value){
	var testFunc=function(input,err,output,value){ return (output!=null && Hop.TestUtils.objectCovers(value,output)); }; 
	this.test.push({ type:"outputContains", value: value, testFunc: testFunc.toString()	});
	return this;
}

/**
	Insure the error contains a specific string

	*This will also test to insure the output is null*

	@param {String} value
		The string to insure the error contains

	@chainable
	@method errorContains
**/
Hop.TestTask.errorContains={ pass:"The error contained the expected value", fail: "The error did not contain the expected value, or unexpectedly had an output" };
Hop.TestTask.prototype.errorContains=function(value){
	var testFunc=function(input,err,output,value){ return (err!=null && output==null && (typeof err.indexOf=="function") && err.indexOf(value)!=-1); }	
	this.test.push({ type:"errorContains", value: value, testFunc:testFunc.toString() });
	return this;
}

/**
	Insure that the output has a specified property

	This will test for existence of a specific property

	@param {String} property
		The name of the property

	@chainable
	@method outputHasProperty

**/
Hop.TestTask.outputHasProperty={ pass:"The output had the expected property", fail: "The output did not have the expected property, or an error occured" };
Hop.TestTask.prototype.outputHasProperty=function(value){
	var testFunc=function(input,err,output,value){ return (err==null && ouput!=null && Hop.TestUtils.outputHasProperty(output,value)); }	
	this.test.push({ type:"outputHasProperty", value: value, testFunc:testFunc.toString() });
	return this;
}

/**
	Test the output to make sure it is the same as a saved result
	
	@param {String} savedValue
		The name of the saved result

	@chainable
	@method outputSameAs
**/
Hop.TestTask.outputSameAs={ pass:"The output was the same as expected", fail: "The output was not the same as expected" };
Hop.TestTask.prototype.outputSameAs=function(value){
	var testFunc=function(input,err,output,value){ if(typeof value=="string") { value=Hop.TestUtils.loadValue(value); } return (err==null && Hop.TestUtils.objectCovers(value,output));	}	
	this.test.push({ type:"outputSameAs", value: value, testFunc:testFunc.toString() });
	return this;
}

/**
	TestCase Class

	This is the underlying class which is used in defineTestCase
	
	*To construct a new test case use defineTestCase instead*
	*The name of the case must alway be the name of a method, but may be followed by a description*

	@example
		Hop.defineTestCase("Object.Method",function()...);
		Hop.defineTestCase("Object.Method: Do a specific test",function()...);


	@param {String} name
		The name of the test case, this must always start with the name of a defined method, but may also include a description seperated by a ':'
	@param {Function} onTest
		The function defining the test case

	@class Hop.TestCase
	@constructor
**/
Hop.TestCase=function(name,onTest){
	this.name=name;
	this.tasks=[];
	onTest(this);	
	
	Hop.TestCases[name]=this;
}

/**
	Create a special object to instruct Hop to use a file provide by a URL as a test input value

	@param {String} url

	@static
	@method Hop.TestCase.fileFromURL
**/
Hop.TestCase.fileFromURL=function(url){
	return { _fileFromURL: url };
}

Hop.TestCase.standAloneSupport=function(options){
	return Hop.renderTemplate("test/standalone.comb")({ supportCode:true });
}

Hop.TestCase.toStandAlone=function(){
	var str="";
	str+=Hop.TestCase.standAloneSupport();
	for(var i in Hop.TestCases){
		str+=Hop.TestCases[i].toStandAlone();
	}
	return str;
}

Hop.TestCase.prototype.toStandAlone=function(){
	return Hop.renderTemplate("test/standalone.comb")(this);
}

Hop.TestCase.prototype.do=function(apiName){
	this.tasks.push(new Hop.TestTask(apiName));	
	return this.tasks[this.tasks.length-1];
}

Hop.TestCase.prototype.task=function(onTask){
	this.tasks.push(onTask);	
	return this.tasks[this.tasks.length-1];
}

Hop.TestService={
	wait:function(input,onComplete){
		setTimeout(function(){
			return onComplete(null,true);
		},input.duration*1000);
	},
	log:function(input,onComplete){
		Hop.log(input.msg);
		return onComplete(null,true);
	}
}

Hop.defineClass("TestService",Hop.TestService,function(api){
	api.get("wait","/hopjs/test/wait").demand("duration");
	api.get("log","/hopjs/test/log").demand("msg");
});


