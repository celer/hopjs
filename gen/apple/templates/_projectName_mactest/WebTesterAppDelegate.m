/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import "WebTesterAppDelegate.h"

@implementation WebTesterAppDelegate

@synthesize url;
@synthesize testButton;
@synthesize webView;
@synthesize testStub;
@synthesize textView;

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
    
    [webView setUIDelegate:self];
		[webView setFrameLoadDelegate:self];
		[webView setResourceLoadDelegate:self];
    
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
    
    [url setStringValue:@"http://localhost:3000/"];
}



- (IBAction) runTest:(id)selector {
    NSString *urlToTest = [url stringValue];
    
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
    
    NSError *error = nil;
    
    NSString *htmlContent = [[NSString alloc] initWithContentsOfFile: [[NSBundle mainBundle] pathForResource: @"index" ofType: @"html"] encoding:NSASCIIStringEncoding error:&error];
    
    
    if(error!=nil){
        [self error:[[NSString alloc]initWithFormat:@"Error loading index.html: %@",[error localizedDescription]]];
    } else {
        [[webView mainFrame] loadHTMLString:htmlContent baseURL:[NSURL URLWithString:urlToTest]];
    }
    
}

- (void)info:(NSString *) msg{
		NSMutableAttributedString *string = [[NSMutableAttributedString alloc] initWithString: [[NSString alloc]initWithFormat:@"%@\n",msg]];
		NSTextStorage *storage = [textView textStorage];
		[string addAttribute:NSForegroundColorAttributeName value:[NSColor blueColor] range:NSMakeRange(0, [string length])];
			
		[storage beginEditing];
		[storage appendAttributedString:string];
		[storage endEditing];
}
- (void)log:(NSString *) msg{
		NSMutableAttributedString *string = [[NSMutableAttributedString alloc] initWithString: [[NSString alloc]initWithFormat:@"%@\n",msg]];
		NSTextStorage *storage = [textView textStorage];
		[string addAttribute:NSForegroundColorAttributeName value:[NSColor grayColor] range:NSMakeRange(0, [string length])];
			
		[storage beginEditing];
		[storage appendAttributedString:string];
		[storage endEditing];
}
- (void)warn:(NSString *) msg{
    NSMutableAttributedString *string = [[NSMutableAttributedString alloc] initWithString: [[NSString alloc]initWithFormat:@"%@\n",msg]];
		NSTextStorage *storage = [textView textStorage];
    [string addAttribute:NSForegroundColorAttributeName value:[NSColor orangeColor] range:NSMakeRange(0, [string length])];
    
		[storage beginEditing];
		[storage appendAttributedString:string];
		[storage endEditing];
}
- (void)error:(NSString *) msg{
    NSMutableAttributedString *string = [[NSMutableAttributedString alloc] initWithString: [[NSString alloc]initWithFormat:@"%@\n",msg]];
		NSTextStorage *storage = [textView textStorage];
    [string addAttribute:NSForegroundColorAttributeName value:[NSColor redColor] range:NSMakeRange(0, [string length])];
    
		[storage beginEditing];
		[storage appendAttributedString:string];
		[storage endEditing];
}


- (void) webView:(WebView*)webView addMessageToConsole:(NSDictionary*)message
{
		NSLog(@"bm %@",message);
			if (![message isKindOfClass:[NSDictionary class]]) {
			return;
		}
		NSString *msgLevel = [message valueForKey:@"MessageLevel"];
    if([msgLevel isEqualToString:@"LogMessageLevel"]){
        [self log:[[NSString alloc]initWithFormat:@"%@:%@ %@",[message valueForKey:@"sourceURL"],[message valueForKey:@"lineNumber"],[message valueForKey:@"message"]]];
    } else if([msgLevel isEqualToString:@"ErrorMessageLevel"]){
        [self error:[[NSString alloc]initWithFormat:@"%@:%@ %@",[message valueForKey:@"sourceURL"],[message valueForKey:@"lineNumber"],[message valueForKey:@"message"]]];
    } else if([msgLevel isEqualToString:@"WarningMessageLevel"]){
        [self warn:[[NSString alloc]initWithFormat:@"%@:%@ %@",[message valueForKey:@"sourceURL"],[message valueForKey:@"lineNumber"],[message valueForKey:@"message"]]];
    } else {
        [self info:[[NSString alloc]initWithFormat:@"%@:%@ %@",[message valueForKey:@"sourceURL"],[message valueForKey:@"lineNumber"],[message valueForKey:@"message"]]];
    }
}

- (void)webView:(WebView *)sender resource:(id)identifier didFinishLoadingFromDataSource:(WebDataSource *)dataSource {
    [self info: [[NSString alloc] initWithFormat:@"Loaded %@",[[dataSource request].URL path]]];
}

- (void)webView:(WebView *)sender resource:(id)identifier didFailLoadingWithError:(NSError *)error fromDataSource:(WebDataSource *)dataSource {
    [self error: [[NSString alloc] initWithFormat:@"%@ %@",[error localizedDescription], [[error userInfo] objectForKey:NSURLErrorFailingURLStringErrorKey] ]];
}



- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame {
    [self info:@"Done loading test page"];
    
    WebScriptObject *wso = [webView windowScriptObject];
    
    
    NSError *error = nil;
    
    NSString *jsContent = [[NSString alloc] initWithContentsOfFile: [[NSBundle mainBundle] pathForResource: @"index" ofType: @"js"] encoding:NSASCIIStringEncoding error:&error];
    NSLog(@"JS %@",jsContent);
    if(error!=nil){
        [self error:[[NSString alloc]initWithFormat:@"Error loading index.js: %@",[error localizedDescription]]];
    } else {
    
        testStub = [[TestStub alloc]initWithUrl:[url stringValue] andWebScriptObject:wso];
    
        [wso setValue:testStub forKey:@"TestStub"];

        
        [webView stringByEvaluatingJavaScriptFromString:jsContent];
        
        [wso evaluateWebScript:@"console.log('foo')"];
        [wso evaluateWebScript:@"console.warn('foo')"];
        [wso evaluateWebScript:@"console.error('foo')"];
    }
    
}

@end
