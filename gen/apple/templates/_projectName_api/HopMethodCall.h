//
//  HopMethodCall.h
//  HopJSCLI
//
//  Created by celer on 1/22/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface HopMethodCall : NSObject

@property NSString *name;
@property NSString *path;
@property NSString *method;
@property NSDictionary *params;
@property NSDictionary *options;

- (id) init:
(NSString *) name
     usingA: (NSString *) method
     onPath: (NSString *) path
 withParams: (NSDictionary *) params;

- (id) initWithOptions:
(NSString *) name
     usingA: (NSString *) method
     onPath: (NSString *) path
 withParams: (NSDictionary *) params
 andOptions: (NSDictionary *) options;

@end
