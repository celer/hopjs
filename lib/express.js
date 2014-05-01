var Hop = require('./api');
var Fire = require('fire-ts');
var fs = require('fs');
var path = require('path');
var util = require('hopjs-common');
var url = require('url');



Hop.expressAPI=function(basePath){

  Hop.basePath=basePath;
  Hop.hopjsURL=util.webpath.join(basePath,"/hopjs.js");
  Hop.docURL=util.webpath.join(basePath,"/");
  Hop.apiURL=util.webpath.join(basePath,"api.js");
  Hop.testURL=util.webpath.join(basePath,"test.js");

  var send=function(strFunc,mimeType){
    var apiChecksum = (Hop.checksum());
    return function(req,res){
      if(req.get("If-Non-Match")==apiChecksum){
        return res.send("Not modified",304);
      }
      res.set("ETag",apiChecksum);  
      res.contentType(mimeType||"application/json");
      res.send(strFunc());
    }
  }

  var template=function(templateName,mimeType){
      var apiChecksum = (Hop.checksum());
      return function(req,res){
        if(req.get("If-Non-Match")==apiChecksum){
          return res.send("Not modified",304);
        }
        if(req.query.url){
          var _url = url.parse(req.query.url);
          var srcURL = url.format({host: _url.host, protocol: _url.protocol, auth: _url.auth }); 
        }
        fs.readFile(path.join(cwd,templateName),function(err,data){
          try {
            var template = Fire.compile(data.toString());
            res.set('Content-Type', mimeType || 'text/html');
            res.set("ETag",apiChecksum);  
            res.send(template({ Hop: Hop, Objects: Hop.Objects, Models: Hop.Models, _csrf: (req.session?req.session._csrf:undefined), srcURL:srcURL }));
          } catch(e){
            Hop.error("Error parsing doc template",e.stack);
            res.send(500,"Error:"+e.toString());
          }
        });
    }
  }

  
  
  Hop.router.GET.add("/",{ call: template("static/doc.comb") });
  Hop.router.GET.add("/hopjs.js",{ call: template("static/hopjs.comb") });
  Hop.router.GET.add("/api.js",{ call: template("static/api.comb","application/javascript") });


  Hop.router.GET.add("/api.json",{call: send(function(){ return Hop.toJSON() }) });
  Hop.router.GET.add("/apitest.json",{ call: send(function(){ return JSON.stringify(Hop.TestCases) }) });
  Hop.router.GET.add("/apitest.js",{ call: send(function(){ return Hop.TestCase.toStandAlone()} ,"application/javascript") });

  if(Hop.enableUnitTests){
    Hop.router.GET.add("/test.js",{ call: template("static/test.comb","application/javascript") });
  }
 

  //FIXME decide on what to with absolute verses relative api paths
  return function(req,res,next){
    if(req.path.indexOf(basePath)==0){
      var url = req.path.substr(basePath.length);
      console.log("METHOD",req.method);
      var route = Hop.router[req.method].resolve(url);
      if(route) {
        req.params = route.params;
        if(route.data.method){
          route.data.method.expressHandler(req,res);
        } else if(route.data.call){
          route.data.call(req,res);
        }
      } else { 
        next();
      }
    } else {
      if(req.url.indexOf("/_hopjs")==0){
        return res.redirect(basePath+req.url.substr("/_hopjs".length));
      }
      next();
    }
  }
  
}


Hop.Method.prototype.expressHandler=function(req,res){
  var self=this;

  Hop._host = req.get("host");

  var input = {};

  if(req.body._hopRedirect || req.query._hopRedirect){
    var redirect = req.body._hopRedirect || req.query._hopRedirect;
  }

  if(req.body._hopTemplate || req.query._hopTemplate){
    var template = req.body._hopTemplate || req.query._hopTemplate;
  }

  for(var paramName in self.params){
    var param = self.params[paramName];
    var value=undefined;
    if(self.method=="get" || self.method=="del" || self.method=="delete")
      value = req.params[paramName] || req.query[paramName];
    else if(self.method=="post" || self.method=="put" || self.method=="patch") {
      if(req.files && (param.demandFile || param.optionalFile)){
        value = req.files[paramName];  
      } else if(req.body){
        value = req.params[paramName] || req.body[paramName];
      } else {
        value = req.params[paramName];
        
      }
    }
    if(param.demand && typeof value=="undefined"){
      return res.send(400,"Missing parameter:"+paramName);
    }
    input[paramName]=value;
  }
  
  req._response = res;
  req.getResponse=function(){ return res; };
  var called=false;


  self.call(input,function(err,result,statusCode){
      if(typeof statusCode!="undefined"){
        res.status(statusCode);
      }
      if(called){
        var m = self._object.name+"."+self.name;
        Hop.logCall(m,"warn","called onComplete twice");  
      } else {
        called=true;
        try {
          if(redirect)
            return res.redirect(redirect);
          if(template)
            return res.render(template,{ result: result, error: err, request: req});  

          if(err){
            err=self._object.callOnError(self,req,input,err);
            if(typeof err.send=="function"){
              err.send(res);
            } else {
              res.send(statusCode||500,err);
            }
          } else {
            if(result && result.send && typeof result.send=="function"){
              result.send(res);
            } else {
              if(result===null || result===undefined){
                res.send(statusCode||404,"Not found");
              } else { 
                if(self.output && self.output.model){
                  res.setHeader('Content-Type','application/json');
                  res.send(JSON.stringify(result));
                } else {
                  res.json(result);
                }
              }
            }
          }
        } catch(e){
          Hop.error(e.stack);
        }
      }
  },req,res);
}

/**
Inserts the Hop calls into express

@param {string} basePath 
  the path which the Hop will hang off of
@param {object} app 
  the express app

@for Hop
@method apiHook
**/
Hop.apiHook=function(basePath,app,options){

  
  app.get(util.webpath.join(basePath,"*"),function(req,res){
    if(req.params[0].indexOf("..")!=-1)
      return res.send(404,"Not found");
    var file = path.join(__dirname,"../static/_hopjs",req.params[0]);

    if(/\.comb$/.test(file) || /\.html\.fts/.test(file)){
      Fire.parse(file,{},function(err,templ){
        if(err) return res.send(500,err.toString());
        if(req.query.name){
          res.send(req.query.name+"="+templ.toString());
        } else {
          res.send(templ.toString());
        }
      });  
    } else {
      res.sendfile(file);
    }
  });
}

var cwd = path.join(path.dirname(module.filename),"../");


/**
Render a template using the cumbustion template engine

@param {string} filename The filename of the template relative to the "./static" path
@param {object} input The inputs to the template

@for Hop
@method renderTemplate
**/
Hop.renderTemplate=function(filename,input){
  input=input||{};
  try {
    var file = path.join(cwd,"static",filename);
    if(fs.existsSync(file)){
      var data = fs.readFileSync(file);
    } else {
      var data = fs.readFileSync(filename);
    }
    if(!data){
      return "Invalid template specified:"+filename;  
    }
    
    var _input={};
    for(var i in input){
      _input[i]=input[i];
    }
    _input.Hop=Hop;


    var template = Fire.compile(data.toString());
    return template;
  } catch(e){
    Hop.error(e);
    Hop.error(e.stack);
    return (file+":"+e.toString());
  }
}

module.exports=Hop;

