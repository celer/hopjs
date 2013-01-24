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
        NSString *str = @"{\"a\":3}";
        NSData *data = [ str dataUsingEncoding:NSUTF8StringEncoding ];
        NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil ];
        
        NSLog(@"jsonObject=%@",dict);
        
        UserService *userService = [[UserService alloc]init];
        
      
    }
    return 0;
}

