package org.hopjs;

import java.io.File;
import java.io.Serializable;

public class HopFile extends JSObject implements Serializable {
	public HopFile(String localFile, String originalName, String contentType) {
		super();
		put("localFile", localFile);
		put("originalName",originalName);
		put("contentType",contentType);
	}
	
	public String getLocalFile() {
		return (String) get("localFile");
	}
	public void setLocalFile(String localFile) {
		put("localFile",localFile);
	}
	public String getOriginalName() {
		return (String) get("originalName");
	}
	public void setOriginalName(String originalName) {
		put("originalName",originalName);
	}
	public String getContentType() {
		return (String) get("contentType");
	}
	public void setContentType(String contentType) {
		put("contentType",contentType);
	}
	
	public File localFile(){
		return new File(getLocalFile());
	}
	
	public boolean delete(){
		File f = new File(getLocalFile());
		return f.delete();
	}	
}

