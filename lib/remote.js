/**
	Client side remote API utilities

  @module Hop
	@submodule Remote
**/
var Hop = require('./api');
var path = require('path');
var request = require('request');
var querystring = require('querystring');
var url = require('url');
var fs = require('fs');
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


var responseHandler=function(err,ahr,data,onComplete){
    /*
		if(ahr && ahr.headers && ahr.headers['set-cookie']){
      for(var i in ahr.headers['set-cookie']){
        var c=cookie.parse(ahr.headers['set-cookie'][i]);
        saveCookie(c);
      }
    } */
   	if(ahr.statusCode=="404") return onComplete(null,null);
   	if(ahr.statusCode*1 >= 400) return onComplete(data,null);
		if(err){  
      return onComplete(err,null);
    } else {
      return onComplete(null,data);
    } 
}

/**
  Use a remote URL to instantiate a client side Javascript implementation of the API

  @param {String} _url 
    The URL to use, this can be either the base URL for the website or api.json
  @param {Function} onComplete(err,api) 
    The call back which will return an error or the API 
	@param {Object} options
		@param  options.ignoreDemands - do not check for missing parameters before calling the API

  @method Hop.remoteAPI
  @static
*/
Hop.remoteAPI=function(_url,onComplete,options){
	options=options||{};

  if(!(/.*\/api.json/.test(_url))){
    var _u = url.parse(_url);
    _url = _u.protocol+"//"+_u.host+"/_hopjs/api.json";
  }

  request.get(_url,{ json:true },function(err,ahr,data){


    if(err) return onComplete(err);
    if(!data) return onComplete("Invalid _url"); 
		
    
    var api = {};

    api._json=data;
    for(var objName in data.Objects){
      api[objName]={};
      for(var methodName in data.Objects[objName].methods){
        (function(objName,methodName,apiOptions){
                var method = data.Objects[objName].methods[methodName];
               
                api[objName][methodName]=function(input,onComplete,req){
									input=input||{};
                  var _u = url.parse(_url);
                  var _path = path.join(data.basePath,method.fullPath);
					
                  _path = _u.protocol+"//"+_u.host+_path;
									
           
									var _input={};	
 
                  for(var paramName in method.params){
										if(apiOptions.ignoreDemands!==true){
											if(method.params[paramName].demand){
												if(!input || typeof input[paramName]=="undefined")
													return onComplete("Missing parameter '"+paramName+"'");
											}
										}
										if(_path.indexOf(":"+paramName)!=-1){
                    	_path= _path.replace(":"+paramName,input[paramName]);
										} else {
											if(typeof input[paramName]=="object" && input[paramName]._fileFromURL){
												var _fileFromUrl = url.parse(input[paramName]._fileFromURL);
												if(!_fileFromUrl.host) _fileFromUrl.host = _u.host;
												if(!_fileFromUrl.protocol) _fileFromUrl.protocol = _u.protocol;
												var _fu = url.format(_fileFromUrl);
												_input[paramName]=request(_fu);
											} else {		
												if(typeof input[paramName]!="undefined"){
													_input[paramName]=input[paramName];
												}
											}
										}	
                  }     
            			//console.log(_input); 
                  if(method.method=="get" || method.method=="delete"){
													var query = querystring.stringify(_input);
                          request({ uri: _path+"?"+query, method: method.method, json:true}, function(err,ahr,data){
                            responseHandler(err,ahr,data,onComplete);
                          }) 
                  } else {
													var r = request({uri: _path, method: method.method, json:true, callback: function(err,ahr,data){
                            responseHandler(err,ahr,data,onComplete);
													} });
													var form = r.form();
													for(var i in _input){
														form.append(i,_input[i]);
													}

                  }
                };

      
        })(objName,methodName,options);
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

  request.get(_url,function(err,ahr,data){

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

  request.get(_url,function(err,ahr,data){

    if(err) return onComplete(err);
    if(!data) return onComplete("Invalid url"); 
    
    onComplete(null,data);    

  }); 
}

