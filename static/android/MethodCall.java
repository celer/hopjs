package <%=package%>;

import java.io.Serializable;
import java.util.Hashtable;

public class MethodCall implements Serializable {
	public class Param {
		String name;
		public boolean demand;
		public boolean file;
		public String defaultValue;
		
		public Param(String name, boolean demand, boolean file) {
			super();
			this.name = name;
			this.demand = demand;
			this.file = file;
		}
	
		public Param setDefaultValue(String obj){
			this.defaultValue=obj;
			return this;
		}
		
	};
	
	protected Hashtable<String,MethodCall.Param> params = new Hashtable<String,MethodCall.Param>();
	protected Hashtable <String,String> headers = new Hashtable<String,String>();
	
	protected String inputClass;
	protected String outputClass;
	protected String methodName;
	protected String method;
	protected String path;
	
	public MethodCall(String methodName, String method, String path,
			String inputClass, String outputClass) {
		super();
		this.methodName = methodName;
		this.method = method;
		this.path = path;
		this.inputClass = inputClass;
		this.outputClass = outputClass;
	}

	public Hashtable<String, MethodCall.Param> getParams() {
		return params;
	}

	public void setParams(Hashtable<String, MethodCall.Param> params) {
		this.params = params;
	}

	public Hashtable<String, String> getHeaders() {
		return headers;
	}

	public void setHeaders(Hashtable<String, String> headers) {
		this.headers = headers;
	}

	public String getInputClass() {
		return inputClass;
	}

	public void setInputClass(String inputClass) {
		this.inputClass = inputClass;
	}

	public String getOutputClass() {
		return outputClass;
	}

	public void setOutputClass(String outputClass) {
		this.outputClass = outputClass;
	}

	public String getMethodName() {
		return methodName;
	}

	public void setMethodName(String methodName) {
		this.methodName = methodName;
	}

	public String getMethod() {
		return method;
	}

	public void setMethod(String method) {
		this.method = method;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}
	

	public void addParam(MethodCall.Param param){
		this.params.put(param.name, param);
	}
	
	public MethodCall.Param addParam(String name,boolean demand,boolean file){
		MethodCall.Param param = new MethodCall.Param(name,demand,file);
		this.params.put(param.name,param);
		return param;
	}
	
	public void setHeader(String name,String value){
		this.headers.put(name,value);
	}
	
}
