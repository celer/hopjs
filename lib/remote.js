/*
  @class Hop
*/
var Hop = require('./api');
var path = require('path');
var ahr2 = require('ahr2');
var url = require('url');
var cookie = require('cookie');

var cookies={};

var saveCookie=function(cookie){
  var opts=["path","max-age","expires","httponly","secure"];
  for(var i in cookie){
    if(i!='' && i.length>0  && opts.indexOf(i.toLowerCase())==-1){
      cookies[i]=cookie;
    }
  } 
}

//FIXME need to find a better solution for supporting cookies
var getCookies=function(){
  return (Object.keys(cookies).map(function(item){
    var c = cookies[item];
    return cookie.serialize(item,c[item],c);
  }).join(";"));
} 


var ahr2ResponseHandler=function(err,ahr,data,onComplete){
    if(ahr.headers['set-cookie']){
      for(var i in ahr.headers['set-cookie']){
        var c=cookie.parse(ahr.headers['set-cookie'][i]);
        saveCookie(c);
      }
    } 
 
    if(err!=undefined){
      if(ahr.statusCode=="404") return onComplete(null,null);
      else if(data) return onComplete(data.toString());
      else return onComplete(err,data);
    } else {
      return onComplete(err,data);
    } 
}

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
                        return onComplete("Missing parameter '"+paramName+"'");
                    }
                    _path= _path.replace(":"+paramName,input[paramName]);
                  }     
              
                  if(method.method!="post" && method.method!="put"){
                          var options = { headers:{ 'Cookie': getCookies() } }
                          console.log(method.method);
                          ahr2[method.method](_path,input,options).when(function(err,ahr,data){
                            ahr2ResponseHandler(err,ahr,data,onComplete);
                          }) 
                  } else {
                          var options = { headers:{ 'Cookie': getCookies() } }

                          console.log(method.method);
                          ahr2[method.method](_path,{},input,options).when(function(err,ahr,data){
                            ahr2ResponseHandler(err,ahr,data,onComplete);
                          }) 

                  }
                };

      
        })(objName,methodName);
      }
    }
    onComplete(null,api);    

  }); 
}


Hop.remoteAPITestHarness=function(_url,onComplete){
  if(!(/.*\/apitest.js/.test(_url))){
    var _u = url.parse(_url);
    _url = _u.protocol+"//"+_u.host+"/_hopjs/apitest.js";
  }

  ahr2.get(_url).when(function(err,ahr,data){

    if(err) return onComplete(err);
    if(!data) return onComplete("Invalid url"); 
    
    onComplete(null,data.toString());    

  }); 
}

Hop.remoteAPITest=function(_url,onComplete){
  if(!(/.*\/apitest.json/.test(_url))){
    var _u = url.parse(_url);
    _url = _u.protocol+"//"+_u.host+"/_hopjs/apitest.json";
  }

  ahr2.get(_url).when(function(err,ahr,data){

    if(err) return onComplete(err);
    if(!data) return onComplete("Invalid url"); 
    
    onComplete(null,data);    

  }); 
}

