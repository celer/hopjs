var path = require('path');
var fs = require('fs');

Java={};

Java.mkdirpSync=function(base,dir){
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

Java.translatePath=function(genObj,options,inputItem,outputItem){
  var inFilename= path.basename(inputItem);
  var outDir = path.dirname(inputItem);

  var packageDir = (options.package.replace(/\./g,path.sep ));
	console.log("Package:", packageDir);
    
  if(/_package/.test(outDir)){
      var _outDir = outDir.replace("_package",packageDir);
      Java.mkdirpSync(options.outputDir,_outDir);
      outDir = _outDir;
  }
  
  if(/_package/.test(inFilename)){
    inFilename = inFilename.replace("_package",packageDir);
  }

  if(outputItem==null){
    return path.join(options.outputDir,outDir,inFilename); 
  } else {
    var extname = path.extname(inputItem);
    var outFile = Java.camelHump(outputItem)+extname;

    return path.join(options.outputDir,outDir,outFile);  
  } 
}


Java.camelHump=function(name){
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



Java.modelFieldToJavaType=function(field){
	var coreType = "JSObject";
	if(field.type=="String") coreType="String";
	else if(field.type=="File") coreType="JavaFile";
	else if(field.type=="Boolean") coreType="Boolean";
	else if(field.type=="Date") coreType="Date";
	else if(field.type=="Number"){
		 coreType="Number";
		 if(field.subType=="Float") coreType="Double";
		 else if(field.subType=="Integer") coreType="Integer";
		 else if(field.subType=="ID") coreType="Long";
	} else if(field.type=="Object"){
		if(field.model!=undefined) coreType=Java.camelHump(field.model);
		else coreType="JSObject";
	}

	if(field.isArray===true){
		coreType = "List<"+coreType+">";
	}
	return coreType;
}


Java.methodGetJavaInputType=function(method){
	var type = "JSObject";
	if(method.input){
		type = Java.modelFieldToJavaType(method.input);
	}
	return type;
}

Java.methodGetJavaOutputType=function(method){
	var type = "JSObject";
	if(method.output){
		type = Java.modelFieldToJavaType(method.output);
	}
	return type;
}

Java.getPackagePath=function(packageName){
	return packageName.replace(/\./g,"/");
}

