/*
Provides declarative model functionality

HopJS allows you to define models which can then be associated with various API calls to:
 * Improve client side stub generation
 * Reduce duplicate parameter descriptions

@module Hop
@submodule Model
*/
var Hop = require("./api");


Hop.addToJSONHandler(function(obj){
	obj.Models=Hop.Models;
});


Hop.camelHump=function(name){
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

Hop.Type = function(){
}

Hop.Type.prototype.password=function(){
	if(this.type==undefined) this.string();
	this.subType=Hop.Type.password;
	return this;
}

Hop.Type.prototype.ID=function(){
	this.subType=Hop.Type.ID;
	return this;
}

Hop.Type.prototype.model=function(modelName){
	this.object();
	this.model=modelName;
	return this;
}

Hop.Type.prototype.object=function(){
	this.type="Object";
	return this;
}

Hop.Type.prototype.file=function(){
	this.type="File";
	return this;
}

Hop.Type.prototype.boolean=function(){
	this.type="Boolean";
	return this;
}

Hop.Type.prototype.string=function(){
	this.type="String";
	return this;
}

Hop.Type.prototype.double=function(){
	this.type="Number";
	this.subType=Hop.Type.Float;
	return this;
}

Hop.Type.prototype.float=function(){
	this.type="Number";
	this.subType=Hop.Type.Float;
	return this;
}

Hop.Type.prototype.integer=function(){
	this.type="Number";
	this.subType=Hop.Type.Integer;
	return this;
}


Hop.Type.prototype.date=function(){
	this.type="Date";
	return this;
}


Hop.Type.prototype.isArray=function(){
	this.isArray=true;
	return this;
}

Hop.ValidatedType = function(){
}

Hop.ValidatedType.prototype = Object.create(Hop.Type.prototype);

Hop.ValidatedType.prototype.getValidatorLogic=function(){
	var str="";
	if(this.validators!=undefined){
		for(var i in this.validators){
			str+="if("+this.validators[i].test+") throw "+JSON.stringify(this.validators[i].msg)+";\n";
		}
	}
	return str;
}

Hop.ValidatedType.prototype.regexp=function(regex,regexMsg){
	this.regex=regex;
	this.regexMsg=regexMsg;
	this.validators=this.validators||[];
	this.validators.push({ test: "(!"+regex.toString()+".test(#VALUE.toString()))", msg: (regexMsg||"Invalid value")});
	return this;
}

Hop.ValidatedType.prototype.range=function(min,max){
	this.range={ min: min, max: max};
	this.validators=this.validators||[];
	if(min!=null){
		this.validators.push({ test: "(#VALUE < "+min.toString()+")", msg: "Value must be greater than "+min });
	}
	if(max!=null){
		this.validators.push({ test: "(#VALUE > "+max.toString()+")", msg: "Value must be less than "+max });
	}
	return this;
}

Hop.ValidatedType.prototype.values=function(values){
	this.values=values;
	
	this.validators=this.validators||[];
	if(values instanceof Array){
		this.validators.push({ test: "("+JSON.stringify(values)+".indexOf(#VALUE)==-1)", msg: "Valid values are: "+values.join(", ") });
	} else if(values instanceof Object){
		this.validators.push({ test: "("+JSON.stringify(Object.keys(values))+".indexOf(#VALUE)==-1)", msg: "Valid values are: "+Object.keys(values).join(", ") });
	}
	return this;
}


Hop.Field=function(name){
	this.name=name;
}

Hop.Field.prototype = Object.create(Hop.ValidatedType.prototype);

Hop.Type.JSON="JSON";
Hop.Type.ID="ID";
Hop.Type.Float="Float";
Hop.Type.Integer="Integer";
Hop.Type.Password="Password";

Hop.Field.prototype.title=function(name){
	this.displayName=name;
	return this;
}

Hop.Field.prototype.description=function(desc){
	this.desc=desc;
	return this;
}

Hop.Field.prototype.getValidator=function(){
	var logic = this.getValidatorLogic();
	logic=logic.replace(/\#VALUE/g,"input."+this.name);
	return logic;
}

Hop.Models={};
Hop.Model=function(name){
	this.name=name;
	this.tableName=name.toLowerCase();
	this.fields={};
	Hop.Models[name]=this;
}

Hop.Model.applyToMethod=function(method,model){
	var validator="";
	for(var paramName in method.params){
		if(model.fields[paramName]){
			if(method.params[paramName].desc==undefined && model.fields[paramName].desc!=undefined)
				method.params[paramName].desc=model.fields[paramName].desc;

				validator+="\t"+model.fields[paramName].getValidator()+"\n";	
		}	
	}
	if(validator!=""){
		console.log(validator);
		var func = new Function("req","input","onComplete","next",'try {' +validator +'} catch(e){ return onComplete(e); } next();');
	
		//func({},{},null,function(){},function(){});	
		console.log(func);
		
		method.addPreCall(func);
	}	
}

Hop.Model.prototype.field=function(name,title,description){
	var field = new Hop.Field(name);
	this.fields[name]=field;

	if(title!=undefined){
		field.title(title);
	}
	
	if(description!=undefined){
		field.description(description);
	}

	return field;
}

Hop.defineModel=function(name,onDefine){
	var model = new Hop.Model(name);
	onDefine(model);	
	return model;
}



/**
Use a model for both input and output

Models are used to provide meta data for both UI 
and api generation 

@param {object} inputObject Input model
@param {object} [outputModel] Output model

 * Models require a field called _name which specifies the name of the model
 * Models can have the following fields on types: 
   * type - The class name of the type, valid values are ( String, Number, Array, Object, Date, Boolean )
   * subtype - A subtype for the field "ID", "Float", "JSON", "IDRef", "Tags" 
   * regex - A regex used to validate the fields
   * regexMsg - A message which is displayed when the regex is not matched
   * title - A title for the field, for UI purposes
   * desc - A description of the field for UI purposes
   * values - An array or object which contains possible values for this field 

@example
	Hop.defineModel("User",function(model){
		model.field("name").string().regex(/[A-Za-z]{3,10}/,"Usernames must be between 3 - 10 characters long and can only contain A-Z  and a-z");
		model.field("id").integer().ID();
		model.field("email").string().title("Email");
	});

	Hop.defineClass("User",new User(),function(api){
		api.post("create","/user").useModel("User");
		api.get("list","/user").inputModel(SearchModel).outputModel(UserModel);
	});
 

@for Hop.Method
@chainable
@method model
**/
Hop.Method.prototype.useModel=function(inputModel,outputModel){
	if(outputModel==undefined)
		outputModel=inputModel;

	if(inputModel){
		if(!Hop.Models[inputModel]){
			throw "Invalid model specified:"+inputModel;
		}
		this.input=new Hop.Type();
		this.input.model(inputModel);
		Hop.Model.applyToMethod(this,Hop.Models[inputModel]);
	}
	if(outputModel){
		if(!Hop.Models[outputModel]){
			throw "Invalid model specified:"+outputModel;
		}
		this.output=new Hop.Type();
		this.output.model(outputModel);
	}
	return this;
}

/**
Use a model for the input 

@param {string} model Name of the model that is used as an input
@param {class} What the model is inputted as (Array is the only valid value)

@for Hop.Method
@method inputModel
@chainable
**/
Hop.Method.prototype.inputModel=function(inputModel,asWhat){
	if(inputModel){
		if(!Hop.Models[inputModel]){
			throw "Invalid model specified:"+inputModel;
		}
		this.input=new Hop.Type();
		Hop.Model.applyToMethod(this,Hop.Models[inputModel]);
		this.input.model(inputModel);

		if(asWhat==Array){
			this.input.isArray();
		}

	}
	
	return this;
}


/**
Use a model for the output

@param {string} model Name of the model that is returned
@param {class} What the model is returned as (Array is the only valid value)

@example
	//Returns an array of vehicles
	api.get("list","/vehicles").outputModel("Vehicle",Array);

@for Hop.Method
@method inputModel
@chainable
**/
Hop.Method.prototype.outputModel=function(outputModel,asWhat){
	if(outputModel){
		if(!Hop.Models[outputModel]){
			throw "Invalid model specified:"+outputModel;
		}
		this.output=new Hop.Type();
		this.output.model(outputModel);
		
		if(asWhat==Array){
			this.output.isArray();
		}
	}
	return this;
}

/**
 This call returns a boolean value

@for Hop.Method
@method returnsBoolean
@chainable
*/
Hop.Method.prototype.returnsBoolean=function(){
	this.output=new Hop.Type();
	this.output.boolean();
	return this;
}

/**
 This call returns a string value

@for Hop.Method
@method returnsString
@chainable
*/
Hop.Method.prototype.returnsString=function(){
	this.output=new Hop.Type();
	this.output.string();
	return this;
}

/**
 This call returns a file

@for Hop.Method
@method returnsString
@chainable
*/
Hop.Method.prototype.returnsFile =function(){
	this.output=new Hop.Type();
	this.output.file();
	return this;
}


/**
 This call returns a number value

@for Hop.Method
@method returnsNumber
@chainable
*/
Hop.Method.prototype.returnsNumber=function(){
	this.output=new Hop.Type();
	this.output.number();
	return this;
}

