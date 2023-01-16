---
title: "How to fix CodeTaskFactory build error MSB4018"
excerpt: |
	When using inline C# in MSBuild, you may face the following error: System.ArgumentException: 
	Object of type Microsoft.Build.Framework.ITaskItem cannot be converted to [same type name!]. 
	This happens especially when VS2013 or later is installed and you're trying to build from VS2010. This is the fix.
layout: post
tags: programming, msbuild
---
<img src="https://www.cazzulino.com/img/msbuild-codetaskfactory.jpg" width="50%" align="right" class="image">

I've posted before 

Errors on 2010:

			<dependentAssembly>
				<assemblyIdentity name="Microsoft.Build.Framework" publicKeyToken="b03f5f7f11d50a3a" culture="neutral"/>
				<bindingRedirect oldVersion="12.0.0.0" newVersion="4.0.0.0"/>
			</dependentAssembly>
