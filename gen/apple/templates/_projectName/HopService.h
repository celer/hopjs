/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import <Foundation/Foundation.h>
#import "../Pods/AFNetworking/AFNetworking/AFNetworking.h"
#import "HopMethodCall.h"

/**
	Base class for Hop Service classes

	This class performs all the form encoding/decoding to support HopJS API calls
 
	@class HopService
*/
@interface HopService : NSObject
{
    AFHTTPClient *httpClient;
}

/**
	Static utility function to convert a JSON string into an NSDictionary 
	
	@param {NSString *} json JSON string to convert
	@return {NSDictionary *} Dictionary containing elements of JSON object

	@method fromJSON
	@static
*/
+ (NSDictionary *) fromJSON: (NSString *) json;

/**
	Static utility method to convert an NSDictionary into a JSON String

	@method toJSON
	@return {NSString *} JSON Encoding of the NSDictionary
	@static
*/
+ (NSString *) toJSON: (NSDictionary *) dict;

/**
	Constructor for a HopService

	@param {NSString *} baseURL the base URL for the website which offers the API
	
	@method initWithBaseUrl
*/
- (id) initWithBaseUrl: (NSString *) baseURL;

/**
	Perform a RESTful API call

	This function takes in a HopMethodCall class to specify the various parameters for the call

	@param {HopMethodCall *} methodCall The method call to perform
	@param {NSDictionary *} input A NSDictionary which contains the required and optional fields for the call
	@param {^(NSString *,id)} onComplete
		@param {NSString *} error The error string returned from the call 
		@param {id} result the resulting object, which may be an NSDictionary, NSNumber or NSString or nil

	@return nil or The AFHTTPRequestOperation which can be used for progress tracking or result monitoring
	
	
*/
- (id) doRequest:
    (HopMethodCall *) methodCall
         withInput: (NSDictionary *) input
      whenComplete: (void (^)(NSString *error, id result)) onComplete;


//Below here are protected methods which are mostly used to aid in construction the inputs to the restful calls
- (void) addData:(id)inputValue withName: (NSString *)name toFormUsing: (void (^)(NSString *name, NSData *data)) addToForm;
- (NSMutableArray *) convertArray: (NSArray *)input;
- (bool) prepareValues: (NSMutableDictionary *) output withInput: (NSDictionary *) input asField: (NSString *)fieldName;

@end
