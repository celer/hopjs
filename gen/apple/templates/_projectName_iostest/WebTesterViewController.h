//
//  WebTesterViewController.h
//  IOSTester4
//
//  Created by celer on 1/28/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface WebTesterViewController : UIViewController
    @property IBOutlet UIWebView *webView;
    @property IBOutlet UIButton *testButton;
    @property IBOutlet UITextField *urlField;


    - (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType;

    - (void) startTest;

@end
