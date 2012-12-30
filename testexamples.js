/*
  This will iterate through each one of the examples running the unit tests on them
*/
var fs=require('fs');
var cp=require('child_process');
var path=require('path');
var optimist=require('optimist');

optimist=optimist.describe("url","url to use for testing");
optimist=optimist.describe("log","log file");

var args = optimist.argv;

var url = args.url||"http://localhost:3000/";

var results={};

var testExample=function(example,onComplete){
  var dir = path.join("./examples",example);

  console.log("Testing example",example);  
  cp.exec("(cd "+dir+" && rm -rf node_modules && npm install .)",function(err,stdout,stderr){
    if(err) return onComplete("Error installing package:"+err);

    var exited=false; 
    var testNumber=0;

    var appRunning=true;
 
    console.log("Starting application"); 
    var app = cp.spawn("node",["./app.js"],{ cwd: dir }); 
    
    app.on("exit",function(code,data){
      console.log("Example application exited with:",code);
      appRunning=false;
    });
   
    var appOut="";
 
    app.on("close",function(code,data){
      //console.log("A",arguments);
    });

    app.stderr.on("data",function(data){
      appOut+=data;
    }); 
    
    app.stdout.on("data",function(data){
      appOut+=data;
    }); 
    
    setTimeout(function(){




      if(!appRunning){
        console.error(appOut);
        return onComplete("Application quit before being tested");
      }

      var unitTest = cp.exec("./bin/hopjs --url "+url+" --unitTest --testDetails");
      
      var unitTestErr="";
      var unitTestOut="";      

      unitTest.on("close",function(code,data){
      
        if(args.log){
          fs.appendFileSync(args.log,"\n"+example+": ########################################################\n");
          fs.appendFileSync(args.log,"\n"+example+": APP OUT ---------------------------------------------\n");
          fs.appendFileSync(args.log,appOut);
          fs.appendFileSync(args.log,"\n"+example+": TEST STDOUT ---------------------------------------------\n");
          fs.appendFileSync(args.log,unitTestOut);
          fs.appendFileSync(args.log,"\n"+example+": TEST STDERR ---------------------------------------------\n");
          fs.appendFileSync(args.log,unitTestErr);
        }
        app.kill();
        console.log("Unit test exited with",code);
        results[example]={ exitCode:code } 

        var m = /^Pass.*$/gm.exec(unitTestOut);
        if(m){
          results[example].results=m[0];
        }
            
        app.kill("SIGKILL");
        cp.exec("kill -9 "+app.pid);
  
        var waitForAppExit=function(){
          if(appRunning){
            setTimeout(waitForAppExit,200);
          } else {
            return onComplete();  
          }
        }
        waitForAppExit();
      });
      
      unitTest.stderr.on("data",function(data){
        console.log(data.toString());
      }); 
      
      unitTest.stdout.on("data",function(data){
        console.log(data);
        unitTestOut+=data; 
        var m = /^#([0-9]+)/gm.exec(data);
        if(m){
          testNumber=m[1];
        }
      }); 

    },3000);
    
 
  });

}

fs.readdir("./examples",function(err,examples){
  var run=function(){
    if(examples.length>0){
      var example = examples.shift();
      testExample(example,function(err,res){
        if(err){
          console.error(err,example);
          process.exit();
        }
        run();
      })
    } else {
      console.log("--------------------------");
      for(var i in results){
        console.log(i+":");
        if(results[i].results)
          console.log("\t",results[i].results);
        else console.log("\t exited with",results[i].exitCode);

      }
      process.exit();
    }
  }
  run();

});
