---
title: "Project dependency does not build with Xamarin"
description: "In a solution with one or more shared portable libraries and one app project for each target platform (iOS, Android and Windows Phone), when selecting iPhone or iPhoneSimulator as the platform, Visual Studio seems to 'forget' to build the shared library, and just fails with a less than helpful 'Metadata [dependency project dll] could not be found'. This is the fix."
tags: xamarin
---
<img src="http://www.cazzulino.com/img/dependency-build-errors.png" width="50%" align="right" class="image">
It's not at all uncommon to face this error while working with Xamarin iOS projects. The scenario shown in the screenshot is fairly typical: a multi-platform solution with one or more shared portable libraries and one app project for each target platform, in this case iOS, Android and Windows Phone 8.0. In theses cases, when you select iPhone or iPhoneSimulator as the platform, suddendly, Visual Studio seems to "forget" to build the shared library, and just fails with a less than helpful "Metadata [dependency project dll] could not be found".

Rest assured, this is not a Xamarin-only "feature". Visual Studio determines what to build and when based on Solution Configurations. Those solution configurations are created automatically for every combination of Configuration (i.e. Debug and Release) and Platform (i.e. AnyCPU, x86, ARM, iPhone, iPhoneSimulator). More information is available on [MSDN on how these solution configurations work](http://msdn.microsoft.com/en-us/library/kkz9kefa.aspx).

The gist is that Visual Studio will match Configuration/Platform combinations and build them together, leaving those that don't match to build alone. Most .NET developers aren't even aware of this, since most of the time it's all Debug|Release + AnyCPU, so the Platform dropdown isn't even visible for most of us. However, with the advent of more than just AnyCPU, it's a must to understand how this works. 

Specifically for iOS, there are significant differences in how an app is build for the iOS simulator rather than the actual devices so they are actually completely different platforms with different compiler switches and even runtime behavior (i.e. Reflection.Emit works on iOS simulator, hence Moq ;), but not on an iOS device). For Android, this is currently not a problem, but it may be if we ever need to explicitly target ARM vs x86 down the road, so this information is useful anyways.

<img src="http://www.cazzulino.com/img/iphone-configuration-manager.png" width="50%" align="right" class="image">
In order to tell Visual Studio to always build the dependent library when we build for the various iOS-supported platforms, we just right-click the solution node and select Configuration Manager.

We need to select the various platforms from the "Active solution platform" dropdown and turn on the Build checkbox for all the relevant projects.

Yes, I know this is annoying as hell. We're still investigating ways to make Visual Studio "smarter" on this, but for now, knowing this will save valuable time, especially if you're using the super-cool new [Xamarin.Forms](https://xamarin.com/forms) templates. 

And you can also see that the title is missleading, since this won't happen exclusively with Xamarin projects, but with any project that has non-AnyCPU target platform and uses a shared library that only has AnyCPU platform configurations.