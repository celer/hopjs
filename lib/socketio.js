var Hop = require('./event');

Hop.addAfterTemplate("JavaScript","socketio/preJSTemplate.comb");

Hop.hookSocketIO=function(socketIO){
	socketIO.sockets.on("connection",function(socket){
		console.log("Socket io connected");
		socket.on("Hop.Event.Listen",function(msg){
			console.log("Attempting to listen");
			if(msg){
				console.log("Subscribing");
				Hop.Event.Channel.listen(msg,function(req,message,onDone){
					console.log("Hop.Event",{ channel: req.channel, url: req.url, message: message, source: req.source });
					socket.emit("Hop.Event",{ channel: req.channel, url: req.url, message: message, source: req.source });
					onDone(null,true);
					//FIXME what if the socket goes tits up?
					return true;
				});
			}	
		});
		socket.on("Hop.Event",function(msg){
		
		});
		//This will allow to move to a fully socket.io based comm if possible
		socket.on("Hop.call",function(msg){
			console.log("Hop.call",msg);
		});
	});




}
