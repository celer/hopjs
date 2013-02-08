/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import <Foundation/Foundation.h>

/**
*	Provides a concrete class for capturing details about a various API call supported by Hop
* 
* @class HopMethodCall
*/
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
