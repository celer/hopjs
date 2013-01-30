//
//  TestStub.h
//  HopWebTester
//
//  Created by celer on 1/24/13.
//
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface TestStub : NSObject

@property UIWebView *webView;
@property NSString *url;


- (id) initWithUrl: (NSString *) url andWebView: (UIWebView *) webView;
- (void) runMethod: (NSDictionary *) input;
+ (NSString *) doOnComplete: (NSString *) onCompleteString withError: (NSString *)errorString withOutput: (id) dict forWebView: (UIWebView *) webView;


@end
