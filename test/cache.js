var assert = require('assert');
require('should');
var Hop = require('../index');

var CacheTest = function(){

}

CacheTest.count=0;

CacheTest.prototype.cacheIt=function(input,onComplete){
	CacheTest.count++;
	return onComplete(null,input);
}

CacheTest.prototype.invalidateIt=function(input,onComplete){
	return onComplete(null,input);
}

CacheTest.prototype.complex=function(input,onComplete){
	return onComplete(null,input);
}

Hop.defineClass("CacheTest",new CacheTest(),function(api){
	api.get("cacheIt","/cache").cacheId("/cache/:id").demand("id").demand("contents").demand("when");
	api.get("invalidateIt","/invalidate").cacheInvalidate("/cache/:id").demand("id");
	api.get("complex","/complex").cache(function(cache,input,result){
		if(input.what=="cache") return cache.id("/cache/:id");
		if(input.what=="invalidate") return cache.invalidate("/cache/:id");
	}).demand("what").demand("id").demand("when");
});


describe("Cache",function(){
	it("should cache results",function(done){	
		var _CacheTest = Hop.Object.wrap("CacheTest");
		var request = new Hop.StubRequest();	
		var id = Math.round((Math.random()*10000));
		_CacheTest.cacheIt({id:id, contents:"hello", when: new Date().getTime()},function(err,res1){
			setTimeout(function(){
				_CacheTest.cacheIt({id:id, contents:"hello", when: new Date().getTime()},function(err,res2){
					assert.equal(CacheTest.count,1);
					assert.equal(res1.when,res2.when);
					done();
				},request);
			},100);
		},request);
	});
	it("should cache invalidate results",function(done){	
		var _CacheTest = Hop.Object.wrap("CacheTest");
		var request = new Hop.StubRequest();	
		var id = Math.round((Math.random()*10000));
		_CacheTest.cacheIt({id:id, contents:"hello", when: new Date().getTime()},function(err,res1){
			_CacheTest.invalidateIt({id: id},function(err,resX){
			},request);
				setTimeout(function(){
					_CacheTest.cacheIt({id:id, contents:"hello", when: new Date().getTime()},function(err,res2){
						assert.notEqual(res1.when,res2.when);
						done();
					},request);
				},100);
		},request);
	});
	it("should work with complex tests",function(done){	
		var _CacheTest = Hop.Object.wrap("CacheTest");
		var request = new Hop.StubRequest();	
		var id = Math.round((Math.random()*10000));
		_CacheTest.complex({what:"cache",id:id, contents:"hello", when: new Date().getTime()},function(err,res1){
			_CacheTest.complex({what:"invalidate", id: id, when: new Date().getTime()},function(err,resX){
			},request);
				setTimeout(function(){
					_CacheTest.complex({what:"cache",id:id, contents:"hello", when: new Date().getTime()},function(err,res2){
						assert.notEqual(res1.when,res2.when);
						done();
					},request);
				},100);
		},request);
	});

});
