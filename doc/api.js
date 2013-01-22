YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Hop",
        "Hop.CodeGenerator",
        "Hop.Method",
        "Hop.Object",
        "Hop.StubRequest",
        "Hop.StubResponse",
        "Hop.TestCase",
        "Hop.TestTask",
        "Hop.TestUtils",
        "Hop.User"
    ],
    "modules": [
        "Cache",
        "CodeGenerator",
        "Event",
        "Hop",
        "Job",
        "Test",
        "User"
    ],
    "allModules": [
        {
            "displayName": "Cache",
            "name": "Cache",
            "description": "Implements server-side and client side caching"
        },
        {
            "displayName": "CodeGenerator",
            "name": "CodeGenerator",
            "description": "Provides generator functionality for generating client stubs for other languauges\n\nHop can utilize its knowledge of your APIs to generate client side stubs for various languages. This module provides the core functionality for generators in such a way that\na new generator can be built with relative ease. \n\n * Implemeneted generators can be found under /gen in the Hop root directory\n\n\n## To use a generator\n\nHop tries to make it easy to generate client side code, to do so we use a command line utilility 'hopjs-gen'\n\nTo generate client side stubs for android for a specific website:\n\n\thopjs-gen --url http://localhost:3000/ android --outputDir output/ --package com.foo\n\nYou might first want to make sure HopJS is installed locally\n\n\tnpm install -g hopjs\n\n\n\n## Creating a new generator\n 1. Create a new directory under /gen - the directory will be the name of your generator\n 2. Create a generator.json (see the android/generator.json for an example)\n 3. Define some number of templates\n\n#### Generators work by:\n * Asking for any required command line options as defiend in generator.json:demand and generator.json:optional\n * Fetching an API definition from URL/_hopjs/api.json\n * Loading any required utility functions as defined in generator.json:required\n * Determining the type of gernerator as specified by generator.json:generates\n\t * If the generator type is 'file' then file pointed to by generator.json:template will be evaluated with { Objects, Models (and options passed in via the commandline ) }\n\t * If the generator type is 'dir' then dir pointed to by generator.json:templateDir will be evaluated \n\t\t\t* Files which have the basename _object will be evaluted one for each defined object with { object (and options passed in via the commandline ) }\n\t\t\t* Files which have the basename _model will be evaluted one for each defined model with { model (and options passed in via the commandline ) }\n\n*generator.json:translatePath can be used for determining how templates get translated into the resulting output directory*"
        },
        {
            "displayName": "Event",
            "name": "Event"
        },
        {
            "displayName": "Hop",
            "name": "Hop",
            "description": "Hop Core module\n\nThis is the primary impelementation behind Hop"
        },
        {
            "displayName": "Job",
            "name": "Job",
            "description": "Provides generic job functionality"
        },
        {
            "displayName": "Test",
            "name": "Test",
            "description": "Testing module"
        },
        {
            "displayName": "User",
            "name": "User",
            "description": "Provides utility functions and DSL implemenations for Methods and Objects.\n\nThis class will look at request.session.user as a base implementation to support the \nHop.User.* functions. These functions are expected to be overrriden if needed."
        }
    ]
} };
});