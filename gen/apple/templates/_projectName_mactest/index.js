/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/
var patch=function(){
    console.log(typeof Hop);
    
    if(typeof Hop!="undefined"){
        Hop.TestCase.prototype.do=function(method,inputValue,onComplete){
            inputValue=inputValue||{};
            onComplete=onComplete||{};
            TestStub.runMethod({
                               method: method,
                               input: JSON.stringify(inputValue),
                               onComplete: function(error, result){
                               console.log("ONCOMPLETE "+error+" "+result);
                               var retData=null;
                                if(result){
                                    console.log("Result: "+result);
                                    try {
                                        retData=JSON.parse(result);
                                    } catch(e){
                                        retData=result;
                                    }
                                }
                               console.log("Making call",error,retData);
                               try {
                                    return onComplete(error,retData);
                               } catch(e){
                               console.log("ERROR MAKING CALL" + e.toString());
                               }
                               }
                    });
        }

        Hop.TestCase.prototype.testResult=function(taskIndex,method,inputValue,err,outputValue,testType,result){
            
            if(Hop.TestCase.lastTaskIndex!=taskIndex){
                Hop.TestCase.resultIndex++;
                $(Hop.TestCase.resultSelector).append("<p><div>#"+(taskIndex+1)+" "+method+"(<a href='#foo' onclick='$(\"#testResult_"+Hop.TestCase.resultIndex+"\").slideToggle();return false;'>Details</a>)</div><p>");
                Hop.TestCase.lastTaskIndex=taskIndex
                $(Hop.TestCase.resultSelector).append("<div class='testDetails' id='testResult_"+Hop.TestCase.resultIndex+"' style='display:none'><h4>Input</h4><div class='testInput'>"+JSON.stringify(inputValue)+"</div><h4>Error</h4><div class='testResultError'>"+err+"</div><h4>Result</h4><div class='testResult'>"+JSON.stringify(outputValue)+"</div><br></div>");
            }
            
            var what = Hop.Tests[testType];
            if(what){
                if(result==false)
                    $(Hop.TestCase.resultSelector).append("<div style='color:red'>"+what.fail+"</div>");
                else
                    $(Hop.TestCase.resultSelector).append("<div style='color:green'>"+what.pass+"</div>");
            } else {
                if(result==false)
                    $(Hop.TestCase.resultSelector).append("<div style='color:red'>"+testType+"</div>");
                else
                    $(Hop.TestCase.resultSelector).append("<div style='color:green'>"+testType+"</div>");
            }
            if(result==true){
                Hop.TestCase.results.pass++
            } else {
                Hop.TestCase.results.fail++;
            }
    
            
        }
    
      


        Hop.TestCase.resultSelector=null;
        Hop.TestCase.runInDialog=function(what,selector){
            Hop.TestCase.resultSelector=selector;
            Hop.TestCase.resultIndex=0;
            Hop.TestCase.lastTaskIndex=-1;
            Hop.TestCase.results={ pass:0, fail:0 };
            $(selector).empty();
    
            
            if(Hop.TestCases[what]){
                Hop.TestCase.run(what);
                $(Hop.TestCase.resultSelector).append("<p>Passed: "+Hop.TestCase.results.pass+" Failed: "+Hop.TestCase.results.fail);
            } else {
                
                if(typeof what=="string" && what.length>0){
                    var toRun=[];
                    for(var i in Hop.TestCases){
                        if(i.indexOf(what)==0){
                            toRun.push(i);
                        }
                    }
                }  else {
                    var toRun=Object.keys(Hop.TestCases);
                }
                
                var run=function(){
                    if (toRun.length>0){
                        var testCase = toRun.shift();
                        $(Hop.TestCase.resultSelector).append("<h3>Running :"+testCase+"</h3>");
                        Hop.TestCase.run(testCase,function(){
                                         console.log("Done running test cases");
                                         Hop.TestCase.lastTaskIndex=-1;
                                         run();
                                         });
                    } else {
                        $(Hop.TestCase.resultSelector).append("<p><span id='allTestResults'>Passed: "+Hop.TestCase.results.pass+" Failed: "+Hop.TestCase.results.fail+" "+((Hop.TestCase.results.pass/(Hop.TestCase.results.pass+Hop.TestCase.results.fail))*100.0).toFixed(1)+"%</span>");
                        
                    }
                }
                run();
            }
            
            
            
        }
        
        Hop.TestCase.runInDialog(null,"#results");

        
    } else {
        console.log("Waiting");
        setTimeout(patch,200);
    }


    
}
patch();
