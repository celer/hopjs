{ 
	'targets': [
		{
			'target_name': '<%=projectName%>',
			'product_name': '<%=projectName%>',
			'type': 'executable',
			'mac_bundle': 1,
			'sources': [
				'./<%=projectName%>/<%=projectName%>-Prefix.pch',
				'./<%=projectName%>/HopMethodCall.h',
				'./<%=projectName%>/HopMethodCall.m',
				'./<%=projectName%>/HopService.h',
				'./<%=projectName%>/HopService.m',
				'./<%=projectName%>/WebTesterAppDelegate.h',
				'./<%=projectName%>/WebTesterAppDelegate.m',
				'./<%=projectName%>/WebTesterViewController.h',
				'./<%=projectName%>/WebTesterViewController.m',
				'./<%=projectName%>/<%=projectName%>-Info.plist',
				'./<%=projectName%>/main.m',
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
				'./<%=projectName%>/Default-568h@2x.png',
				'./<%=projectName%>/Default.png',
				'./<%=projectName%>/Default@2x.png',
				'./<%=projectName%>/en.lproj/InfoPlist.strings',
				'./<%=projectName%>/en.lproj/MainStoryboard_iPad.storyboard',
				'./<%=projectName%>/en.lproj/MainStoryboard_iPhone.storyboard',
				'./<%=projectName%>/index.html',
				'./<%=projectName%>/index.js',
			],
			'link_settings': {
				'libraries': [
					'/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS6.0.sdk/System/Library/Frameworks/UIKit.framework',
					'/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS6.0.sdk/System/Library/Frameworks/CoreGraphics.framework',
					'/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS6.0.sdk/System/Library/Frameworks/Foundation.framework',
				],
			},
		}
	]
}
