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

  @param {object} input The input object
  @param {object} output The output object

  @method Hop.TestUtils.objectCovers
  @static
**/
Hop.TestUtils.objectCovers=function(input,output){
  var recurse=function(input,output){
    if(typeof input!=typeof output){
      return false;
    } else {
      if(input instanceof Array){
        for(var i in input){
          var found=false;
          for(var j in output){
            if(recurse(input[i],output[j])){
              found=true;
            }
          }
          if(!found){
            return false;      
          }
        }
        return true;
      } else if(typeof input=="object") {
        for(var inputProp in input){
          if(input!=null && output==null)
            return false;
          else if(typeof input[inputProp]!=typeof output[inputProp])
            return false;
          if(input[inputProp] instanceof Array){
            var res = recurse(input[inputProp],output[inputProp]);
            if(res==false)
              return false;
          } else if(typeof input[inputProp]=="object"){
            var res = recurse(input[inputProp],output[inputProp]);
            if(res==false)
              return false;
          } else if(input[inputProp]!==output[inputProp])
            return false
        }
        return true; 
      } else {
        return (input==output);
      }
    }
  }
  return recurse(input,output);  
}

assert.equal(Hop.TestUtils.objectCovers([1,2,3,4],[1,2,3,4,5]),true);
assert.equal(Hop.TestUtils.objectCovers([1,2,3,4],[1,2,4,5]),false);
assert.equal(Hop.TestUtils.objectCovers("hello","hello"),true);
assert.equal(Hop.TestUtils.objectCovers({a:1},{a:1}),true);
assert.equal(Hop.TestUtils.objectCovers({a:1},{b:1}),false);
assert.equal(Hop.TestUtils.objectCovers({a:1,b:1},{a:1,b:1,c:3}),true);
assert.equal(Hop.TestUtils.objectCovers({a:1, b:{ k:3} },{a:1, b:{ k:3}}),true);
assert.equal(Hop.TestUtils.objectCovers({a:1, b:{ k:3} },{a:1, b:{ k:8}}),false);
assert.equal(Hop.TestUtils.objectCovers({a:1, b:{ k:3}, complex: [ 1, '3','A',{ a:1 },{ b:5, c:[1,2,3,'5']}]}, {a:1, b:{ k:3}, complex: [ 1, '3','A',{ a:1 },{ b:5, c:[1,2,3,'5']}]}),true);
assert.equal(Hop.TestUtils.objectCovers({a:1, b:{ k:3}, complex: [ 1, '3','A',{ a:1 },{ b:5, c:[1,2,3,'5']}]}, {a:1, b:{ k:3} }),false);
assert.equal(Hop.TestUtils.objectCovers({a:1, b:{ k:3}, complex: [ 1, '3','A',{ a:1 },{ b:5, c:[1,2,3,'5']}]}, {a:1, b:{ k:3}, complex: [ 1, '3','A',{ a:1 },{ b:5, c:[1,2,3]}]}),false);

assert.equal(Hop.TestUtils.objectCovers([ { name:'foo' }, {name:'bar',roles:['a','b','c'], thing:{ a:1, b:2}}], [ { name:'foo' }, {name:'bar',roles:['a','b','c'], thing:{ a:1, b:2}}]),true);
assert.equal(Hop.TestUtils.objectCovers([ { name:'foo' }, {name:'bar',roles:['a','b','c'], thing:{ a:1, b:2}}], [ { name:'foo' }, {name:'bar',roles:['a','b','c'], thing:{ a:1, b:5}}]),false);
assert.equal(Hop.TestUtils.objectCovers([ { name:'foo' }, {name:'bar',roles:['a','b','c'], thing:{ a:1, b:2}}], [{name:'bar',roles:['a','b','c'], thing:{ a:1, b:5}}]),false);

/**
  Test to ensure that the output object has a specific property with a specific value

  *This function is designed to be usable with (function).toString() for embedding*

    @param {Object} output The output object
    @param {String} propertyName The property to test (supports dotted notation)
    @param {Object} [propertyValue] The expected object value

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
  Test to ensure that the array contains the specified value
  
  *This function is designed to be usable with (function).toString() for embedding*

    @param {Object} array The output array
    @param {Object value The expected object value

    @return bool

  @static
  @method Hop.TestUtils.arrayContains
  
**/
Hop.TestUtils.arrayContains=function(array,value){
  for(var i in array){
    var v=array[i];
    if(Hop.TestUtils.objectCovers(value,v)){
      return true;
    }  
  }  
  return false;
}

assert.equal(Hop.TestUtils.arrayContains(["A","b","c","d"],"a"),false);
assert.equal(Hop.TestUtils.arrayContains(["A","b","c","d"],"A"),true);
assert.equal(Hop.TestUtils.arrayContains(["A","b","c","d", { a: 1, b: 2}],{a:1,b:2}),true);
assert.equal(Hop.TestUtils.arrayContains(["A","b","c","d", { a: 1, b: 2,c:3}],{a:1,b:2}),true);
assert.equal(Hop.TestUtils.arrayContains(["A","b","c","d", { a: 1, b: 2}],{a:1,b:2,c:3}),false);


/**
  Loads a value for later usage as part of a test

  @static
  @method Hop.TestUtils.loadValue
**/
Hop.TestUtils.loadValue=function(name){
  if(typeof name=="string"){
    if(typeof Hop.TestUtils!="undefined" && typeof Hop.TestUtils._savedValues!="undefined"){
      with(Hop.TestUtils._savedValues){
        try {
          return eval(name);
        } catch(e){
          console.log(e);
          return undefined;
        }
      }
      //return Hop.TestUtils._savedValues[name];
    }
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
  delete Hop.TestUtils._savedValues;
}

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
  Resolve a values within an array or object based upon saved values
  
  This function will search for strings matching #{.+#} and replace  
  the object property or array value with the resolved value from a saved value. 

  Values are resolved like so:
  @example
    with(savedValues){
      return eval(inputString);
    }  

  @examples
    #{savedUser.name}
    #{savedUsers[1].name}
    #{undefined} // will return undefined  

  @static
  @method Hop.TestUtils.resolve
**/
Hop.TestUtils.resolve=function(object,checkSavedObjects){
  if(typeof object=="string" && checkSavedObjects==true){
    if(typeof Hop.TestUtils._savedValues!="undefined" && typeof Hop.TestUtils._savedValues[object]!="undefined"){
      return Hop.TestUtils._savedValues[object];
    }
  }

  if(object instanceof Array){
    return object.map(function(item){
      return Hop.TestUtils.resolve(item);
    });  
  } else if(typeof object=="object"){
    for(var propName in object){
      var prop = object[propName];
      object[propName]=Hop.TestUtils.resolve(prop);
    }
    return object;
  } else if(typeof object=="string"){
      var m = /^\#\{(.+)\}$/.exec(object);
      if(m && m.length>1){
        with(Hop.TestUtils._savedValues){
          return eval(m[1]);
        }    
      } else {
          return object;  
      }
  } else return object;
}

Hop.TestUtils.saveValue("Foo",{ a:1, b:2, c:true, d:"Bar"});
Hop.TestUtils.saveValue("Foos",[{ a:1, b:2, c:true, d:"Bar"},"a"]);
assert.deepEqual(Hop.TestUtils.resolve({ a:"#{Foo.d}"}), {a:"Bar"});
assert.deepEqual(Hop.TestUtils.resolve({ a:"#{Foo.c}"}), {a:true});
assert.deepEqual(Hop.TestUtils.resolve({ a:"#{Foo.e}"}), {a:undefined});
assert.deepEqual(Hop.TestUtils.resolve({ a:"#{Foo.a}", b:[1,2,3,"#{Foo.b}"]}), {a:1, b:[1,2,3,2]});
assert.deepEqual(Hop.TestUtils.resolve({ a:"#{Foo.a}", b:[1,2,3,"#{Foo.b}"], e: { a:{ a: 44, j:['a','b','c','d']}}}), {a:1, b:[1,2,3,2],e: { a:{ a: 44, j:['a','b','c','d']}}});
assert.equal(Hop.TestUtils.resolve("#{Foo.d}"),"Bar");
assert.deepEqual(Hop.TestUtils.resolve("Foo",true),{ a:1, b:2, c:true, d:"Bar"});
assert.equal(Hop.TestUtils.resolve(4),4);
assert.equal(Hop.TestUtils.resolve("#{undefined}"),undefined);
assert.equal(Hop.TestUtils.resolve("#{Foos[1]}"),"a");
assert.deepEqual(Hop.TestUtils.resolve("#{Foo}"),{ a:1, b:2, c:true, d:"Bar"});
Hop.TestUtils.clearValues();


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
  Utility function to copy an object, primarly used by .with
  
  @static
  @method Hop.TestUtils.extendTo
**/
Hop.TestUtils.extendTo=function(toObj,fromObj){
    var result = JSON.parse(JSON.stringify(toObj));
    
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
    
    copyProps(result,fromObj); 
    return result;
}


/**  
  Define a test case for a specific method

  @param {string} name the name of the method to test, this must be the same as a defined API method, and may also contain a commnet appened after a :
  @param {function} lambda The lambda defining the test

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
  }  else {
    var method = Hop.Method.findMethod(name);
  }
  
  delete Hop._checksum;

  if(!method)
    throw "Invalid test case name specified, must be named after a defined method";

  method.addAfterTemplate("Doc","test/postDocMethod.comb");

  var obj = Hop.Object.findObject(name);
  obj.addAfterTemplate("Doc","test/postDocObject.comb");

  Hop.addBeforeTemplate("Doc","test/preDocHop.comb");
  Hop.addAfterTemplate("Doc","test/postDocHop.comb");

  var test = new Hop.TestCase(name,onTest);
}

/**
  Used to impelement the .do interface for defineTest
 
  so .do("MyClass.myFunc") is implemented by this class 

  @param {string} funcName The name of the function this test should call
  
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
  

  @param {Mixed} inputValue The input value to use. Can be an object or string
  @param {Object} extend The object to extend the input value with. Can be an object or string
  
  @chainable
  @method with
**/
Hop.TestTask.prototype.with=function(){
  var args = Array.prototype.slice.call(arguments,0);

  var containsValue=false;
  for(var i in args){
    if(typeof args[i] == "string")
      containsValue=true;
  }

  if(!containsValue){
    var obj = args[0];
    for(var i=1;i<args.length;i++){
      obj = Hop.TestUtils.extendTo(obj,args[i]);
    }
    this.inputObject=obj;
  } else {
    this.inputObjectFunc="function(){"+
      "var args = "+JSON.stringify(args)+";"+
      "var obj = args[0];"+
      "if(typeof obj=='string'){ obj = Hop.TestUtils.loadValue(obj); }"+
      "for(var i=1;i<args.length;i++){"+
        "if(typeof obj=='string'){ obj = Hop.TestUtils.loadValue(obj); }"+
        "if(typeof args[i]=='string'){ args[i] = Hop.TestUtils.loadValue(args[i]); }"+
        "obj = Hop.TestUtils.extendTo(obj,args[i]);"+
      "}"+
      "return obj;"+
    "}";
  }

  return this;
}

/**
  Save the output into a name variable for usage later

  @param {string} name The name of the value to save

  @chainable
  @method saveOutputAs
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

  @param {String} value The name of the property in the output

  @chainable
  @method outputPropertyChanged
**/
Hop.TestTask.outputPropertyChanged={ pass:"The property changed as expected", fail: "The output property didn't change as expected" };
Hop.TestTask.prototype.outputPropertyChanged=function(value){
  var testFunc=function(input,err,output,value){ return (err==null && input!=null && output!=null && Hop.TestUtils.getProperty(input,value)!=Hop.TestUtils.getProperty(output,value));  }
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
  var testFunc=function(input,err,output){ return Hop.TestUtils.objectCovers(input,output);  }
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
  Test to insure that the output does not contain a specific object

  This test will insure that the output does not contain a specific object 

  @param {Object} value The object that shouldn't appear in the output

  @chainable
  @method outputDoesntContain
**/
Hop.TestTask.outputDoesntContain={ pass:"The output does not contain the specified value", fail: "The output contained the specified value" };
Hop.TestTask.prototype.outputDoesntContain=function(value){
  var testFunc=function(input,err,output,value){ value=Hop.TestUtils.resolve(value,true); return (output!=null && !Hop.TestUtils.objectCovers(value,output)); }; 
  this.test.push({ type:"outputDoesntContain", value: value, testFunc: testFunc.toString()  });
  return this;
}

/**
  Test to insure that the output contains a specific object

  This test will insure that the output is a superset of the specified object

  @param {Object} value The object to compare the output to

  @chainable
  @method outputContains
**/
Hop.TestTask.outputContains={ pass:"The output contains the expected value", fail: "The output did not contain the expected value, or was null" };
Hop.TestTask.prototype.outputContains=function(value){
  var testFunc=function(input,err,output,value){ value=Hop.TestUtils.resolve(value,true); return (output!=null && Hop.TestUtils.objectCovers(value,output)); }; 
  this.test.push({ type:"outputContains", value: value, testFunc: testFunc.toString()  });
  return this;
}

/**
  Insure that an error exists

  *This will also test to insure the output is null*

  @chainable
  @method hasError 
**/
Hop.TestTask.hasError={ pass:"An error was detected", fail: "An error was not detected" };
Hop.TestTask.prototype.hasError=function(){
  var testFunc=function(input,err,output){ return (err!=null && output==null); }  
  this.test.push({ type:"hasError", testFunc:testFunc.toString() });
  return this;
}

/**
  Insure the error contains a specific string

  *This will also test to insure the output is null*

  @param {String} value The string to insure the error contains

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

  @param {String} property The name of the property

  @chainable
  @method outputHasProperty

**/
Hop.TestTask.outputHasProperty={ pass:"The output had the expected property", fail: "The output did not have the expected property, or an error occured" };
Hop.TestTask.prototype.outputHasProperty=function(value){
  var testFunc=function(input,err,output,value){ return (err==null && output!=null && Hop.TestUtils.outputHasProperty(output,value)); }  
  this.test.push({ type:"outputHasProperty", value: value, testFunc:testFunc.toString() });
  return this;
}

/**
  Test the output to make sure it is the same as the specified object or saved object
  
  @example
    Test.do("User.save").with(user).outputSameAs({ name:'foo', email:'bar@bar.com'});
    Test.do("User.save").with(user).outputSameAs("#{savedUser}");
    Test.do("User.save").with(user).outputSameAs("#{savedUsers[1]}");

  @param {String} savedValue The name of the saved result

  @chainable
  @method outputSameAs
**/
Hop.TestTask.outputSameAs={ pass:"The output was the same as expected", fail: "The output was not the same as expected" };
Hop.TestTask.prototype.outputSameAs=function(value){
  var testFunc=function(input,err,output,value){ var value = Hop.TestUtils.resolve(value,true);  return (err==null && Hop.TestUtils.objectCovers(value,output));  }  
  this.test.push({ type:"outputSameAs", value: value, testFunc:testFunc.toString() });
  return this;
}

/**
  Test the output to make sure it an array with a maximum length 
  
  @param {String} length The maximum length of the array

  @chainable
  @method outputIsArrayWithMaxLength
**/
Hop.TestTask.outputIsArrayWithMaxLength={ pass:"The output was an array with expected length", fail: "The output was not an array with the expected length, or an error occured" };
Hop.TestTask.prototype.outputIsArrayWithMaxLength=function(value){
  var testFunc=function(input,err,output,value){ return (output instanceof Array && err==null && output.length<=Hop.TestUtils.resolve(value,true));  }  
  this.test.push({ type:"outputIsArrayWithMaxLength", value: value, testFunc:testFunc.toString() });
  return this;
}

/**
  Test the output to make sure it an array with a minimum length 
  
  @param {String} length The minimum length of the array

  @chainable
  @method outputIsArrayWithMinLength
**/
Hop.TestTask.outputIsArrayWithMinLength={ pass:"The output was an array with expected length", fail: "The output was not an array with the expected length, or an error occured" };
Hop.TestTask.prototype.outputIsArrayWithMinLength=function(value){
  var testFunc=function(input,err,output,value){ return (output instanceof Array && err==null && output.length>=Hop.TestUtils.resolve(value,true));  }  
  this.test.push({ type:"outputIsArrayWithMinLength", value: value, testFunc:testFunc.toString() });
  return this;
}

/**
  Test the output to make sure it an array with a specified length
  
  @param {String} length The length of the array

  @chainable
  @method outputIsArrayWithLength
**/
Hop.TestTask.outputIsArrayWithLength={ pass:"The output was an array with expected length", fail: "The output was not an array with the expected length, or an error occured" };
Hop.TestTask.prototype.outputIsArrayWithLength=function(value){
  var testFunc=function(input,err,output,value){ return (output instanceof Array && err==null && output.length==Hop.TestUtils.resolve(value,true));  }  
  this.test.push({ type:"outputIsArrayWithLength", value: value, testFunc:testFunc.toString() });
  return this;
}

/**
  Test the output to make sure it is an array
  
  @chainable
  @method outputIsArray
**/
Hop.TestTask.outputIsArray={ pass:"The output was an array", fail: "The output was not an array, or an error occured" };
Hop.TestTask.prototype.outputIsArray=function(value){
  var testFunc=function(input,err,output,value){ return (output instanceof Array && err==null);  }  
  this.test.push({ type:"outputIsArray", value: value, testFunc:testFunc.toString() });
  return this;
}

/**
  Test the output array contains
  
  @chainable
  @method outputArrayContains
**/
Hop.TestTask.outputArrayContains={ pass:"The output array contained the specified value", fail: "The output array did not contain the specified value, or an error occured" };
Hop.TestTask.prototype.outputArrayContains=function(value){
  var testFunc=function(input,err,output,value){ if(output instanceof Array && err==null){ value = Hop.TestUtils.resolve(value,true); return Hop.TestUtils.arrayContains(output,value); } else return false;  }  
  this.test.push({ type:"outputArrayContains", value: value, testFunc:testFunc.toString() });
  return this;
}

Hop.TestTask.arrayContains={ pass: "The array contains the specified value", fail:"The array does not contain the specified value, or an error occured" };
Hop.TestTask.prototype.arrayContains=function(property,tv){
  var value = { property: property, tv: tv };
  var testFunc=function(input,err,output,value){ if(output){ var p = Hop.TestUtils.getProperty(output,value.property); if(p instanceof Array) { var v = Hop.TestUtils.resolve(value.tv,true); return Hop.TestUtils.arrayContains(p,v); }} return false; }
  this.test.push({ type:"arrayContains", value: value, testFunc: testFunc.toString() });
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


  @param {String} name The name of the test case, this must always start with the name of a defined method, but may also include a description seperated by a ':'
  @param {Function} onTest The function defining the test case

  @class Hop.TestCase
  @constructor
**/
Hop.TestCase=function(name,onTest){
  this.name=name;
  this.uses=[];
  this.tasks=[];
  onTest(this);  
  Hop.TestCases[name]=this;
}

/**
  Create a special object to instruct Hop to use a file provide by a URL as a test input value

  @param {String} url url to fetch file from (this should be a url on the local server)

  @static
  @method fileFromURL
**/
Hop.TestCase.prototype.fileFromURL=function(url){
  return { _fileFromURL: url };
}

Hop.TestCase.standAloneSupport=function(options){
  return Hop.renderTemplate("test/standalone.comb")({ Hop: Hop, supportCode:true });
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

Hop.TestCase.prototype.use=function(urlOrService){
  this.uses.push(urlOrService);
  return null;
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


