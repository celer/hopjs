var Hop = require('./api');

Hop.TestCases={};

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
	//FIXME for extends
  if(typeof extend!="undefined"){
    this.inputObject = JSON.parse(JSON.stringify(extend));
    
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
    copyProps(this.inputObject,obj); 
  } else {    
	  this.inputObject = obj;
  }
	return this;
}

Hop.TestTask.prototype.noError=function(){
	this.test.push({ type:"noError"});
	return this;
}

Hop.TestTask.prototype.inputSameAsOutput=function(){
	this.test.push({ type: "inputSameAsOutput" });
	return this;
}

Hop.TestTask.prototype.outputNull=function(){
	this.test.push({ type:"outputNull"});
	return this;
}

Hop.TestTask.prototype.outputNotNull=function(){
	this.test.push({ type:"outputNotNull"});
	return this;
}

Hop.TestTask.prototype.outputMatches=function(obj){
	this.test.push({ type:"outputMatches", args: arguments });
	return this;
}

Hop.TestTask.prototype.errorContains=function(expectedError){
	this.test.push({ type:"errorContains", expectedError: expectedError });
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

Hop.TestCase.prototype.do=function(apiName){
	this.tasks.push(new Hop.TestTask(apiName));	
	return this.tasks[this.tasks.length-1];
}

Hop.TestCase.prototype.task=function(onTask){
	this.tasks.push(onTask);	
	return this.tasks[this.tasks.length-1];
}

setTimeout(function(){
		for(var i in Hop.Objects){
			var object = Hop.Objects[i];
			for(var j in object.methods){
				var method = object.methods[j];

				if(!Hop.TestCases[method.getMethod()]){
					console.warn("Missing test case for "+method.getMethod());
				}

			}		
		}
},500);


