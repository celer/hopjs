{ 
	'targets': [
		{
			'target_name': 'HopJSAPI',
			'product_name': 'HopJSAPI',
			'type': 'executable',
			'mac_bundle': 1,
			'sources': [
				'./build/HopService.h',
				'./build/HopMethodCall.h',
				'./build/HopService.m',
				'./build/HopMethodCall.m',
				'./build/main.m',
				<% for(var objectName in api.Objects){	 %>
				'./build/<%=Apple.camelHump(objectName)%>.h',
				'./build/<%=Apple.camelHump(objectName)%>.m',
				<% } %>
			],
			'mac_bundle_resources': [
			],
			'link_settings': {
				'libraries': [
					'$(SDKROOT)/System/Library/Frameworks/Foundation.framework',
				],
			},
		}
	]
}
