package org.hopjs.android;

import java.util.Date;
import java.util.LinkedList;
import java.util.List;

import org.apache.http.cookie.Cookie;

import android.util.Log;


public class CookieStore implements  org.apache.http.client.CookieStore {
	protected LinkedList<Cookie> cookies = new LinkedList<Cookie>();
	
	@Override
	public void addCookie(Cookie cookie) {
		synchronized(cookies){
		cookies.add(cookie);
		}
	}

	@Override
	public void clear() {
		synchronized(cookies){
		cookies.clear();
		}
	}

	@Override
	public boolean clearExpired(Date date) {
		boolean removedAny=false;
		synchronized(cookies){
			
			for(Cookie cookie: cookies){
				if(cookie.isExpired(date)){
					cookies.remove(cookie);
				}
			}
		} 
		return removedAny;
	}

	@Override
	public List<Cookie> getCookies() {
		return cookies;
	}

}
