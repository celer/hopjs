var assert = require('assert');
require('should');
var RAPI = require('../index');

describe("Job Drivers",function(){
	
	it("should save and load",function(done){

		var validJob = {
			expiresAt: (new Date()).getTime() + (1000*10)
		};
	
		RAPI.Job.save("testJob",validJob,function(err,res){
			assert.equal(err,null);
			assert.deepEqual(res,validJob);
		
			RAPI.Job.load("testJob",function(err,res){
				assert.equal(err,null);
				assert.deepEqual(res,validJob);
				done();
			});
		});

	});
	
	it("should expire",function(done){
		this.timeout(5000);
		var validJob = {
			expiresAt: (new Date()).getTime() + (1500*1)
		};
	
		RAPI.Job.save("testJob",validJob,function(err,res){
			assert.equal(err,null);
			assert.deepEqual(res,validJob);
	
			setTimeout(function(){	
				RAPI.Job.load("testJob",function(err,res){
					assert.equal(err,null);
					assert.deepEqual(res,null);
					done();
				});
			},3700);
		});
	});

	it("should be able to load by a unique path",function(done){
		var validJob = {
			expiresAt: (new Date()).getTime() + (1000*1),
			path: "/foo/bar"
		};
	
		RAPI.Job.save("testJob",validJob,function(err,res){
			assert.equal(err,null);
			assert.deepEqual(res,validJob);
	
			RAPI.Job.loadByPath("/foo/bar",function(err,res){
				assert.equal(err,null);
				assert.deepEqual(res,validJob);
				done();
			});
		});

	});

	it("should notify listeners of a job being finished",function(done){
		var inputRes = { complete: true };

		RAPI.Job.wait("testJob",function(err,res){
			assert.equal(err,"error");
			assert.deepEqual(res,inputRes);
			done();
		});
		setTimeout(function(){
			RAPI.Job.notifyFinished("testJob","error",inputRes,function(err,res){
			});	
		},500);
	});
	
	it("should notify listeners of job status",function(done){
		var inputRes = { complete: true };

		RAPI.Job.listen("testJob",function(msg,percent){
			assert.equal(msg,"running");
			assert.equal(percent,51);
			done();
		});
		setTimeout(function(){
			RAPI.Job.notifyStatus("testJob","running",51,function(err,res){
			});	
		},500);
	});

});

var JobTest = function(){

}

JobTest.prototype.singletonJobRepeat=function(input,onComplete){
	setTimeout(function(){
		return onComplete(null,{ when: new Date().getTime() });
	},1500);
}

JobTest.prototype.jobStatusTest=function(input,onComplete,req){
	var count=0;
	var countUp = function(){
		if(count<100){
			count+=4;
			if(req.job){
				req.job.setStatus("Status "+count,count);
			}	
			setTimeout(function(){
				countUp();
			},50);
		} else {
			return onComplete(null,{ when: new Date().getTime() });
		}
	};
	countUp();
}

JobTest.prototype.singletonJob=function(input,onComplete){
	setTimeout(function(){
		return onComplete(null,{ when: new Date().getTime() });
	},1500);
}

RAPI.defineClass("JobTest",new JobTest(),function(api){
	api.get("singletonJob","/singletonJob").trackJob("/job/"+(new Date()).getTime());
	api.get("singletonJobRepeat","/singletonJobRepeat").trackJob("/job/"+(new Date()).getTime(),10000,true);
	api.get("jobStatusTest","/jobStatusTest").trackJob();
});

describe("Highlevel Job Interface",function(){

	it("should track the status of a job",function(done){
		this.timeout(8000);
		var count=0;
		var request = new RAPI.StubRequest();
		setTimeout(function(){

			var listenToJob=function(){
				RAPI.Job.listen(request.job.jobID,function(msg,percent){
					count++;
					listenToJob();
				});	
			}
			listenToJob()
			RAPI.Job.wait(request.job.jobID,function(err,result){
				assert.ok(result);
				assert.ok(count>10);
				done();	
			});

		},50);
		RAPI.call("JobTest.jobStatusTest",{},function(err,res){
			assert.ok(res);
		},request);
	});
	it("should prevent running a singleton job more then once",function(done){
		this.timeout(8000);
		var checkResults=function(){
			assert.ok(results.sRes.when);
			assert.equal(results.fErr,results.sErr);
			assert.equal(results.fErr,results.kErr);
			assert.deepEqual(results.fRes,results.sRes);
			assert.deepEqual(results.fRes,results.kRes);
			assert.equal(results.fJobID, results.sJobID);
			assert.equal(results.fJobID, results.kJobID);
			done();
		};

		var request = new RAPI.StubRequest();
		var tasks = 0;
		var results = {};
		tasks++;
		RAPI.call("JobTest.singletonJob",{},function(err,res){
					console.log("1",err,res,request.getResponse().get("Job-Status"));
			tasks--;
			results.fErr=err;
			results.fRes=res;
			results.fJobID = request.getResponse().get("Job-ID");
			if(tasks==0){
				checkResults();
			}
		},request);
		setTimeout(function(){
			var srequest = new RAPI.StubRequest();
			tasks++;
			RAPI.call("JobTest.singletonJob",{},function(err,res){
					console.log("2",err,res);
				var krequest = new RAPI.StubRequest();
				tasks++;
				RAPI.call("JobTest.singletonJob",{},function(err,res){
					console.log("3",err,res);
					tasks--;
					results.kErr=err;
					results.kRes=res;
					results.kJobID = krequest.getResponse().get("Job-ID");
					if(tasks==0){
						checkResults();
					}
				},krequest);
				tasks--;
				results.sErr=err;
				results.sRes=res;
				results.sJobID = srequest.getResponse().get("Job-ID");
				if(tasks==0){
					checkResults();
				}
			},srequest);
		},100);
	}); 
	it("should run a repetable singleton job more then once",function(done){
		this.timeout(8000);
		var checkResults=function(){
			assert.ok(results.sRes.when);
			assert.equal(results.fErr,results.sErr);
			assert.equal(results.fErr,results.kErr);
			assert.deepEqual(results.fRes,results.sRes);
			assert.notDeepEqual(results.fRes,results.kRes);
			assert.equal(results.fJobID, results.sJobID);
			assert.notEqual(results.fJobID, results.kJobID);
			done();
		};

		var request = new RAPI.StubRequest();
		var tasks = 0;
		var results = {};
		tasks++;
		RAPI.call("JobTest.singletonJobRepeat",{},function(err,res){
			tasks--;
			results.fErr=err;
			results.fRes=res;
			results.fJobID = request.getResponse().get("Job-ID");
			if(tasks==0){
				checkResults();
			}
		},request);
		setTimeout(function(){
			var srequest = new RAPI.StubRequest();
			tasks++;
			RAPI.call("JobTest.singletonJobRepeat",{},function(err,res){
				var krequest = new RAPI.StubRequest();
				tasks++;
				RAPI.call("JobTest.singletonJobRepeat",{},function(err,res){
					tasks--;
					results.kErr=err;
					results.kRes=res;
					results.kJobID = krequest.getResponse().get("Job-ID");
					if(tasks==0){
						checkResults();
					}
				},krequest);
				tasks--;
				results.sErr=err;
				results.sRes=res;
				results.sJobID = srequest.getResponse().get("Job-ID");
				if(tasks==0){
					checkResults();
				}
			},srequest);
		},100);
	});
});


