var Hop = require('./cache');

Hop.Cache._cache={};

Hop.Cache.store=function(cacheId,duration,req,input,err,result,next){
  Hop.log("store",cacheId,duration);
  Hop.Cache._cache[cacheId] = { 
    expiresAt: (duration + (new Date()).getTime()),
    err: err,
    result: result
  };
  next();
}

Hop.Cache.fetch=function(cacheId,duration,req,input,onComplete,next){
  Hop.log("fetch",cacheId,duration);
  var entry = Hop.Cache._cache[cacheId];
  if(entry){
    if(entry.expiresAt > (new Date()).getTime()){
      Hop.log("hit",cacheId);
      return onComplete(entry.err,entry.result);  
    } else {
      return next();
    }
  } else {
    return next();
  }
}

Hop.Cache.invalidate=function(cacheId){
  return Hop.Cache._cache[cacheId];
}

Hop.Cache.cleanUp=function(){
  for(var cacheId in Hop.Cache._cache){
    var entry = Hop.Cache._cache[cacheId];
    if(entry.expiresAt < (new Date().getTime())){
      Hop.log("expire",cacheId);
      delete Hop.Cache._cache[cacheId];
    }
  }
}

setInterval(Hop.Cache.cleanUp,10*1000);
