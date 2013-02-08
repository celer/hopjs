/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import "<%= Apple.camelHump(object.name)%>.h"

@implementation <%= Apple.camelHump(object.name) %> 
- (id) initWithBaseUrl:(NSString *)baseURL {
    
    self = [super initWithBaseUrl:baseURL];
    
<% for(var i in object.methods){ %>
	<% var method = object.methods[i]; %>
    <%=method.name%> = [[HopMethodCall alloc] init:@"<%=object.name%>.<%=method.name%>" usingA:@"<%=method.method.toUpperCase()%>" onPath:@"<%=Apple.webPathJoin(api.basePath,method.path)%>" withParams: [HopService fromJSON: @<%=JSON.stringify(JSON.stringify(method.params))%> ]];

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
