/**
Implements server-side and client side caching

@module Hop
@submodule Cache

**/
var Hop = require('./api');

/**
	Specifies a cache Id to invalidate.
	
	This function is used to delete an item from the cache, so for 
	example on an HTTP DEL command it may be desirable to delete
	an associated cache object.

	The specified cache ID will attempt to substitude variables
	in the id with those from the input, or from the user. 

	@param {string} cacheId the id for the cached item

	@chainable
	@for Hop.Method
	@method cacheInvalidate
**/
Hop.Method.prototype.cacheInvalidate=function(cacheId){
	var self=this;
	self.addPreCall(function(req,input,onComplete,next){
		var _cacheId = Hop.Cache.resolvePath(cacheId,req,input);	
		Hop.Cache.invalidate(_cacheId);
		next();
	});
	return this;
}

/**
	Specifies a cache Id to use for storing the result of this call.
	
	This funciton is used to specify a cache id for the result
	causing the result to be associated with the id. 

	The specified cache ID will attempt to substitude variables
	in the id with those from the input, or from the user. 

	@param {string} cacheId the id for the cached item
	@param {number} duration that the number of seconds result will be cached for
	@param {force} attempt to force the client side to cache the result for the specified duration, this will essentially mean the client side will not request the item again until expiration 

	@chainable
	@for Hop.Method
	@method cacheId
**/
Hop.Method.prototype.cacheId=function(cacheId,duration,force){
	var self=this;
	duration=duration||(5*60);
	self.addPreCall(function(req,input,onComplete,next){
		var _cacheId = Hop.Cache.resolvePath(cacheId,req,input);	
		Hop.Cache.fetch(_cacheId,duration,req,input,onComplete,next,force);
	});
	self.addPostCall(function(req,input,err,result,onComplete){
		var _cacheId = Hop.Cache.resolvePath(cacheId,req,input);	
		Hop.Cache.store(_cacheId,duration,req,input,err,result,onComplete,force);
	});
	return this;
}

/**
	Specifies a cache lambda for this call.
	
	This funciton is used to specify a cache lambda
	which will determine how the result is cached.
	
	@param {function} cacheFunc
		@param {function} cacheFunc.when Used to indicate when this cache function was evaluated, valid values are "before" and "after"
		@param {function} cacheFunc.cache The cache object, which is used to return an action
		@param {function} cacheFunc.cache.id return the result of this function to specify the result should be cached
		@param {string} cacheFunc.cache.id.id The cache id
		@param {number} cacheFunc.cache.id.duration The duration in seconds to cache the result for
		@param {function} cacheFunc.cache.invalidate return the result of this function to specify the result should be invalidated
		@param {string} cacheFunc.cache.invalidate.id The cache id
		@param {object} cacheFunc.req the Express/HTTP request object
		@param {object} cacheFunc.input the input parameters for the call
		@param {object} cacheFunc.error the error as a result of calling this function (only valid after the call)
		@param {object} cacheFunc.result the result of this function (only valid after the call)

@example
		Hop.defineClass("Comment",new Comment(),function(api){
			//This will cause the list to always attempt to hit the cache
			api.get("list","/comment").cacheId("/comment/list/:start/:size").demand("start").demand("size").defaults({start:0, size:25});
			api.del("delete","/comment/:commentId").cacheInvalidate("/comment/:commentId").demand("commentId");
			api.get("load","/comment/:commentId").cache(function(when,cache,req,input,err,result){
				if(Hop.hasUser(req)){
					var userId = Hop.User.id(req);
					//If we have a user, and that user is the one who posted the comment don't show a cached copy
					if(userId == input.userId){
						return false;
					}
				} else return cache.id("/comment/:commentId",60*5);
			}).demand("commentId");
			api.post("update","/comment/:commentId").cacheInvalidate("/comment/:commentId").demand("commentId");
		});

	@chainable
	@for Hop.Method
	@method cache
**/
Hop.Method.prototype.cache=function(cacheFunc){
	var cache = new Hop.Cache();
	
	var self=this;
	self.addPreCall(function(req,input,onComplete,next){
		var res = cacheFunc("before",cache,req,input);
		if(res && res.what){
			if(res.what=="store"){
				var cacheId = Hop.Cache.resolvePath(res.id,req,input);	
				Hop.Cache.fetch(cacheId,res.duration,req,input,onComplete,next,res.force);
			} else if(res.what=="invalidate"){
				var cacheId = Hop.Cache.resolvePath(res.id,req,input);	
				Hop.Cache.invalidate(cacheId);
				return next();
			}
		} else return next(); 
	});
	self.addPostCall(function(req,input,err,result,onComplete){
		var res = cacheFunc("after",cache,req,input,err,result);
		if(res && res.what){
			if(res.what=="store"){
				var cacheId = Hop.Cache.resolvePath(res.id,req,input);	
				Hop.Cache.store(cacheId,res.duration,req,input,err,result,onComplete,res.force);
			} else if(res.what=="invalidate"){
				var cacheId = Hop.Cache.resolvePath(res.id,req,input);	
				Hop.Cache.invalidate(cacheId);
				return next();
			};
		}
		return onComplete();
	});
	return this;
}

Hop.Cache = function(){

}

Hop.Cache.resolvePath=function(path,req,input){
	var request=req;
	return path.replace(/:([^\/]+)/g,function(m,s){
		if(s){
			try {
				with(input){
					var v = eval(s);
					if(v==undefined){
						throw "Undefined value found in cache path: "+s;
					}
				}
				return v.toString();
			} catch(e){
				throw "Error in cache path: "+s+" is "+e;
			}
		}
	});

}

Hop.Cache.store=function(cacheId,duration,req,input,err,result,next){
	Hop.warn("Hop Caching is disabled");
	next();
}

Hop.Cache.fetch=function(cacheId,duration,req,input,onComplete,next){
	Hop.warn("Hop Caching is disabled");
	next();
}

Hop.Cache.invalidate=function(cacheId){
	Hop.warn("Hop Caching is disabled");
}

Hop.Cache.prototype.id=function(cacheId,duration,force){
	return { id: cacheId, duration: duration, what: "store", force: force };
}

Hop.Cache.prototype.invalidate=function(cacheId){
	return { id: cacheId, what: "invalidate" };
}
