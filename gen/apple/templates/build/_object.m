//
//  UserService.m
//  HopJSCLI
//
//  Created by celer on 1/22/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import "<%= Apple.camelHump(object.name)%>.h"

@implementation <%= Apple.camelHump(object.name) %> 
- (id) initWithBaseUrl:(NSString *)baseURL {
    
    self = [super initWithBaseUrl:baseURL];
    
<% for(var i in object.methods){ %>
	<% var method = object.methods[i]; %>
    <%=method.name%> = [[HopMethodCall alloc] init:@"<%=object.name%>.<%=method.name%>" usingA:@"<%=method.method%>" onPath:@"<%=method.fullPath%>" withParams: [self fromJSON: @<%=JSON.stringify(JSON.stringify(method.params))%> ]];

<%}%>
    
    return self;
}
<% for(var i in object.methods){ %>
	<% var method = object.methods[i]; %>
- (id) <%=method.name%>: (NSDictionary *)input
            whenComplete: (void (^)(NSString *error,id result)) handler {
    
        return [self doRequest:<%=method.name%> withInput:input whenComplete:handler ];
    
    
    }
<% } %>
@end
