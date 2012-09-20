var Hop=require('./api');
require('./job');

var redis = require("redis");
var	client = redis.createClient();
var	channelClient = redis.createClient();
var notifyClient = redis.createClient();
		
Hop.Job._jobWaitListeners={};
Hop.Job._jobStatusListeners={};

client.on("error", function (err) {
		console.log("Error " + err);
});

channelClient.on("ready", function(){
	channelClient.on("message",function(channel,message){
		channel = channel.toString();
		message = JSON.parse(message.toString());
		if(/jobStatus/.test(channel)){
			Hop.Job.localNotifyStatus(message.jobID,message.msg,message.percent,function(){});	
		}	
		if(/jobFinished/.test(channel)){
			Hop.Job.localNotifyFinished(message.jobID,message.err,message.result,function(){});	
		}	
	});
	channelClient.subscribe("jobStatus");
	channelClient.subscribe("jobFinished");
});

Hop.Job.wait=function(jobID,onComplete){
	if(!Hop.Job._jobWaitListeners[jobID]){
		Hop.Job._jobWaitListeners[jobID]=[];
	}
	Hop.Job._jobWaitListeners[jobID].push(onComplete);
}

Hop.Job.listen=function(jobID,onComplete){
	if(!Hop.Job._jobStatusListeners[jobID]){
		Hop.Job._jobStatusListeners[jobID]=[];
	}
	Hop.Job._jobStatusListeners[jobID].push(onComplete);
}

Hop.Job.load=function(jobID,onComplete){
	client.get(jobID,function(err,res){
		if(!err && res){
			try {	
				return onComplete(err,JSON.parse(res.toString()));	
			} catch(e){
				return onComplete(e);	
			}
		} else {
			return onComplete(err,null);
		}
	});
}

Hop.Job.delete=function(jobID,onComplete){
	var tasks=0;
	Hop.Job.load(jobID,function(err,job){
		if(job && job.path){
			tasks++;
			client.del(job.path,function(){ tasks--; if(tasks==0) return onComplete(null,true); });
		}				
		tasks++;
		client.del(jobID,function(){ tasks--; if(tasks==0) return onComplete(null,true); });
	});
}

Hop.Job.save=function(jobID,job,onComplete){
	if(typeof job.expiresAt!="number")
		return onComplete("Property expiresAt is missing in job");

	var duration = Math.ceil((job.expiresAt - (new Date().getTime())) / 1000);
	if(duration>0){
		client.setex(jobID,duration,JSON.stringify(job),function(err,res){
			if(err) return onComplete(err);
			if(job.path){
				client.setex(job.path,duration,jobID.toString(),function(err,res){
					return onComplete(null,job);
				});
			} else {
				return onComplete(null,job);
			}
		});
	} else return onComplete(null,null);
}

Hop.Job.loadByPath=function(path,onComplete){
	client.get(path,function(err,res){
		if(!err && res){
			Hop.Job.load(res.toString(),onComplete);
		} else return onComplete(err);
	});
}

Hop.Job.notifyStatus=function(jobID,msg,percent,onComplete){
	notifyClient.publish("jobStatus",JSON.stringify({jobID: jobID, msg:msg, percent:percent}),onComplete);
}

Hop.Job.notifyFinished=function(jobID,err,result,onComplete){
	notifyClient.publish("jobFinished",JSON.stringify({jobID: jobID, err:err, result:result}),onComplete);
}

Hop.Job.localNotifyStatus=function(jobID,msg,percent,onComplete){
	if(Hop.Job._jobStatusListeners[jobID]){
		var listeners = Hop.Job._jobStatusListeners[jobID].splice(0);
		Hop.Job._jobStatusListeners[jobID]=[];
		for(var i in listeners){
			try { 
				listeners[i](msg,percent);
			} catch(e){}
		}
	} else onComplete();
}

Hop.Job.localNotifyFinished=function(jobID,err,result,onComplete){
	if(Hop.Job._jobWaitListeners[jobID]){
		var listeners = Hop.Job._jobWaitListeners[jobID].splice(0);
		Hop.Job._jobWaitListeners[jobID]=[];
		for(var i in listeners){
			try { 
				listeners[i](err,result);
			} catch(e){}
		}
	} else onComplete();
}
