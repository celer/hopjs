var Hop=require('./api');
require('./job');

Hop.Job._jobs={};
Hop.Job._jobStatusListeners={};
Hop.Job._jobWaitListeners={};

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
	onComplete(null,Hop.Job._jobs[jobID]);
}

Hop.Job.save=function(jobID,job,onComplete){
	Hop.Job._jobs[jobID]=job;
	onComplete(null,true);
}

Hop.Job.notifyStatus=function(jobID,msg,percent,onComplete){
	if(Hop.Job._jobStatusListeners[jobID]){
		for(var i in Hop.Job._jobStatusListeners[jobID]){
			try { 
				Hop.Job._jobStatusListeners[jobID][i](msg,percent);
			} catch(e){}
		}
		Hop.Job._jobStatusListeners[jobID]=[];
	} else onComplete();
}

Hop.Job.notifyFinished=function(jobID,err,result,onComplete){
	if(Hop.Job._jobWaitListeners[jobID]){
		for(var i in Hop.Job._jobWaitListeners[jobID]){
			try { 
				Hop.Job._jobWaitListeners[jobID][i](msg,percent);
			} catch(e){}
		}
		Hop.Job._jobWaitListeners[jobID]=[];
	} else onComplete();
}
