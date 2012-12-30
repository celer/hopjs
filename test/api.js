var assert = require('assert');
require('should');
var Hop = require('../index');

var TestObj=function(){

}

TestObj.prototype.interfaceFunc=function(input,onComplete){
  return onComplete(null,input);
}

TestObj.prototype.getFunc=function(input,onComplete){
  input.type="get";
  return onComplete(null,input);
}

TestObj.prototype.postFunc=function(input,onComplete){
  input.type="post";
  return onComplete(null,input);
}

TestObj.prototype.delFunc=function(input,onComplete){
  input.type="del";
  return onComplete(null,input);
}

TestObj.prototype.putFunc=function(input,onComplete){
  input.type="put";
  return onComplete(null,input);
}


Hop.defineInterface("TestInterface",function(api){
  api.get("interfaceFunc","/interfaceFunc").demand("id");
});

Hop.defineClass("TestObj",new TestObj(),function(api){
  api.extend("TestInterface");
  api.get("getFunc","/getFunc").demand("id");
  api.put("putFunc","/putFunc").demand("id");
  api.post("postFunc","/postFunc").demand("id");
  api.del("delFunc","/delFunc").demand("id");
});

describe("API",function(){
  it("should define functions from the interface",function(done){
    var testObj = Hop.Object.wrap("TestObj");

    testObj.interfaceFunc({ id:2},function(err,res){
      assert.equal(res.id,2);
      done();
    });
      
  });
  it("should honor demand options for the interface",function(done){
    var testObj = Hop.Object.wrap("TestObj");
    
    try { 
            testObj.interfaceFunc({},function(err,res){
              console.log(assert);
            
            });
    } catch(e){
      assert.equal(e,"Missing required parameter:id");
      done();
    }
  });
  it("should define get methods",function(done){
    var testObj = Hop.Object.wrap("TestObj");

    testObj.getFunc({ id:7},function(err,res){
      assert.equal(res.id,7);
      assert.equal(res.type,"get");
      done();
    }); 

  });   
  it("should define put methods",function(done){
    var testObj = Hop.Object.wrap("TestObj");

    testObj.putFunc({ id:7},function(err,res){
      assert.equal(res.id,7);
      assert.equal(res.type,"put");
      done();
    }); 

  });   
  it("should define post methods",function(done){
    var testObj = Hop.Object.wrap("TestObj");

    testObj.postFunc({ id:7},function(err,res){
      assert.equal(res.id,7);
      assert.equal(res.type,"post");
      done();
    }); 

  });   
  it("should define del methods",function(done){
    var testObj = Hop.Object.wrap("TestObj");

    testObj.delFunc({ id:7},function(err,res){
      assert.equal(res.id,7);
      assert.equal(res.type,"del");
      done();
    }); 

  });   


});
