(function($){


  var start=function(element){
    var $p = element;
    
    //Capture all templates
    $p.find("[data-foreach]").each(function(i,e){
      var template = $(e).children();
      $(e).children().detach();
      if(!$(e).data("template")){
        $(e).data("template",template);
      }
    });


    //Hook all the forms
    var types = ["button","input"];
    types.map(function(type){
      $p.find(type+"[type=submit][data-call]").each(function(i,e){
        var $e = $(e);
        $e.parents("form").submit(function(e){
          e.preventDefault();
          submitForm($e);
          return false;
        });

      });
    });

    //Do all calls
    $p.find("[data-type=list][data-call]").each(function(i,e){
      call($(e));
    });

    //Do all the links
    $p.find("a[data-call]").each(function(i,e){
      $(e).click(function(e){
        e.preventDefault(); 
        call($(this));
        return false;
      });
    });
    
    $p.find("a[data-list-action]").each(function(i,e){
      var action = $(e).attr("data-list-action");
      if(action=="next" || action=="prev"){
        (function(action){
          var $l = $(e);
          $(e).click(function(e){
            e.preventDefault(); 
            if(action=="next") listNextPage($l);
            if(action=="prev") listPrevPage($l);
            return false;
          });
        })(action);
      }
    });

  }

  var listNextPage=function($e){
    var $list=($e.parents("[data-type]"));
    var pageVar = $list.attr("data-page-var");
    var pageSize = $list.attr("data-page-size");
   
    var input = JSON.parse($list.attr("data-input") || {});
    if(typeof input[pageVar]=="undefined"){
      input[pageVar]=(1*pageSize);
    } else {
      input[pageVar]+=(1*pageSize);
    }
    $list.attr("data-input",JSON.stringify(input)); 
   
   
    call($list);
  }

  var listPrevPage=function($e){
    var $list=($e.parents("[data-type]"));
    var pageVar = $list.attr("data-page-var");
    var pageSize = $list.attr("data-page-size");
   
    var input = JSON.parse($list.attr("data-input") || {});
    if(typeof input[pageVar]=="undefined"){
      input[pageVar]=0;
    } else {
      input[pageVar]-=(1*pageSize);
      if(input[pageVar]<0)
        input[pageVar]=0;
    }
    $list.attr("data-input",JSON.stringify(input)); 
    call($list);
  }


  var handleListAction=function($e){
    var action = $e.attr("data-list-action");
    if(action){
      var list = $e.parents("[data-type=list]");
      var idProp = $e.parents("[data-id]").attr("data-id");
      var id = null;

      $e.parents("[data-id]").attr("class").split(" ").map(function(i){
        if(/^hop-id/.test(i)){
          id = i.replace("hop-id-","");          
        }
      });

      if(action=="delete"){
        deleteListItem($(list),id);
      }
    }
  }


  var evalElement=function(element,value){
    if(element instanceof Array){
      element.map(function(e){
        evalElement($(e),value);
      });
    } else {
      var $c = element;
      with(value){
        if($c.attr("data-id")){
          if(typeof value[($c.attr("data-id"))]!="undefined"){
            $c.addClass("hop-id-"+eval($c.attr("data-id")));
          }
        }
        if($c.attr("data-input")){
          var di = $c.attr("data-input");
          for(var i in value){
            if(typeof value[i]!="undefined"){
              di = di.replace("${"+i+"}",value[i]+"");
            }
          }
          $c.attr("data-input",di);
        }
        if($c.attr("data-value")){
          try { 
            if(typeof eval($c.attr("data-value"))!="undefined"){
              $c.val(eval($c.attr("data-value")));
            }
          } catch(e){
      
          }
        }
        if($c.attr("data-contents")){
          if(typeof value[$c.attr("data-contents")]!="undefined"){
            $c.html(eval($c.attr("data-contents")));
          }
        }
        if($c.attr("data-foreach")){
          var j = $c.attr("data-foreach");
          $c.empty();
          for(var i in value[j]){
            var val = value[j][i];
            var nn = $c.data("template");  
            var cc = nn.clone();
            evalElement(cc.get(),val);
            cc.show();
            $c.append(cc);
            //walkElements(jnn,val);
          }
          start($c);
        }
      }
     
      $c.children().each(function(i,e){
        evalElement($(e),value);
      }); 

    }
  }
  
  var getTarget=function($e){
    if(!$e) return undefined;
    var target= $e.attr("data-target");
    if(target) return (target);
    else return undefined;
  }

  var getCall=function($e){
    return $e.attr("data-call");
  }

  var getInput=function($e){
    var input = $e.attr("data-input")
    if(!input){
      input = {};
      return input;
    } else { 
      var i = undefined;
      //FIXME
      eval("i="+input);
      return i;
    }
  }

  var call=function($e,input,onComplete){
    var call = getCall($e);
    var input = input||getInput($e);
    var target = getTarget($e);
    
    var fn = eval(call);

    if(!fn){
      console.error("Invalid method",call);
    }   

    for(var i in fn.params){
      var p = fn.params[i];
      if(p.demand && typeof input[i]=="undefined"){

      }
    }

    $e.attr("data-input",JSON.stringify(input));

    fn.call(null,input,function(err,res){
      if(target){
        evalElement($(target),{ error: err, result: res});
      } else {
        evalElement($e,{ error: err, result: res});
      }
      handleListAction($e,input,err,res);
      if(onComplete) onComplete(err,res);
    });
  }

  //Use this on the button, not on the form
  var submitForm=function($e,input,onComplete){
    var call = getCall($e);
    var input = input||getInput($e);
    var target = getTarget($e);
    
    var fn = eval(call+".fromForm");
    fn.call(null,$e.parents("form").get(),input,function(err,res){


      if(!err && res){
        if($e.attr("data-upsert-list-item")){
          var list = $e.attr("data-upsert-list-item");
          var id = $(list).find("[data-id]").attr("data-id");
          upsertListItem($(list),id,res);
        }
      }

      if(onComplete) onComplete(err,res);
    });
  }
  
  var upsertListItem=function($e,id,value){
  
    var item = $e.find(".hop-id-"+id);
    var template = $e.find("[data-foreach]").data("template");
   
    var t = template.clone();
    evalElement(t,value); 
  
    if(item.length>0){
      item = $(item).replaceWith(t);
    } else {
      $e.find("[data-foreach]").append(t);
      t.show();
    }
  }

  var updateListItem=function($e,id,value){
  
    var item = $e.find(".hop-id-"+id);
    var template = $e.find("[data-foreach]").data("template");
   
    var t = template.clone();
    evalElement(t,value); 
    item = $(item).replaceWith(t);
  }

  var deleteListItem=function($e,id){
    $e.find(".hop-id-"+id).detach();
  }


  $.fn.hopjs = function(what,arg1,arg2,arg3){
    if(what=="eval") evalElement($(this),arg1);
    else if(what=="get-input") return getInput($(this));
    else if(what=="get-target") return getTarget($(this));
    else if(what=="submit") submitForm($(this),arg1,arg2);
    else if(what=="call" || what=="update") call($(this),arg1,arg2);   
    else if(what=="start") start($(this));
    else if(what=="update-list-item") updateListItem($(this),arg1,arg2);
    else if(what=="delete-list-item") deleteListItem($(this),arg1);
    else if(what=="upsert-list-item") upsertListItem($(this),arg1,arg2);
 
    return this;
  }

}(jQuery));
