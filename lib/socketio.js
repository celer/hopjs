var RAPI = require('./api');
require('./event');

RAPI.addAfterTemplate("JavaScript","socketio/preJSTemplate.comb");

RAPI.hookSocketIO=function(socketIO){
	socketIO.sockets.on("connection",function(socket){
		console.log("Socket io connected");
		socket.on("RAPI.Event.Listen",function(msg){
			console.log("Attempting to listen");
			if(msg){
				console.log("Subscribing");
				RAPI.Event.Channel.listen(msg,function(req,message,onDone){
					console.log("RAPI.Event",{ channel: req.channel, url: req.url, message: message, source: req.source });
					socket.emit("RAPI.Event",{ channel: req.channel, url: req.url, message: message, source: req.source });
					onDone(null,true);
					//FIXME what if the socket goes tits up?
					return true;
				});
			}	
		});
		socket.on("RAPI.Event",function(msg){
		
		});
		//This will allow to move to a fully socket.io based comm if possible
		socket.on("RAPI.call",function(msg){
			console.log("RAPI.call",msg);
		});
	});




}
