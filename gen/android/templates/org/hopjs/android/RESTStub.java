package us.slipangle.rest.android;

import java.util.HashMap;
import java.util.UUID;

import us.slipangle.rapi.HttpHelper;
import us.slipangle.rapi.JSObject;
import us.slipangle.rapi.Listener;
import us.slipangle.rapi.MethodCall;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.util.Log;

public class RESTStub extends HttpHelper {
	protected Context mContext;
	public Messenger mService = null;
	public boolean mBound=false;
	protected String baseUrl;
	
	protected HashMap<String,Listener> mListeners = new HashMap<String,Listener>();
	
	
	public RESTStub(Context context,String baseUrl){
		this.mContext = context;
		this.baseUrl = baseUrl;
	}
	
	private Handler mHandler = new Handler() {
	    public void handleMessage(Message message) {
	      Bundle data = message.getData();

	      handleResponse(message);  
	      
	      
	      Log.d("XXXX","Stub on MEssage");
	      
	    }
	};
	
	public void handleResponse(Message message){
		Bundle data = message.getData();
		String uuid = (String) data.get(RESTService.UUID);
		Log.d("XXXX",uuid);
		if(uuid!=null){
			Listener listener = mListeners.get(uuid);
			try {
				if(listener!=null){
					String error = message.getData().getString(RESTService.ERROR);
					int resultCode = message.getData().getInt(RESTService.STATUSCODE);
					if(resultCode==404){
						listener.onComplete(null,null);
					} else if(resultCode==200){
						if(message.getData().containsKey(RESTService.RESULT)){
							Object res = message.getData().getSerializable(RESTService.RESULT);
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
	
    /**
     * Class for interacting with the main interface of the service.
     */
    private ServiceConnection mConnection = new ServiceConnection() {
        public void onServiceConnected(ComponentName className, IBinder service) {
            // This is called when the connection with the service has been
            // established, giving us the object we can use to
            // interact with the service.  We are communicating with the
            // service using a Messenger, so here we get a client-side
            // representation of that from the raw IBinder object.
            mService = new Messenger(service);
            mBound = true;
        }

        public void onServiceDisconnected(ComponentName className) {
            // This is called when the connection with the service has been
            // unexpectedly disconnected -- that is, its process crashed.
            mService = null;
            mBound = false;
        }
    };
    
    
	
    public UUID makeRequest(String url,MethodCall call,JSObject input, Listener listener){
    	Log.d("XXXX","Making request");
	    UUID requestUUID = UUID.randomUUID();
    	Message msg = Message.obtain(null, RESTService.MAKE_REQUEST, 0, 0);
    	Bundle bundle = new Bundle();
    	bundle.putString(RESTService.UUID,requestUUID.toString());
    	bundle.putSerializable(RESTService.METHODCALL,call);
    	bundle.putSerializable(RESTService.INPUT, input);   
    	bundle.putString(RESTService.URL,url);
    	
    	msg.setData(bundle);
    	
    	if(listener!=null){
    		mListeners.put(requestUUID.toString(),listener);
    		
    	}
	    try {
	        mService.send(msg);
	    } catch (RemoteException e) {
	        e.printStackTrace();
	    }
	    return requestUUID;
    }
    
    
  
    public void bind() {
    	Intent intent = new Intent(mContext,RESTService.class);
    	
    	Messenger messenger = new Messenger(mHandler);
    	intent.putExtra("MESSENGER", messenger);
    	
        mContext.bindService(intent, mConnection,Context.BIND_AUTO_CREATE);
    }


    public void unbind() {
        
        if (mBound) {
            mContext.unbindService(mConnection);
            mBound = false;
        }
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
	
}
