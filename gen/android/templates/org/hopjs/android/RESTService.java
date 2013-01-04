package org.hopjs.android;

import java.io.File;
import java.net.CookieHandler;
import java.net.CookieManager;
import java.util.Stack;

import android.annotation.SuppressLint;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.util.Log;
import android.widget.Toast;


@SuppressLint("NewApi")
public class RESTService extends Service {
	protected Messenger mOutMessenger;
	
	private Stack<Message> mTasks = new Stack<Message>();
	private Stack<Thread> mThreads = new Stack<Thread>();
	
	protected CookieManager mCookieManager;
	
	static int MAX_THREADS = 4;
	
    /** Command to the service to display a message */
	static final int MAKE_REQUEST=0;
	static final int RESPONSE_COMPLETE=1;
	static final int RESPONSE_ERROR=2;
	static final int RESPONSE_TIMEOUT=3;
	static final String UUID = "UUID";
    static final String URL = "URL";
    static final String METHOD = "METHOD";
    static final String HEADERS = "HEADERS";
    static final String INPUT = "INPUT";
    static final String OUTPUT = "OUTPUT";

	static final String METHODCALL = "METHODCALL";
	public static final String STATUSCODE = "STATUSCODE";
	public static final String REASON = "REASON";

	public static final String RESULT = "RESULT";

	public static final String ERROR = "ERROR";
    
   
    /**
     * Handler of incoming messages from clients.
     */
    class IncomingHandler extends Handler {
        @Override
        public void handleMessage(Message msg) {
        	Log.d("XXXX","Incomming message");
            switch (msg.what) {
                case MAKE_REQUEST:
                    enqueuRequest(msg);
                    break;
                default:
                    super.handleMessage(msg);
            }
        }
    }
    
    
    
    public CookieManager getCookieManager() {
		return mCookieManager;
	}

	public void setCookieManager(CookieManager mCookieManager) {
		this.mCookieManager = mCookieManager;
	}
	

	@Override
	public void onCreate() {
		// TODO Auto-generated method stub
    	mCookieManager = new CookieManager();
    	
    	enableHttpResponseCache();
    	disableConnectionReuseIfNecessary();
    	CookieHandler.setDefault(mCookieManager);
		super.onCreate();
	}

	private void enableHttpResponseCache() {
        try {
            long httpCacheSize = 10 * 1024 * 1024; // 10 MiB
            File httpCacheDir = new File(getCacheDir(), "http");
            Log.d("XXXX","Setting http cache");
            Class.forName("android.net.http.HttpResponseCache")
                .getMethod("install", File.class, long.class)
                .invoke(null, httpCacheDir, httpCacheSize);
        } catch (Exception httpResponseCacheNotAvailable) {
        	Log.e("XXXX","Cache unavailable",httpResponseCacheNotAvailable);
        }
    }
	
	private void disableConnectionReuseIfNecessary() {
		   // Work around pre-Froyo bugs in HTTP connection reuse.
		   if (Integer.parseInt(Build.VERSION.SDK) < Build.VERSION_CODES.FROYO) {
		     System.setProperty("http.keepAlive", "false");
		   
	}}
    
    public void enqueuRequest(Message msg){
    	Message inMessage = new Message();
    	inMessage.copyFrom(msg);
    	mTasks.push(inMessage);
    	
    	startThread();
    }

    
    protected void removeThread(RequestThread t){
    	synchronized(mThreads){
    		mThreads.remove(t);
    	}
    }
    
	protected void startThread(){
		synchronized(mThreads){
			Log.d("XXXX","Number of thread: "+mThreads.size());
			Log.d("XXXX","Number of requests: "+mTasks.size());
			if(mThreads.size()< MAX_THREADS && mTasks.size()>0){
				Message msg = mTasks.pop();
				
		    	String uuid =  msg.getData().getString(RESTService.UUID);
		    	Log.d("XXXX","pop:"+uuid);
				
				RequestThread t = new RequestThread(this, msg);
				mThreads.push(t);
				t.start();
			} else {
				Log.d("XXXX","Too many threads or no work");
			}
		}
	}
    

    public void sendResponse(Bundle bundle){
    	
        Message backMsg = Message.obtain();
        backMsg.what=RESTService.RESPONSE_COMPLETE;
       
        backMsg.setData(bundle);
        try {
          mOutMessenger.send(backMsg);
        } catch (android.os.RemoteException e1) {
          Log.w(getClass().getName(), "Exception sending message", e1);
        }
    }
    
    /**
     * Target we publish for clients to send messages to IncomingHandler.
     */
    final Messenger mMessenger = new Messenger(new IncomingHandler());

    /**
     * When binding to the service, we return an interface to our messenger
     * for sending messages to the service.
     */
    @Override
    public IBinder onBind(Intent intent) {
        Toast.makeText(getApplicationContext(), "binding", Toast.LENGTH_SHORT).show();
        Bundle extras = intent.getExtras();
        if(extras!=null){
        	Log.d("XXXX","Got out messenger");
        	mOutMessenger = (Messenger) extras.get("MESSENGER");
       
        }
        return mMessenger.getBinder();
    }
}
