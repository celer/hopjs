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
				'SDKROOT': 'iphoneos',
				'OTHER_CFLAGS':['-fobjc-arc'],
				'CODE_SIGN_IDENTITY':'iPhone Developer',
				'TARGETED_DEVICE_FAMILY':'1,2',
				'IPHONEOS_DEPLOYMENT_TARGET': '6.0',
				'ARCHS':'$(ARCHS_UNIVERSAL_IPHONE_OS)',
				'INFOPLIST_FILE':'<%=projectName%>/<%=projectName%>-Info.plist'
			},
			'mac_bundle_resources': [
			],
			'link_settings': {
				'libraries': [
					'/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS6.0.sdk/System/Library/Frameworks/Foundation.framework',
				],
			},
		}
	]
}
