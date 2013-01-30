//
//  WebTesterViewController.m
//  IOSTester4
//
//  Created by celer on 1/28/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import "WebTesterViewController.h"

@interface WebTesterViewController ()

@end

@implementation WebTesterViewController

@synthesize webView;
@synthesize testButton;
@synthesize urlField;
@synthesize testStub;


- (void)viewDidLoad
{
    [super viewDidLoad];

    [testButton addTarget: self action: @selector(startTest)forControlEvents:UIControlEventTouchUpInside];
   
    [webView setDelegate:self];
    
    [urlField setText:@"http://localhost:3000/"];

}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    
}


- (void) startTest {
    NSLog(@"Starting test");
    //Create a URL object.
    NSURL *url = [NSURL URLWithString:[urlField text]];
   
    testStub = [[TestStub alloc] initWithUrl:[urlField text] andWebView:webView];
    
    //URL Requst Object
    NSURLRequest *requestObj = [NSURLRequest requestWithURL:url];
    NSError *error;
    
    NSString *html = [[NSString alloc] initWithContentsOfFile: [[NSBundle mainBundle] pathForResource: @"index" ofType: @"html"]  encoding:NSASCIIStringEncoding error:&error];
 
    if(error!=nil){
        NSLog(@"Error: %@",error);
        
    }
    
    [webView loadHTMLString:html baseURL:url];
    
    
    NSString *js = [[NSString alloc] initWithContentsOfFile: [[NSBundle mainBundle] pathForResource: @"index" ofType: @"js"]  encoding:NSASCIIStringEncoding error:&error];
    
    if(error!=nil){
        NSLog(@"Error: %@",error);
        
    }
    
    [webView stringByEvaluatingJavaScriptFromString:js];
    
  }

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
   
    
    
    NSString *input = [[request URL] absoluteString];
    if([input hasPrefix:@"api:"]){
        NSString *jsonInput = [[input substringFromIndex:4] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
              
        NSData *data = [ jsonInput dataUsingEncoding:NSUTF8StringEncoding ];
        NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil ];
        NSLog(@"JSON Data %@",dict);
        [testStub runMethod:dict];
        return NO;
    }
    
    if ([input hasPrefix:@"ios-log:"]) {
        NSString *logInput = [[input substringFromIndex:4] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
        NSString* logString = [[logInput componentsSeparatedByString:@":#iOS#"] objectAtIndex:1];
        NSLog(@"UIWebView console: %@", logString);
        return NO;
    }
    
    return YES;
}

@end
