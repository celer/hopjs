//
//  WebTesterAppDelegate.h
//  HopWebTester
//
//  Created by celer on 1/24/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import "TestStub.h"

@interface WebTesterAppDelegate : NSObject <NSApplicationDelegate>

@property (assign) IBOutlet NSWindow *window;
@property (assign) IBOutlet WebView *webView;
@property (assign) IBOutlet NSButton *testButton;
@property (assign) IBOutlet NSTextField *url;
@property (assign) IBOutlet NSTextView *textView;
@property TestStub *testStub;

- (IBAction) runTest: (id) selector;

- (void)info:(NSString *) msg;
- (void)log:(NSString *) msg;
- (void)warn:(NSString *) msg;
- (void)error:(NSString *) msg;


- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame;
- (void)webView:(WebView*)webView addMessageToConsole:(NSDictionary*)message;

- (void)webView:(WebView *)sender resource:(id)identifier didFinishLoadingFromDataSource:(WebDataSource *)dataSource;
- (void)webView:(WebView *)sender resource:(id)identifier didFailLoadingWithError:(NSError *)error fromDataSource:(WebDataSource *)dataSource;

@end
