/**
	@module Hop
	@submodule Event
**/
var Hop = require('./api');
var uuid = require('node-uuid');

if(!Array.remove){
		Array.remove = function(array,from, to) {
			var rest = array.slice((to || from) + 1 || array.length);
			array.length = from < 0 ? array.length + from : from;
			return array.push.apply(array, rest);
		};
}



Hop.Event={};
Hop.Event.sockets={};

Hop.Event.Channels=[];


Hop.Event.Channel = function(channel){
	this.channel=channel;
	this.regexp = new RegExp(this.channel.replace(/:([^\/]+)/g,"([^\/]+)"));
	this.params = this.channel.match(/:([^\/]+)/g)||[];
	this.params = this.params.map(function(i){
		return i.replace(/^:/,"");
	});
	this.subscribers=[];
	Hop.Event.Channels.push(this);
}

Hop.Event.Channel.create=function(channelPath){
	for(var i in Hop.Event.Channels){
		var channel = Hop.Event.Channels[i];
		if(channel.channel == channelPath)
			return channel;
	}	
	return new Hop.Event.Channel(channelPath);
}

Hop.Event.Channel.prototype.toString=function(){
	return { channel: this.channel, subscribers: this.subscribers.length };
}

Hop.Event.Channel.prototype.matches=function(path){
	var match = path.match(this.regexp);
	if(match){
		match.shift();

		var input={};

		for(var i in this.params){
			input[this.params[i]] = match[i];
		}
		return input;
	} else { 
		return null;
	}
}

Hop.Event.Channel.prototype.unsubscribeByKey=function(key){
	Hop.log("Subscribers",this.subscribers);
	for(var i in this.subscribers){
		var subscriber = this.subscribers[i];
		if(subscriber.key==key){
			Hop.log("Attempting to delete:",i);
			Array.remove(this.subscribers,i);
			this.unsubscribeByKey(key);
		}
	}	
}

Hop.Event.Channel.prototype.unsubscribe=function(id){
	for(var i in this.subscribers){
		var subscriber = this.subscribers[i];
		if(subscriber.id==id){
			Array.remove(this.subscribers,i);
		}
	}	
}

Hop.Event.Channel.prototype.subscribe=function(url,key,onComplete){
	var m = this.matches(url);
	if(m){

		var id = uuid(); 

		this.subscribers.push({
			id: id,
			key: key,
			url:url,
		});

		return onComplete(null,id);			
	} else {
		return false;
	}	
}

Hop.Event.Channel.prototype.notify=function(url,message,source,onComplete){
	onComplete=onComplete||function(){};
	var m = this.matches(url);
	var self=this;
	if(m){
		Hop.log("Notifying channel",this.toString());
		for(var i in this.subscribers){
			var subscriber = this.subscribers[i];

			if(subscriber.url==url){
				try {
					var req = {
							channel: self.channel,
							url: url,
							source: source,
							key: subscriber.key,
							id: subscriber.id,
							params: m
					}
					Hop.log("Notifying subsscriber",req,message);	
					(function(req,message){
					Hop.Event.Channel.notify(req,message,function(err,res){
						if(res==0){
							Hop.log("Deleting all subscriptions for key: ",req.key);
							self.unsubscribeByKey(req.key);	
						} else {
							Hop.log("There are listeners",res);
						}
						//FIXME This needs to keep track of the IDs to unsubscribe
					});	
					})(req,message);
				} catch(e){
					Hop.warn(e);
				}
			}	
		}
		return true;			
	} else {
		return false;
	}	
}

Hop.Event.Channel.Listeners={};

Hop.Event.Channel.removeListener=function(key,index){
	Hop.log("Removing",key,index);
	if(Hop.Event.Channel.Listeners[key]){
		var listeners = Hop.Event.Channel.Listeners[key];

		Array.remove(listeners.callbacks,index);
	}
}

Hop.Event.Channel.notify=function(req,message,onComplete){
	var badIDs=[];
	Hop.log("LISTENERS",Hop.Event.Channel.Listeners);
	if(Hop.Event.Channel.Listeners[req.key]){
		var listeners = Hop.Event.Channel.Listeners[req.key];
		var k = listeners.callbacks.length;
		var notify=function(){
			if(k>0){
				k--;	
				Hop.log("Notifying listener",listeners.callbacks[k].toString());
				try {
					listeners.callbacks[k](req,message,function(err,res){
						if(err || res===false){
							Hop.Event.Channel.removeListener(req.key,k);	
						}
						notify();
					});	
				} catch(e){
					Hop.error(e);
					Hop.Event.Channel.removeListener(req.key,k);	
				}
			} else {
				var numListeners = listeners.callbacks.length;
				if(numListeners==0){
					delete Hop.Event.Channel.Listeners[req.key];
				}
				return onComplete(null,numListeners);
			}
		}	
		notify(); 
	} else {
		return onComplete(null,0);
	}	
}

Hop.Event.Channel.listen=function(key,onNotify){
	if(!Hop.Event.Channel.Listeners[key]){
		Hop.Event.Channel.Listeners[key]={ callbacks:[], when: new Date().getTime() };
	}
	Hop.log("Adding call back");
	Hop.Event.Channel.Listeners[key].callbacks.push(onNotify);
}

Hop.Event.Channel.find=function(path){
	for(var i in Hop.Event.Channels){
		var channel = Hop.Event.Channels[i];
		if(channel.matches(path)){
			return channel;
		}
	}
	return null;
}

Hop.EventHelper={};

Hop.EventHelper.getKey=function(input,onComplete,req){
	if(req.session){
		if(!req.session.eventKey){ 
			req.session.eventKey=uuid();
		}
		return onComplete(null,req.session.eventKey);
	} else {
		return onComplete("Session support is required for event support");
	}
}

Hop.EventHelper.listen=function(input,onComplete,req){
	Hop.log("CHANNELS",typeof input.channels);
	if(input.channels){
		if(input.channels instanceof String){
			try { 
				input.channels = JSON.parse(input.channels);
			} catch(e){
	
			}
		}
		if(!input.channels instanceof Array)
				return onComplete("Invalid type for channels, array is expected");
	} else {
		input.channels = [];
	}

	var subscribe=function(){
		if(input.channels.length>0){
			var channelPath = input.channels.pop();
			var channel = Hop.Event.Channel.find(channelPath);
			if(channel){
				Hop.log(input,"Found channel",channel.toString());
				//We need to see if this listener can actually subscribe to the channel
				channel.subscribe(channelPath,input.key,function(){});
			}
			process.nextTick(subscribe);
		} else {
			Hop.log("Listinging on key",input.key);
			Hop.Event.Channel.listen(input.key,function(req,message,onDone){
				Hop.log("Attempting to respond to listener");
				try {
					onComplete(null,{ channel: req.channel, url: req.url, message:message, source: req.source});
				} catch(e){
					return onDone(e,false);
				}
				return onDone(null,false);
			});
		}
	}
	subscribe();

};


Hop.EventHelper.subscribe=function(input,onComplete,req){
	Hop.log("SUBSCRIBE");
	//Find a matching channel	
	var channel = Hop.Event.Channel.find(input.channel);
	if(channel){
		Hop.log(input,"Found channel",channel.toString());
		//We need to see if this listener can actually subscribe to the channel
		channel.subscribe(input.channel,input.key,onComplete);
	} else return onComplete(null,null);
}

Hop.EventHelper.listChannels=function(input,onComplete,req){
	var channels = [];
	for(var i in Hop.Event.Channels){
		var channel = Hop.Event.Channels[i];
		channels.push(channel.toString());
	}
	return onComplete(null,channels);
}

Hop.EventHelper.unsubscribe=function(input,onComplete,req){
	var channel = Hop.Event.Channel.find(input.channel);
	if(channel){
		var res = channel.unsubscribe(input.id);
		return onComplete(null,res);
	} else return onComplete(null,null);
}

Hop.EventHelper.emit=function(req,input,onComplete){
	var source = { method: "Event.emit" };
	if(req.session && req.session.user && req.session.user.name){
		source.user=req.session.user.name;
	}	
	var message = { channel: input.channel, message: input.message, source: source };
	
	//FIXME should try to force addition of user to event data 
	Hop.Event.Bus.emit(message);
	return onComplete(null,true);		
}

Hop.defineClass("Hop.Event",Hop.EventHelper,function(api){
	api.get("getKey","/event/key");
	api.get("listen","/event/listen").demand("key").optional("channels").noCache();
	api.post("emit","/event/").demand("channel").demand("message");
	api.post("subscribe","/event/channel").demand("channel").demand("key");
	api.del("unsubscribe","/event/channel").demand("key").demand("id");
	api.get("listChannels","/event/channel");
});


Hop.EventEmitter=function(channel,source){
	this.channel=channel;
	this.source = source
}

Hop.EventEmitter.prototype.emit=function(message){
	//FIXME should try to force addition of user to event data 
	Hop.Event.Bus.emit({ channel: this.channel,message: message, source:this.source},function(){});
};

Hop.EventEmitter.resolvePath=function(path,req,input){
	var request=req;
	return path.replace(/:([^\/]+)/g,function(m,s){
		if(s){
			try {
				with(input){
					var v = eval(s);
					if(v==undefined){
						throw "Undefined value found in cache path: "+s;
					}
					return v.toString();
				}
			} catch(e){
				throw "Error in cache path: "+s+" is "+e;
			}
		}
	});
}


/**
Emit an event prior to calling this method

* The channel will have variables provided by the input parameters
	substituted into it.

@param {string} channel The channel to emit the event on
@param {function} onEmit The function which determines what is emitted
@param {object} onEmit.req The Exbeforess/HTTP request object
@param {object} onEmit.input The input object

@example
	api.post("send","/message/send").emitBefore("/user/:to",function(req,input){
		//Emit an event to the specified channel
		this.emit({msg: input.msg, from: input.from});
	}).demand("msg").demand("from").demand("to");


@method emitBefore
@for Hop.Method
@chainable
**/
Hop.Method.prototype.emitBefore=function(channel,onEmit){

	Hop.Event.Channel.create(channel);

	var self=this;
	self.addPreCall(function(req,input,onComplete){
		var path = Hop.EventEmitter.resolvePath(channel,req,input);
	
		var source = { method: self.getMethod() };
		if(req.session && req.session.user && req.session.user.name){
			source.user=req.session.user.name;
		}	
		var emitter = new Hop.EventEmitter(path,source);
		try {
			onEmit.apply(emitter,[req,input]);
		} catch(e){
			Hop.error("Error while calling event emitter on method "+self.className+"."+self.name+" "+e.toString());
		}		

		onComplete();	
		
	},"event");
	return this;
}


/**
Emit an event after calling this method

* The channel will have variables provided by the input parameters
	substituted into it.

@param {string} channel The channel to emit the event on
@param {function} onEmit The function which determines what is emitted
@param {object} onEmit.req The Express/HTTP request object
@param {object} onEmit.input The input object
@param {object} onEmit.err The error resulting from calling the method 
@param {object} onEmit.result The result of calling the method 

@example
	api.post("processFile","/process/").emitAfter("/user/:userId",function(req,input,err,result){
		//Emit an event to the specified channel
		this.emit({err: err, result:result});
	}).demand("userId");


@method emitAfter
@for Hop.Method
@users Hop.Cache
@chainable
**/
Hop.Method.prototype.emitAfter=function(channel,onEmit){

	new Hop.Event.Channel(channel);

	var self=this;
	self.addPostCall(function(req,input,err,result,onComplete){
		var path = Hop.EventEmitter.resolvePath(channel,req,input);
	
		var source = { method: self.getMethod() };
		if(req.session && req.session.user && req.session.user.name){
			source.user=req.session.user.name;
		}	
		var emitter = new Hop.EventEmitter(path,source);
		try {
			onEmit.apply(emitter,[req,input,err,result]);
		} catch(e){
			Hop.error("Error while calling event emitter on method "+self.className+"."+self.name+" "+e.toString());
		}		

		onComplete();	
		
	},"event");
	return this;
}

/**
Alias to emitAFter

@method emit
@for Hop.Method
@chainable
**/
Hop.Method.prototype.emit=Hop.Method.prototype.emitAfter;

Hop.Event.Bus={};

Hop.addAfterTemplate("JavaScript","event/preJSHop.comb");


Hop.Event.Bus.localEmit=function(message,onComplete){
	var channel = Hop.Event.Channel.find(message.channel);
	if(channel){
		Hop.log("localEmit",message);
		channel.notify(message.channel,message.message,message.source);
	}	
}

Hop.Event.Bus.emit=function(message,onComplete){

}


/* 
Hop.defineChannel("/user/:userID/messages",function(c){
	c.onConnect(function(req,input,onAllowConnect){
		if(req.session.user.name==input.userID || req.session.user.userID=input.userID){
			return onAllowConnect(true);
		} else return onAllowConnect(false);
	});
});
*/
