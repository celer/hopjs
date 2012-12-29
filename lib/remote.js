/*
  @class Hop
*/
var Hop = require('./api');
var path = require('path');
var ahr2 = require('ahr2');
var url = require('url');

/**
  Use a remote URL to instantiate a client side Javascript implementation of the API

  @param {String} _url 
    The URL to use, this can be either the base URL for the website or api.json
  @param {Function} onComplete(err,api) 
    The call back which will return an error or the API 

  @method Hop.remoteAPI
  @static
*/
Hop.remoteAPI=function(_url,onComplete){
  if(!(/.*\/api.json/.test(_url))){
    var _u = url.parse(_url);
    _url = _u.protocol+"//"+_u.host+"/_hopjs/api.json";
  }

  ahr2.get(_url).when(function(err,ahr,data){

    if(err) return onComplete(err);
    if(!data) return onComplete("Invalid _url"); 
    
    var api = {};

    api._json=data;

    for(var objName in data.Objects){
      api[objName]={};

      for(var methodName in data.Objects[objName].methods){
        (function(objName,methodName){
                var method = data.Objects[objName].methods[methodName];
                
                api[objName][methodName]=function(input,onComplete,request){
                  var _u = url.parse(_url);
                  var _path = path.join(data.basePath,method.path);
                  _path = _u.protocol+"//"+_u.host+_path;
            
                  for(var paramName in method.params){
                    if(method.params[paramName].demand){
                      if(!input || !input[paramName])
                        throw "Missing parameter '"+paramName+"'";
                    }
                    _path= _path.replace(":"+paramName,input[paramName]);
                  }     
              
                  if(method.method!="post" && method.method!="put"){
                          ahr2[method.method](_path,input).when(function(err,ahr,data){
                            onComplete(err,data);
                          }) 
                  } else {
                          ahr2[method.method](_path,{},input).when(function(err,ahr,data){
                            onComplete(err,data);
                          }) 

                  }
                };

      
        })(objName,methodName);
      }
    }
    onComplete(null,api);    

  }); 
}


Hop.remoteAPITest=function(_url,onComplete){
  if(!(/.*\/apitest.json/.test(_url))){
    var _u = url.parse(_url);
    _url = _u.protocol+"//"+_u.host+"/_hopjs/apitest.json";
  }

  ahr2.get(_url).when(function(err,ahr,data){

    if(err) return onComplete(err);
    if(!data) return onComplete("Invalid _url"); 
    
    onComplete(null,data);    

  }); 
}

