package us.slipangle.rapi;

import java.util.*;
import com.google.gson.JsonElement;

public class UserMessage extends JSObject {

	
	
	
	
	public boolean isIdDefined(){
		return this.isDefined("id");
	}


	public Long getId(){
		return (Long) this.get("id");
	}
	public void setId(Long value){
		this.put("id",(Object) value);
	}
	
	
	
	
	public boolean isFromDefined(){
		return this.isDefined("from");
	}


	public String getFrom(){
		return (String) this.get("from");
	}
	public void setFrom(String value){
		this.put("from",(Object) value);
	}
	
	
	
	
	public boolean isToDefined(){
		return this.isDefined("to");
	}


	public String getTo(){
		return (String) this.get("to");
	}
	public void setTo(String value){
		this.put("to",(Object) value);
	}
	
	
	
	
	public boolean isSubjectDefined(){
		return this.isDefined("subject");
	}


	public String getSubject(){
		return (String) this.get("subject");
	}
	public void setSubject(String value){
		this.put("subject",(Object) value);
	}
	
	
	
	
	public boolean isSentDefined(){
		return this.isDefined("sent");
	}


	public Date getSent(){
		return (Date) this.get("sent");
	}
	public void setSent(Date value){
		this.put("sent",(Object) value);
	}
	
	
	
	
	public boolean isReadDefined(){
		return this.isDefined("read");
	}


	public Date getRead(){
		return (Date) this.get("read");
	}
	public void setRead(Date value){
		this.put("read",(Object) value);
	}
	
	
	
	
	public boolean isMessageDefined(){
		return this.isDefined("message");
	}


	public String getMessage(){
		return (String) this.get("message");
	}
	public void setMessage(String value){
		this.put("message",(Object) value);
	}
	

	public Class getFieldType(String name){
	
	
	
		if(name.equalsIgnoreCase("id")) return Long.class;
		
	
	
	
		if(name.equalsIgnoreCase("from")) return String.class;
		
	
	
	
		if(name.equalsIgnoreCase("to")) return String.class;
		
	
	
	
		if(name.equalsIgnoreCase("subject")) return String.class;
		
	
	
	
		if(name.equalsIgnoreCase("sent")) return Date.class;
		
	
	
	
		if(name.equalsIgnoreCase("read")) return Date.class;
		
	
	
	
		if(name.equalsIgnoreCase("message")) return String.class;
		
	
		return null;
	}

	public static UserMessage fromJson(JsonElement element){
		UserMessage val = new UserMessage();
		val.readJson(element);
		return val;
	}
	
}

