var path = require('path');
var fs = require('fs');
var util = require('hopjs-common');

Apple={};

Apple.webPathJoin=util.webpath.join;

Apple.mkdirpSync=function(base,dir){
  var d = dir.split(path.sep);
 
  var dir = d.shift();;
 
  while(dir!=null){
    try {
      fs.mkdirSync(path.join(base,dir));
    } catch(e){
    }
    base = path.join(base,dir);
    dir = d.shift();
  }

}

Apple.translatePath=function(genObj,options,inputItem,outputItem){
  var inFilename= path.basename(inputItem);
  var outDir = path.dirname(inputItem);

	var match = /_projectName(_([a-z]+))?/.exec(inFilename);
	if(match!=null && match[2]!=undefined){
		var type = match[2];
		if(options.type != type){
			return false;
		}
	}
	inFilename = inFilename.replace(/_projectName(_([a-z]+))?/,options.projectName);
	var match = /_projectName(_([a-z]+))?/.exec(outDir);
	if(match!=null && match[2]!=undefined){
		var type = match[2];
		if(options.type != type){
			return false;
		}
	}
	outDir = outDir.replace(/_projectName(_([a-z]+))?/,options.projectName);
	

  Apple.mkdirpSync(options.outputDir,outDir);

  if(outputItem==null){
    return path.join(options.outputDir,outDir,inFilename); 
  } else {
    var extname = path.extname(inputItem);
    var outFile = Apple.camelHump(outputItem)+extname;

    return path.join(options.outputDir,outDir,outFile);  
  } 
}


Apple.camelHump=function(name){
	var fs = [".","_","-"];
	var str = "";
	for(var i =0 ; i<name.length;i++){
		if(i==0){
			str+=name[i].toUpperCase();	
		} else if(fs.indexOf(name[i])!=-1){
			i++;
			str+=name[i].toUpperCase();	
		} else {
			str+=name[i];
		}	
	}
	return str;
}



Apple.modelFieldToAppleType=function(field){
	var coreType = "JSObject";
	if(field.type=="String") coreType="String";
	else if(field.type=="File") coreType="AppleFile";
	else if(field.type=="Boolean") coreType="Boolean";
	else if(field.type=="Date") coreType="Date";
	else if(field.type=="Number"){
		 coreType="Number";
		 if(field.subType=="Float") coreType="Double";
		 else if(field.subType=="Integer") coreType="Integer";
		 else if(field.subType=="ID") coreType="Long";
	} else if(field.type=="Object"){
		if(field.model!=undefined) coreType=Apple.camelHump(field.model);
		else coreType="JSObject";
	}

	if(field.isArray===true){
		coreType = "List<"+coreType+">";
	}
	return coreType;
}


Apple.methodGetAppleInputType=function(method){
	var type = "JSObject";
	if(method.input){
		type = Apple.modelFieldToAppleType(method.input);
	}
	return type;
}

Apple.methodGetAppleOutputType=function(method){
	var type = "JSObject";
	if(method.output){
		type = Apple.modelFieldToAppleType(method.output);
	}
	return type;
}

Apple.getPackagePath=function(packageName){
	return packageName.replace(/\./g,"/");
}

