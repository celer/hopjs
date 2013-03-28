package <%=package%>.hopjs.api;

import org.hopjs.*;
import java.util.*;
import org.json.JSONObject;

public class <%=Java.camelHump(object.name)%> {

	protected HttpHelper helper;
		<% for(var i in object.methods){ %>
		<% var method = object.methods[i]; %>

		MethodCall <%=method.name%>Call=null;

		<% } %>

	public <%=Java.camelHump(object.name)%>(HttpHelper helper){
		this.helper = helper;
	
		<% for(var i in object.methods){ %>
		<% var method = object.methods[i]; %>
		<% var inputType = Java.methodGetJavaInputType(method); %>
		<% var outputType = Java.methodGetJavaOutputType(method);  %>

		<%=method.name%>Call = new MethodCall("<%=(object.name+'.'+method.name)%>","<%=method.method%>","<%=method.fullPath%>","<%=inputType%>","<%=outputType%>");
		<% for(var i in method.params){ %>
		<% var param = method.params[i]; %>
			<%=method.name%>Call.addParam("<%=i%>",<%=param.demand==true?"true":"false"%>,false)<%=((method.defaults&&(method.defaults[i]!=undefined))?".setDefaultValue(\""+method.defaults[i]+"\")":"")%>;	
		<%}%>
				

		<% } %>
	}

	<% for(var i in object.methods){ %>
	<% var method = object.methods[i]; %>
	<% var inputType = Java.methodGetJavaInputType(method);  %>
	<% var outputType = Java.methodGetJavaOutputType(method); %>


	public void <%=method.name%>(<%=inputType%> input,Listener<<%=outputType%>> listener)  {
			helper.doRequest(<%=method.name%>Call,input,listener);
	}


	<% } %>


}
