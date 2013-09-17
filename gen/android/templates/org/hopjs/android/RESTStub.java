package org.hopjs.android;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.UUID;

import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
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
import org.hopjs.HopFile;
import org.hopjs.HttpHelper;
import org.hopjs.JSObject;
import org.hopjs.Listener;
import org.hopjs.MethodCall;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import android.content.Context;
import android.net.http.AndroidHttpClient;
import android.net.http.HttpResponseCache;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Message;
import android.util.Log;

public class RESTStub extends HttpHelper {
  protected Context mContext;
  protected String baseUrl;
  protected CookieManager mCookieManager;
  RESTTask mRestTask = null;
  static protected CookieStore cookieStore = new CookieStore();

  static final String UUID_KEY = "UUID";
  static final String URL = "URL";
  static final String HEADERS = "HEADERS";
  static final String INPUT = "INPUT";
  static final String METHODCALL = "METHODCALL";
  public static final String STATUSCODE = "STATUSCODE";
  public static final String REASON = "REASON";
  public static final String RESULT = "RESULT";

  public static final String ERROR = "ERROR";

  protected HashMap<String,Listener> mListeners = new HashMap<String,Listener>();


  public RESTStub(Context context,String baseUrl){
    this.mContext = context;
    this.baseUrl = baseUrl;
    mCookieManager = new CookieManager();
    CookieHandler.setDefault(mCookieManager);
    enableHttpResponseCache();
  }

  private void enableHttpResponseCache() {
    try {
      long httpCacheSize = 10 * 1024 * 1024; // 10 MiB
      File httpCacheDir = new File(mContext.getCacheDir(), "http");
      Log.d("TaskTracker","Setting http cache");
      Class.forName("android.net.http.HttpResponseCache")
        .getMethod("install", File.class, long.class)
        .invoke(null, httpCacheDir, httpCacheSize);
    } catch (Exception httpResponseCacheNotAvailable) {
      Log.e("XXXX","Cache unavailable",httpResponseCacheNotAvailable);
    }
  }

  public CookieManager getCookieManager() {
    return mCookieManager;
  }

  public void setCookieManager(CookieManager mCookieManager) {
    this.mCookieManager = mCookieManager;
  }

  public void handleResponse(Bundle data){
    String uuid = (String) data.get(RESTStub.UUID_KEY);
    Log.d("XXXX",uuid);
    if(uuid!=null){
      Listener listener = mListeners.get(uuid);
      try {
        if(listener!=null){
          String error = data.getString(RESTStub.ERROR);
          int resultCode = data.getInt(RESTStub.STATUSCODE);
          if(resultCode==404){
            listener.onComplete(null,null);
          } else if(resultCode==200){
            if(data.containsKey(RESTStub.RESULT)){
              Object res = data.getSerializable(RESTStub.RESULT);
              listener.onComplete(error, res);
            } else {
              listener.onComplete(error, null);
            }
          } else if(resultCode==500){
            listener.onComplete(error, null);
          }
        }
      } catch(Exception e){
        Log.e("XXXX","Error calling Hop listener:"+ e.getMessage(),e);

      }
    }
  }


  public UUID makeRequest(String url,MethodCall call,JSObject input, Listener listener){
    Log.d("XXXX","Making request");
    UUID requestUUID = UUID.randomUUID();
    Message msg = new Message();
    Bundle bundle = new Bundle();
    bundle.putString(RESTStub.UUID_KEY,requestUUID.toString());
    bundle.putSerializable(RESTStub.METHODCALL,call);
    bundle.putSerializable(RESTStub.INPUT, input);
    bundle.putString(RESTStub.URL,url);

    msg.setData(bundle);

    if(listener!=null){
      mListeners.put(requestUUID.toString(),listener);
    }
    try {
      mRestTask = new RESTTask();
      mRestTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR, (Message) msg);
    } catch (Exception e) {
      e.printStackTrace();
    }
    return requestUUID;
  }

  @Override
  public void doRequest(MethodCall call, JSObject input,
                        Listener listener)  {

    String path = "";
    Bundle inputs = new Bundle();
    for(String paramName : call.getParams().keySet() ){
      Object val = input.get(paramName);
      MethodCall.Param param = call.getParams().get(paramName);
      if(val==null && param.demand){
        if(param.defaultValue==null){
          listener.onComplete("Missing required parameter: "+paramName, null);
          return;
        } else {
          inputs.putString(paramName,param.defaultValue.toString());
        }
      } if(val!=null)
        inputs.putString(paramName, val.toString());
    }

    path = this.prepareURL(call.getPath(), input);
    makeRequest(baseUrl+path,call, input, listener);
  }


  public class RESTTask extends AsyncTask<Message, Void, Bundle> {
    String uuid = null;

    @Override
    protected Bundle doInBackground(Message... params) {
      Bundle mRet = null;
      if(params.length < 1){
        Log.e("XXXX", "No message passed into RESTTask");
        return null;
      }
      Message msg = params[0];
      mRet = performAsync(msg);


      return mRet;
    }

    @Override
    protected void onPostExecute(final Bundle retMsg) {
      handleResponse(retMsg);
    }

    @Override
    protected void onCancelled() {

    }
  }

  public Bundle performAsync(Message msg){
    String uuid =  msg.getData().getString(RESTStub.UUID_KEY);
    MethodCall call = (MethodCall) msg.getData().getSerializable(RESTStub.METHODCALL);
    JSObject input = (JSObject) msg.getData().getSerializable(RESTStub.INPUT);
    Bundle retBundle = null;

    String strURL = msg.getData().getString(RESTStub.URL);
    String method = call.getMethod();

    Bundle bundle = new Bundle();
    bundle.putString(RESTStub.UUID_KEY,uuid);

    Log.d("XXXX","Perform:"+uuid);
    Log.d("XXXX","URL "+strURL);
    Log.d("XXXX","CACHE REQS "+ HttpResponseCache.getInstalled().getNetworkCount());
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
            urlParams.append(URLEncoder.encode(name, "utf-8"));
            urlParams.append("=");
            urlParams.append(URLEncoder.encode(val.toString(),"utf-8"));
          }
        }

        URL url = new URL(strURL+urlParams.toString());
        Log.i("TaskTracker", "url:" + url.toString());
        strURL = url.toString();
      }

      HttpContext context = new BasicHttpContext();
      HttpParams params = new BasicHttpParams();
      HttpConnectionParams.setConnectionTimeout(params, 3000);
      HttpConnectionParams.setSoTimeout(params, 3000);
      ConnManagerParams.setTimeout(params, 3000);
      context.setAttribute(ClientContext.COOKIE_STORE, cookieStore);
      cookieStore.logCookies();

      httpClient = AndroidHttpClient.newInstance("Hop");

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
      } else if(method.equalsIgnoreCase("get")){
        request = new HttpGet(strURL);
      } else{
        throw new Exception("Invalid method type specified:"+method);
      }

      for(String key : call.getHeaders().keySet()){
        Log.i("TaskTracker", "Adding header:" + key + " with value:" + call.getHeaders().get(key));
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
      bundle.putBundle(RESTStub.HEADERS, headers);
      bundle.putInt(RESTStub.STATUSCODE, response.getStatusLine().getStatusCode());
      bundle.putString(RESTStub.REASON,response.getStatusLine().getReasonPhrase());

      retBundle = processResponse(call,bundle, in, headers);

      in.close();

    } catch (Exception e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
      bundle.putString(RESTStub.RESULT,e.getMessage());
    } finally {
      if(httpClient!=null)
        ((AndroidHttpClient) httpClient).close();
      if(urlConn!=null)
        urlConn.disconnect();
    }
    return retBundle;

  }

  public Bundle processResponse(MethodCall call, Bundle bundle,InputStream in, Bundle headers){
    try {
      String contentType = headers.getString("Content-Type");
      if(contentType == null){
        contentType = headers.getString("content-type");
        if(contentType == null){
          Log.e("TaskTracker", "No content-type found in header");
          bundle.putString(RESTStub.ERROR,"No content-type found");
          return bundle;
        }
      }
      int resultCode = bundle.getInt(RESTStub.STATUSCODE);
      String reason = bundle.getString(RESTStub.REASON);
      if(resultCode==200){
        if(contentType.toLowerCase().contains("json")){
          InputStreamReader inReader = new InputStreamReader(in);
          StringBuffer responseString = new StringBuffer();
          int data = inReader.read();
          while(data != -1){
            responseString.append((char)data);
            data = inReader.read();
          }
          String finalResponse = responseString.toString();
          Object element = null;
          if(finalResponse.charAt(0) == '['){
            //It's an JSONArray
            element = new JSONArray(new JSONTokener(finalResponse));
          }else{
            element = new JSONObject(new JSONTokener(finalResponse));
          }
          Log.d("XXXX",element.toString());

          String outputType = call.getOutputClass();
          if(outputType.equals("String")){
            bundle.putString(RESTStub.RESULT,finalResponse);
          } else if(outputType.equals("Double")){
            bundle.putDouble(RESTStub.RESULT,Double.parseDouble(finalResponse));
          } else if(outputType.equals("Boolean")){
            bundle.putBoolean(RESTStub.RESULT,Boolean.parseBoolean(finalResponse));
          } else if(outputType.equals("Integer")){
            bundle.putInt(RESTStub.RESULT,Integer.parseInt(finalResponse));
          } else if(outputType.startsWith("List<")){
            Log.d("XXXX","inside LIST");
            if(element.getClass() == JSONArray.class){
              String objType = outputType.replace("List<","").replace(">","");
              Log.d("XXXX","TYPE "+objType);
              LinkedList list = new LinkedList();
              JSONArray array = (JSONArray) element;
              for(int i = 0; i < array.length(); i++){
                JSONObject e = array.getJSONObject(i);
                JSObject obj = JSObject.newObjectFromJson(objType, e);
                list.add(obj);
              }
              bundle.putSerializable(RESTStub.RESULT, list);
            } else {
              bundle.putString(RESTStub.ERROR,"API Specification requires a return type of array, yet returned JSON element was not an array.");
            }

          } else {
            JSObject obj = JSObject.newObjectFromJson(call.getOutputClass(), (JSONObject)element);
            if(obj!=null){
              bundle.putSerializable(RESTStub.RESULT, obj);
            } else {
              bundle.putString(RESTStub.ERROR,"Invalid model or class specified in API:"+call.getOutputClass());
            }
          }
        } else {
          String outputType = call.getOutputClass();
          if(outputType=="File"){
            String filename = mContext.getCacheDir()+"/"+bundle.getString(RESTStub.UUID_KEY);
            FileOutputStream fos = mContext.openFileOutput(filename, Context.MODE_PRIVATE);;
            byte inBytes[] = new byte[2048];
            int bytesLen=0;
            while((bytesLen=in.read(inBytes))!=-1){
              fos.write(inBytes,0,bytesLen);
            }
            fos.close();
            HopFile file = new HopFile(filename,"","");
            bundle.putSerializable(RESTStub.RESULT,file);
          } else {
            StringBuffer inputString = new StringBuffer();
            Reader inReader = new InputStreamReader(in);
            char inChars[] = new char[1024];
            int charsUsed = 0;
            while((charsUsed=inReader.read(inChars))!=-1){
              inputString.append(inChars,0, charsUsed);
            }
            Log.d("XXXX",inputString.toString());
            bundle.putString(RESTStub.RESULT,inputString.toString());
          }
        }
      } else if(resultCode==404){

      } else if(resultCode==500){

        bundle.putString(RESTStub.ERROR, reason);
        StringBuffer inputString = new StringBuffer();
        Reader inReader = new InputStreamReader(in);
        char inChars[] = new char[1024];
        int charsUsed = 0;
        while((charsUsed=inReader.read(inChars))!=-1){
          inputString.append(inChars,0, charsUsed);
        }
        Log.e("XXXX",inputString.toString());
        bundle.putString(RESTStub.RESULT,inputString.toString());
      }
      in.close();

    } catch (Exception e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
      bundle.putString(RESTStub.RESULT,e.getMessage());
    }
    return bundle;
  }
}
