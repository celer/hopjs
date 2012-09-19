var RAPI = require("./api");

/**
	Types
		{ 
			type? -> Primative types (Date,String,Boolean,Number,RegEx,Object, can recurse?, never Array) 
			subType -> (Int, ID, Float, Double, IDRef)
			model? -> Model (String name for model)
			asArray	-> t/f
			asObject -> { key: "FOO", key will be taken from the model or from the type if it is an object }
		}


**/


RAPI.camelHump=function(name){
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

RAPI.Type = function(){

}

RAPI.Type.prototype.ID=function(){
	this.subType=RAPI.Type.ID;
	return this;
}

RAPI.Type.prototype.model=function(modelName){
	this.object();
	this.model=modelName;
	return this;
}

RAPI.Type.prototype.object=function(){
	this.type="Object";
	return this;
}

RAPI.Type.prototype.file=function(){
	this.type="File";
	return this;
}

RAPI.Type.prototype.boolean=function(){
	this.type="Boolean";
	return this;
}

RAPI.Type.prototype.string=function(){
	this.type="String";
	return this;
}

RAPI.Type.prototype.double=function(){
	this.type="Number";
	this.subType=RAPI.Type.Float;
	return this;
}

RAPI.Type.prototype.float=function(){
	this.type="Number";
	this.subType=RAPI.Type.Float;
	return this;
}

RAPI.Type.prototype.integer=function(){
	this.type="Number";
	this.subType=RAPI.Type.Integer;
	return this;
}


RAPI.Type.prototype.date=function(){
	this.type="Date";
	return this;
}


RAPI.Type.prototype.isArray=function(){
	this.isArray=true;
	return this;
}

RAPI.ValidatedType = function(){

}

RAPI.ValidatedType.prototype = Object.create(RAPI.Type.prototype);

RAPI.ValidatedType.prototype.regexp=function(regex,regexMsg){
	this.regex=regex;
	this.regexMsg=regexMsg;
	return this;
}

RAPI.ValidatedType.prototype.range=function(min,max){
	this.range={ min: min, max: max};
	return this;
}

RAPI.ValidatedType.prototype.values=function(values){
	this.values=values;
	return this;
}


RAPI.Field=function(name){
	this.name=name;
}

RAPI.Field.prototype = Object.create(RAPI.ValidatedType.prototype);

RAPI.Type.JSON="JSON";
RAPI.Type.ID="ID";
RAPI.Type.Float="Float";
RAPI.Type.Integer="Integer";
RAPI.Type.Password="Password";

RAPI.Field.prototype.title=function(name){
	this.displayName=name;
	return this;
}

RAPI.Field.prototype.description=function(desc){
	this.desc=desc;
	return this;
}

RAPI.Models={};
RAPI.Model=function(name){
	this.name=name;
	this.tableName=name.toLowerCase();
	this.fields={};
	RAPI.Models[name]=this;
}

RAPI.Model.prototype.field=function(name){
	this.fields[name]=new RAPI.Field(name);
	return this.fields[name];
}

RAPI.defineModel=function(name,onDefine){
	var model = new RAPI.Model(name);
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
	RAPI.defineModel("User",function(model){
		model.field("name").string().regex(/[A-Za-z]{3,10}/,"Usernames must be between 3 - 10 characters long and can only contain A-Z  and a-z");
		model.field("id").integer().ID();
		model.field("email").string().title("Email");
	});

	RAPI.defineClass("User",new User(),function(api){
		api.post("create","/user").useModel("User");
		api.get("list","/user").inputModel(SearchModel).outputModel(UserModel);
	});
 

@for RAPI.Method
@chainable
@method model
**/
RAPI.Method.prototype.useModel=function(inputModel,outputModel){
	if(outputModel==undefined)
		outputModel=inputModel;

	if(inputModel){
		if(!RAPI.Models[inputModel]){
			throw "Invalid model specified:"+inputModel;
		}
		this.input=new RAPI.Type();
		this.input.model(inputModel);
	}
	if(outputModel){
		if(!RAPI.Models[outputModel]){
			throw "Invalid model specified:"+outputModel;
		}
		this.output=new RAPI.Type();
		this.output.model(outputModel);
	}
	return this;
}

/**
Use a model for the input 

@param {string} model Name of the model that is used as an input
@param {class} What the model is inputted as (Array is the only valid value)

@for RAPI.Method
@method inputModel
@chainable
**/
RAPI.Method.prototype.inputModel=function(inputModel,asWhat){
	if(inputModel){
		if(!RAPI.Models[inputModel]){
			throw "Invalid model specified:"+inputModel;
		}
		this.input=new RAPI.Type();
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

@for RAPI.Method
@method inputModel
@chainable
**/
RAPI.Method.prototype.outputModel=function(outputModel,asWhat){
	if(outputModel){
		if(!RAPI.Models[outputModel]){
			throw "Invalid model specified:"+outputModel;
		}
		this.output=new RAPI.Type();
		this.output.model(outputModel);
		
		if(asWhat==Array){
			this.output.isArray();
		}
	}
	return this;
}

/**
 This call returns a boolean value

@for RAPI.Method
@method returnsBoolean
@chainable
*/
RAPI.Method.prototype.returnsBoolean=function(){
	this.output=new RAPI.Type();
	this.output.boolean();
	return this;
}

/**
 This call returns a string value

@for RAPI.Method
@method returnsString
@chainable
*/
RAPI.Method.prototype.returnsString=function(){
	this.output=new RAPI.Type();
	this.output.string();
	return this;
}

/**
 This call returns a file

@for RAPI.Method
@method returnsString
@chainable
*/
RAPI.Method.prototype.returnsFile =function(){
	this.output=new RAPI.Type();
	this.output.file();
	return this;
}


/**
 This call returns a number value

@for RAPI.Method
@method returnsNumber
@chainable
*/
RAPI.Method.prototype.returnsNumber=function(){
	this.output=new RAPI.Type();
	this.output.number();
	return this;
}

