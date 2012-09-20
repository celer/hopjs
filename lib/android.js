fse = require('fs-extra');
var Hop = require('./api');
require('./model');

var fs=require('fs');
var path=require('path');

Hop.Android={};

/**
	Convert this type to a java type

	@for Hop.Type
	@method toJavaType
**/
Hop.Type.prototype.toJavaType=function(){
	var coreType = "JSObject";
	if(this.type=="String") coreType="String";
	else if(this.type=="File") coreType="HopFile";
	else if(this.type=="Boolean") coreType="Boolean";
	else if(this.type=="Date") coreType="Date";
	else if(this.type=="Number"){
		 coreType="Number";
		 if(this.subType==Hop.Type.Float) coreType="Double";
		 else if(this.subType==Hop.Type.Integer) coreType="Integer";
		 else if(this.subType==Hop.Type.ID) coreType="Long";
	} else if(this.type=="Object"){
		if(this.model!=undefined) coreType=Hop.camelHump(this.model);
		else coreType="JSObject";
	}

	if(this.isArray===true){
		coreType = "List<"+coreType+">";
	}
	return coreType;
}


/**
	Convert the input for this call to a java type

	@for Hop.Method
	@method getJavaInputType
**/
Hop.Method.prototype.getJavaInputType=function(){
	var type = "JSObject";
	if(this.input){
		type = this.input.toJavaType();
	}
	return type;
}

/**
	Convert the output for this call to a java type

	@for Hop.Method
	@method getJavaOutputType
**/
Hop.Method.prototype.getJavaOutputType=function(){
	var type = "JSObject";
	if(this.output){
		type = this.output.toJavaType();
	}
	return type;
}

Hop.Android.getPackagePath=function(packageName){
	return packageName.replace(/\./g,"/");
}

Hop.makeAndroid=function(outputDir,package){
	package = package || "us.slipangle.rapi";
	var cwd = path.join(path.dirname(module.filename),"../","static/android");
	
	var packageDir = Hop.Android.getPackagePath(package);
	fse.mkdir(path.join(outputDir,packageDir),function(){

		if(Hop.Models){
			for(var i in Hop.Models){
				var model = Hop.Models[i];
			
				var str = Hop.renderTemplate("android/model.comb")({model:model,package: package});
				var modelName = model.name.replace(".","");

				var fileName = path.join(outputDir,packageDir,modelName+".java");
				fs.writeFileSync(fileName,str);
			}
		}


		for(var i in Hop.Objects){
			var object = Hop.Objects[i];
			var str = Hop.renderTemplate("android/object.comb")({object:object,package: package});
			var objectName = object.name.replace(".","");

			var fileName = path.join(outputDir,packageDir,objectName+".java");
			fs.writeFileSync(fileName,str);
		}

		fs.readdir(cwd,function(err,files){
			for(var i in files){
				if(path.extname(files[i])==".java"){
					var inStr = Hop.renderTemplate(path.join("android",files[i]))({ package: package });
					fs.writeFileSync(path.join(outputDir,packageDir,files[i]),inStr);
				}
			}
		});
	});
}
