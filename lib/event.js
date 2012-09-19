var RAPI = require('./api');
var uuid = require('node-uuid');

if(!Array.remove){
		Array.remove = function(array,from, to) {
			var rest = array.slice((to || from) + 1 || array.length);
			array.length = from < 0 ? array.length + from : from;
			return array.push.apply(array, rest);
		};
}



RAPI.Event={};
RAPI.Event.sockets={};

RAPI.Event.Channels=[];


RAPI.Event.Channel = function(channel){
	this.channel=channel;
	this.regexp = new RegExp(this.channel.replace(/:([^\/]+)/g,"([^\/]+)"));
	this.params = this.channel.match(/:([^\/]+)/g)||[];
	this.params = this.params.map(function(i){
		return i.replace(/^:/,"");
	});
	this.subscribers=[];
	RAPI.Event.Channels.push(this);
}

RAPI.Event.Channel.create=function(channelPath){
	for(var i in RAPI.Event.Channels){
		var channel = RAPI.Event.Channels[i];
		if(channel.channel == channelPath)
			return channel;
	}	
	return new RAPI.Event.Channel(channelPath);
}

RAPI.Event.Channel.prototype.toString=function(){
	return { channel: this.channel, subscribers: this.subscribers.length };
}

RAPI.Event.Channel.prototype.matches=function(path){
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

RAPI.Event.Channel.prototype.unsubscribeByKey=function(key){
	RAPI.log("Subscribers",this.subscribers);
	for(var i in this.subscribers){
		var subscriber = this.subscribers[i];
		if(subscriber.key==key){
			RAPI.log("Attempting to delete:",i);
			Array.remove(this.subscribers,i);
			this.unsubscribeByKey(key);
		}
	}	
}

RAPI.Event.Channel.prototype.unsubscribe=function(id){
	for(var i in this.subscribers){
		var subscriber = this.subscribers[i];
		if(subscriber.id==id){
			Array.remove(this.subscribers,i);
		}
	}	
}

RAPI.Event.Channel.prototype.subscribe=function(url,key,onComplete){
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

RAPI.Event.Channel.prototype.notify=function(url,message,source,onComplete){
	onComplete=onComplete||function(){};
	var m = this.matches(url);
	var self=this;
	if(m){
		RAPI.log("Notifying channel",this.toString());
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
					RAPI.log("Notifying subsscriber",req,message);	
					(function(req,message){
					RAPI.Event.Channel.notify(req,message,function(err,res){
						if(res==0){
							RAPI.log("Deleting all subscriptions for key: ",req.key);
							self.unsubscribeByKey(req.key);	
						} else {
							RAPI.log("There are listeners",res);
						}
						//FIXME This needs to keep track of the IDs to unsubscribe
					});	
					})(req,message);
				} catch(e){
					RAPI.warn(e);
				}
			}	
		}
		return true;			
	} else {
		return false;
	}	
}

RAPI.Event.Channel.Listeners={};

RAPI.Event.Channel.removeListener=function(key,index){
	RAPI.log("Removing",key,index);
	if(RAPI.Event.Channel.Listeners[key]){
		var listeners = RAPI.Event.Channel.Listeners[key];

		Array.remove(listeners.callbacks,index);
	}
}

RAPI.Event.Channel.notify=function(req,message,onComplete){
	var badIDs=[];
	RAPI.log("LISTENERS",RAPI.Event.Channel.Listeners);
	if(RAPI.Event.Channel.Listeners[req.key]){
		var listeners = RAPI.Event.Channel.Listeners[req.key];
		var k = listeners.callbacks.length;
		var notify=function(){
			if(k>0){
				k--;	
				RAPI.log("Notifying listener",listeners.callbacks[k].toString());
				try {
					listeners.callbacks[k](req,message,function(err,res){
						if(err || res===false){
							RAPI.Event.Channel.removeListener(req.key,k);	
						}
						notify();
					});	
				} catch(e){
					RAPI.error(e);
					RAPI.Event.Channel.removeListener(req.key,k);	
				}
			} else {
				var numListeners = listeners.callbacks.length;
				if(numListeners==0){
					delete RAPI.Event.Channel.Listeners[req.key];
				}
				return onComplete(null,numListeners);
			}
		}	
		notify(); 
	} else {
		return onComplete(null,0);
	}	
}

RAPI.Event.Channel.listen=function(key,onNotify){
	if(!RAPI.Event.Channel.Listeners[key]){
		RAPI.Event.Channel.Listeners[key]={ callbacks:[], when: new Date().getTime() };
	}
	RAPI.log("Adding call back");
	RAPI.Event.Channel.Listeners[key].callbacks.push(onNotify);
}

RAPI.Event.Channel.find=function(path){
	for(var i in RAPI.Event.Channels){
		var channel = RAPI.Event.Channels[i];
		if(channel.matches(path)){
			return channel;
		}
	}
	return null;
}

RAPI.EventHelper={};

RAPI.EventHelper.getKey=function(input,onComplete,req){
	if(req.session){
		if(!req.session.eventKey){ 
			req.session.eventKey=uuid();
		}
		return onComplete(null,req.session.eventKey);
	} else {
		return onComplete("Session support is required for event support");
	}
}

RAPI.EventHelper.listen=function(input,onComplete,req){
	RAPI.log("CHANNELS",typeof input.channels);
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
			var channel = RAPI.Event.Channel.find(channelPath);
			if(channel){
				RAPI.log(input,"Found channel",channel.toString());
				//We need to see if this listener can actually subscribe to the channel
				channel.subscribe(channelPath,input.key,function(){});
			}
			process.nextTick(subscribe);
		} else {
			RAPI.log("Listinging on key",input.key);
			RAPI.Event.Channel.listen(input.key,function(req,message,onDone){
				RAPI.log("Attempting to respond to listener");
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


RAPI.EventHelper.subscribe=function(input,onComplete,req){
	RAPI.log("SUBSCRIBE");
	//Find a matching channel	
	var channel = RAPI.Event.Channel.find(input.channel);
	if(channel){
		RAPI.log(input,"Found channel",channel.toString());
		//We need to see if this listener can actually subscribe to the channel
		channel.subscribe(input.channel,input.key,onComplete);
	} else return onComplete(null,null);
}

RAPI.EventHelper.listChannels=function(input,onComplete,req){
	var channels = [];
	for(var i in RAPI.Event.Channels){
		var channel = RAPI.Event.Channels[i];
		channels.push(channel.toString());
	}
	return onComplete(null,channels);
}

RAPI.EventHelper.unsubscribe=function(input,onComplete,req){
	var channel = RAPI.Event.Channel.find(input.channel);
	if(channel){
		var res = channel.unsubscribe(input.id);
		return onComplete(null,res);
	} else return onComplete(null,null);
}

RAPI.EventHelper.emit=function(req,input,onComplete){
	var source = { method: "Event.emit" };
	if(req.session && req.session.user && req.session.user.name){
		source.user=req.session.user.name;
	}	
	var message = { channel: input.channel, message: input.message, source: source };
	
	//FIXME should try to force addition of user to event data 
	RAPI.Event.Bus.emit(message);
	return onComplete(null,true);		
}

RAPI.defineClass("RAPI.Event",RAPI.EventHelper,function(api){
	api.get("getKey","/event/key");
	api.get("listen","/event/listen").demand("key").optional("channels").noCache();
	api.post("emit","/event/").demand("channel").demand("message");
	api.post("subscribe","/event/channel").demand("channel").demand("key");
	api.del("unsubscribe","/event/channel").demand("key").demand("id");
	api.get("listChannels","/event/channel");
});


RAPI.EventEmitter=function(channel,source){
	this.channel=channel;
	this.source = source
}

RAPI.EventEmitter.prototype.emit=function(message){
	//FIXME should try to force addition of user to event data 
	RAPI.Event.Bus.emit({ channel: this.channel,message: message, source:this.source},function(){});
};

RAPI.EventEmitter.resolvePath=function(path,req,input){
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
@for RAPI.Method
@chainable
**/
RAPI.Method.prototype.emitBefore=function(channel,onEmit){

	RAPI.Event.Channel.create(channel);

	var self=this;
	self.addPreCall(function(req,input,onComplete){
		var path = RAPI.EventEmitter.resolvePath(channel,req,input);
	
		var source = { method: self.getMethod() };
		if(req.session && req.session.user && req.session.user.name){
			source.user=req.session.user.name;
		}	
		var emitter = new RAPI.EventEmitter(path,source);
		try {
			onEmit.apply(emitter,[req,input]);
		} catch(e){
			RAPI.error("Error while calling event emitter on method "+self.className+"."+self.name+" "+e.toString());
		}		

		onComplete();	
		
	});
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
@for RAPI.Method
@users RAPI.Cache
@chainable
**/
RAPI.Method.prototype.emitAfter=function(channel,onEmit){

	new RAPI.Event.Channel(channel);

	var self=this;
	self.addPostCall(function(req,input,err,result,onComplete){
		var path = RAPI.EventEmitter.resolvePath(channel,req,input);
	
		var source = { method: self.getMethod() };
		if(req.session && req.session.user && req.session.user.name){
			source.user=req.session.user.name;
		}	
		var emitter = new RAPI.EventEmitter(path,source);
		try {
			onEmit.apply(emitter,[req,input,err,result]);
		} catch(e){
			RAPI.error("Error while calling event emitter on method "+self.className+"."+self.name+" "+e.toString());
		}		

		onComplete();	
		
	});
	return this;
}

/**
Alias to emitAFter

@method emit
@for RAPI.Method
@chainable
**/
RAPI.Method.prototype.emit=RAPI.Method.prototype.emitAfter;

RAPI.Event.Bus={};

RAPI.addAfterTemplate("JavaScript","event/preJSRAPI.comb");


RAPI.Event.Bus.localEmit=function(message,onComplete){
	var channel = RAPI.Event.Channel.find(message.channel);
	if(channel){
		RAPI.log("localEmit",message);
		channel.notify(message.channel,message.message,message.source);
	}	
}

RAPI.Event.Bus.emit=function(message,onComplete){

}


/* 
RAPI.defineChannel("/user/:userID/messages",function(c){
	c.onConnect(function(req,input,onAllowConnect){
		if(req.session.user.name==input.userID || req.session.user.userID=input.userID){
			return onAllowConnect(true);
		} else return onAllowConnect(false);
	});
});
*/
