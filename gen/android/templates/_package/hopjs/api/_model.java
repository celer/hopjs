package <%=package%>.hopjs.api;

import org.hopjs.*;
import java.util.*;
import org.json.JSONObject;

public class <%=Java.camelHump(model.name)%> extends JSObject {

	<% for(var i in model.fields){ %>
	<% var field = model.fields[i]; %>
	<% var type = Java.modelFieldToJavaType(field); %>
	
	public boolean is<%=Java.camelHump(field.name)%>Defined(){
		return this.isDefined("<%=field.name%>");
	}


	public <%=type + " "%> <%=(field.type!=Boolean?"get":"is")%><%=Java.camelHump(field.name)%>(){
		return (<%=type%>) this.get("<%=field.name%>");
	}
	public void set<%=Java.camelHump(field.name)%>(<%=type%> value){
		this.put("<%=field.name%>",(Object) value);
	}
	<% } %>

	public Class getFieldType(String name){
	<% for(var i in model.fields){ %>
	<% var field = model.fields[i]; %>
	<% var type = Java.modelFieldToJavaType(field); %>
		if(name.equalsIgnoreCase("<%=field.name%>")) return <%=type%>.class;
		
	<% } %>
		return null;
	}

	public static <%=Java.camelHump(model.name)%> fromJson(JSONObject element){
		<%=Java.camelHump(model.name)%> val = new <%=Java.camelHump(model.name)%>();
		val.readJson(element);
		return val;
	}
	
}

