/**
	Hop Core module

	This is the primary impelementation behind Hop

	@module Hop
**/
var crypto = require('crypto');
require('./util');


Hop=function(){
	this.objects={};
	this.interfaces={};
}

Hop.log=console.log;
Hop.error=console.error;
Hop.warn=console.warn;

Hop.sendFile=function(file,options){
	return new Hop.File(file,options);
}

Hop.sendAttachment=function(file,options){
	options=options||{};
	options.attachment=true;	
	return new Hop.File(file,options);
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
	if(!obj._templates)
		return "";
	if(!obj._templates[type])
		return "";
	if(!obj._templates[type][when])
		return "";
	
	var out = "";
	obj._templates[type][when].map(function(template){
		out+=(Hop.renderTemplate(template)(input));
	});
	return out;
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

	@param {String} objectName
		Then name of the object to wrap


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
				result[method.name]=function(input,onComplete,request){
					Hop.log(method.getMethod(),input,onComplete,request);
					Hop.call(method.getMethod(),input,onComplete,request);
				};	
			})(method);
		}	
	} else throw "Invalid object name specified";
	return result;
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
Define a HTTP get call on this method

@params {String} method
	The name of the method on the associated object
@params {String} path
	The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

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

@params {String} method
	The name of the method on the associated object
@params {String} path
	The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

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

@params {String} method
	The name of the method on the associated object
@params {String} path
	The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

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

@params {String} method
	The name of the method on the associated object
@params {String} path
	The HTTP path that this call can be found on. Variables can be specified as part of the path utilizing ':'

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
	this.fullPath = this.getPath();

	//Let's figure out what parameters we must have!
	var self=this;
	var pathParts = _path.split("/");
	pathParts.map(function(part){
		if(/^:.*/.test(part)){
			self.demand(part.replace(/^:/,""));
		}
	});

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
	return webpath.join(basePath,_path);
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

@param {string} name of parameter (+)

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

	@param {string} usage
		A string describing this function for documentation purposes
	@chainable
	@method usage
**/
Hop.Method.prototype.usage=function(desc){
	this.desc=desc;
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
	@param {object} call.request	the ExpressJS / HTTP request object
	@param {object} call.input	the input parameters to the call
	@param call.err	the resulting err from the call
	@param {object} call.result - the result of the call
	@param {function} call.next - to be called when the callback is completed, causing the next call back to be called
@param {string} phase the phase in which this function will be called (see below)

*Phases*

	1. (Pre call phases)
	2. **CALL** 	
	3. data - data processing and conversion
	4. event - event emission
	5. cache - cache phase 


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
Hop.Method.postCallPhases = [ "data", "event", "cache" ];
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
Add a function that will be called after this call is completed

@param {function} call function to be called when this call is completed, which is passed the following parameters:
	@param {object} call.requestthe ExpressJS / HTTP request object
	@param {object} call.inputthe input parameters to the call
	@param call.err	the resulting err from the call
	@param {function} call.onComplete to be called if the function wants to short circuit and return a result
	@param {function} call.next to be called when the callback is completed, causing the next call back to be called
@param {string} phase the phase in which this function will be called (see below)

*Phases*

	1. demand - verifies that the required parameters are in place 
	2. conversion - will convert the input types to the expected types
	3. validation - input validation 
	4. auth - authentication phase
	5. event - event emission
	6. cache - cache phase 
	7. **CALL** 	
	8. (post calls)


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
Hop.Method.preCallPhases=[ "demand", "conversion", "validation", "auth", "event","cache" ];
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
Hop.call=function(name,input,onComplete,request){
	var output = {};
	
	
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
		if(input[paramName]!=undefined){
			output[paramName]=input[paramName];	
		}
	}
	
	for(var paramName in method.params){
		if(param.demand && typeof output[paramName]=="undefined")
			throw ("Missing parameter:" +paramName);
	}


	if(obj._instance){
		if(!obj._instance[method.name])
			throw ("Method not found on object instance: "+method.name);
				
			var preTasks = method._preCall.length;
			var runPreTaskFunctions=function(){
				if(preTasks>0){
					method._preCall[method._preCall.length-preTasks].call(request,output,onComplete,function(){
						preTasks--;
						runPreTaskFunctions();
					});
				} else {
					obj._instance[method.name](output,function(err,result){
							var postTasks = method._postCall.length;
							var runPostTaskFunctions=function(){
								if(postTasks>0){
									method._postCall[method._postCall.length-postTasks].call(request,output,err,result,function(){
										postTasks--;
										runPostTaskFunctions();
									});
								} else {
									return onComplete(err,result);
								}
							}	
							runPostTaskFunctions();			
					},request);
				}
			}	

			runPreTaskFunctions();			

	} else {
		//FIXME
		throw "I don't know what to do here";
	}

}

var Stream = require('stream');

Hop.appendForm=function(form,object,path){
	var hasData=false;
	form=form|| { append:function(){}};
	for(var i in object){
		var v = object[i];
		var p = i;
		if(typeof path!="undefined"){
			p=path+'['+p+']';
		}
		if(v===null){
			form.append(p,"");
			hasData=true;
		} else if(typeof Stream!="undefined" && v instanceof Stream){
			form.append(p,v);
			hasData=true;
		} else if(typeof Buffer!="undefined" && v instanceof Buffer){
			form.append(p,v);
			hasData=true;
		} else if(typeof Blob!="undefined" && v instanceof Blob){
			form.append(p,v);
			hasData=true;
		} else if(typeof File!="undefined" && v instanceof File){
			form.append(p,v);
			hasData=true;
		} else if(typeof v=="object"){
			hasData=Hop.appendForm(form,v,p);	
		} else if(typeof v!="undefined"){
			form.append(p,v.toString());
			hasData=true;
		}
	}
	return hasData;
}


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
