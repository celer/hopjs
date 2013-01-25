//
//  main.m
//  HopJSCLI
//
//  Created by celer on 1/22/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "UserService.h"


int main(int argc, const char * argv[])
{

    @autoreleasepool {
        
        // insert code here...
        NSLog(@"Hello, World!");
        NSString *str = @"{\"a\":3, \"email\":\"foo\", \"name\":\"foo\", \"password\":\"bar\"}";
        NSData *data = [ str dataUsingEncoding:NSUTF8StringEncoding ];
        NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil ];
        
        NSLog(@"jsonObject=%@",dict);
        
        __block BOOL shouldKeepRunning = YES;        // global
        
        UserService *userService = [[UserService alloc] initWithBaseUrl:@"http://localhost:3000"];
        [userService create:dict whenComplete:^(NSString *error,NSDictionary *dict){
            //shouldKeepRunning = NO;
            if(error!=nil){
                NSLog(@"Error %@",error);
                
            } else {
                NSLog(@"Result %@",dict);
                
            }
        }];
        
        
        NSRunLoop *theRL = [NSRunLoop currentRunLoop];
        while (shouldKeepRunning && [theRL runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]]);
      
    }
    return 0;
}

