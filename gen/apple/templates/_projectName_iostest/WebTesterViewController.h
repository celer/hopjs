/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import <UIKit/UIKit.h>
#import "TestStub.h"

/**
	Primary class for runing the web tester	

	@class WebTesterViewController
*/
@interface WebTesterViewController : UIViewController
    @property IBOutlet UIWebView *webView;
    @property IBOutlet UIButton *testButton;
    @property IBOutlet UITextField *urlField;
    @property TestStub *testStub;


    - (BOOL) webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType;

    - (void) startTest;

@end
