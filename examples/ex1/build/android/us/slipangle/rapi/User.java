package us.slipangle.rapi;

import java.util.*;
import com.google.gson.JsonElement;

public class User extends JSObject {

	
	
	
	
	public boolean isIdDefined(){
		return this.isDefined("id");
	}


	public Long getId(){
		return (Long) this.get("id");
	}
	public void setId(Long value){
		this.put("id",(Object) value);
	}
	
	
	
	
	public boolean isNameDefined(){
		return this.isDefined("name");
	}


	public String getName(){
		return (String) this.get("name");
	}
	public void setName(String value){
		this.put("name",(Object) value);
	}
	
	
	
	
	public boolean isEmailDefined(){
		return this.isDefined("email");
	}


	public String getEmail(){
		return (String) this.get("email");
	}
	public void setEmail(String value){
		this.put("email",(Object) value);
	}
	
	
	
	
	public boolean isValidFromDefined(){
		return this.isDefined("validFrom");
	}


	public Date getValidFrom(){
		return (Date) this.get("validFrom");
	}
	public void setValidFrom(Date value){
		this.put("validFrom",(Object) value);
	}
	
	
	
	
	public boolean isValidToDefined(){
		return this.isDefined("validTo");
	}


	public Date getValidTo(){
		return (Date) this.get("validTo");
	}
	public void setValidTo(Date value){
		this.put("validTo",(Object) value);
	}
	
	
	
	
	public boolean isEnabledDefined(){
		return this.isDefined("enabled");
	}


	public Boolean getEnabled(){
		return (Boolean) this.get("enabled");
	}
	public void setEnabled(Boolean value){
		this.put("enabled",(Object) value);
	}
	

	public Class getFieldType(String name){
	
	
	
		if(name.equalsIgnoreCase("id")) return Long.class;
		
	
	
	
		if(name.equalsIgnoreCase("name")) return String.class;
		
	
	
	
		if(name.equalsIgnoreCase("email")) return String.class;
		
	
	
	
		if(name.equalsIgnoreCase("validFrom")) return Date.class;
		
	
	
	
		if(name.equalsIgnoreCase("validTo")) return Date.class;
		
	
	
	
		if(name.equalsIgnoreCase("enabled")) return Boolean.class;
		
	
		return null;
	}

	public static User fromJson(JsonElement element){
		User val = new User();
		val.readJson(element);
		return val;
	}
	
}

