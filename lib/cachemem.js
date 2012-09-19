var RAPI = require('./api');
require('./cache');

RAPI.Cache._cache={};

RAPI.Cache.store=function(cacheId,duration,req,input,err,result,next){
	RAPI.log("store",cacheId,duration);
	RAPI.Cache._cache[cacheId] = { 
		expiresAt: (duration + (new Date()).getTime()),
		err: err,
		result: result
	};
	next();
}

RAPI.Cache.fetch=function(cacheId,duration,req,input,onComplete,next){
	RAPI.log("fetch",cacheId,duration);
	var entry = RAPI.Cache._cache[cacheId];
	if(entry){
		if(entry.expiresAt > (new Date()).getTime()){
			RAPI.log("hit",cacheId);
			return onComplete(entry.err,entry.result);	
		} else {
			return next();
		}
	} else {
		return next();
	}
}

RAPI.Cache.invalidate=function(cacheId){
	return RAPI.Cache._cache[cacheId];
}

RAPI.Cache.cleanUp=function(){
	for(var cacheId in RAPI.Cache._cache){
		var entry = RAPI.Cache._cache[cacheId];
		if(entry.expiresAt < (new Date().getTime())){
			RAPI.log("expire",cacheId);
			delete RAPI.Cache._cache[cacheId];
		}
	}
}

setInterval(RAPI.Cache.cleanUp,10*1000);
