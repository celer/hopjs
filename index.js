var Hop  = require('./lib/api');

Hop.enableCaching=function(options){
  
  Hop.cacheOptions=options||{};

  require('./lib/cache.js');
  require('./lib/cachemem.js');
  require('./lib/cacheredis.js');
}

require('./lib/express.js');

require('./lib/test.js');
require('./lib/user.js');
require('./lib/model.js');

module.exports=Hop;
