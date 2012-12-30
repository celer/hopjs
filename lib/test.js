var Hop = require('./api');
var assert = require('assert');

Hop.TestCases={};

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

@static
@method Hop.TestUtils.objectCovers

*/
Hop.TestUtils.objectCovers=function(input,output){
  var recurse=function(input,output){
    if(typeof input!=typeof output){
      return false;
    } else {
      for(var inputProp in input){
        if(typeof input[inputProp]!=typeof output[inputProp])
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

@param {object} output
  The output object
@param {string} propertyName
  The property to test (supports dotted notation)
@param {object} [propertyValue]
  The expected object value

@static
@method Hop.TestUtils.inputSameAsOutput

*/
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

Hop.TestUtils.saveValue=function(name,value){
  if(typeof _HopTestOutputs=="undefined")
    _HopTestOutputs={};
  _HopTestOutputs[name]=value;
}

Hop.TestUtils.loadValue=function(name){
  if(typeof _HopTestOutputs!="undefined")
    return _HopTestOutputs[name];
  else return undefined;
}

Hop.TestUtils.clearValues=function(){
  _HopTestOutputs={};
}

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

/*
Hop.Test={};

Hop.Test.outputNotNull=function(input,err,output){
  return (output!=null)
}

Hop.Test.outputIsNull=function(input,err,output){
  return (output==null);
}

Hop.Test.outputSameAsInput=function(input,err,output){
  return Hop.TestUtils.objectCovers(input,output);
}

Hop.Test.outputMatches=function(input,err,output,value){
  return Hop.TestUTils.objectCovers(input,value);
}
*/




















/**	
Define a test case for a specific method

@param {string} name the name of the method to test
@param {function} The lambda defining the test

@example
	Hop.defineTestCase("User.authenticate",function(test){
		var validUser = { email:"test@test.com", username:"TestUser" };
		test.do("User.create").with(validUser).noError();
		test.do("User.authenticate").with(validUser).noError();
		test.do("User.authenticate").with({password:"BOB"},validUser).hasError(/Permission denied/);
	});
	

@for Hop
@method defineTestCase
@static
**/
Hop.defineTestCase=function(name,onTest){
  
  if(name.indexOf(":")!=-1){
    var method=name.split(":")[0];
	  method = Hop.Method.findMethod(method);
  }  else {
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

Hop.TestTask = function(funcName){
	this.funcName=funcName;
	this.inputObject=undefined;
	this.test=[];
}

Hop.TestTask.prototype.getInputObject=function(){
	return this.inputObject;
}

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

Hop.TestTask.saveOutputAs={ pass:"The output was saved", fail: "The output was not saved" };
Hop.TestTask.prototype.saveOutputAs=function(value){
  var testFunc=function(input,err,output,value){ Hop.TestUtils.saveValue(value,output); return true; }
	this.test.push({ type:"saveOutputAs", testFunc: testFunc.toString(), value:value});
	return this;
}

Hop.TestTask.noError={ pass:"No error was recieved", fail: "An unexpected error was recieved" };
Hop.TestTask.prototype.noError=function(){
  var testFunc=function(input,err,output){ return (err==null); }
	this.test.push({ type:"noError", testFunc: testFunc.toString()});
	return this;
}

Hop.TestTask.inputSameAsOutput={ pass:"The output was the same as the input", fail: "The output was not the same as the input" };
Hop.TestTask.prototype.inputSameAsOutput=function(){
  var testFunc=function(input,err,output){ return Hop.TestUtils.objectCovers(input,output);  }
	this.test.push({ type: "inputSameAsOutput", testFunc: testFunc.toString() });
	return this;
}

Hop.TestTask.outputIsNull={ pass:"The output was null", fail: "The output was not null" };
Hop.TestTask.prototype.outputIsNull=function(){
  var testFunc=function(input,err,output){ return output==null; }
	this.test.push({ type:"outputIsNull", testFunc: testFunc.toString() });
	return this;
}

Hop.TestTask.outputNotNull={ pass:"The output was not null", fail: "The output was null" };
Hop.TestTask.prototype.outputNotNull=function(){
  var testFunc=function(input,err,output){ return output!=null; }; 
	this.test.push({ type:"outputNotNull", testFunc: testFunc.toString() });
	return this;
}

Hop.TestTask.outputNotNull={ pass:"The output contains the expected value", fail: "The output did not contain the expected value" };
Hop.TestTask.prototype.outputContains=function(value){
  var testFunc=function(input,err,output,value){ return Hop.TestUtils.objectCovers(value,output); }; 
	this.test.push({ type:"outputMatches", value: value, testFunc: testFunc.toString()  });
	return this;
}

Hop.TestTask.errorContains={ pass:"The error contained the expected value", fail: "The error did not contain the expected value" };
Hop.TestTask.prototype.errorContains=function(value){
  var testFunc=function(input,err,output,value){ return (err!=null && (typeof err.indexOf=="function") && err.indexOf(value)!=-1); }  
	this.test.push({ type:"errorContains", value: value, testFunc:testFunc.toString() });
	return this;
}

Hop.TestTask.outputHasProperty={ pass:"The output had the expected property", fail: "The output did not have the expected property" };
Hop.TestTask.prototype.outputHasProperty=function(value){
  var testFunc=function(input,err,output,value){ return Hop.TestUtils.outputHasProperty(output,value); }  
	this.test.push({ type:"outputHasProperty", value: value, testFunc:testFunc.toString() });
	return this;
}

Hop.TestTask.outputSameAs={ pass:"The output was the same as expected", fail: "The output was not the same as expected" };
Hop.TestTask.prototype.outputSameAs=function(value){
  var testFunc=function(input,err,output,value){ if(typeof value=="string") { value=Hop.TestUtils.loadValue(value); } return Hop.TestUtils.objectCovers(value,output);  }  
	this.test.push({ type:"outputSameAs", value: value, testFunc:testFunc.toString() });
	return this;
}

Hop.TestTask.prototype.run=function(onComplete){
				
}

Hop.TestCase=function(name,onTest){
	this.name=name;
	this.tasks=[];
	onTest(this);	
	
	Hop.TestCases[name]=this;
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
  }
}

Hop.defineClass("TestService",Hop.TestService,function(api){
  api.get("wait","/hopjs/test/wait").demand("duration");
});


