/**
RAPI Core module

@module RAPI
**/
var path = require('path');
var crypto = require('crypto');


RAPI=function(){
	this.objects={};
	this.interfaces={};
}

RAPI.log=console.log;
RAPI.error=console.error;
RAPI.warn=console.warn;

RAPI.File=function(filename){
	this.file=filename;
}

RAPI.Objects={};
RAPI.Interfaces={};

/**
	Calculate a checksum for the RAPI 

	This is used to detect changes in the version of the RAPI

	@for RAPI
	@method checksum
	@static
**/
RAPI.checksum = function(){
	if(RAPI._checksum)
		return RAPI._checksum;
	var md5 = crypto.createHash('md5');	
	md5.update(JSON.stringify(RAPI.Objects));

	RAPI._checksum = md5.digest('hex');
	return RAPI._checksum;
}

/**
	Utility class for providing mock response objects

	@class RAPI.StubResponse
**/
RAPI.StubResponse=function(){
	this.header={};
}

RAPI.StubResponse.prototype.set=function(name,value){
	this.header[name]=value;
}

RAPI.StubResponse.prototype.get=function(name){
	return this.header[name];
}


/**
	Utility class for providing mock request objects

	@class RAPI.StubRequest
**/
RAPI.StubRequest=function(){
	this.header={};
	this.response = new RAPI.StubResponse();
	this.session={};
}

RAPI.StubRequest.prototype.getResponse=function(){
	return this.response;
}

RAPI.StubRequest.prototype.set=function(name,value){
	this.header[name]=value;
}

RAPI.StubRequest.prototype.get=function(name){
	return this.header[name];
}

RAPI.getTemplates=function(obj,when,type){
	if(!obj.templates)
		return null;
	if(!obj.templates[type])
		return null;
	if(!obj.templates[type][when])
		return null;
	return obj.templates[type][when];
}

RAPI.renderTemplates=function(obj,when,type,input){
	if(!obj.templates)
		return "";
	if(!obj.templates[type])
		return "";
	if(!obj.templates[type][when])
		return "";
	
	var out = "";
	obj.templates[type][when].map(function(template){
		out+=(RAPI.renderTemplate(template)(input));
	});
	return out;
}

RAPI.addTemplate=function(obj,when,type,template){
	if(!obj.templates)
		obj.templates={};
	if(!obj.templates[type])
		obj.templates[type]={};
	if(!obj.templates[type][when])
		obj.templates[type][when]=[];
	obj.templates[type][when].push(template);
}

RAPI.renderBeforeTemplates=function(type,input){
	return RAPI.renderTemplates(RAPI,"before",type,input);
}	
RAPI.renderAfterTemplates=function(type,input){
	return RAPI.renderTemplates(RAPI,"after",type,input);
}	

RAPI.getBeforeTemplates=function(type){
	return RAPI.getTemplates(RAPI,"before",type);
}	

RAPI.getAfterTemplates=function(type){
	return RAPI.getTemplates(RAPI,"after",type);
}	

RAPI.addBeforeTemplate=function(type,template){
	RAPI.addTemplate(RAPI,"before",type,template);
}

RAPI.addAfterTemplate=function(type,template){
	RAPI.addTemplate(RAPI,"after",type,template);
}


/**
Define a new class 

* Use #classname to have the class name substituted into the URL

@param {string} name the name of the class
@param {object} [instance] an instance of the object
@param {function} onDefine the lambda used to define the interface

@example
	RAPI.defineClass("Email",new Email(),function(api){
		//define the class 
	});


@for RAPI
@method defineClass
@static
**/
RAPI.defineClass=function(name,instance,onDefine){
	delete RAPI._checksum;
	var api = new RAPI.Object(name,instance);
	onDefine(api);
}

/**
Define a new interface

* Use #classname to have the class name substituted into the URL

@param {string} name the name of the interface
@param {function} onDefine the lambda used to define the interface

@example
	RAPI.defineInterface("Notification",function(api){
		api.post("send","#classname/send").usage("Sends a message").demand("msg").demand("subject").demand("to");
	}


@for RAPI
@method defineInterface 
@static
**/
RAPI.defineInterface=function(name,onDefine){
	delete RAPI._checksum;
	var intf = new RAPI.Interface(name,onDefine);
}



RAPI.Interface = function(name,onDefine){
	this.onDefine=onDefine;
	this.name=name;
	RAPI.Interfaces[name]=this;
}

RAPI.Object = function(name,instance){
	this.name=name;
	this.instance=instance;
	this.methods={};
	RAPI.Objects[name]=this;
}
RAPI.Object.prototype.renderBeforeTemplates=function(type,input){
	return RAPI.renderTemplates(this,"before",type,input);
}	
RAPI.Object.prototype.renderAfterTemplates=function(type,input){
	return RAPI.renderTemplates(this,"after",type,input);
}	

RAPI.Object.prototype.getBeforeTemplates=function(type){
	return RAPI.getTemplates(this,"before",type);
}	

RAPI.Object.prototype.getAfterTemplates=function(type){
	return RAPI.getTemplates(this,"after",type);
}	


RAPI.Object.prototype.addBeforeTemplate=function(type,template){
	RAPI.addTemplate(this,type,"before",type,template);
}

RAPI.Object.prototype.addAfterTemplate=function(type,template){
	RAPI.addTemplate(this,type,"after",type,template);
}


/**
Have this object extend from an interface

@example
	RAPI.defineInterface("Notification",function(api){
		api.post("send","#classname/send").usage("Sends a message").demand("msg").demand("subject").demand("to");
	}
	RAPI.defineClass("Email",function(api){
		//This will essentially evaluate the interface defined above against thsi class adding the send function
		api.extend("Notification");
	});

@for RAPI.Object
@method extend
**/
RAPI.Object.prototype.extend=function(intf){
	if(!this.interfaces){
		this.interfaces={};
	}
	this.interfaces[intf]=true;
	if(RAPI.Interfaces[intf]){
		RAPI.Interfaces[intf].onDefine(this);	
	} else throw ("Invalid interface specified:"+intf);
}

/**
Define a HTTP get call on this method

@example
	RAPI.defineClass("UserService",function(api){
		api.get("load","/user/:userID");
		//..
	});

@for RAPI.Object
@method get
@chainable
**/
RAPI.Object.prototype.get=function(name,path){
	this.methods[name]=new RAPI.Method("get",this,name,path);			
	return this.methods[name];
}	

/**
Define a HTTP post call on this method

@example
	RAPI.defineClass("UserService",function(api){
		api.post("update","/user/:userID");
		//..
	});

@for RAPI.Object
@method post
@chainable
**/
RAPI.Object.prototype.post=function(name,path){
	this.methods[name]=new RAPI.Method("post",this,name,path);			
	return this.methods[name];
}	

/**
Define a HTTP del call on this method

@example
	RAPI.defineClass("UserService",function(api){
		api.del("delete","/user/:userID");
		//..
	});

@for RAPI.Object
@method del
@chainable
**/
RAPI.Object.prototype.del=function(name,path){
	this.methods[name]=new RAPI.Method("del",this,name,path);			
	return this.methods[name];
}	


/**
Define a HTTP put call on this method

@example
	RAPI.defineClass("UserService",function(api){
		api.put("create","/user/");
		//..
	});

@for RAPI.Object
@method put
@chainable
**/
RAPI.Object.prototype.put=function(name,path){
	this.methods[name]=new RAPI.Method("put",this,name,path);			
	return this.methods[name];
}	

/**
Define the usage for this function

@example
	RAPI.defineClass("UserService",function(api){
		api.usage("Manages Users");
		//..
	});

@for RAPI.Object
@method usage
@chainable
**/
RAPI.Object.prototype.usage=function(usage){
	this.desc=usage;
	return this;
}

/**
Find an object by name

@return {string} The name of the method

@example
	RAPI.defineClass("UserService",function(api){
		api.get("load","/user/:userID")

	});
	var method = RAPI.Method.findMethod("UserService.load");
	RAPI.log(method.getMethod()); //returns UserService.load

@for RAPI.Object
@method findObject
@static
**/
RAPI.Object.findObject=function(objName){
	if(objName.indexOf(".")!=-1){
			var parts = objName.split(".");	
			objName = parts.splice(0,parts.length-1).join(".");
	}
	return RAPI.Objects[objName];
}

RAPI.Method = function(method,object,name,path){
	this.className = object.name;
	this.method=method;
	this.name=name;
	this.path=path;
	this.params={};
	this.preCall=[];
	this.postCall=[];
	this.defaults={};
	this.options={};
}

RAPI.Method.getPath=function(inpath){
	return path.join(RAPI.basePath,inpath);
}

/**
Find a method by name

@return {string} The name of the method

@example
	RAPI.defineClass("UserService",function(api){
		api.get("load","/user/:userID")

	});
	var method = RAPI.Method.findMethod("UserService.load");
	RAPI.log(method.getMethod()); //returns UserService.load

@for RAPI.Method
@method findMethod
@static
**/
RAPI.Method.findMethod=function(objName){
	var obj = RAPI.Object.findObject(objName);
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
	RAPI.defineClass("UserService",function(api){
		api.get("load","/user/:userID")

	});
	var method = RAPI.Method.findMethod("UserService.load");
	RAPI.log(method.getMethod()); //returns UserService.load

@for RAPI.Method
@method getMethod
**/
RAPI.Method.prototype.getMethod=function(){
	return this.className+"."+this.name;
}

/**
Get the full url for the method

This will get the full path for the url for the method.

@return {string} The URL for the method
@for RAPI.Method
@method getPath
**/
RAPI.Method.prototype.getPath=function(){
	return path.join(RAPI.basePath,this.path.replace("#className",this.className.toLowerCase()));
}

/**
Specify the default values for this call

These values will be copied into the input if no existing value is found.

@param {object} defaults
@for RAPI.Method
@method defaultValues
@chainable
**/
RAPI.Method.prototype.defaultValues=function(defaults){
	this.defaults=defaults;
	return this;
}

/**
Demand a parameter for a call

@example
	api.post("create","/user/profile/").demand("email","Email address");

@param {string} name of parameter
@param {string} desc description of parameter

@for RAPI.Method
@method demand
@chainable
**/
RAPI.Method.prototype.demand=function(name,desc,validate){
	this.params[name]={ desc: desc, validate: validate, demand:true };
	return this;
}

/**
Optional parameter for a call

@example
	api.post("create","/user/profile/").optional("phoneNumber","Phone Number");

@param {string} name of parameter
@param {string} desc description of parameter

@for RAPI.Method
@method optional
@chainable
**/
RAPI.Method.prototype.optional=function(name,desc,validate){
	this.params[name]={ desc: desc, validate: validate, optional:true };
	return this;
}

/**
Indicate this function performs longPolling

@example
	api.get("status","/server/:serverID/status").longPoll();

@for RAPI.Method
@method longPoll
@chainable
**/
RAPI.Method.prototype.longPoll=function(){
	this.options.noCache=true;
	this.options.longPoll=true;
	return this;
}

/**
Indicate this function should avoid caching

@example
	api.post("create","/user/profile/").noCache();

@for RAPI.Method
@method noCache
@chainable
**/
RAPI.Method.prototype.noCache=function(){
	this.options.noCache=true;
	return this;
}

RAPI.Method.prototype.renderBeforeTemplates=function(type,input){
	return RAPI.renderTemplates(this,"before",type,input);
}	
RAPI.Method.prototype.renderAfterTemplates=function(type,input){
	return RAPI.renderTemplates(this,"after",type,input);
}	

RAPI.Method.prototype.getBeforeTemplates=function(type){
	return RAPI.getTemplates(this,"before",type);
}	

RAPI.Method.prototype.getAfterTemplates=function(type){
	return RAPI.getTemplates(this,"after",type);
}	

RAPI.Method.prototype.addBeforeTemplate=function(type,template){
	RAPI.addTemplate(this,"before",type,template);
}

RAPI.Method.prototype.addAfterTemplate=function(type,template){
	RAPI.addTemplate(this,"after",type,template);
}


/**
Demand a file be provided for this method.

@example
	api.post("create","/user/profile/").demandFile("avatar","Users avatar image");

@for RAPI.Method
@method demandFile
@chainable
**/
RAPI.Method.prototype.demandFile=function(name,desc,validate){
	this.params[name]={ desc: desc, validate: validate, type:"demandFile" };
	return this;
}

/**
Specify that a file may optionally be provided as an input to this call.

@example
	api.post("create","/user/profile/").optionalFile("avatar","Users avatar image");

@for RAPI.Method
@method optionalFile
@chainable
**/
RAPI.Method.prototype.optionalFile=function(name,desc,validate){
	this.params[name]={ desc: desc, validate: validate, type:"optionalFile" };
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

@example
	api.get("load","/user/:userID").addPostCall(function(req,input,err,result,next){
		//Let's caclulate the users age:
		if(result && result.birthdate){
			result.age = User.calculateAge(result.birthdate);
		}	
		next();
	});

@for RAPI.Method
@method addPostCall
@chainable
**/
RAPI.Method.prototype.addPostCall=function(call){
	this.postCall.push(call);
	return this;
}


/**
Add a function that will be called after this call is completed

@param {function} call function to be called when this call is completed, which is passed the following parameters:
	@param {object} call.request  the ExpressJS / HTTP request object
	@param {object} call.input  the input parameters to the call
	@param call.err  the resulting err from the call
	@param {function} call.onComplete - to be called if the function wants to short circuit and return a result
	@param {function} call.next - to be called when the callback is completed, causing the next call back to be called

@example
	api.get("load","/user/:userID").addPreCall(function(req,input,err,onComplete,next){
		//If we have a user allow this call to complete
		if(req && req.session && req.session.user){
			next();
		//If not return an error 
		} else {
			return onComplete("Permission denied");
		}
	});

@for RAPI.Method
@method addPreCall
@chainable
**/
RAPI.Method.prototype.addPreCall=function(call){
	this.preCall.push(call);
	return this;
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
	RAPI.call("UserService.create",input,function(err,res){
		RAPI.log(err,res);
	});


@for RAPI
@method call
@static
**/
RAPI.call=function(name,input,onComplete,request){
	var output = {};
	
	
	var obj = RAPI.Object.findObject(name);
	if(!obj)
		throw ("Invalid object specified: "+name);
	
	var method = RAPI.Method.findMethod(name);
	
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
		if(param.demand && output[paramName]==undefined)
			throw ("Missing required parameter:" +paramName);
	}


	if(obj.instance){
		if(!obj.instance[method.name])
			throw ("Method not found on object instance: "+method.name);
				
			var preTasks = method.preCall.length;
			var runPreTaskFunctions=function(){
				if(preTasks>0){
					method.preCall[method.preCall.length-preTasks](request,output,onComplete,function(){
						preTasks--;
						runPreTaskFunctions();
					});
				} else {
					obj.instance[method.name](output,function(err,result){
							var postTasks = method.postCall.length;
							var runPostTaskFunctions=function(){
								if(postTasks>0){
									method.postCall[method.postCall.length-postTasks](request,output,err,result,function(){
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

RAPI.Object.wrap=function(objectName){
	var result = {};

	var obj = RAPI.Object.findObject(objectName);
	if(obj){
		for(var i in obj.methods){
			var method = obj.methods[i];
			(function(method){
				result[method.name]=function(input,onComplete,request){
					RAPI.log(method.getMethod(),input,onComplete,request);
					RAPI.call(method.getMethod(),input,onComplete,request);
				};	
			})(method);
		}	
	} else throw "Invalid object name specified";
	return result;
}


module.exports=RAPI;
