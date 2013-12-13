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

Hop.Type.prototype.href=function(){
  if(this.type==undefined) this.string();
  this.subType=Hop.Type.href;
  return this;
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

Hop.Type.prototype.getConverterLogic=function(){
  var str="if(typeof #VALUE!=\'undefined\'){\n";
  if(this.converters!=undefined){
    for(var i in this.converters){
      str+="\t"+this.converters[i].convert+"\n";
    }
  }
  str+="}";
  return str;
}

Hop.Type.prototype.boolean=function(){
  this.type="Boolean";
  this.converters=this.converters||[];
  this.converters.push({ convert: "#VALUE=(#VALUE=='true' || #VALUE===true || #VALUE=='1' || #VALUE==true|| #VALUE=='checked');", priority:1 });
  return this;
}

Hop.Type.prototype.string=function(){
  this.type="String";
  return this;
}

Hop.Type.prototype.double=function(){
  this.type="Number";
  this.subType=Hop.Type.Float;
  this.converters=this.converters||[];
  this.converters.push({ convert: "#VALUE=parseFloat(#VALUE);", priority:1 });
  return this;
}

Hop.Type.prototype.float=function(){
  this.type="Number";
  this.subType=Hop.Type.Float;
  this.converters=this.converters||[];
  this.converters.push({ convert: "#VALUE=parseFloat(#VALUE);", priority:1 });
  return this;
}

Hop.Type.prototype.integer=function(){
  this.type="Number";
  this.subType=Hop.Type.Integer;
  this.converters=this.converters||[];
  this.converters.push({ convert: "#VALUE=parseInt(#VALUE);", priority:1 });
  return this;
}


Hop.Type.prototype.date=function(){
  this.type="Date";
  this.converters=this.converters||[];
  this.converters.push({ convert: "#VALUE=(/[0-9]+/.test(#VALUE)?new Date(parseInt(#VALUE)):new Date(#VALUE));", priority:1 });
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
  var preStr="";
  var t="\t";
  if(this.isArray===true){
    preStr+="\tif(!(#VALUE instanceof Array)) throw 'Invalid value: #VALUENAME';\n";
    if(this.validators!=undefined && this.validators.length>0){
      preStr+="\tfor(var i in #VALUE){\n";
      preStr+="\t\tvar _val = #VALUE[i];\n";
      t="\t\t";
    }
  }
  if(this.validators!=undefined){
    for(var i in this.validators){
      str+=t+"if("+this.validators[i].test+") throw "+JSON.stringify(this.validators[i].msg)+";\n";
    }
  }

  if(this.isArray===true){ 
    str=str.replace("#VALUE","_val");
    str=preStr+str;
    if(this.validators!=undefined && this.validators.length>0){
      str+="\t}\n";
    }
  }

  if(str.length>0){
    str="if(typeof #VALUE!=\'undefined\'){\n"+str+"}";
  }
  return str;
}

Hop.ValidatedType.prototype.regexp=function(regex,regexMsg){
  this.regex=regex;
  this.regexMsg=regexMsg;
  this.validators=this.validators||[];
  this.validators.push({ test: "#VALUE===null || (!"+regex.toString()+".test(#VALUE.toString()))", msg: ((regexMsg||"Invalid value")+": #VALUENAME")});
  return this;
}

Hop.ValidatedType.prototype.range=function(min,max){
  this.range={ min: min, max: max};
  this.validators=this.validators||[];
  if(min!=null){
    this.validators.push({ test: "#VALUE===null || (#VALUE < "+min.toString()+")", msg: "Value must be greater than "+min+": #VALUENAME" });
  }
  if(max!=null){
    this.validators.push({ test: "#VALUE===null || (#VALUE > "+max.toString()+")", msg: "Value must be less than "+max+": #VALUENAME" });
  }
  return this;
}

Hop.ValidatedType.prototype.values=function(values){
  this.values=values;
  
  this.validators=this.validators||[];
  if(values instanceof Array){
    this.validators.push({ test: "("+JSON.stringify(values)+".indexOf(#VALUE)==-1)", msg: "Valid values are: "+values.join(", ")+": #VALUENAME" });
  } else if(values instanceof Object){
    this.validators.push({ test: "("+JSON.stringify(Object.keys(values))+".indexOf(#VALUE)==-1)", msg: "Valid values are: "+Object.keys(values).join(", ")+": #VALUENAME" });
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
Hop.Type.href="HREF";

Hop.Field.prototype.title=function(name){
  this.displayName=name;
  return this;
}

Hop.Field.prototype.description=function(desc){
  this.desc=desc;
  return this;
}

Hop.Field.prototype.getConverter=function(){
  var logic = this.getConverterLogic();
  logic=logic.replace(/\#VALUE/g,"input."+this.name);
  return logic;
}

Hop.Field.prototype.getValidator=function(){
  var logic = this.getValidatorLogic();
  logic=logic.replace(/\#VALUENAME/g,this.name);
  logic=logic.replace(/\#VALUE/g,"input."+this.name);
  return logic;
}

Hop.Link=function(model,rel,href){
  this._model=model;
  this.rel=rel;
  this.href=href;
}

Hop.Link.prototype.validateMethod=function(method){
  if(this.call && method.getMethod()==this.call){
    if(method.input && method.input.model && method.input.model==this._model.name){
    } else {
      throw new Error("Cannot creat link '"+this.rel+"' to method '"+this.call+"' because the input model for the method is not set to '"+this._model.name+"'");
    }
  }
}

Hop.Link.prototype.toJSONSchema=function(){
  var ret = {};
  ret.rel = this.rel;
  ret.method = this.getMethod();
  if(ret.method=="get") delete ret.method;
  ret.href = this.getHREF();

  ret.href=ret.href.replace(/:([A-Za-z0-9\_\-]+)/gm,function(str,c){
    return "{"+c+"}";
  });

  return ret;
}

Hop.Link.prototype.method=function(method){
  this.method=method;
}

Hop.Link.prototype.title=function(title){
  this.title=title;
}

Hop.Link.prototype.call=function(call){
  //FIXME this should resolve to a method call
  this.call=call;
}

Hop.Link.prototype.getHREF=function(){
  if(this.href) return this.href;
  if(this.call){
    var method = Hop.Method.findMethod(this.call);
    if(!method){
      throw new Error("Unable to find method: " + this.call);
    }
    return method.getPath();
  }
}

Hop.Link.prototype.getMethod=function(){
  if(typeof this.method=="string")
    return this.method;
  if(typeof this.call=="string"){
    var method = Hop.Method.findMethod(this.call);
    if(!method){
      throw new Error("Unable to find method: " + this.call);
    }
    return method.method;
  } 
  return "get";
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
  var converter="";
  for(var paramName in method.params){
    if(model.fields[paramName]){
      if(method.params[paramName].desc==undefined && model.fields[paramName].desc!=undefined)
        method.params[paramName].desc=model.fields[paramName].desc;

        validator+=model.fields[paramName].getValidator();  
        converter+=model.fields[paramName].getConverter();  
      
    }  
  }
  if(validator!=""){
    var func = new Function("req","input","onComplete","next",'try {\n' +validator +'\n} catch(e){ return onComplete(e); } next();');
    method.addPreCall(func,"validation");
  }  
  if(converter!=""){
    var func = new Function("req","input","onComplete","next",'try {\n' +converter+'\n} catch(e){ return onComplete(e); } next();');
    method.addPreCall(func,"conversion");
  }  
  if(model.links){
    model.links.map(function(link){
      link.validateMethod(method);  
    });
  }

  method.addAfterTemplate("JavaScript","model/postJSMethod.comb");
  method.addAfterTemplate("Doc","model/postDocMethod.comb");
}

Hop.Model.prototype.toJSONSchema=function(){
  var types = [ "string","number","integer","boolean","object","array","null","any"];
  var ret = {};
  ret.name = this.name;
  ret.properties = {};
  for(var i in this.fields){
    var field = this.fields[i];
    ret.properties[i]={};
    if(field.displayName){ 
      ret.properties[i].title=field.displayName;
    }
    if(field.desc){ 
      ret.properties[i].description=field.desc;
    }


    if(field.type && types.indexOf(field.type.toLowerCase())!=-1){
      var type = field.type.toLowerCase();
      if(type=="object" && field.model){
        type=undefined;
        ref=field.model;
      }
    } else {
      type="any";
    }
    
    if(field.isArray===true){
      ret.properties[i].type="array";
      if(type){
        ret.properties[i].items={ type: type };
      } else if(ref){
        ret.properties[i].items={ "$ref":ref };
      }
    } else {
      if(type){
        ret.properties[i].type=type;
      } else if(ref){
        ret.properties[i].ref=ref;
      }
    }

    if(field.range){
      if(typeof field.range.min!="undefined"){
        ret.properties[i].min=field.range.min;  
        ret.properties[i].exclusiveMinimum=true;
      }
      if(typeof field.range.max!="undefined"){
        ret.properties[i].max=field.range.max;
        ret.properties[i].exclusiveMaximum=true;
      }
    }
    

    if(field.regex){
      ret.properties[i].pattern=field.regex.toString();
    }  

    if(field.values){
      if(field.values instanceof Array){
        ret.properties[i].enum=field.values;
      } else {
        ret.properties[i].enum=Object.keys(field.values);
      }
    }


  }
  if(this.links){
    ret.links=[];
    this.links.map(function(link){
      ret.links.push(link.toJSONSchema());
    });
  }

  return ret;  
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


Hop.Model.prototype.link=function(rel,href){
  if(!this.links){
    this.links=[];
  }  
  var link = new Hop.Link(this,rel,href);
  this.links.push(link);
  return link;
}

Hop.addBeforeTemplate("JavaScript","model/preJSHop.comb");
Hop.addBeforeTemplate("Doc","model/preDocHop.comb");

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

module.exports=Hop;
