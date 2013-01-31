var io=require('socket.io');
var Hop=require('./event');

var redis = require("redis");
var	client = redis.createClient();
var	eventClient = redis.createClient();

Hop.Event.Bus.emit=function(message,onComplete){
	client.publish("Hop.EVENT",JSON.stringify(message),onComplete);
}

eventClient.on("ready",function(){
	eventClient.subscribe("Hop.EVENT",function(){
		eventClient.on("message",function(channel,message){
			if(channel=="Hop.EVENT"){
				message = JSON.parse(message.toString());
				Hop.Event.Bus.localEmit(message,function(){});	
			}
		});
	});
});

