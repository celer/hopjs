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


- (void)viewDidLoad
{
    [super viewDidLoad];

    [testButton addTarget: self action: @selector(startTest)forControlEvents:UIControlEventTouchUpInside];
   
    [webView setDelegate:self];
	// Do any additional setup after loading the view, typically from a nib.
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


- (void) startTest {
  

    
    //Create a URL object.
    NSURL *url = [NSURL URLWithString:[urlField text]];
    
    //URL Requst Object
    NSURLRequest *requestObj = [NSURLRequest requestWithURL:url];
    NSError *error;
    
    NSString *html = [[NSString alloc] initWithContentsOfFile: [[NSBundle mainBundle] pathForResource: @"index" ofType: @"html"]  encoding:NSASCIIStringEncoding error:&error];
 
    if(error!=nil){
        NSLog(@"Error: %@",error);
        
    }
    
    [webView loadHTMLString:html baseURL:url];
    
    //Load the request in the UIWebView.
    //[webView loadRequest:requestObj];
}

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
   
     NSLog(@"URL %@",request);
    
    NSString *input = [[request URL] absoluteString];
    if([input hasPrefix:@"api:"]){
        NSString *jsonInput = [[input substringFromIndex:4] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
        NSLog(@"JSON %@",jsonInput);
        
        NSData *data = [ jsonInput dataUsingEncoding:NSUTF8StringEncoding ];
        NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil ];
        NSLog(@"JSON Data %@",dict);
    }
   
    
    return YES;
}

@end
