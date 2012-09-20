package us.slipangle.rapi;

import java.util.*;
import com.google.gson.JsonElement;

public class UserService {

	protected HttpHelper helper;
		
		

		MethodCall deleteCall=null;

		
		

		MethodCall listCall=null;

		
		

		MethodCall currentUserCall=null;

		
		

		MethodCall loadCall=null;

		
		

		MethodCall createCall=null;

		
		

		MethodCall messageCall=null;

		
		

		MethodCall avatarImageCall=null;

		
		

		MethodCall logoutCall=null;

		

	public UserService(HttpHelper helper){
		this.helper = helper;
	
		
		
		
		

		deleteCall = new MethodCall("UserService.delete","del","/api/1.0/user/:id","User","Boolean");
		
		
			deleteCall.addParam("id",true,false);	
		
				

		
		
		
		

		listCall = new MethodCall("UserService.list","get","/api/1.0/user/","JSObject","List<User>");
		
		
			listCall.addParam("sortBy",false,false).setDefaultValue("username");	
		
		
			listCall.addParam("start",true,false).setDefaultValue("0");	
		
		
			listCall.addParam("size",true,false).setDefaultValue("25");	
		
				

		
		
		
		

		currentUserCall = new MethodCall("UserService.currentUser","get","/api/1.0/user/current/","JSObject","User");
		
				

		
		
		
		

		loadCall = new MethodCall("UserService.load","get","/api/1.0/user/:id","User","User");
		
		
			loadCall.addParam("id",true,false);	
		
				

		
		
		
		

		createCall = new MethodCall("UserService.create","post","/api/1.0/user","User","User");
		
		
			createCall.addParam("email",true,false);	
		
		
			createCall.addParam("name",true,false);	
		
				

		
		
		
		

		messageCall = new MethodCall("UserService.message","post","/api/1.0/user/message","UserMessage","UserMessage");
		
		
			messageCall.addParam("message",true,false);	
		
		
			messageCall.addParam("to",true,false);	
		
		
			messageCall.addParam("from",true,false);	
		
		
			messageCall.addParam("subject",true,false);	
		
				

		
		
		
		

		avatarImageCall = new MethodCall("UserService.avatarImage","get","/api/1.0/user/:id/icon","User","HopFile");
		
		
			avatarImageCall.addParam("id",true,false);	
		
				

		
		
		
		

		logoutCall = new MethodCall("UserService.logout","get","/api/1.0/logout","JSObject","JSObject");
		
				

		
	}

	
	
	
	


	public void delete(User input,Listener<Boolean> listener)  {
			helper.doRequest(deleteCall,input,listener);
	}


	
	
	
	


	public void list(JSObject input,Listener<List<User>> listener)  {
			helper.doRequest(listCall,input,listener);
	}


	
	
	
	


	public void currentUser(JSObject input,Listener<User> listener)  {
			helper.doRequest(currentUserCall,input,listener);
	}


	
	
	
	


	public void load(User input,Listener<User> listener)  {
			helper.doRequest(loadCall,input,listener);
	}


	
	
	
	


	public void create(User input,Listener<User> listener)  {
			helper.doRequest(createCall,input,listener);
	}


	
	
	
	


	public void message(UserMessage input,Listener<UserMessage> listener)  {
			helper.doRequest(messageCall,input,listener);
	}


	
	
	
	


	public void avatarImage(User input,Listener<HopFile> listener)  {
			helper.doRequest(avatarImageCall,input,listener);
	}


	
	
	
	


	public void logout(JSObject input,Listener<JSObject> listener)  {
			helper.doRequest(logoutCall,input,listener);
	}


	


}
