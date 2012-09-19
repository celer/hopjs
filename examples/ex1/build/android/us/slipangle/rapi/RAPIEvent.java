package us.slipangle.rapi;

import java.util.*;
import com.google.gson.JsonElement;

public class RAPIEvent {

	protected HttpHelper helper;
		
		

		MethodCall getKeyCall=null;

		
		

		MethodCall listenCall=null;

		
		

		MethodCall emitCall=null;

		
		

		MethodCall subscribeCall=null;

		
		

		MethodCall unsubscribeCall=null;

		
		

		MethodCall listChannelsCall=null;

		

	public RAPIEvent(HttpHelper helper){
		this.helper = helper;
	
		
		
		
		

		getKeyCall = new MethodCall("RAPI.Event.getKey","get","/api/1.0/event/key","JSObject","JSObject");
		
				

		
		
		
		

		listenCall = new MethodCall("RAPI.Event.listen","get","/api/1.0/event/listen","JSObject","JSObject");
		
		
			listenCall.addParam("key",true,false);	
		
		
			listenCall.addParam("channels",false,false);	
		
				

		
		
		
		

		emitCall = new MethodCall("RAPI.Event.emit","post","/api/1.0/event/","JSObject","JSObject");
		
		
			emitCall.addParam("channel",true,false);	
		
		
			emitCall.addParam("message",true,false);	
		
				

		
		
		
		

		subscribeCall = new MethodCall("RAPI.Event.subscribe","post","/api/1.0/event/channel","JSObject","JSObject");
		
		
			subscribeCall.addParam("channel",true,false);	
		
		
			subscribeCall.addParam("key",true,false);	
		
				

		
		
		
		

		unsubscribeCall = new MethodCall("RAPI.Event.unsubscribe","del","/api/1.0/event/channel","JSObject","JSObject");
		
		
			unsubscribeCall.addParam("key",true,false);	
		
		
			unsubscribeCall.addParam("id",true,false);	
		
				

		
		
		
		

		listChannelsCall = new MethodCall("RAPI.Event.listChannels","get","/api/1.0/event/channel","JSObject","JSObject");
		
				

		
	}

	
	
	
	


	public void getKey(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(getKeyCall,input,listener);
	}


	
	
	
	


	public void listen(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(listenCall,input,listener);
	}


	
	
	
	


	public void emit(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(emitCall,input,listener);
	}


	
	
	
	


	public void subscribe(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(subscribeCall,input,listener);
	}


	
	
	
	


	public void unsubscribe(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(unsubscribeCall,input,listener);
	}


	
	
	
	


	public void listChannels(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(listChannelsCall,input,listener);
	}


	


}
