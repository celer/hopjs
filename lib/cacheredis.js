var RAPI = require('./api');
var crypto = require('crypto');

require('./cache');

var redis = require("redis");
var	client = redis.createClient();

client.on("error", function (err) {
		RAPI.log("Error " + err);
});


RAPI.Cache.store=function(cacheId,duration,req,input,err,result,next,force){
	var entry = {
		expiresAt: (duration*1000)+(new Date()).getTime(),
		cachedAt: new Date().getTime(),
		err: err,
		result: result
	};

	var md5 = crypto.createHash('md5');
	md5.update(cacheId+":"+entry.cachedAt);
	entry.etag = md5.digest('hex');
	req.getResponse().set('ETag',entry.etag);
	if(force)
		req.getResponse().set('Cache-Control','max-age='+Math.floor((entry.expiresAt - (new Date()).getTime())/1000.0));
	client.setex(cacheId,duration,JSON.stringify(entry));
	next();
}

RAPI.Cache.fetch=function(cacheId,duration,req,input,onComplete,next,force){
	client.get(cacheId,function(err,data){
		if(!err && data){
			try {
				RAPI.log("hit",JSON.parse(data));
				var entry = JSON.parse(data.toString());
				if(entry.expiresAt > (new Date()).getTime()){
						
					var md5 = crypto.createHash('md5');
					md5.update(cacheId+":"+entry.cachedAt);
					entry.etag = md5.digest('hex');
					req.getResponse().set('ETag',entry.etag);
					if(force)
						req.getResponse().set('Cache-Control','max-age='+Math.floor((entry.expiresAt - (new Date()).getTime())/1000.0));
					
					if(req.get('If-None-Match') == entry.etag){
						return req.getResponse().send("Not modified",304);
					} else {
						return onComplete(entry.err,entry.result);
					}
				} else return next();
			} catch(e){
				RAPI.error(e);
				return next();
			}
		} else return next();
	});
}

RAPI.Cache.invalidate=function(cacheId){
	RAPI.log("DELETING ",cacheId);
	client.del(cacheId);
}

