/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>


/**
	Class for mapping special URLs to calls into the API 

	This class uses a WebScriptObject to recieve calls 

	@class TestStub	
*/
@interface TestStub : NSObject

@property WebScriptObject *wso;
@property NSString *url;

+(NSString*)webScriptNameForSelector:(SEL)sel;
+(BOOL)isSelectorExcludedFromWebScript:(SEL)sel;

- (id) initWithUrl: (NSString *) url andWebScriptObject: (WebScriptObject *) wso;

/**
	This method is called when a native API called is called from JavaScript

	@param {WebScriptObject} WebScript object from the initial call

	@method runMethod
*/
- (void) runMethod: (WebScriptObject *) obj;
- (void) log: (NSString *) msg;

@end
