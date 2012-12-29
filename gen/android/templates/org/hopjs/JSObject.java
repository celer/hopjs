package org.hopjs;

import java.io.Serializable;
import java.util.Date;
import java.util.Hashtable;
import java.util.Map;

import com.google.gson.JsonElement;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;

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
	
	public void addToJsonObject(JsonObject jobj){
		for(String key:data.keySet()){
			Object val = data.get(key);
			if(val!=null){
				if(val instanceof JSObject){
					JsonObject obj = new JsonObject();
					((JSObject) val).addToJsonObject(obj);
					jobj.add(key,obj);
				} else {
					if(val instanceof Boolean){
						jobj.addProperty(key, (Boolean) val); 
					} else if(val instanceof String){
						jobj.addProperty(key,(String) val);
					} else if(val instanceof Number){
						jobj.addProperty(key,(Number) val);						
					} else {
						jobj.addProperty(key, val.toString());
					}
				}
			} else {
				jobj.add(key,JsonNull.INSTANCE);
			}
		}
	}
	
	public String toJSON(){
		JsonObject json = new JsonObject();
		
		this.addToJsonObject(json);
		
		return json.toString();
	}
	
	public Class getFieldType(String name){
		return null;
	}
	
	public static JSObject newObject(String typeName){
		try {
			String pkg = JSObject.class.getPackage().getName();
			Class c = Class.forName(pkg+"."+typeName);
			return (JSObject) c.newInstance();
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	public static JSObject newObjectFromJson(String typeName,JsonElement element){
		JSObject obj = newObject(typeName);
		if(obj!=null){
			obj.readJson(element);
			return obj;
		} else return null;
	}
	
	public void readJson(JsonElement element){
		if(element.isJsonObject()){
			JsonObject jobj = (JsonObject) element;
			for(Map.Entry<String,JsonElement> item: jobj.entrySet()){
				JsonElement e = item.getValue();
				if(e.isJsonPrimitive()){
					Class c = this.getFieldType(item.getKey());
					if(c!=null){
						if(c.equals(String.class)) {
							this.put(item.getKey(),e.getAsString());
						} else if(c.equals(Float.class)){
							this.put(item.getKey(),e.getAsFloat());
						} else if(c.equals(Integer.class)){
							this.put(item.getKey(),e.getAsInt());
						} else if(c.equals(Double.class)){
							this.put(item.getKey(),e.getAsDouble());
						} else if(c.equals(Boolean.class)){
							this.put(item.getKey(),e.getAsBoolean());
						} else if(c.equals(Date.class)){
							//FIXME
							this.put(item.getKey(),new Date(e.getAsString()));
						}
					} else {
						this.put(item.getKey(),e.getAsString());
					}
				} else if(e.isJsonNull()){
					this.put(item.getKey(),null);
				} else {
					Class c = this.getFieldType(item.getKey());
					if(c!=null){
						if(c.equals(JSObject.class)){
							JSObject jsObj = new JSObject();
							jsObj.readJson(item.getValue());
						} else if(c.equals(Date.class)){
							//FIXME
							this.put(item.getKey(),new Date(e.getAsString()));
						}
					}
					
				}
			}
			
		}
	}

	
}
