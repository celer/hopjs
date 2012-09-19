package us.slipangle.rapi;

import java.util.*;
import com.google.gson.JsonElement;

public class JobStatus {

	protected HttpHelper helper;
		
		

		MethodCall waitCall=null;

		
		

		MethodCall listenCall=null;

		
		

		MethodCall loadCall=null;

		

	public JobStatus(HttpHelper helper){
		this.helper = helper;
	
		
		
		
		

		waitCall = new MethodCall("JobStatus.wait","get","/api/1.0/_job/wait/:jobID","JSObject","JSObject");
		
		
			waitCall.addParam("jobID",true,false);	
		
				

		
		
		
		

		listenCall = new MethodCall("JobStatus.listen","get","/api/1.0/_job/listen/:jobID","JSObject","JSObject");
		
		
			listenCall.addParam("jobID",true,false);	
		
				

		
		
		
		

		loadCall = new MethodCall("JobStatus.load","get","/api/1.0/_job/:jobID","JSObject","JSObject");
		
		
			loadCall.addParam("jobID",true,false);	
		
				

		
	}

	
	
	
	


	public void wait(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(waitCall,input,listener);
	}


	
	
	
	


	public void listen(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(listenCall,input,listener);
	}


	
	
	
	


	public void load(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(loadCall,input,listener);
	}


	


}
