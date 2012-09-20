var assert = require('assert');
require('should');
var Hop = require('../index');

var EventEmitter = function(){

}

EventEmitter.prototype.emit1=function(input,onComplete){
	return onComplete(null,{ kittens: true, cats:false });
}

EventEmitter.prototype.emit2=function(input,onComplete){
	return onComplete(null,{ kittens: true, cats:false, key: input.key });
}

Hop.defineClass("EventEmitter",new EventEmitter(),function(api){
	api.get("emit1","/emit1").emit("/emit1",function(req,input,err,result){
		this.emit(result);		
	});
	api.get("emit2","/emit2").emit("/emit2/:key",function(req,input,err,result){
		this.emit(result);		
	}).demand("key");
});

describe("Event emitter",function(){
	it("should emit events to channels without parameters",function(done){	
		var result=null;

		var request = new Hop.StubRequest();
		Hop.call("Hop.Event.getKey",{},function(err,key){
			console.log(err,key);
			Hop.call("Hop.Event.listen",{channels:["/emit1"],key:key},function(err,res){
				console.log("GOT ",err,res);
				assert.deepEqual(res.message, { kittens: true, cats:false });
				done();
			},request);

			setTimeout(function(){
				Hop.call("EventEmitter.emit1",{},function(){},request);
			},500);


		},request);

	});
	it("should emit events to channels with parameters",function(done){	
		var result=null;

		var request = new Hop.StubRequest();

		Hop.call("Hop.Event.getKey",{},function(err,key){
			console.log(err,key);
			Hop.call("Hop.Event.listen",{channels:["/emit2/"+key],key:key},function(err,res){
				console.log("GOT ",err,res);
				assert.deepEqual(res.message, { kittens: true, cats:false, key: key });
				done();
			},request);

			setTimeout(function(){
				Hop.call("EventEmitter.emit2",{key:key},function(){},request);
			},500);


		},request);

	});
});
