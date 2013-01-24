//
//  UserService.h
//  HopJSCLI
//
//  Created by celer on 1/22/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

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
- (id) <%=method.name%>: (NSDictionary *) input whenComplete: (void (^)(NSString *error, id result)) onComplete;
<% } %>
@end
