/**
  Testing module

  @module Hop
  @submodule Test
**/
var Hop = require('./api');
var assert = require('assert');
var Workflow = require('hopjs-workflow');

if(process.env.NODE_ENV!="production"){
  Hop.enableUnitTests=true;
}

Hop.TestCases={};

/**
  Holds testing utility functions

  *All of the functions in this class must be usable with (function).toString() for embedding*

  @class Hop.TestUtils
**/

Hop.defineTestCase=function(name,onScript){
  Hop.addBeforeTemplate("Doc","test/preDocHop.comb");
  Hop.addAfterTemplate("Doc","test/postDocHop.comb");

  var method;

  if(name.indexOf(":")!=-1){
    method=name.split(":")[0];
    method = Hop.Method.findMethod(method);
  }  else {
    method = Hop.Method.findMethod(name);
  }
  if(method){
    method.addAfterTemplate("Doc","test/postDocMethod.comb");
  }

  var test = new Workflow.Script(name);
  onScript(test);
  Hop.TestCases[name]=test;
  return test;
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
  },
  exit:function(input,onComplete){
    setTimeout(function(){
      process.exit(-1);
    },500);
    return onComplete(null,true);
  }
}

if(Hop.enableUnitTests){
  Hop.defineClass("TestService",Hop.TestService,function(api){
    api.get("wait","/hopjs/test/wait").demand("duration");
    api.get("log","/hopjs/test/log").demand("msg");
    api.get("exit","/hopjs/test/exit");
  });
}




