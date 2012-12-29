package org.hopjs;


public abstract class HttpHelper {

	public String prepareURL(String url,JSObject input){
			for(String key : input.getKeys()){
				Object val = input.get(key);
				if(val!=null){
					url = url.replace(":"+key,val.toString());
				}
			}
			return url;
	}

	public abstract void doRequest(MethodCall methodCall,JSObject input, Listener listener);

	//GET add params to URL

	//POST add params to body

}
