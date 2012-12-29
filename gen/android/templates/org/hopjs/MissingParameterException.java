package org.hopjs;

public class MissingParameterException extends Exception {
	protected String parameter;
	public MissingParameterException(String parameter) {
		super("Missing parameter:"+parameter);
	}
	public String getParameter() {
		return parameter;
	}
	public void setParameter(String parameter) {
		this.parameter = parameter;
	}
	
}
