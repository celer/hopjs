/**
Provides generator functionality for generating client stubs for other languauges

Hop can utilize its knowledge of your APIs to generate client side stubs for various languages. This module provides the core functionality for generators in such a way that
a new generator can be built with relative ease. 

 * Implemeneted generators can be found under /gen in the Hop root directory


## To use a generator

Hop tries to make it easy to generate client side code, to do so we use a command line utilility 'hopjs-gen'

To generate client side stubs for android for a specific website:

	hopjs-gen --url http://localhost:3000/ android --outputDir output/ --package com.foo

You might first want to make sure HopJS is installed locally

	npm install -g hopjs



## Creating a new generator
 1. Create a new directory under /gen - the directory will be the name of your generator
 2. Create a generator.json (see the android/generator.json for an example)
 3. Define some number of templates

#### Generators work by:
 * Asking for any required command line options as defiend in generator.json:demand and generator.json:optional
 * Fetching an API definition from URL/_hopjs/api.json
 * Loading any required utility functions as defined in generator.json:required
 * Determining the type of gernerator as specified by generator.json:generates
	 * If the generator type is 'file' then file pointed to by generator.json:template will be evaluated with { Objects, Models (and options passed in via the commandline ) }
	 * If the generator type is 'dir' then dir pointed to by generator.json:templateDir will be evaluated 
			* Files which have the basename _object will be evaluted one for each defined object with { object (and options passed in via the commandline ) }
			* Files which have the basename _model will be evaluted one for each defined model with { model (and options passed in via the commandline ) }

*generator.json:translatePath can be used for determining how templates get translated into the resulting output directory*

@module Hop
@submodule CodeGenerator
**/
var Hop = require('./api');
require("./express");
require('./remote');
var fs = require('fs');
var path = require('path');

/**
	@class Hop.CodeGenerator
*/
Hop.CodeGenerator = { };

Hop.CodeGenerator.genDir = path.join(path.dirname(module.filename),"../gen");



/** 
	Lists the various types of generators that exist

	@method Hop.CodeGenerator.list
	@static
*/
Hop.CodeGenerator.list = function(onComplete){
	fs.readdir(Hop.CodeGenerator.genDir,function(err,res){
		return onComplete(err,res);
	}); 
}

/** 
	Describe the current generator, aka get the generator.json
	
	@method Hop.CodeGenerator.describe
	@static
*/
Hop.CodeGenerator.describe=function(generator,onComplete){

		fs.readFile(path.join(Hop.CodeGenerator.genDir,generator,"generator.json"),function(err,_gen){
			if(err){
				return onComplete("The generator does not appear to have a 'generator.json' file: "+err.toString());
			}
			if(_gen) { 
				try {
					var generator = JSON.parse(_gen.toString());

					generator.name = generator;

					if(["file","dir"].indexOf(generator.generates)==-1){
						return onComplete("generator.json has an invalid generates property, must be 'file' or 'dir'");
					}
					if(generator.demand==undefined) {
						return onComplete("generator.json is missing a required field 'demand'");
					}
					if(generator.optional==undefined) {
						return onComplete("generator.json is missing a required field 'optional'");
					}
					if(generator.desc==undefined) {
						return onComplete("generator.json is missing a required field 'desc'");
					}

					return onComplete(null,generator);
				} catch(e){
					return onComplete("Invalid generator.json: "+e);
				}
			}
		});
}

Hop.CodeGenerator.getGenDir = function(generator){
	return path.join(Hop.CodeGenerator.genDir,generator);
}

Hop.CodeGenerator.walkDir=function(baseDir,dir,onItem,onAllComplete){ 
	fs.readdir(path.join(baseDir,dir),function(err,dirList){
		var eatItem=function(){
			if(dirList.length>0){
				var item = dirList.shift();
				fs.stat(path.join(baseDir,dir,item),function(err,stat){
					if(stat.isDirectory()){
						onItem(path.join(dir,item),stat,function(){
							Hop.CodeGenerator.walkDir(baseDir,path.join(dir,item),onItem,function(){
								eatItem();
							});
						});
					} else {
					 onItem(path.join(dir,item),stat,function(){
						 eatItem();
					 });	
					}
				});
			} else {
				onAllComplete();
			}
		}
		eatItem();
	}); 
}

/** 
	For generators that use a directory structure this will compute the output paths
	
	* The translatePath property in generator.json can be used to override this function
	
	@method Hop.CodeGenerator.toOutputFile 
	@static

*/
Hop.CodeGenerator.toOutputFile=function(genObj,options,inputItem,outputItem){
	if(genObj.translatePath){
		if(eval(genObj.translatePath)){
			return eval(genObj.translatePath)(genObj,options,inputItem,outputItem);
		} else {
			throw "The function specified in 'generator.json' for 'translatePath' is undefined.";
		}
	} else {
					var inFilename= path.basename(inputItem);
					var outDir = path.dirname(inputItem);
					if(outputItem==null){
						return path.join(options.outputDir,outDir,inFilename); 
					} else {
						var extname = path.extname(inputItem);
						var outFile = outputItem+extname;

						return path.join(options.outputDir,outDir,outFile);	
					} 
	}
} 

/** 
	This will generate the files utilized for unit test for this generator. 

	* The property 'testTemplate' in generator.json will be used as the input file for unit tests.
	* The properties Objects, TestCases, and Models will be passed into the context of the script		
	* The property 'output' in options will determine what the output file is called.


	@method Hop.CodeGenerator.generateTest
	@static
*/
Hop.CodeGenerator.generateTest=function(url,generator,options,onComplete){
	var errors = [];
	Hop.CodeGenerator.describe(generator,function(err,_gen){
				if(err) return onComplete(err);
			 Hop.remoteAPI(url,function(err,api){
					
					if(err) return onComplete(err);

					for(var i in _gen.require){
						require(path.join(Hop.CodeGenerator.genDir,generator,_gen.require[i]));
					}
					options.api = api._json; 
					
					Hop.remoteAPITest(url,function(err,apiTest){
						if(typeof _gen.testTemplate!="string")
							return onComplete("generator.json must contain a 'testTemplate' property");
						
						var templateDir = path.join("../gen",generator,(_gen.inputDir||""));
						var outputFile = options.output;
						options.TestCases=apiTest;
						options.Objects=options.api.Objects; 
						options.Models=options.api.Models; 
						var s = Hop.renderTemplate(path.join(templateDir,_gen.testTemplate))(options); 
						fs.writeFileSync(outputFile,s.toString());						
					}); 
			});
	});
}


/** 
	This will generate the files utilized for the stub api. 


	@method Hop.CodeGenerator.generate
	@static
*/
Hop.CodeGenerator.generate=function(url,generator,options,onComplete){
	var errors = [];
	Hop.CodeGenerator.describe(generator,function(err,_gen){
					if(err) return onComplete(err);
					Hop.remoteAPI(url,function(err,api){
						if(err) return onComplete(err);

						for(var i in _gen.require){
								require(path.join(Hop.CodeGenerator.genDir,generator,_gen.require[i]));
						}
						options.api = api._json; 


						if(_gen.generates=="dir"){
						
							var inputDir = path.join(Hop.CodeGenerator.genDir,generator,(_gen.inputDir||""));
							var templateDir = path.join("../gen",generator,(_gen.inputDir||""));
							
							fs.mkdir(options.outputDir,function(err){
								Hop.CodeGenerator.walkDir(inputDir,".",function(item,stat,onDone){
										if(stat.isFile()){
											if(/^\_object.*/.test(path.basename(item))){
												for(var i in api._json.Objects){
													options.object= api._json.Objects[i];
													try { 
														var s = Hop.renderTemplate(path.join(templateDir,item))(options);
														var outFile = Hop.CodeGenerator.toOutputFile(_gen,options,item,i);
														if(outFile!==false)
															fs.writeFileSync(outFile,s.toString());
													} catch(e){
														errors.push(path.join(templateDir,item)+": "+e);
													}
												}
												delete options.object;
												onDone();
											} else if(/^\_model.*/.test(path.basename(item))){
												for(var i in api._json.Models){
													options.model = api._json.Models[i];
													try { 
														var s = Hop.renderTemplate(path.join(templateDir,item))(options);
														var outFile = Hop.CodeGenerator.toOutputFile(_gen,options,item,i);
														if(typeof outFile=="string")
															fs.writeFileSync(outFile,s.toString());
													} catch(e){
														errors.push(path.join(templateDir,generator,item)+": "+e);
													}
												}
												delete options.model;
												onDone();
											} else {
												try { 
													var s = Hop.renderTemplate(path.join(templateDir,item))(options);
													var outFile = Hop.CodeGenerator.toOutputFile(_gen,options,item);
													if(typeof outFile=="string")
														fs.writeFileSync(outFile,s.toString());
												} catch(e){
													errors.push(path.join(templateDir,item)+": "+e);
												}
												onDone();
											}
										} else if(stat.isDirectory()){
											var dir = Hop.CodeGenerator.toOutputFile(_gen,options,item);
											if(typeof dir=="string"){
												fs.mkdir(dir,function(){
														onDone();
												}); 
											} else {
												onDone();
											} 
										}
									
								},function(err,res){
									if(errors.length>0) 
										return onComplete(errors.join("\n"));
									else return onComplete(null,null);
								}); 
							});
						} else {
							if(typeof _gen.template!="string")
								return onComplete("generator.json must contain a 'template' property");
							var templateDir = path.join("../gen",generator,(_gen.inputDir||""));
							var outputFile = options.output;
							options.Objects=options.api.Objects; 
							options.Models=options.api.Models; 
							var s = Hop.renderTemplate(path.join(templateDir,_gen.template))(options); 
							fs.writeFileSync(outputFile,s.toString());						

							}
					}); 
	});
}

