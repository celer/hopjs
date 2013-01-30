//
//  HopService.h
//  HopJSCLI
//
//  Created by celer on 1/22/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "../Pods/AFNetworking/AFNetworking/AFNetworking.h"
#import "HopMethodCall.h"


@interface HopService : NSObject
{
    AFHTTPClient *httpClient;
}
- (void) addData:(id)inputValue withName: (NSString *)name toFormUsing: (void (^)(NSString *name, NSData *data)) addToForm;
- (NSMutableArray *) convertArray: (NSArray *)input;
- (bool) prepareValues: (NSMutableDictionary *) output withInput: (NSDictionary *) input asField: (NSString *)fieldName;
- (id) initWithBaseUrl: (NSString *) baseURL;
+ (NSDictionary *) fromJSON: (NSString *) json;
- (NSDictionary *) fromJSON: (NSString *) json;
+ (NSString *) toJSON: (NSDictionary *) dict;
- (id) doRequest:
    (HopMethodCall *) methodCall
         withInput: (NSDictionary *) input
      whenComplete: (void (^)(NSString *error, id result)) onComplete;
@end
