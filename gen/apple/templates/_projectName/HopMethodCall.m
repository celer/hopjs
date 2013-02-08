/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

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
