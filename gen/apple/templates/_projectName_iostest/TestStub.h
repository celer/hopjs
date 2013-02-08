/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

/**
	Stub class which converts JavaScript calls into native API calls

	If a URL with the prefix api: is requested then it will be caught by this class and run using the native RESTful api. 

	@example
		<a href='api:{ "method":"User.create", "input":{"username":"bob"}, "onComplete":"API.callback[3434]({#ERROR},#{OUTPUT})"}'/>
	
	This class is primarly provided as a means to drive the native API 
			

	@class TestStrub
*/
@interface TestStub : NSObject

@property UIWebView *webView;
@property NSString *url;


- (id) initWithUrl: (NSString *) url andWebView: (UIWebView *) webView;
/**
	Runs a specific native RESTful API method given a NSDictionary as input

	@param {NSDictionary} input
		@param method The method to run 
		@param input	The parsed JSON input
		@param onComplete the javascript to be evaluated upon completion #{ERROR} and #{OUTPUT} will be substituded with the error and output of completed method call
*/
- (void) runMethod: (NSDictionary *) input;

/**
	Evaluate the onComplete string passed into runMethod with the given error and result

	@param {NSString *} error 
	@param {id} result

	@return {NSString} result of evaluating the onComplete

*/
+ (NSString *) doOnComplete: (NSString *) onCompleteString withError: (NSString *)error withOutput: (id) result forWebView: (UIWebView *) webView;


@end
