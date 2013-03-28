package org.hopjs;

import java.io.Serializable;
import java.util.Date;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class JSObject implements Serializable  {
	protected Hashtable<String,Object> data=new Hashtable<String,Object>();
	
	public String[] getKeys(){
			return data.keySet().toArray(new String[0]);
	}

	public boolean isDefined(String name){
		return data.containsKey(name);
	}
	
	public Object get(String name){
		return data.get(name);
	}
	
	public void delete(String name){
		data.remove(name);
	}

	public void put(String name, Object value){
		data.put(name, value);
	}
	
	public void addToJsonObject(JSONObject jobj){
		for(String key:data.keySet()){
			Object val = data.get(key);
			if(val!=null){
				try {
					if(val instanceof JSObject){
						JSONObject obj = new JSONObject();
						((JSObject) val).addToJsonObject(obj);
						jobj.put(key,obj);
					} else {
						if(val instanceof Boolean){
							jobj.put(key, (Boolean) val); 
						} else if(val instanceof String){
							jobj.put(key,(String) val);
						} else if(val instanceof Number){
							jobj.put(key,(Number) val);						
						} else {
							jobj.put(key, val.toString());
						}
					}
				} catch (JSONException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			} else {
				try {
					jobj.put(key,JSONObject.NULL);
				} catch (JSONException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
	}
	
	public String toJSON(){
		JSONObject json = new JSONObject();
		
		this.addToJsonObject(json);
		
		return json.toString();
	}
	
	public Class getFieldType(String name){
		return null;
	}
	
	public static JSObject newObject(String typeName){
		try {
			String pkg = JSObject.class.getPackage().getName();
			Class c = Class.forName("<%=package%>" +"."+typeName);
			return (JSObject) c.newInstance();
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	public static JSObject newObjectFromJson(String typeName,JSONObject element){
		JSObject obj = newObject(typeName);
		if(obj!=null){
			obj.readJson(element);
			return obj;
		} else return null;
	}
	
	public void readJson(JSONObject element){
		try {
			JSONObject jobj = element;
			Iterator keys = jobj.keys();
			while(keys.hasNext()){
				String currentKey = (String) keys.next();
				Object e = jobj.get(currentKey);
				String currentValueClass = e.getClass().getName();
				if(currentValueClass.equals(JSONObject.class.getName())){
					JSONObject currentValue;
					currentValue = jobj.getJSONObject(currentKey);
					Class c = this.getFieldType(currentKey);
					if(c!=null){
						if(c.equals(JSObject.class)){
							JSObject jsObj = new JSObject();
							jsObj.readJson(currentValue);
							//McD - Not sure but I think this should be saved
							this.put(currentKey,  jsObj);
							
						} else if(c.equals(Date.class)){
							//FIXME
							this.put(currentKey,new Date(jobj.getString(currentKey)));
						}
					}
				}else if(currentValueClass.equals(String.class.getName())){
					this.put(currentKey, jobj.getString(currentKey));
				}else if(currentValueClass.equals(Integer.class.getName())){
					this.put(currentKey, jobj.getInt(currentKey));
				}else if(currentValueClass.equals(Double.class.getName())){
					this.put(currentKey, jobj.getDouble(currentKey));
				}else if(currentValueClass.equals(Long.class.getName())){
					this.put(currentKey, jobj.getLong(currentKey));
				}else if(currentValueClass.equals(Boolean.class.getName())){
					this.put(currentKey, jobj.getBoolean(currentKey));
				}else if(currentValueClass.equals(JSONObject.NULL.getClass().getName())){
					this.put(currentKey,  null);
				}
			}
		} catch (JSONException e1) {
			//FIXME Yeah, this needs real error handling
			e1.printStackTrace();
		}
	}
}
