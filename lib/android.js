fse = require('fs-extra');
var RAPI = require('./api');
require('./model');

var fs=require('fs');
var path=require('path');

RAPI.Android={};

RAPI.Type.prototype.toJavaType=function(){
	var coreType = "JSObject";
	if(this.type=="String") coreType="String";
	else if(this.type=="File") coreType="RAPIFile";
	else if(this.type=="Boolean") coreType="Boolean";
	else if(this.type=="Date") coreType="Date";
	else if(this.type=="Number"){
		 coreType="Number";
		 if(this.subType==RAPI.Type.Float) coreType="Double";
		 else if(this.subType==RAPI.Type.Integer) coreType="Integer";
		 else if(this.subType==RAPI.Type.ID) coreType="Long";
	} else if(this.type=="Object"){
		if(this.model!=undefined) coreType=RAPI.camelHump(this.model);
		else coreType="JSObject";
	}

	if(this.isArray===true){
		coreType = "List<"+coreType+">";
	}
	return coreType;
}


RAPI.Method.prototype.getJavaInputType=function(){
	var type = "JSObject";
	if(this.input){
		type = this.input.toJavaType();
	}
	return type;
}

RAPI.Method.prototype.getJavaOutputType=function(){
	var type = "JSObject";
	if(this.output){
		type = this.output.toJavaType();
	}
	return type;
}

RAPI.Android.getPackagePath=function(packageName){
	return packageName.replace(/\./g,"/");
}

RAPI.makeAndroid=function(outputDir,package){
	package = package || "us.slipangle.rapi";
	var cwd = path.join(path.dirname(module.filename),"../","static/android");
	
	var packageDir = RAPI.Android.getPackagePath(package);
	fse.mkdir(path.join(outputDir,packageDir),function(){

		if(RAPI.Models){
			for(var i in RAPI.Models){
				var model = RAPI.Models[i];
			
				var str = RAPI.renderTemplate("android/model.comb")({model:model,package: package});
				var modelName = model.name.replace(".","");

				var fileName = path.join(outputDir,packageDir,modelName+".java");
				fs.writeFileSync(fileName,str);
			}
		}


		for(var i in RAPI.Objects){
			var object = RAPI.Objects[i];
			var str = RAPI.renderTemplate("android/object.comb")({object:object,package: package});
			var objectName = object.name.replace(".","");

			var fileName = path.join(outputDir,packageDir,objectName+".java");
			fs.writeFileSync(fileName,str);
		}

		fs.readdir(cwd,function(err,files){
			for(var i in files){
				if(path.extname(files[i])==".java"){
					var inStr = RAPI.renderTemplate(path.join("android",files[i]))({ package: package });
					fs.writeFileSync(path.join(outputDir,packageDir,files[i]),inStr);
				}
			}
		});
	});

}
