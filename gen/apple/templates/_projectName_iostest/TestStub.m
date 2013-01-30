//
//  TestStub.m
//  HopWebTester
//
//  Created by celer on 1/24/13.
//
//

#import "TestStub.h"
#import "HopService.h"

@implementation TestStub

@synthesize webView;
@synthesize url;

- (id) initWithUrl:(NSString *)_url andWebView:(UIWebView *) _webView {
    self=[super init];
    
    url=_url;
    webView = _webView;
    
    return self;
}

+ (NSString *) doOnComplete: (NSString *) onCompleteString withError: (NSString *)errorString withOutput: (id) dict forWebView: (UIWebView *) webView {
       
    
}

- (void) runMethod: (NSDictionary *) obj {
    
    @try {
    NSLog(@"RunMethod %@",obj);
        
       
    
    NSString *method = [obj valueForKey:@"method"];
    NSString *data = [obj valueForKey:@"input"];
    __block NSString *onComplete = [obj valueForKey:@"onComplete"];
       
        NSLog(@"DATA %@",data);
        NSLog(@"onComplete %@",onComplete);
    
    NSLog(@"Method inputs: %@ %@",method,data);
    
    if(onComplete==nil){
        NSLog(@"onComplete is null for %@",obj);
        
        return;
    }
        
       
    if(method==nil){       
        [TestStub doOnComplete:onComplete withError:@"Invalid method specified" withOutput:nil forWebView:webView];
         return;
    }
         
    if(data==nil){
        [TestStub doOnComplete:onComplete withError:@"Invalid input specified" withOutput:nil forWebView: webView];
        return;
    }
    
    
   
    
    NSMutableArray *items = [[NSMutableArray alloc] initWithArray:[method componentsSeparatedByString:@"."]];
    if([items count]>1){
        
        
        id APIClass = NSClassFromString([items objectAtIndex:0]);
        
        NSLog(@"Class %@",APIClass);
        
        
        
        id api = [((HopService *)[APIClass alloc]) initWithBaseUrl:url];
    
        NSLog(@"Instantated thing %@",api);
        
        [items removeObjectAtIndex:0];
        NSString *method = [[NSString alloc]initWithFormat:@"%@:whenComplete:",[items componentsJoinedByString:@"."]];
        
        NSLog(@"method %@",method);
        
        SEL selector = NSSelectorFromString(method);
        
     
        
       
        
        [api performSelector: selector withObject:data withObject:^(NSString *error, id result){
            NSLog(@"Call complete %@ %@",error,result);
            
            NSString *onCompleteEval = [NSString stringWithString: onComplete];
            if(error!=nil){
                onCompleteEval = [onCompleteEval stringByReplacingOccurrencesOfString:@"#{ERROR}" withString:[NSString stringWithFormat:@"\"%@\"", error]];
            } else {
                onCompleteEval = [onCompleteEval stringByReplacingOccurrencesOfString:@"#{ERROR}" withString:@"null"];
            }
            
            if(result!=nil){
                NSString *resultStr=nil;
                if([result isKindOfClass:[NSString class]]){
                    resultStr=[NSString stringWithFormat:@"\"%@\"",result];
                } else if([result isKindOfClass:[NSNumber class]]){
                    resultStr=[result stringRepresentation];
                } else if([result isKindOfClass:[NSDictionary class]]){
                    resultStr = [HopService toJSON:result];
                }
                onCompleteEval = [onCompleteEval stringByReplacingOccurrencesOfString:@"#{OUTPUT}" withString:resultStr];
            } else {
                 onCompleteEval = [onCompleteEval stringByReplacingOccurrencesOfString:@"#{OUTPUT}" withString:@"null"];
            }
            
          
            //[TestStub doOnComplete:onComplete withError:nil withOutput:nil forWebView:nil];
            NSLog(@"%@ %@",webView, onCompleteEval);
            
            [webView stringByEvaluatingJavaScriptFromString:onCompleteEval];
        }];
        
        
    } else {
        return;
    }
    return;
    } @catch(NSException *e){
        NSLog(@"EXCP %@",e);
    }
    

}


@end
