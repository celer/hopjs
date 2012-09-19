var RAPI = require('./api');
var combustion = require('combustion')();
var fs = require('fs');
var path = require('path');


/**
Inserts the RAPI calls into express

@param {string} basePath the path which the RAPI will hang off of
@param {object} app the express app

@for RAPI
@method apiHook
**/
RAPI.apiHook=function(basePath,app){
	RAPI.basePath=basePath;
	for(var objectName in RAPI.Objects){
		var obj = RAPI.Objects[objectName];
		for(var methodName in obj.methods){
			var method = obj.methods[methodName];
			RAPI.log(method.method,method.path);	
			(function(obj,method){
							app[method.method](path.join(basePath,method.path),function(req,res){
								RAPI.log("-",method.method,method.path);	

								var input = {};
	
								for(var paramName in method.params){
									var param = method.params[paramName];
				
									var value=undefined;
									if(method.method=="get" || method.method=="del")
										value = req.params[paramName] || req.query[paramName];
									else if(method.method="post" || method.method=="put") {
										if(req.body)
											value = req.params[paramName] || req.body[paramName];
										else
											value = req.params[paramName];
									}
									input[paramName]=value;
								}
								//try {
									req._response = res;
									req.getResponse=function(){ return res; };
									RAPI.call(obj.name+"."+method.name,input,function(err,result){
											try {
												if(err){
													res.send(500,err);
													RAPI.error(err);
												} else {
													if(result instanceof RAPI.File){
														res.sendfile(result.file);
													} else {
														res.json(result);
													}
												}
											} catch(e){
												RAPI.error(e);
											}
									},req);
								/*
								} catch(e){
									res.send(500,e.toString()+"\n"+e.stack());	
								}*/
							});
			})(obj,method);
		}
	}
	var cwd = path.join(path.dirname(module.filename),"../");
	RAPI.docURL = path.join(basePath,"/");
	app.get(path.join(basePath,"/"),function(req,res){
		var apiChecksum = (RAPI.checksum());
		if(req.get("If-Non-Match")==apiChecksum){
			return res.send("Not modified",304);
		}
		fs.readFile(path.join(cwd,"static/doc.comb"),function(err,data){
			var template = combustion(data.toString());
			res.set('Content-Type', 'text/html');
			res.set("ETag",apiChecksum);	
			res.send(template(RAPI));
		});
	});
	RAPI.apiURL = path.join(basePath,"api.js");
	app.get(path.join(basePath,"api.js"),function(req,res){
		var apiChecksum = (RAPI.checksum());
		if(req.get("If-Non-Match")==apiChecksum){
			return res.send("Not modified",304);
		}
		var file = path.join(cwd,"static/api.comb");
		console.log("FILE",file);
		fs.readFile(file,function(err,data){
			try {
				console.log(file,data.toString());
				var template = combustion(data.toString());
			

				res.set('Content-Type', 'application/javascript');
				res.set('Content-Type', 'text/html');
				res.set("ETag",apiChecksum);	
				res.set("RAPI-Checksum",apiChecksum);
				res.send(template(RAPI));

			} catch (e){
				RAPI.error("Error parsing : api.js",e);
				RAPI.error(e.stack());
			}
		});
	});
	RAPI.testURL=path.join(basePath,"test.js");
	app.get(path.join(basePath,"test.js"),function(req,res){
		var apiChecksum = (RAPI.checksum());
		if(req.get("If-Non-Match")==apiChecksum){
			return res.send("Not modified",304);
		}
		fs.readFile(path.join(cwd,"static/test.comb"),function(err,data){
			var template = combustion(data.toString());
			res.set('Content-Type', 'application/javascript');
			res.set("ETag",apiChecksum);	
			res.send(template(RAPI));
		});
	});
}

var cwd = path.join(path.dirname(module.filename),"../");
RAPI.log(cwd);
/**

@param {string} filename The filename of the template relative to the "./static" path
@param {object} input The inputs to the template

@for RAPI
@method renderTemplate
**/
RAPI.renderTemplate=function(filename,input){
	RAPI.log(filename,input);
	try {
		var file = path.join(cwd,"static",filename);
		var data = fs.readFileSync(file);
		if(!data){
			return "Invalid template specified:"+cwd;	
		}
		var template = combustion(data.toString(),input);
		return template;
	} catch(e){
		RAPI.error(e);
		RAPI.error(e.stack());
		return (file+":"+e.toString());
	}
}


