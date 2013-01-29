//
//  HopMethodCall.m
//  HopJSCLI
//
//  Created by celer on 1/22/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import "HopMethodCall.h"

@implementation HopMethodCall

@synthesize name;
@synthesize path;
@synthesize method;
@synthesize params;
@synthesize options;

-(id) initWithOptions:(NSString *)_name usingA:(NSString *)_method onPath:(NSString *)_path withParams:(NSDictionary *)_params andOptions: (NSDictionary *) _options {
   
    self = [super init];
    
    name=_name;
    method=_method;
    path=_path;
    params=_params;
    options=_options;
    
    
    return self;
    
}

-(id) init:(NSString *)_name usingA:(NSString *)_method onPath:(NSString *)_path withParams:(NSDictionary *)_params  {
    
    return [self initWithOptions:_name usingA:_method onPath:_path withParams:_params andOptions:nil];
}



@end
