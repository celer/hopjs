{ 
	'targets': [
		{
			'target_name': '<%=projectName%>',
			'product_name': '<%=projectName%>',
			'type': 'executable',
			'mac_bundle': 1,
			'sources': [
				'./<%=projectName%>/HopService.h',
				'./<%=projectName%>/HopMethodCall.h',
				'./<%=projectName%>/HopService.m',
				'./<%=projectName%>/HopMethodCall.m',
				'./<%=projectName%>/HopWebTester-Prefix.pch',
				'./<%=projectName%>/WebTesterAppDelegate.h',
				'./<%=projectName%>/WebTesterAppDelegate.m',
				'./<%=projectName%>/TestStub.h',
				'./<%=projectName%>/TestStub.m',
				'./<%=projectName%>/main.m',
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
				'INFOPLIST_FILE':'<%=projectName%>/HopWebTester-Info.plist'
			},
			'mac_bundle_resources': [
				'<%=projectName%>/index.js',
				'<%=projectName%>/index.html',
				'<%=projectName%>/en.lproj/Credits.rtf',
				'<%=projectName%>/en.lproj/InfoPlist.strings',
				'<%=projectName%>/en.lproj/MainMenu.xib'
			],
			'link_settings': {
				'libraries': [
					'$(SDKROOT)/System/Library/Frameworks/Cocoa.framework',
					'$(SDKROOT)/System/Library/Frameworks/Foundation.framework',
					'$(SDKROOT)/System/Library/Frameworks/AppKit.framework',
					'$(SDKROOT)/System/Library/Frameworks/WebKit.framework',
				],
			},
		}
	]
}
