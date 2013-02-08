{ 
	'targets': [
		{
			'target_name': '<%=projectName%>',
			'product_name': '<%=projectName%>',
			'type': 'shared_library',
			'mac_bundle': 1,
			'sources': [
				'./<%=projectName%>/HopService.h',
				'./<%=projectName%>/HopMethodCall.h',
				'./<%=projectName%>/HopService.m',
				'./<%=projectName%>/HopMethodCall.m',
				<% for(var objectName in api.Objects){	 %>
				'./<%=projectName%>/<%=Apple.camelHump(objectName)%>.h',
				'./<%=projectName%>/<%=Apple.camelHump(objectName)%>.m',
				<% } %>
			],
			'xcode_settings': {
				'SDKROOT': 'macosx10.8',
				'OTHER_CFLAGS':['-fobjc-arc'],
				'MACOSX_DEPLOYMENT_TARGET':'10.7',
				'ARCHS':'$(ARCHS_STANDARD_64_BIT)',
			},
			'mac_bundle_resources': [
			],
			'link_settings': {
				'libraries': [
					'$(SDKROOT)/System/Library/Frameworks/Cocoa.framework',
					'$(SDKROOT)/System/Library/Frameworks/Foundation.framework',
					'$(SDKROOT)/System/Library/Frameworks/AppKit.framework',
				],
			},
		}
	]
}
