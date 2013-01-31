var Hop  = require('./lib/api');

Hop.enableCaching=function(options){
  
  Hop.cacheOptions=options||{};

  require('./lib/cache.js');
  require('./lib/cachemem.js');
  require('./lib/cacheredis.js');
}

Hop.enableEvents=function(){
  require('./lib/event.js');
  require('./lib/eventredis.js');
  require('./lib/socketio.js');
}


require('./lib/express.js');

Hop.enableJobs=function(){
  Hop.warn("Job support is expiremental at best");
  require('./lib/job.js');
  require('./lib/joblocal.js');
  require('./lib/jobredis.js');
}

require('./lib/test.js');
require('./lib/user.js');
require('./lib/model.js');

module.exports=Hop;
