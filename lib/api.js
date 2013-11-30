/**
  Hop Core module

  This is the primary impelementation behind Hop

  @module Hop
**/
var crypto = require('crypto');
var util = require('hopjs-common');
var url = require('url');

/*
  - display docs
  - enable unit tests
  - log functions
  - protect docs /w password
  - site name
  - readme.md
  - doc.css
  - 
*/

var Hop=function(){
  this.objects={};
  this.interfaces={};
}

Hop.use=function(what){
  what(Hop);
}

Hop.log=console.log;
Hop.error=console.error;
Hop.warn=console.warn;

/**
   Given a string representation of a stack for a trace made during a call, return a more focused stack trace

  This function will attempt to cull a larger stack trace into something more relevant for what went on during
  a call. 

  @param {String} errorStack a stack trace captured from an error

  @returns stack a focused stack trace

*/
Hop.callStack=function(errorStack){
    var lines = errorStack.split("\n");
    var stack=[];
    var capture=false;
    for(var i=lines.length-1;i>0;i--){
      var l = lines[i];
      var f = (l.replace(/^\s+at\s+([^ ]+).+/,"$1"));
      if(f=="Hop_call_preTask"){
        capture=true;
      }
      if(f=="Hop_call_postTask"){
        capture=false;
      }  
      if(capture==true && f.indexOf("Hop_call")!=0){
        stack.push(l);
      } 
    }  
    return stack.join("\n");
}

Hop.logCall=function(method,type,err,result){
  var error = new Error();
  var stack = Hop.callStack(error.stack);
  Hop[type](method,err+"\n"+stack);
}


Hop.sendFile=function(file,options){
  return new Hop.File(file,options);
}

Hop.sendAttachment=function(file,options){
  options=options||{};
  options.attachment=true;  
  return new Hop.File(file,options);
}

Hop.href=function(method,input){
  this.method=Hop.Method.findMethod(method);
  if(!this.method){
    throw new Error("Invalid method specified:"+this.method);
  } 
  if(this.method.method!="get")
    throw new Error("Hop.href used to call a method which was not a GET");
  this.input=input;
}

Hop.href.prototype.call=function(onComplete,request,response){
  Hop.call(this.method.getMethod(),this.input,onComplete,request,response);
}


Hop.href.prototype.toJSON=function(){
  var path = this.method.getPath();
  var q = "";
  for(var i in this.input){
    if(path.indexOf(":"+i)!=-1){
      path=path.replace(":"+i,this.input[i]);
    } else if(this.method.params[i]){
      if(q.length>0){
        q+="&";
      }
      if(this.input[i] instanceof Array){
        this.input[i].map(function(e){
          if(q.length>0){
            q+="&";
          }
          q+=i+"="+encodeURI(e) 
        });
      } else {
        q+=i+"="+encodeURI(this.input[i])
      }
    }
  }
  if(q==""){
  } else {
    path=path+"?"+q;
  }
  if(Hop._host){
    return url.resolve("http://"+Hop._host+"/",path); 
  } else return path;
}

Hop.href.prototype.toString=Hop.href.prototype.toJSON;

Hop.render=function(template,input){
  return new Hop.Template(template,input);
}

Hop.Template=function(templateName,input){
  this.template=templateName;
  this.input=input;
}

Hop.Template.prototype.send=function(response){
  response.render(this.template,this.input);
}

Hop.File=function(file,options){
  this.file=file;
  this.options=options||{};
}

Hop.File.prototype.send=function(response){
  var filename = this.file || this.options.filename;
  if(this.options.attachment==true)
    response.download(this.file,filename);
  else
    response.sendfile(this.file);
}

Hop.redirect=function(url,options){
  return new Hop.Redirect(url,options);
}

Hop.Redirect=function(url,options){
  this.url=url;
  this.options=options;
}

Hop.Redirect.prototype.send=function(response){
  if(this.options && this.options.noCache){
    response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
    response.setHeader("Pragma","no-cache"); // HTTP 1.0.
    response.setHeader("Expires","0"); // Proxies.
  }
  response.redirect(this.url);
}


Hop.Objects={};
Hop.Interfaces={};


/**
  Calculate a checksum for the Hop 

  This is used to detect changes in the version of the Hop

  @for Hop
  @method checksum
  @static
**/
Hop.checksum = function(){
  if(Hop._checksum)
    return Hop._checksum;
  var md5 = crypto.createHash('md5');  
  md5.update(Hop.toJSON(true));

  Hop._checksum = md5.digest('hex');
  return Hop._checksum;
}

/**
  Utility class for providing mock response objects

  @class Hop.StubResponse
**/
Hop.StubResponse=function(){
  this.header={};
}

Hop.StubResponse.prototype.set=function(name,value){
  this.header[name]=value;
}

Hop.StubResponse.prototype.get=function(name){
  return this.header[name];
}


/**
  Utility class for providing mock request objects

  @class Hop.StubRequest
**/
Hop.StubRequest=function(){
  this.header={};
  this.response = new Hop.StubResponse();
  this.session={};
}

Hop.StubRequest.prototype.getResponse=function(){
  return this.response;
}

Hop.StubRequest.prototype.set=function(name,value){
  this.header[name]=value;
}

Hop.StubRequest.prototype.get=function(name){
  return this.header[name];
}


Hop.getTemplates=function(obj,when,type){
  if(!obj._templates)
    return null;
  if(!obj._templates[type])
    return null;
  if(!obj._templates[type][when])
    return null;
  return obj._templates[type][when];
}

Hop.renderTemplates=function(obj,when,type,input){
  try {
    if(!obj._templates)
      return "";
    if(!obj._templates[type])
      return "";
    if(!obj._templates[type][when])
      return "";
  

    var _input={};
    for(var i in input){
      _input[i]=input[i];
    }
    _input.Hop=Hop;
  
    var out = "";
    obj._templates[type][when].map(function(template){
      out+=(Hop.renderTemplate(template)(_input));
    });
    return out;
  } catch(e){ 
    console.error(e);
    console.error(e.stack);
  }
}

Hop.addTemplate=function(obj,when,type,template){
  if(!obj._templates)
    obj._templates={};
  if(!obj._templates[type])
    obj._templates[type]={};
  if(!obj._templates[type][when])
    obj._templates[type][when]=[];
  if(obj._templates[type][when].indexOf(template)==-1){
    obj._templates[type][when].push(template);
  }
}

Hop.renderBeforeTemplates=function(type,input){
  return Hop.renderTemplates(Hop,"before",type,input);
}  
Hop.renderAfterTemplates=function(type,input){
  return Hop.renderTemplates(Hop,"after",type,input);
}  

Hop.getBeforeTemplates=function(type){
  return Hop.getTemplates(Hop,"before",type);
}  

Hop.getAfterTemplates=function(type){
  return Hop.getTemplates(Hop,"after",type);
}  

Hop.addBeforeTemplate=function(type,template){
  Hop.addTemplate(Hop,"before",type,template);
}

Hop.addAfterTemplate=function(type,template){
  Hop.addTemplate(Hop,"after",type,template);
}


/**
Define a new class 

* Use #classname to have the class name substituted into the URL

@param {string} name the name of the class
@param {object} [instance] an instance of the object
@param {function} onDefine the lambda used to define the interface

@example
  Hop.defineClass("Email",new Email(),function(api){
    //define the class 
  });


@for Hop
@method defineClass
@static
**/
Hop.defineClass=function(name,instance,onDefine){
  delete Hop._checksum;
  var api = new Hop.Object(name,instance);
  api.setLocalInterface();
  onDefine(api);
}

/**
Define a new interface

* Use #classname to have the class name substituted into the URL

@param {string} name the name of the interface
@param {function} onDefine the lambda used to define the interface

@example
  Hop.defineInterface("Notification",function(api){
    api.post("send","#classname/send").usage("Sends a message").demand("msg").demand("subject").demand("to");
  }


@for Hop
@method defineInterface 
@static
**/
Hop.defineInterface=function(name,onDefine){
  delete Hop._checksum;
  var intf = new Hop.Interface(name,onDefine);
}

Hop.toJSON=function(noChecksum){
    var obj = {};

    obj.Objects=Hop.Objects;
    obj.basePath = Hop.basePath;
    if(noChecksum!=true)
      obj.checksum = Hop.checksum();


    for(var i in this._toJSONHandler){
      var handler = this._toJSONHandler[i];
      handler(obj);  
    }  

    return JSON.stringify(obj,function(key,value){
        if(/^_/.test(key)){
          return undefined;
        } 
        return value;
    }," ");
}

Hop.fromJSON=function(jsonString){
  if(typeof jsonString=="object")
    var obj = jsonString;
  else if(typeof jsonString=="string")
    var obj = JSON.parse(jsonString);

  
  if(obj.Objects){
    for(var objectName in obj.Objects){
      var _object = obj.Objects[objectName];
      var object = new Hop.Object(objectName);
        
      for(var j in _object){
        object[j]=_object[j];
      }
      for(var methodName in obj.Objects[i].methods){
        var _method = obj.Objects[i].methods[methodName];
        var method = new Hop.Method(_method.method,object,_method.name,_method.path);
        object[_method.name]=method;
        
        for(var j in _method){
          method[j]=_method[j];
        }


      }
    }
  }
  
}


/**
  Add a call back which will be called when a version of the API must be built from JSON

  @param {function} onJSON Callback to be called when a json version of Hop is requested
    @param {object} The stub object which is being populated for conversion to JSON

  @for Hop
  @method addToJSONHandler
  @static
**/
Hop.addToJSONHandler=function(onJSON){
  if(!this._fromJSONHandler){
    this._fromJSONHandler=[];
  }
  this._fromJSONHandler.push(onJSON);
}

/**
  Add a call back which will be called when a JSON version of the API is requested

  @param {function} onJSON Callback to be called when a json version of Hop is requested
    @param {object} The stub object which is being populated for conversion to JSON

  @for Hop
  @method addToJSONHandler
  @static
**/
Hop.addToJSONHandler=function(onJSON){
  if(!this._toJSONHandler){
    this._toJSONHandler=[];
  }
  this._toJSONHandler.push(onJSON);
}


Hop.Interface = function(name,onDefine){
  this.onDefine=onDefine;
  this.name=name;
  Hop.Interfaces[name]=this;
}

/** 
  Defines an object

  This object is created by .defineClass

  @class Hop.Object
**/
Hop.Object = function(name,instance){
  this.name=name;
  this._instance=instance;
  this.methods={};
  Hop.Objects[name]=this;
}

/**
  Wrap an object so that it may be called localy with all of the functionality that Hop normally provides

  This function will create a wrapped version of a defined object with all of the functionality that Hop would normally provide. 

  @example
    Hop.defineClass("UserService",function(api){
      api.get("load","/user/:userID").demand("userID").cacheId("/user/:userID");
    });

    var userService = Hop.Object.wrap("UserService");

    //This call will now be subject to all of the normal constraints and functionality provided by Hop
    userService.load({ userID:5 },function(err,result){

    },request);

  @param {String} objectName Then name of the object to wrap


  @returns {Object} 
    An object with implementations of all the functions defined by the object. 
    The returned functions will have the calling signature (input,onComplete,request)


  @method Hop.Object.wrap
**/
Hop.Object.wrap=function(objectName){
  var result = {};

  var obj = Hop.Object.findObject(objectName);
  if(obj){
    for(var i in obj.methods){
      var method = obj.methods[i];
      (function(method){
        result[method.name]=function(input,onComplete,request,response){
          Hop.log(method.getMethod(),input,onComplete,request,response);
          Hop.call(method.getMethod(),input,onComplete,request,response);
        };  
      })(method);
    }  
  } else throw "Invalid object name specified";
  return result;
}



Hop.Object.prototype.callOnError=function(method,request,input,error,stack){
  if(!stack){
    var exp = new Error();
    var stack = Hop.callStack(exp.stack);
  } else {
    stack = Hop.callStack(stack);
  }
  if(this.onError){
    var res = this.onError(method,request,input,error,stack);
    if(res!==null)
      return res;
  }
  Hop.error(method.getMethod(),":returned an error result of '"+error+"'\n"+stack);
  return error;
}

/**
  Provide a function that will be called when an error occured for any call in the class

  This function can be used to filter error messages. A typical use case would be to have a small
  set of allowed error messages, and return a generic error message in all other cases. Or to attach 
  a unique number to each error and provide details in the console log. This function should return a string 
  for the desired error string or null if no custom error is returned. This function is not asynchronous.

  @param {Function} onError function to be called when an error has occured
    @param {Object} onError.method The method call associated with the error
    @param {Object} onError.request The request for the call
    @param {Object} onError.input The input for the call
    @param {String} onError.error The error string
    @param {String} onError.stack A stack trace of where the error occured
  

  @example
    Hop.defineClass("UserService",function(api){
      api.post("update","/user/:userID");
      
      api.errorHandler(function(method,request,input,error,stack){
        //If we know what the error is simply return it
        if(allowedErrors.contains(error)){
          return null;
        } else {
          //If we don't recognize the error produce a unique ID for it and spit it out in the logs
          var id = Date.now();
          var err = "Error ("+id+")";
          Log.error(method.getName(),request,input,id,error,stack);
          return err;
        }
      });
    });
  
  @for Hop.Object
  @method errorHandler
 */
Hop.Object.prototype.errorHandler=function(onError){
  this.onError=onError;
}

Hop.Object.prototype.setLocalInterface=function(){
  this._localInterface=true;
}

Hop.Object.prototype.isLocalInterface=function(){
  return this._localInteraface===true;
}

Hop.Object.prototype.renderBeforeTemplates=function(type,input){
  return Hop.renderTemplates(this,"before",type,input);
}  
Hop.Object.prototype.renderAfterTemplates=function(type,input){
  return Hop.renderTemplates(this,"after",type,input);
}  

Hop.Object.prototype.getBeforeTemplates=function(type){
  return Hop.getTemplates(this,"before",type);
}  

Hop.Object.prototype.getAfterTemplates=function(type){
  return Hop.getTemplates(this,"after",type);
}  


Hop.Object.prototype.addBeforeTemplate=function(type,template){
  Hop.addTemplate(this,type,"before",type,template);
}

Hop.Object.prototype.addAfterTemplate=function(type,template){
  Hop.addTemplate(this,type,"after",type,template);
}


/**
Have this object extend from an interface

@example
  Hop.defineInterface("Notification",function(api){
    api.post("send","#classname/send").usage("Sends a message").demand("msg").demand("subject").demand("to");
  }
  Hop.defineClass("Email",function(api){
    //This will essentially evaluate the interface defined above against thsi class adding the send function
    api.extend("Notification");
  });

@for Hop.Object
@method extend
**/
Hop.Object.prototype.extend=function(intf){
  if(!this.interfaces){
    this.interfaces={};
  }
  this.interfaces[intf]=true;
  if(Hop.Interfaces[intf]){
    Hop.Interfaces[intf].onDefine(this);  
  } else throw ("Invalid interface specified:"+intf);
}

/**
Perform a modification to all methods defined on a class within the specified lamda

@example
  Hop.defineClass("UserService",function(api){
    api.each(function(api){
      api.get("load","/user/:userID");
      api.del("del","/user/:userID");
    },function(method){
      method.demand("userId","The user ID");
      method.requireUser();
    }); 
  });

@for Hop.Object
@method each
**/
Hop.Object.prototype.each=function(onDefine,onMethod){
  var self = this;
  var methods = [];
  var proxy = { 
    get: function(){ var ret = self.get.apply(self,arguments); methods.push(ret); return ret;},
    post: function(){ var ret = self.post.apply(self,arguments); methods.push(ret); return ret;},
    put: function(){ var ret = self.put.apply(self,arguments); methods.push(ret); return ret;},
    del: function(){ var ret = self.del.apply(self,arguments); methods.push(ret); return ret;},
    create: function(){ var ret = self.create.apply(self,arguments); methods.push(ret); return ret;},
    read: function(){ var ret = self.read.apply(self,arguments); methods.push(ret); return ret;},
    update: function(){ var ret = self.update.apply(self,arguments); methods.push(ret); return ret;},
    list: function(){ var ret = self.list.apply(self,arguments); methods.push(ret); return ret;},
  }
  onDefine(proxy);
  methods.map(function(method){
    onMethod(method);
  }); 
}  

/**
  Expand any href's found in the result
*/  
Hop.postCallExpand=function(method,name){
  var self = method;
  return function(req,input,err,result,next,response){
    Hop.log("PCE",input,err,result);
    if(result && !err){
      var thisInput = JSON.parse(JSON.stringify(input));
      if(!result.href)
        result.href = new Hop.href(self.methods[name].getMethod(),thisInput);
      var expands=[];
      if(typeof input.expand=="string"){
        expands.push(input.expand);
      } else if(input.expand instanceof Array){
        expands = input.expand.slice(0);
      }
      doExpands=function(){
        if(expands.length>0){
          var expand = expands.pop();
          //FIXME This should go to any level of depth which means we could do an eval?
          // We will only expand calls we could make locally so we don't find ourselves victim to attack
          if(result[expand] && result[expand].href && result[expand].href instanceof Hop.href){
            console.log("EXPANDING",expand);
            result[expand].href.call(function Hop_expand_results(err,res){
              console.log("R",err,res);
              if(err){
                result[expand]={error: err}
              } else {
                result[expand]=res;
              }
              doExpands();
            },req,response); 
          } else {
            doExpands();
          }
        } else {
          next();
        }
      }
      doExpands();
    } else next();
  }
}

/**
Define a HTTP create CRUD based post

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

The returned result is a URL to the created resource as either a Hop.href or a string

See http://java.dzone.com/articles/beautiful-rest-json-apis-les?mz=62823-enterprise-integration for details

@example
  UserService.create=function(input,onComplete){
    var user = { name: input.name, email: input.email }
    UserDAO.save(user,function(err,savedUser){
      if(!err){
        return onComplete(null,new Hop.href("UserService.read",{id:savedUser.id});
      } else return onComplete(err,null);
    });
  }

  Hop.defineClass("UserService",function(api){
    api.create("create","/user/");
    //..
  });

@for Hop.Object
@method create
@chainable
**/
Hop.Object.prototype.create=function(name,path){
  var self = this;
  this.methods[name]=new Hop.Method("post",this,name,path);
  this.methods[name].optional("expand","Expand the result to include the resource located in the href (true/false)");
  this.methods[name].addPostCall(function(req,input,err,result,next,response){
    if(result){
      Hop.log(input,err,result);
      if(result instanceof Hop.href || typeof result=="string"){
        if(result instanceof Hop.href){
          var location = result.toString();
          result.call(function(e,r){
            response.set("Location",location);
            response.status(201);
            next(e,r);
          },req);  
        } else {
          result.send=function(res){
            var location = result.toString();
            res.set('Location',location);
            res.send(201,location);  
          };
          next();
        } 
      } else {
        throw new Error("Invalid return type from create, must be an instance of Hop.href or a url (as a string)");
        next();
      }
    } else { next(); }
  },"data");

  this.methods[name].addPostCall(Hop.postCallExpand(self,name),"data");

  return this.methods[name];
}  

/**
Define a HTTP update CRUD based put

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

This method will expand any href's inline in the returned result if asked to do so

See http://java.dzone.com/articles/beautiful-rest-json-apis-les?mz=62823-enterprise-integration for details

@example
  UserService.update=function(input,onComplete){
    var user = { name: input.name, email: input.email }
    UserDAO.save(user.id, user,function(err,savedUser){
      if(!err){
        var res = {};
        res.href=new Hop.href("UserService.read",{id:savedUser.id});
        return onComplete(null,res);
      } else return onComplete(err,null);
    });
  }

  Hop.defineClass("UserService",function(api){
    api.create("update","/user/:id");
    //..
  });

@for Hop.Object
@method update
@chainable
**/
Hop.Object.prototype.update=function(name,path){
  var self = this;
  //TBD should this be a patch or a put ?!?
  this.methods[name]=new Hop.Method("put",this,name,path);
  this.methods[name].optional("expand","Which in-line hrefs to expand");
  this.methods[name].addPostCall(Hop.postCallExpand(self,name),"data");
  return this.methods[name];
}  


/**
Define a HTTP read CRUD based get

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

This method will always inject the href for the current link into the resulting object

@example
  {
    href: link to itself
  }  

See http://java.dzone.com/articles/beautiful-rest-json-apis-les?mz=62823-enterprise-integration for details

@example
  UserService.read=function(input,onComplete){
    return onComplete(null,users[input.id]);
  }

  Hop.defineClass("UserService",function(api){
    api.read("read","/user/:id");
    //..
  });

@for Hop.Object
@method read
@chainable
**/
Hop.Object.prototype.read=function(name,path){
  var self = this;
  this.methods[name]=new Hop.Method("get",this,name,path);
  this.methods[name].optional("expand","Which in-line hrefs to expand");
  this.methods[name].addPostCall(Hop.postCallExpand(self,name),"data");
  return this.methods[name];
}  


/**
Define a HTTP get of a list on this method

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

The list method by default will have optional values of offset and limit. And will return an object that has the following structure:

@example
  {
    href: link to itself
    offset: offset value
    limit: number of items returned
    prev: {
      href: link to previous part of the set
    }
    next: {
      href: link to next part of the set
    },
    items:[
      ... 
    ]
  }  

See http://java.dzone.com/articles/beautiful-rest-json-apis-les?mz=62823-enterprise-integration for details

@example
  UserService.list=function(input,onComplete){
    return onComplete(null,arrayOfUsers);
  }

  Hop.defineClass("UserService",function(api){
    api.list("list","/user/");
    //..
  });

@for Hop.Object
@method list
@chainable
**/
Hop.Object.prototype.list=function(name,path){
  var self = this;
  this.methods[name]=new Hop.Method("get",this,name,path);
  this.methods[name].optional("limit","The number of results to return").optional("offset","Where to start in the result set");      
  this.methods[name].addPreCall(function Hop_Method_preCall_list(req,input,onComplete,next){
    if(typeof input.limit=="undefined" || !(/[0-9]+/.test(input.limit))) input.limit=25;
    if(typeof input.offset=="undefined" || !(/[0-9]+/.test(input.offset))) input.offset=0;
    return next();
  },"demand");
  this.methods[name].addPostCall(function Hop_Method_postCall_list(req,input,err,result,next){
    if(result){
      var thisInput = JSON.parse(JSON.stringify(input));
      var prevInput = JSON.parse(JSON.stringify(input));
      var nextInput = JSON.parse(JSON.stringify(input));
    
      var itemCount = (result.items instanceof Array?result.items.length:(typeof result.items=="object"?Object.keys(result.items).length:0));
      if(!result.href)
        result.href = new Hop.href(self.methods[name].getMethod(),thisInput);
      if(!result.next && itemCount>=thisInput.limit){
        result.next={};
        nextInput.offset+=nextInput.limit;
        result.next.href = new Hop.href(self.methods[name].getMethod(),nextInput);
      }
      if(!result.prev && (prevInput.offset-(prevInput.limit*2))>0){
        result.prev={};
        prevInput.offset-=(prevInput.limit*2);
        result.prev.href = new Hop.href(self.methods[name].getMethod(),prevInput);
      }
    }
    next();
  },"data");
    
  return this.methods[name];
}  

/**
Define a HTTP patch call on this method

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

@example
  Hop.defineClass("UserService",function(api){
    api.patch("patch","/user/:id");
    //..
  });

@for Hop.Object
@method patch
@chainable
**/
Hop.Object.prototype.patch=function(name,path){
  this.methods[name]=new Hop.Method("patch",this,name,path);      
  return this.methods[name];
}  

/**
Define a HTTP get call on this method

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

@example
  Hop.defineClass("UserService",function(api){
    api.get("load","/user/:userID");
    //..
  });

@for Hop.Object
@method get
@chainable
**/
Hop.Object.prototype.get=function(name,path){
  this.methods[name]=new Hop.Method("get",this,name,path);      
  return this.methods[name];
}  

/**
Define a HTTP post call on this method

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

@example
  Hop.defineClass("UserService",function(api){
    api.post("update","/user/:userID");
    //..
  });

@for Hop.Object
@method post
@chainable
**/
Hop.Object.prototype.post=function(name,path){
  this.methods[name]=new Hop.Method("post",this,name,path);      
  return this.methods[name];
}  

/**
Define a HTTP del call on this method

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

@example
  Hop.defineClass("UserService",function(api){
    api.del("delete","/user/:userID");
    //..
  });

@for Hop.Object
@method del
@chainable
**/
Hop.Object.prototype.del=function(name,path){
  this.methods[name]=new Hop.Method("delete",this,name,path);      
  return this.methods[name];
}  


/**
Define a HTTP put call on this method

@params {String} method The name of the method on the associated object
@params {String} path The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

@example
  Hop.defineClass("UserService",function(api){
    api.put("create","/user/");
    //..
  });

@for Hop.Object
@method put
@chainable
**/
Hop.Object.prototype.put=function(name,path){
  this.methods[name]=new Hop.Method("put",this,name,path);      
  return this.methods[name];
}  

/**
Define the usage for this class 

@example
  Hop.defineClass("UserService",function(api){
    api.usage("Manages Users");
    //..
  });

@for Hop.Object
@method usage
@chainable
**/
Hop.Object.prototype.usage=function(usage){
  this.desc=usage;
  return this;
}

/**
Find an object by name

@return {string} The name of the method

@example
  Hop.defineClass("UserService",function(api){
    api.get("load","/user/:userID")

  });
  var method = Hop.Method.findMethod("UserService.load");
  Hop.log(method.getMethod()); //returns UserService.load

@for Hop.Object
@method findObject
@static
**/
Hop.Object.findObject=function(objName){
  if(objName.indexOf(".")!=-1){
      var parts = objName.split(".");  
      objName = parts.splice(0,parts.length-1).join(".");
  }
  return Hop.Objects[objName];
}

/**
  Class used to define methods

  @class Hop.Method
  @constructor
**/
Hop.Method = function(method,object,name,_path){
  this._className = object.name;
  this.method=method;
  this.name=name;
  this.path=_path;
  this.params={};
  this._preCall=[];
  this._postCall=[];
  this.defaults={};
  this.options={};

  //Let's figure out what parameters we must have!
  var self=this;
  var pathParts = _path.split("/");
  pathParts.map(function(part){
    if(/^:.*/.test(part)){
      self.demand(part.replace(/^:/,""));
    }
  });

}

Hop.Method.prototype.toJSON=function(noChecksum){
  var obj = {};
  this.fullPath = Hop.Method.getPath(Hop.basePath,this._className,this);

  return this;
}


/**
Find a method by name

@return {string} The name of the method

@example
  Hop.defineClass("UserService",function(api){
    api.get("load","/user/:userID")

  });
  var method = Hop.Method.findMethod("UserService.load");
  Hop.log(method.getMethod()); //returns UserService.load

@method findMethod
@static
**/
Hop.Method.findMethod=function(objName){
  var obj = Hop.Object.findObject(objName);
  if(obj){
    var parts = objName.split(".");
    var method = parts.splice(parts.length-1);
    return obj.methods[method];
  } else return null;
}

/**
Get the name of the method

This will get the name of the method

@return {string} The name of the method

@example
  Hop.defineClass("UserService",function(api){
    api.get("load","/user/:userID")

  });
  var method = Hop.Method.findMethod("UserService.load");
  Hop.log(method.getMethod()); //returns UserService.load

@method getMethod
**/
Hop.Method.prototype.getMethod=function(){
  return Hop.Method.getMethod(this._className,this);
}

Hop.Method.getMethod=function(className,method){
  return className+"."+method.name;
}


/**
Get the full url for the method

This will get the full path for the url for the method.

@return {string} The URL for the method
@method getPath
**/
Hop.Method.prototype.getPath=function(){
  
  return Hop.Method.getPath(Hop.basePath,this._className,this);
}

Hop.Method.getPath=function(basePath,className,method){
  var _path = method.path.replace("#classname",className.toLowerCase());
  _path = _path.replace("#ClassName",className);
  return util.webpath.join(basePath,_path);
}

/**
Specify the default values for this call

These values will be copied into the input if no existing value is found.

@param {object} defaults
@method defaultValues
@chainable
**/
Hop.Method.prototype.defaultValues=function(defaults){
  this.defaults=defaults;
  return this;
}
/**
Specify a number of optionals for  for a call

@example
  api.post("create","/user/profile/").optionals("email","name","password");

@param {string} name of parameter (+)

@for Hop.Method
@method optionals
@chainable
**/
Hop.Method.prototype.optionals=function(){
  for(var i=0;i<arguments.length;i++)
    this.optional(arguments[i]);  
  return this;
}

/**
Specify a number of demands for  for a call

@example
  api.post("create","/user/profile/").demands("email","name","password");

@param {string} name name of parameter (+)

@for Hop.Method
@method demands
@chainable
**/
Hop.Method.prototype.demands=function(){
  for(var i=0;i<arguments.length;i++)
    this.demand(arguments[i]);  
  return this;
}

/**
Demand a parameter for a call

@example
  api.post("create","/user/profile/").demand("email","Email address");

@param {string} name of parameter
@param {string} desc description of parameter

@for Hop.Method
@method demand
@chainable
**/
Hop.Method.prototype.demand=function(name,desc,validate){
  this.params[name]={ desc: desc, validate: validate, demand:true };
  return this;
}

/**
  Describe this method

  @param {string} usage text describing the function for documentation purposes


  @chainable
  @method usage
**/
Hop.Method.prototype.usage=function(desc){
  this.desc=desc;
  return this;
}

/**
  Note that this method can only be called when there is a user in the session

  *This will only allow this method to be called if req.session.user exists*


  @example
    Hop.defineClass("UserService",UserService,function(api){
      //Only allow this method to be called if a user is in the session
      api.post("sendMsg","/user/:userId/message").authed();
    });

  @chainable
  @method authed 
**/
Hop.Method.prototype.authed=function(desc){
  this.authed=true;
  this.addPreCall(function Hop_Method_preCall_authed(req,input,onComplete,next){
    if(!req.session.user){
      return onComplete("Permission denied");
    } else return next();
  },"demand");
  return this;
}



/**
  Note that this method can only be called using https

  @chainable
  @method secure 
**/
Hop.Method.prototype.secure=function(desc){
  this.secure=true;
  this.addPreCall(function Hop_Method_preCall_secure(req,input,onComplete,next){
    if(!req.secure){
      return onComplete("Permission denied");
    } else return next();
  },"demand");
  return this;
}

/**
  Include the express CSRF token in the response headers for this method

  The CSRF token is utilized to prevent cross site request forgery attacks, and is a middleware component
  for express. 

  See here for information: http://www.senchalabs.org/connect/middleware-csrf.html

  By default HopJS will attempt to utilize the CSRF functionality in express if it is enabled, but 
  some clients require a means to access the CSRF token, hence this function will will send the csrf token
  in the headers as 'x-crsf-token'
  
  The primary usage for this function is with secure login functions

  @example
    Hop.defineClass("UserService",UserService,function(api){
      api.post("login","/login").demands("username","password").sendCSRFToken();
    });

  @chainable
  @method sendCSRFToken
**/
Hop.Method.prototype.sendCSRFToken=function(){
  this.sendsCSRFToken=true;
  this.addPostCall(function Hop_Method_postCall_sendCSRFToken(req,input,err,result,next){
    if(!err && req.session._csrf){
      req._response.set('X-CSRF-Token',req.session._csrf);  
    }
    next();
  },"last");
  return this;
}


/**
Optional parameter for a call

@example
  api.post("create","/user/profile/").optional("phoneNumber","Phone Number");

@param {string} name of parameter
@param {string} desc description of parameter

@for Hop.Method
@method optional
@chainable
**/
Hop.Method.prototype.optional=function(name,desc,validate){
  this.params[name]={ desc: desc, validate: validate, optional:true };
  return this;
}

/**
Indicate this function performs longPolling

@example
  api.get("status","/server/:serverID/status").longPoll();

@for Hop.Method
@method longPoll
@chainable
**/
Hop.Method.prototype.longPoll=function(){
  this.options.noCache=true;
  this.options.longPoll=true;
  return this;
}

/**
Indicate this function should avoid caching

@example
  api.post("create","/user/profile/").noCache();

@for Hop.Method
@method noCache
@chainable
**/
Hop.Method.prototype.noCache=function(){
  this.options.noCache=true;
  return this;
}

Hop.Method.prototype.renderBeforeTemplates=function(type,input){
  return Hop.renderTemplates(this,"before",type,input);
}  
Hop.Method.prototype.renderAfterTemplates=function(type,input){
  return Hop.renderTemplates(this,"after",type,input);
}  

Hop.Method.prototype.getBeforeTemplates=function(type){
  return Hop.getTemplates(this,"before",type);
}  

Hop.Method.prototype.getAfterTemplates=function(type){
  return Hop.getTemplates(this,"after",type);
}  

Hop.Method.prototype.addBeforeTemplate=function(type,template){
  Hop.addTemplate(this,"before",type,template);
}

Hop.Method.prototype.addAfterTemplate=function(type,template){
  Hop.addTemplate(this,"after",type,template);
}


/**
Demand a file be provided for this method.

@example
  api.post("create","/user/profile/").demandFile("avatar","Users avatar image");

@for Hop.Method
@method demandFile
@chainable
**/
Hop.Method.prototype.demandFile=function(name,desc,validate){
  this.params[name]={ desc: desc, validate: validate, demandFile:true, demand:true };
  return this;
}

/**
Specify that a file may optionally be provided as an input to this call.

@example
  api.post("create","/user/profile/").optionalFile("avatar","Users avatar image");

@for Hop.Method
@method optionalFile
@chainable
**/
Hop.Method.prototype.optionalFile=function(name,desc,validate){
  this.params[name]={ desc: desc, validate: validate, optionalFile:true };
  return this;
}

/**
Add a function that will be called after this call is completed

@param {function} call function to be called when this call is completed, which is passed the following parameters:
  @param {object} call.request  the ExpressJS / HTTP request object
  @param {object} call.input  the input parameters to the call
  @param call.err  the resulting err from the call
  @param {object} call.result - the result of the call
  @param {function} call.next - to be called when the callback is completed, causing the next call back to be called
  @param {object} call.response the ExpressJS / HTTP response object
@param {string} phase the phase in which this function will be called (see below)

*Phases*

  1. (Pre call phases)
  2. **CALL**   
  3. first - called before any other phases
  4. data - data processing and conversion
  5. event - event emission
  6. cache - cache phase 
  7. last - called last


@example
  api.get("load","/user/:userID").addPostCall(function(req,input,err,result,next){
    //Let's caclulate the users age:
    if(result && result.birthdate){
      result.age = User.calculateAge(result.birthdate);
    }  
    next();
  },"data");

@for Hop.Method
@method addPostCall
@chainable
**/
Hop.Method.postCallPhases = [ "first", "data", "event", "cache", "last" ];
Hop.Method.prototype.addPostCall=function(call,phase){
  if(Hop.Method.postCallPhases.indexOf(phase)==-1)
    throw "Invalid post call phase specified '"+phase+"' valid phases are "+Hop.Method.postCallPhases.join(", ");
  this._postCall.push({ call: call, phase: phase });
  
  this._postCall.sort(function(a,b){
    var aPhase = Hop.Method.postCallPhases.indexOf(a.phase);
    var bPhase = Hop.Method.postCallPhases.indexOf(b.phase);
    if(aPhase < bPhase){
      return -1;
    } else if(bPhase > aPhase){
      return 1;
    } else return 0;
  });  
  return this;
}


/**
Add a function that will be called before this call is executed 

@param {function} call function to be called prior to when this call is executed , which is passed the following parameters:
  @param {object} call.request the ExpressJS / HTTP request object
  @param {object} call.input the input parameters to the call
  @param {function} call.onComplete to be called if the function wants to short circuit and return a result
  @param {function} call.next to be called when the callback is completed, causing the next call back to be called
  @param {object} call.response the ExpressJS / HTTP reponse object
@param {string} phase the phase in which this function will be called (see below)

*Phases*

  1. first - called first
  2. demand - verifies that the required parameters are in place 
  3. conversion - will convert the input types to the expected types
  4. validation - input validation 
  5. auth - authentication phase
  6. event - event emission
  7. cache - cache phase 
  8. last - the last set of calls to be called prior to the function call
  9. **CALL**   
  10. (post calls)


@example
  api.get("load","/user/:userID").addPreCall(function(req,input,err,onComplete,next){
    //If we have a user allow this call to complete
    if(req && req.session && req.session.user){
      next();
    //If not return an error 
    } else {
      return onComplete("Permission denied");
    }
  },"auth");

@for Hop.Method
@method addPreCall
@chainable
**/
Hop.Method.preCallPhases=[ "first","demand", "conversion", "validation", "auth", "event","cache","last"];
Hop.Method.prototype.addPreCall=function(call,phase){
  if(Hop.Method.preCallPhases.indexOf(phase)==-1)
    throw "Invalid pre call phase specified '"+phase+"' valid phases are "+Hop.Method.preCallPhases.join(", ");
  this._preCall.push({ call: call, phase: phase });
  
  this._preCall.sort(function(a,b){
    var aPhase = Hop.Method.preCallPhases.indexOf(a.phase);
    var bPhase = Hop.Method.preCallPhases.indexOf(b.phase);
    if(aPhase < bPhase){
      return -1;
    } else if(bPhase > aPhase){
      return 1;
    } else return 0;
  });  

  return this;
}

/**
Indicate that this method call has been depricated

@for Hop.Method
@method depricated
@chainable
**/

Hop.Method.prototype.depricated=function(){
  this.depricated=true;
}

/**
Calls the specified method 

This function is provided so that all functionality around a specific call may be utilized. 

@param {string} name Name of the function to call
@param {object} input Input for the call
@param {function} callback for completion
  @param callback.err The error returned from the call
  @param callback.result The result returned from the call
@param {object} [request] ExpressJS/HTTP request object

@example
  var input = { username: "cfox", email:"cfox@gmail.com"}
  Hop.call("UserService.create",input,function(err,res){
    Hop.log(err,res);
  });


@for Hop
@method call
@static
**/
Hop.call=function(name,input,onComplete,request,response){
  var output = {};
  
  Hop.log("CALL");
  
  var obj = Hop.Object.findObject(name);
  if(!obj)
    throw ("Invalid object specified: "+name);
  
  var method = Hop.Method.findMethod(name);
  
  if(!method)
    throw ("Invalid method specified: "+name);
  
  for(var paramName in method.defaults){
    output[paramName]=method.defaults[paramName];  
  }
  for(var paramName in method.params){
    var param = method.params[paramName];
    if(typeof input[paramName]!="undefined"){
      output[paramName]=input[paramName];  
    }
  }
   
  for(var paramName in method.params){
    var param = method.params[paramName];
    if(param.demand && typeof output[paramName]=="undefined"){
      throw ("Missing parameter:" +paramName);
    }
  }


  if(obj._instance){
    if(!obj._instance[method.name])
      throw ("Method not found on object instance: "+method.name);
        
      var preTasks = method._preCall.length;
      var runPreTaskFunctions=function Hop_call_preTask(){
        if(preTasks>0){
          method._preCall[method._preCall.length-preTasks].call(request,output,onComplete,function Hop_call_preCall(){
            preTasks--;
            runPreTaskFunctions();
          },response);
        } else {
          obj._instance[method.name](output,function Hop_call_instance(err,result,statusCode){  
              Hop.log("RES",input,err,result);
              if(typeof statusCode!="undefined"){
                response.status(statusCode);
              }  
              var postTasks = method._postCall.length;
              var runPostTaskFunctions=function Hop_call_postTask(){
                if(postTasks>0){
                  try {
                    method._postCall[method._postCall.length-postTasks].call(request,output,err,result,function Hop_call_postCall(e,r){
                      if(typeof e!="undefined")
                        err=e;
                      if(typeof r!="undefined")
                        result=r;
                      postTasks--;
                      runPostTaskFunctions();
                    },response);
                  } catch (e){
                    return onComplete(e);
                  }
                } else {
                  return onComplete(err,result);
                }
              }  
              runPostTaskFunctions();      
          },request,response);
        }
      }  

      runPreTaskFunctions();      

  } else {
    throw new Error("Invalid API object instance");
  }

}

var Stream = require('stream');

Hop.DataEncoder=util.DataEncoder;


Hop.addslashes=function(string) {
    return string.replace(/\\/g, '\\\\').
        replace(/\u0008/g, '\\b').
        replace(/\t/g, '\\t').
        replace(/\n/g, '\\n').
        replace(/\f/g, '\\f').
        replace(/\r/g, '\\r').
        replace(/'/g, '\\\'').
        replace(/"/g, '\\"');
}
module.exports=Hop;
