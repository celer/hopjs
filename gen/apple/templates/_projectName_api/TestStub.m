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

@synthesize wso;
@synthesize url;

- (id) initWithUrl:(NSString *)_url andWebScriptObject:(WebScriptObject *)_wso {
    self=[super init];
    
    url=_url;
    wso=_wso;
    
    return self;
}

+(NSString*)webScriptNameForSelector:(SEL)sel {
    if(sel == @selector(runMethod:))
        return @"runMethod";
    if(sel == @selector(log:))
        return @"log";
    if(sel == @selector(cb:))
        return @"cb";
    return nil;
    
}

+(BOOL)isSelectorExcludedFromWebScript:(SEL)sel {
    if(sel == @selector(runMethod:))
        return NO;
    if(sel == @selector(log:))
        return NO;
    if(sel == @selector(cb:))
        return NO;
    return YES;
}


- (void) cb: (WebScriptObject *)obj {
    NSLog(@"CB %@",obj);
    
    
    NSLog(@"Input %@",[obj valueForKey:@"data"]);
    //NSLog(@"JSON %@",[obj callWebScriptMethod:@"JSON.stringify" withArguments:[[NSArray alloc]initWithObjects:[obj valueForKey:@"data"], nil]]);
     NSLog(@"JSON %@",[obj evaluateWebScript:@"JSON.stringify(this.data)"]);
}

- (void) log: (NSString *) msg{
    
    NSLog(@"Log %@",msg );
}

- (void) runMethod: (WebScriptObject *) obj {
    
    @try {
    NSLog(@"RunMethod %@",obj);
    
    NSString *method = [obj valueForKey:@"method"];
    NSString *data = [obj valueForKey:@"input"];

    NSLog(@"Method inputs: %@ %@",method,data);
    
    if([obj valueForKey:@"onComplete"]==nil){
        NSLog(@"Invalid or missing on complete for TestStub.runMethod");
        return;
    }
    
       
    if(method==nil){
        [obj callWebScriptMethod:@"onComplete" withArguments:[[NSArray alloc] initWithObjects:@"Invalid method specified", nil]];
         return;
    }
         
    if(data==nil){
        [obj callWebScriptMethod:@"onComplete" withArguments:[[NSArray alloc] initWithObjects:@"Invalid input specified", nil]];
        return;
    }
    
    
   
    
    NSMutableArray *items = [[NSMutableArray alloc] initWithArray:[method componentsSeparatedByString:@"."]];
    if([items count]>1){
        NSLog(@"Method %@",[items objectAtIndex:0]);
        
        id APIClass = NSClassFromString([items objectAtIndex:0]);
        
        NSLog(@"Class %@",APIClass);
        
        
        
        id api = [((HopService *)[APIClass alloc]) initWithBaseUrl:url];
    
        NSLog(@"Instantated thing %@",api);
        
        [items removeObjectAtIndex:0];
        NSString *method = [[NSString alloc]initWithFormat:@"%@:whenComplete:",[items componentsJoinedByString:@"."]];
        
        NSLog(@"method %@",method);
        
        SEL selector = NSSelectorFromString(method);
        
        
        NSDictionary *input = [HopService fromJSON:data];
        
        [api performSelector: selector withObject:input withObject:^(NSString *error, id result){
            NSLog(@"Call complete %@",result);
            
            NSString *strResult = nil;
            
            if(result!=nil){
                strResult = [HopService toJSON:result];
                NSLog(@"TestStub - sending back result: %@",strResult);
            }
            if(strResult==nil && result!=nil){
                strResult=result;
            }
            
            NSMutableArray *cbResults = [[NSMutableArray alloc]init];
            if(error==nil)
                [cbResults addObject:[NSNull null]];
            else [cbResults addObject:error];
            if(strResult==nil)
                [cbResults addObject:[NSNull null]];
            else
                [cbResults addObject:strResult];
            
            [obj callWebScriptMethod:@"onComplete" withArguments:cbResults];
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
