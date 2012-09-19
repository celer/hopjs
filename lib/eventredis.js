var io=require('socket.io');
var RAPI=require('./api');
require('./event');

var redis = require("redis");
var	client = redis.createClient();
var	eventClient = redis.createClient();

RAPI.Event.Bus.emit=function(message,onComplete){
	client.publish("RAPI.EVENT",JSON.stringify(message),onComplete);
}

eventClient.on("ready",function(){
	eventClient.subscribe("RAPI.EVENT",function(){
		eventClient.on("message",function(channel,message){
			if(channel=="RAPI.EVENT"){
				message = JSON.parse(message.toString());
				RAPI.Event.Bus.localEmit(message,function(){});	
			}
		});
	});
});

