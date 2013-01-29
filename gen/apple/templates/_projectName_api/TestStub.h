//
//  TestStub.h
//  HopWebTester
//
//  Created by celer on 1/24/13.
//
//

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>

@interface TestStub : NSObject

@property WebScriptObject *wso;
@property NSString *url;



+(NSString*)webScriptNameForSelector:(SEL)sel;
+(BOOL)isSelectorExcludedFromWebScript:(SEL)sel;

- (id) initWithUrl: (NSString *) url andWebScriptObject: (WebScriptObject *) wso;
- (void) runMethod: (WebScriptObject *) obj;
- (void) log: (NSString *) msg;
- (void) cb: (WebScriptObject *) obj;

@end
