package us.slipangle.rest.android;

import java.io.BufferedInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.client.protocol.ClientContext;
import org.apache.http.conn.params.ConnManagerParams;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;

import us.slipangle.rapi.JSObject;
import us.slipangle.rapi.MethodCall;
import us.slipangle.rapi.RAPIFile;
import android.annotation.SuppressLint;
import android.content.Context;
import android.net.http.AndroidHttpClient;
import android.net.http.HttpResponseCache;
import android.os.Bundle;
import android.os.Message;
import android.util.Log;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

public class RequestThread extends Thread {
	/**
	 * 
	 */
	private final RESTService restService;
	Message mMessage;

	RequestThread(RESTService restService, Message msg){
	 	this.restService = restService;
		String uuid =  msg.getData().getString(RESTService.UUID);
    	Log.d("XXXX","Thred con:"+uuid);
		mMessage = new Message();
		mMessage.copyFrom(msg);
		
	}
	
	public void processResponse(MethodCall call, Bundle bundle,InputStream in, Bundle headers){
		try {		
			String contentType = headers.getString("Content-Type");			
			int resultCode = bundle.getInt(RESTService.STATUSCODE);
			String reason = bundle.getString(RESTService.REASON);
			if(resultCode==200){
				if(contentType.toLowerCase().contains("json")){
				    JsonParser parser = new JsonParser();
				    JsonElement element = parser.parse(new InputStreamReader(in));
				    Log.d("XXXX",element.toString());				
					 
				    String outputType = call.getOutputClass();
				    if(outputType.equals("String")){
				    	String s = element.getAsString();
				    	bundle.putString(RESTService.RESULT,s);
				    } else if(outputType.equals("Double")){
				    	Double s = element.getAsDouble();
				    	bundle.putDouble(RESTService.RESULT,s);
				    } else if(outputType.equals("Boolean")){
				    	Boolean s = element.getAsBoolean();
				    	bundle.putBoolean(RESTService.RESULT,s);
				    } else if(outputType.equals("Integer")){
				    	Integer s = element.getAsInt();
				    	bundle.putInt(RESTService.RESULT,s);
				    } else if(outputType.startsWith("List<")){
				    	if(element.isJsonArray()){
				    		String objType = outputType.replace("List<","").replace(">","");
				    		Log.d("XXXX","TYPE "+objType);
				    		LinkedList list = new LinkedList();
				    		JsonArray array = (JsonArray) element;
				    		for(JsonElement e: array){
				    			JSObject obj = JSObject.newObjectFromJson(objType, e);
				    			list.add(obj);
				    		}
				    		bundle.putSerializable(RESTService.RESULT, list);
				    	} else {
				    		bundle.putString(RESTService.ERROR,"API Specification requires a return type of array, yet returned JSON element was not an array.");
				    	}
				    	
				    } else {
				    	JSObject obj = JSObject.newObjectFromJson(call.getOutputClass(), element);
				    	if(obj!=null){	
				    		bundle.putSerializable(RESTService.RESULT, obj);
				    	} else {
				    		bundle.putString(RESTService.ERROR,"Invalid model or class specified in API:"+call.getOutputClass());
				    	}
				    }
				} else {
					String outputType = call.getOutputClass();
					if(outputType=="File"){
						String filename = restService.getCacheDir()+"/"+bundle.getString(RESTService.UUID);
						FileOutputStream fos = restService.openFileOutput(filename, Context.MODE_PRIVATE);;
						byte inBytes[] = new byte[2048];
						int bytesLen=0;
						while((bytesLen=in.read(inBytes))!=-1){
							fos.write(inBytes,0,bytesLen);
						}
						fos.close();
						RAPIFile file = new RAPIFile(filename,"","");
						bundle.putSerializable(RESTService.RESULT,file);
					} else {
						StringBuffer inputString = new StringBuffer();
					    Reader inReader = new InputStreamReader(in);
					    char inChars[] = new char[1024];
					    int charsUsed = 0;
					    while((charsUsed=inReader.read(inChars))!=-1){
					    	inputString.append(inChars,0, charsUsed);
					    }
					    Log.d("XXXX",inputString.toString());
					    bundle.putString(RESTService.RESULT,inputString.toString());
					}
				}
			} else if(resultCode==404){
				
			} else if(resultCode==500){
	
				bundle.putString(RESTService.ERROR, reason);
				
				StringBuffer inputString = new StringBuffer();
			    Reader inReader = new InputStreamReader(in);
			    char inChars[] = new char[1024];
			    int charsUsed = 0;
			    while((charsUsed=inReader.read(inChars))!=-1){
			    	inputString.append(inChars,0, charsUsed);
			    }
			    Log.e("XXXX",inputString.toString());
			    bundle.putString(RESTService.RESULT,inputString.toString());
				
			}
	
		    in.close();
		
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			bundle.putString(RESTService.RESULT,e.getMessage());
		}
	
		restService.sendResponse(bundle);
	}
	
	
    @SuppressLint("NewApi")
	public void performRequest(Message msg){
    	
    	
       	String uuid =  msg.getData().getString(RESTService.UUID);
       	MethodCall call = (MethodCall) msg.getData().getSerializable(RESTService.METHODCALL);
       	JSObject input = (JSObject) msg.getData().getSerializable(RESTService.INPUT);
    	
       	String strURL = msg.getData().getString(RESTService.URL);
       	String method = call.getMethod();
       	
       	Bundle bundle = new Bundle();
       	bundle.putString(RESTService.UUID,uuid);
    	Log.d("XXXX","Perform:"+uuid);
        Log.d("XXXX","URL "+strURL);
        
        Log.d("XXXX","CACHE REQS "+HttpResponseCache.getInstalled().getNetworkCount());
        Log.d("XXXX","CACHE HITS "+HttpResponseCache.getInstalled().getHitCount());
        Log.d("XXXX","MAX SIZE "+HttpResponseCache.getInstalled().maxSize());
        Log.d("XXXX","MAX SIZE "+HttpResponseCache.getInstalled().size());
        HttpClient httpClient = null;
        
        
        
    	HttpURLConnection urlConn = null;
    	try {

			if(method.equalsIgnoreCase("get")){
			
						
				StringBuffer urlParams = new StringBuffer();
				for(String name: call.getParams().keySet()){
					Object val = input.get(name);
					if(val!=null){
						if(urlParams.length()==0)
							urlParams.append("?");
						else urlParams.append("&");
						urlParams.append(URLEncoder.encode(name,"utf-8"));
						urlParams.append("=");
						urlParams.append(URLEncoder.encode(val.toString(),"utf-8"));
					}
				}
				
				
				URL url = new URL(strURL+urlParams.toString());
				
				
				
				
				urlConn = (HttpURLConnection) url.openConnection();
			    InputStream in = new BufferedInputStream(urlConn.getInputStream());
			    
			    
			    
			    Bundle headers = new Bundle();
			    for(String name: urlConn.getHeaderFields().keySet()){
			    	headers.putString(name,urlConn.getHeaderField(name));
			    }
			    
				bundle.putBundle(RESTService.HEADERS, headers);
				bundle.putInt(RESTService.STATUSCODE, urlConn.getResponseCode());
				bundle.putString(RESTService.REASON,urlConn.getResponseMessage());
			    
			    processResponse(call, bundle, in, headers);
			   
			} else {	
	    		HttpContext context = new BasicHttpContext();
	    		HttpParams params = new BasicHttpParams();
	    		HttpConnectionParams.setConnectionTimeout(params, 3000);
	    		HttpConnectionParams.setSoTimeout(params, 3000);
	    		ConnManagerParams.setTimeout(params, 3000);
	    		context.setAttribute(ClientContext.COOKIE_STORE, new CookieStore()); 		
	    		httpClient = AndroidHttpClient.newInstance("RAPI");

				HttpResponse response;
				HttpRequestBase request;
				if(method.equalsIgnoreCase("del")){
					request  = new HttpDelete(strURL);
				} else if(method.equalsIgnoreCase("post")){
					request = new HttpPost(strURL);
					
					List<NameValuePair> nvp = new ArrayList<NameValuePair>(1);
					for(String name: call.getParams().keySet()){
						Object val = input.get(name);
						if(val!=null){
							nvp.add(new BasicNameValuePair(name,val.toString()));
						}
					}
					
					((HttpPost) request).setEntity(new UrlEncodedFormEntity(nvp));
					
				} else {
					throw new Exception("Invalid method type specified:"+method);
				}
	
				for(String key : call.getHeaders().keySet()){
					request.addHeader(key, call.getHeaders().get(key));
				}
	
				
				response = httpClient.execute(request,context);
				
				InputStream in = response.getEntity().getContent();
				
			    //Look at the response headers to see what kind of response 
				// we are getting / JSON / HTML / File
			
				String contentType = response.getFirstHeader("Content-Type").getValue();
				
				Log.d("XXXX",contentType);
	
				Bundle headers = new Bundle();
				for(Header header: response.getAllHeaders()){
					headers.putString(header.getName(),header.getValue());
				}
				bundle.putBundle(RESTService.HEADERS, headers);
				bundle.putInt(RESTService.STATUSCODE, response.getStatusLine().getStatusCode());
				bundle.putString(RESTService.REASON,response.getStatusLine().getReasonPhrase());
				
				processResponse(call,bundle, in, headers);
				
			    in.close();
		
    		}
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			bundle.putString(RESTService.RESULT,e.getMessage());
		} finally {
			if(httpClient!=null)
				((AndroidHttpClient) httpClient).close();
			if(urlConn!=null)
				urlConn.disconnect();
		}

    }
	
	public void run(){

		Log.d("XXXX","Starting Thread");


		performRequest(mMessage);

		this.restService.removeThread(this);
		this.restService.startThread();
	}
	
}