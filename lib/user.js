var RAPI = require('./api');
/**
Provides utility functions and DSL implemenations for Methods and Objects.

This class will look at request.session.user as a base implementation to support the 
RAPI.User.* functions. These functions are expected to be overrriden if needed.

@module RAPI.User
**/

/**
@module RAPI.User
	

*/


/**
Object for RAPI.User

@class User
@namespace RAPI
**/
RAPI.User={};


/**
Returns the name of the user from the HTTP request.

@method name
@static 
@return {String} name of user 
**/ 
RAPI.User.name=function(request){

}

/**
Returns the id of the user from the HTTP request.

@method id 
@static
@return {String} name of user 
**/ 
RAPI.User.id=function(request){

}

/**
Tests to see if this user has a role regarding a specific target

@method hasRole
@static
@return {String} name of user 
**/ 
RAPI.User.hasRole=function(request,role,target){

}

/**
Returns the id of the user from the HTTP request.

@method exists
@static
@return {String} name of user 
**/ 
RAPI.User.exists=function(request){

}

/**
Indicates that a user is required to call this function.

@example
	RAPI.defineClass("AccountService",function(api){
		//This will cause this function to return "Permission denied" unless a user is found via RAPI.User.exists();
		api.get("/account/:accountID").requireUser();
	});	


@method requiresUser
@for RAPI.Method
**/
RAPI.Method.prototype.requireUser=function(){
	this.options.requireUser=true;
}

/**
Indicates that a user is required to call this function.

@example
	RAPI.defineClass("UserService",function(api){
		//This will cause this function to return "Permission denied" unless a user is found via RAPI.User.hasRole();
		api.get("view","/admin/user/:userID").requireRole("admin");
	});	

@method requireRole
@for RAPI.Method
**/
RAPI.Method.prototype.requireRole=function(role){
	this.options.requireRole=role;
}

