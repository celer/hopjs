//
//  WebTesterViewController.h
//  IOSTester4
//
//  Created by celer on 1/28/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "TestStub.h"

@interface WebTesterViewController : UIViewController
    @property IBOutlet UIWebView *webView;
    @property IBOutlet UIButton *testButton;
    @property IBOutlet UITextField *urlField;
    @property TestStub *testStub;


    - (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType;

    - (void) startTest;

@end
