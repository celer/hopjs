var RAPI=require('./api');
require('./job');

RAPI.Job._jobs={};
RAPI.Job._jobStatusListeners={};
RAPI.Job._jobWaitListeners={};

RAPI.Job.wait=function(jobID,onComplete){
	if(!RAPI.Job._jobWaitListeners[jobID]){
		RAPI.Job._jobWaitListeners[jobID]=[];
	}
	RAPI.Job._jobWaitListeners[jobID].push(onComplete);
}

RAPI.Job.listen=function(jobID,onComplete){
	if(!RAPI.Job._jobStatusListeners[jobID]){
		RAPI.Job._jobStatusListeners[jobID]=[];
	}
	RAPI.Job._jobStatusListeners[jobID].push(onComplete);
}

RAPI.Job.load=function(jobID,onComplete){
	onComplete(null,RAPI.Job._jobs[jobID]);
}

RAPI.Job.save=function(jobID,job,onComplete){
	RAPI.Job._jobs[jobID]=job;
	onComplete(null,true);
}

RAPI.Job.notifyStatus=function(jobID,msg,percent,onComplete){
	if(RAPI.Job._jobStatusListeners[jobID]){
		for(var i in RAPI.Job._jobStatusListeners[jobID]){
			try { 
				RAPI.Job._jobStatusListeners[jobID][i](msg,percent);
			} catch(e){}
		}
		RAPI.Job._jobStatusListeners[jobID]=[];
	} else onComplete();
}

RAPI.Job.notifyFinished=function(jobID,err,result,onComplete){
	if(RAPI.Job._jobWaitListeners[jobID]){
		for(var i in RAPI.Job._jobWaitListeners[jobID]){
			try { 
				RAPI.Job._jobWaitListeners[jobID][i](msg,percent);
			} catch(e){}
		}
		RAPI.Job._jobWaitListeners[jobID]=[];
	} else onComplete();
}
