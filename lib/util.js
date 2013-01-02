var path = require('path');

webpath = {};

//joining process for URL's, on windows will replace backslashes with forward.
webpath.join = function(){
	var pathArgs = [];
	
	for(var i in arguments){
		pathArgs.push(arguments[i]);		
	}
	var ret = path.join.apply(null,pathArgs);
	if(path.sep == "\\"){
		ret=ret.replace(/\\/g, "/");
	}
	return ret;
};

exports.webpath = webpath;

