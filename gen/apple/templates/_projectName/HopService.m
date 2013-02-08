/*

	This file is generated as part of the hopjs code generator for Apple(tm) related products and is licensed
	under an MIT License, see http://github.com/celer/hopjs for more details.

*/

#import "HopService.h"


@implementation HopService

- (id) initWithBaseUrl: (NSString *) baseURL {
    httpClient = [AFHTTPClient clientWithBaseURL: [NSURL URLWithString: baseURL]];
    return self;
}

+ (NSDictionary *) fromJSON: (NSString *) json {
    NSData *data = [ json dataUsingEncoding:NSUTF8StringEncoding ];
    return [NSJSONSerialization JSONObjectWithData:data options:0 error:nil ];
};

+ (NSString *) toJSON: (NSDictionary *) dict {
    @try {
        NSError *error=nil;
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:dict
                                                           options:NSJSONWritingPrettyPrinted
                                                             error:&error];
        
        if(error!=nil){
            NSLog(@"Error encoding JSON Object: %@",error);
            return nil;
        }
        
        NSString* aStr;
        aStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        return aStr;
    } @catch(NSException *e){
        NSLog(@"Error encoding JSON Object: %@",e);
        return nil;
    }
}

- (NSMutableArray *) convertArray: (NSArray *)input  {
    NSMutableArray *outputArray=[[NSMutableArray alloc] init];
    for(id arrayValue in input){
        if([arrayValue isKindOfClass:[NSString class]]){
            [outputArray addObject: arrayValue];
        } else if([arrayValue isKindOfClass:[NSNumber class]]){
            [outputArray addObject: [arrayValue stringValue]];
        } else if([arrayValue isKindOfClass:[NSDictionary class]]){
            NSMutableDictionary *arrayDict = [[NSMutableDictionary alloc] init];
            [self prepareValues:arrayDict withInput: arrayValue asField: nil];
            [outputArray addObject: arrayDict];
        } else if([arrayValue isKindOfClass: [NSArray class]]){
            NSMutableArray *arrayArray = [self convertArray: input];
            [outputArray addObject: arrayArray];
        }
    }
    return outputArray;
}


- (bool) prepareValues:(NSMutableDictionary *)output withInput:(NSDictionary *)input asField:(NSString *)fieldName {
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
            //NSLog(@"Recurse %@",output);
        } else if([value isKindOfClass: [NSNumber class]]){
            //NSLog(@"Number %@ %@",p,[value stringValue]);
            
            [output setValue: [value stringValue] forKey: p];
            hasData=true;
        } else if([value isKindOfClass: [NSArray class]]){
            hasData=true;
            [output setValue: [self convertArray: value] forKey: p];
        } else {
            //NSLog(@"Other %@",p);
            [output setValue: [value stringValue]forKey: p];
            hasData=true;
        }
        
    }
    //NSLog(@"Done Recurse %@",output);
    return hasData;
}

- (void) addData:(id)inputValue withName: (NSString *)name toFormUsing: (void (^)(NSString *name, NSData *data)) addToForm {
    if([inputValue isKindOfClass:[NSArray class]]){
        for(id arrayValue in inputValue){
            [self addData: arrayValue withName: name toFormUsing: addToForm];
        }
    } else {
        NSData *data = [ inputValue dataUsingEncoding:NSUTF8StringEncoding ];
        addToForm(name,data);
    }
}

- (id) doRequest:
(HopMethodCall *) methodCall
         withInput: (NSDictionary *) input
      whenComplete: (void (^)(NSString *error, id result)) onComplete {

    __block NSMutableString *path = [[NSMutableString alloc] initWithCapacity: 2048];

    
    __block NSMutableString *error=nil;
    
    NSMutableDictionary *_input = [[NSMutableDictionary alloc]init];
    [path appendString:methodCall.path];
    
    [methodCall.params enumerateKeysAndObjectsUsingBlock:^(id paramName, id paramData, BOOL *stop) {
        id value = [ input objectForKey: paramName];
        if([paramData objectForKey: @"demand"]!=nil){
            if(value==nil){
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
        }
       
        
        
        
    }];
    
    if(error!=nil){
        onComplete(error,nil);
        return nil;
    }
    
    
    NSMutableDictionary *output = [[NSMutableDictionary alloc]init];
    
    [self prepareValues:output withInput:_input asField:nil];
    
    NSURLRequest *request=nil;
    if([methodCall.method isEqualToString:@"POST"] ||[methodCall.method isEqualToString:@"PUT"] ){
        request = [httpClient multipartFormRequestWithMethod: methodCall.method path: path parameters:nil constructingBodyWithBlock:
                             ^(id<AFMultipartFormData>formData){
                                 [output enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
                                     [self addData:obj withName:key toFormUsing:^(NSString *name, NSData *data) {
                                         [formData appendPartWithFormData:data name:name];
                                     }];
                                 }];
                             }];
    } else {
        request = [httpClient requestWithMethod: methodCall.method path: path parameters:_input ];
        
    }
    
    AFHTTPRequestOperation *operation = [[AFHTTPRequestOperation alloc]initWithRequest:request ];
    
    [operation setCompletionBlockWithSuccess:^(AFHTTPRequestOperation *operation, id responseObject) {
        if(responseObject!=nil){
            NSError *error;
            
            NSData *JSONData = [operation.responseString dataUsingEncoding:operation.responseStringEncoding];
            NSDictionary *responseJSON = [NSJSONSerialization JSONObjectWithData:JSONData options:0 error:&error];
            
            if(error==nil){
                onComplete(nil,responseJSON);
                
            } else {
                onComplete(nil,operation.responseString);
            }
        }
     
    } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
       
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
   
		return operation; 
    
}
@end
