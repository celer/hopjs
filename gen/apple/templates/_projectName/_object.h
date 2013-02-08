/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import <Foundation/Foundation.h>
#import "HopService.h"

typedef void (^OnComplete) (NSString *error,id);

@interface <%= Apple.camelHump(object.name) %>: HopService
{
	<% for(var i in object.methods){ %>
		<% var method = object.methods[i]; %>
    HopMethodCall *<%=method.name%>;
	<% } %>
}
- (id) initWithBaseUrl:(NSString *)baseURL;
<% for(var i in object.methods){ %>
	<% var method = object.methods[i]; %>
/**
	<%=Apple.camelHump(object.name)+"."+method.name%>

	<%=(method.desc?method.desc:"")%>

	@param {NSDictionary *}	input
	<%for(var paramName in method.params){%>
		@param <%=paramName%> <%=method.params[paramName].desc?method.params[paramName].desc:""%> <%=method.params[paramName].demand?"(required)":""%> <%}%>
	
	@param {^(NSString *,id)} onComplete to be called when the call has been completed
	
	@return AFHTTPNetworkOperation or nil

*/
- (id) <%=method.name%>: (NSDictionary *) input whenComplete: (void (^)(NSString *error, id result)) onComplete;
<% } %>
@end
