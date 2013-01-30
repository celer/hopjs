//
//  HopService.m
//  HopJSCLI
//
//  Created by celer on 1/22/13.
//  Copyright (c) 2013 hopjs.org. All rights reserved.
//

#import "HopService.h"


@implementation HopService

- (id) initWithBaseUrl: (NSString *) baseURL {
    httpClient = [AFHTTPClient clientWithBaseURL: [NSURL URLWithString: baseURL]];
    return self;
}

- (NSDictionary *) fromJSON: (NSString *) json {
    NSData *data = [ json dataUsingEncoding:NSUTF8StringEncoding ];
    return [NSJSONSerialization JSONObjectWithData:data options:0 error:nil ];
};

+ (NSDictionary *) fromJSON: (NSString *) json {
    NSData *data = [ json dataUsingEncoding:NSUTF8StringEncoding ];
    return [NSJSONSerialization JSONObjectWithData:data options:0 error:nil ];
};

+ (NSString *) toJSON: (NSDictionary *) dict {
    @try {
        NSError *error;
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:dict
                                                           options:NSJSONWritingPrettyPrinted
                                                             error:nil];
        NSString* aStr;
        aStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        return aStr;
    } @catch(NSException *e){
        return nil;
    }
}


- (bool) prepareValues:(NSMutableDictionary *)output withInput:(NSDictionary *)input asField:(NSString *)fieldName {
    NSLog(@"OUTPUT %@",output);
    bool hasData=false;
    for(NSString *valueName in input){
        id value = [input objectForKey: valueName];
        NSString *p=valueName;
        if(fieldName!=nil){
            p = [[NSMutableString alloc]initWithFormat:@"%@[%@]",fieldName,valueName];
        }
        if(value== [NSNull null]){
            [output setValue: @"" forKey:p];
            hasData=true;
        } else if([value isKindOfClass:[NSString class]]){
            [output setValue: value forKey:p ];
             hasData=true;
        } else if([value isKindOfClass:[NSDictionary class]]){
            hasData=[self prepareValues: output withInput: value asField: p];
            NSLog(@"Recurse %@",output);
        } else if([value isKindOfClass: [NSNumber class]]){
            NSLog(@"Number %@ %@",p,[value stringValue]);
            
            [output setValue: [value stringValue] forKey: p];
            hasData=true;
        } else {
            NSLog(@"Other %@",p);
            [output setValue: [value stringValue]forKey: p];
            hasData=true;
        }
        
    }
    NSLog(@"Done Recurse %@",output);
    return hasData;
}

- (id) doRequest:
(HopMethodCall *) methodCall
         withInput: (NSDictionary *) input
      whenComplete: (void (^)(NSString *error, id result)) onComplete {
    NSLog(@"Making call with input %@",input);
    NSLog(methodCall.name);
    __block NSMutableString *path = [[NSMutableString alloc] initWithCapacity: 2048];
    NSLog(@"jsonObject=%@",methodCall.params);

    
    __block NSMutableString *error=nil;
    
    NSMutableDictionary *_input = [[NSMutableDictionary alloc]init];
    [path appendString:methodCall.path];
    
    [methodCall.params enumerateKeysAndObjectsUsingBlock:^(id paramName, id paramData, BOOL *stop) {
        id value = [ input objectForKey: paramName];
        if([paramData objectForKey: @"demand"]!=nil){
            if(value==nil){
                NSLog(@"Missing %@",paramName);
                
                error=[[NSMutableString alloc]initWithFormat:@"Missing parameter:%@",paramName];
                *stop=1;
             }
        }
        
        NSString *needle = [[NSString alloc]initWithFormat:@":%@",paramName];
        if([path rangeOfString:needle].location!=NSNotFound){
            if([value isKindOfClass: [ NSString class]])
                path = [[path stringByReplacingOccurrencesOfString:needle withString:value] mutableCopy];
            if([value isKindOfClass: [ NSNumber class]])
                path = [[path stringByReplacingOccurrencesOfString:needle withString:[value stringValue]] mutableCopy];
        } else {
        
        [_input setValue:value forKey:paramName];
         NSLog(@"Param %@ Value %@",paramName,value);
        }
       
        
        
        
    }];
    
    if(error!=nil){
        onComplete(error,nil);
        return;
    }
    
    NSLog(@"Using path %@",path);
    
    NSMutableDictionary *output = [[NSMutableDictionary alloc]init];
    
    [self prepareValues:output withInput:_input asField:nil];
    
    NSURLRequest *request=nil;
    if([methodCall.method isEqualToString:@"POST"] ||[methodCall.method isEqualToString:@"PUT"] ){
        request = [httpClient multipartFormRequestWithMethod: methodCall.method path: path parameters:nil constructingBodyWithBlock:
                             ^(id<AFMultipartFormData>formData){
                                 [output enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
                                
                                     NSLog(@"Setting param %@ to %@",key,obj);
                                     NSData *data = [ obj dataUsingEncoding:NSUTF8StringEncoding ];
                                     [formData appendPartWithFormData:data name:key];
                                 
                                 }];
                             }];
    } else {
        request = [httpClient requestWithMethod: methodCall.method path: path parameters:_input ];
        
    }
    
    AFHTTPRequestOperation *operation = [[AFHTTPRequestOperation alloc]initWithRequest:request ];
    
    [operation setCompletionBlockWithSuccess:^(AFHTTPRequestOperation *operation, id responseObject) {
        NSLog(@"Done");
        if(responseObject!=nil){
            NSLog(@"Response %@",operation.responseString);
            NSError *error;
            
            NSData *JSONData = [operation.responseString dataUsingEncoding:operation.responseStringEncoding];
            NSDictionary *responseJSON = [NSJSONSerialization JSONObjectWithData:JSONData options:0 error:&error];
            
            if(error==nil){
            
                NSLog(@"JSON %@",responseJSON);
                onComplete(nil,responseJSON);
                
            } else {
                NSLog(@"STRIN %@",operation.responseString);
                onComplete(nil,operation.responseString);
            }
        }
     
    } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
        NSLog(@"Error %@",error);
       
        if([operation.response statusCode]==404){
            onComplete(nil,nil);
            
        } else {
        
            NSString *errorStr = [[error userInfo]valueForKey:NSLocalizedRecoverySuggestionErrorKey];
            if(errorStr!=nil){
                onComplete(errorStr,nil);
            } else {
                onComplete([error localizedDescription],nil);
              
            }
        }
        
    }];
    
    
    [operation start];
    
    
}
@end
