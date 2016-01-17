---
title: "Bite-sized reusable MSBuild targets, properties and tasks"
description: "Introducing MSBuilder, an open source project that enables you to pick & choose the specific extensions you need for your MSBuild project, powered by NuGet."
tags: programming, msbuild, 
---
I'm a long-time MSBuild fan. Now that [it's open source](https://github.com/Microsoft/msbuild), 
I've even played with bootstrapping it [with xbuild](http://www.cazzulino.com/xplat-msbuild.html) 
to use it even on Mac. It works like a charm, for the most part :)

I've always wished I could just reuse fragments of MSBuild targets that are 
generic enough to fit in lots of projects. Things like determining whether 
we're being built with [XBuild or MSBuild](https://github.com/MobileEssentials/MSBuilder/blob/master/src/IsXBuild/build/MSBuilder.IsXBuild.props#L36), 
determining the [location of Git](https://github.com/MobileEssentials/MSBuilder/blob/master/src/Git/build/MSBuilder.Git.props#L35), 
or the particular [assembly location for a CodeTaskAssembly](https://github.com/MobileEssentials/MSBuilder/blob/master/src/CodeTaskAssembly/build/MSBuilder.CodeTaskAssembly.props#L29)
(which isn't [exactly trivial](http://www.cazzulino.com/ultimate-cross-platform-nuget-restore.html)). 
Those kinds of things are probably a few lines of XML that could even be 
distributed via NuGet. 

And so I started doing just that for my own stuff, and thus [MSBuilder](https://github.com/MobileEssentials/MSBuilder) 
was born. It is sort of like [NetFx](http://blogs.clariusconsulting.net/kzu/introducing-netfx-or-the-end-of-common-dll-and-helpers-dll/) 
but for MSBuild rather than .NET code. It may still suffer from that project's Achilles heel 
though, namely, discoverability. But with any luck, the extremely low barrier of entry for 
contributors, plus the almost real-time pull-request building and subsequent nuget publishing, 
thanks to a paid super-responsive [AppVeyor](https://ci.appveyor.com/project/MobileEssentials/msbuilder)-based 
CI system, will make it useful enough to gain traction. Time will tell. 

In the meantime, I've already added a few very useful MSBuilder blocks already:

Package | Stats
--- | ---
[MSBuilder.CodeTaskAssembly](https://www.nuget.org/packages/MSBuilder.CodeTaskAssembly) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.CodeTaskAssembly.svg)](https://www.nuget.org/packages/MSBuilder.CodeTaskAssembly) [![Version](https://img.shields.io/nuget/v/MSBuilder.CodeTaskAssembly.svg)](https://www.nuget.org/packages/MSBuilder.CodeTaskAssembly)
[MSBuilder.DownloadFile](https://www.nuget.org/packages/MSBuilder.DownloadFile) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.DownloadFile.svg)](https://www.nuget.org/packages/MSBuilder.DownloadFile) [![Version](https://img.shields.io/nuget/v/MSBuilder.DownloadFile.svg)](https://www.nuget.org/packages/MSBuilder.DownloadFile)
[MSBuilder.DumpItems](https://www.nuget.org/packages/MSBuilder.DumpItems) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.DumpItems.svg)](https://www.nuget.org/packages/MSBuilder.DumpItems) [![Version](https://img.shields.io/nuget/v/MSBuilder.DumpItems.svg)](https://www.nuget.org/packages/MSBuilder.DumpItems)
[MSBuilder.Git](https://www.nuget.org/packages/MSBuilder.Git) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.Git.svg)](https://www.nuget.org/packages/MSBuilder.Git) [![Version](https://img.shields.io/nuget/v/MSBuilder.Git.svg)](https://www.nuget.org/packages/MSBuilder.Git)
[MSBuilder.Introspect](https://www.nuget.org/packages/MSBuilder.Introspect) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.Introspect.svg)](https://www.nuget.org/packages/MSBuilder.Introspect) [![Version](https://img.shields.io/nuget/v/MSBuilder.Introspect.svg)](https://www.nuget.org/packages/MSBuilder.Introspect)
[MSBuilder.IsXBuild](https://www.nuget.org/packages/MSBuilder.IsXBuild) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.IsXBuild.svg)](https://www.nuget.org/packages/MSBuilder.IsXBuild) [![Version](https://img.shields.io/nuget/v/MSBuilder.IsXBuild.svg)](https://www.nuget.org/packages/MSBuilder.IsXBuild)
[MSBuilder.NuGet.GetLatestVersion](https://www.nuget.org/packages/MSBuilder.NuGet.GetLatestVersion) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.NuGet.GetLatestVersion.svg)](https://www.nuget.org/packages/MSBuilder.NuGet.GetLatestVersion) [![Version](https://img.shields.io/nuget/v/MSBuilder.NuGet.GetLatestVersion.svg)](https://www.nuget.org/packages/MSBuilder.NuGet.GetLatestVersion)
[MSBuilder.RegexReplace](https://www.nuget.org/packages/MSBuilder.RegexReplace) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.RegexReplace.svg)](https://www.nuget.org/packages/MSBuilder.RegexReplace) [![Version](https://img.shields.io/nuget/v/MSBuilder.RegexReplace.svg)](https://www.nuget.org/packages/MSBuilder.RegexReplace)
[MSBuilder.Run](https://www.nuget.org/packages/MSBuilder.Run) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.Run.svg)](https://www.nuget.org/packages/MSBuilder.Run) [![Version](https://img.shields.io/nuget/v/MSBuilder.Run.svg)](https://www.nuget.org/packages/MSBuilder.Run)
[MSBuilder.TaskInliner](https://www.nuget.org/packages/MSBuilder.TaskInliner) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.TaskInliner.svg)](https://www.nuget.org/packages/MSBuilder.TaskInliner) [![Version](https://img.shields.io/nuget/v/MSBuilder.TaskInliner.svg)](https://www.nuget.org/packages/MSBuilder.TaskInliner)
[MSBuilder.ThisAssembly.Project](https://www.nuget.org/packages/MSBuilder.ThisAssembly.Project) | [![NuGet downloads](https://img.shields.io/nuget/dt/MSBuilder.ThisAssembly.Project.svg)](https://www.nuget.org/packages/MSBuilder.ThisAssembly.Project) [![Version](https://img.shields.io/nuget/v/MSBuilder.ThisAssembly.Project.svg)](https://www.nuget.org/packages/MSBuilder.ThisAssembly.Project)

# MSBuilder.DumpItems

One of my most frequently used ones is surely [MSBuilder.DumpItems](https://www.nuget.org/packages/MSBuilder.DumpItems). 
Whenever I'm tweaking MSBuild targets, especially if they are the built-in ones in either 
MSBuild/CSharp itself, or WiX, I more often than not want to inspect what various item groups 
contain at certain points, as well as potentially useful item metadata I might want to use 
for my task at hand. 

For example, say you want to do something [interesting with project references](http://www.cazzulino.com/smarter-project-references.html) 
that requires you to know precisely what's going on in the built-in targets after project 
and assembly references are resolved. You can just create a console app, install the package 

    install-package MSBuilder.DumpItems

and edit the .csproj to dump items on AfterBuild for inspection of the items built by one 
of the [many targets involving ResolveReferences](https://github.com/Microsoft/msbuild/blob/master/src/XMakeTasks/Microsoft.Common.CurrentVersion.targets#L1327), 
such as the [_ResolvedProjectReferencePaths](https://github.com/Microsoft/msbuild/blob/master/src/XMakeTasks/Microsoft.Common.CurrentVersion.targets#L1527) which 
looks kinda interesting:

    <Target Name="AfterBuild">
      <DumpItems Items="@(_ResolvedProjectReferencePaths)" />
    </Target>

And you get a full dump of all those items and their metadata, right in the Visual Studio 
output window, such as:

    2>AfterBuild:
    2>  Item: C:\Delete\ConsoleApplication13\src\ConsoleApplication1\ClassLibrary1\bin\Debug\ClassLibrary1.dll
    2>  	AccessedTime=2015-07-19 01:18:52.2170776
    2>  	BuildReference=true
    2>  	Configuration=Debug
    2>  	CreatedTime=2015-07-19 01:16:15.3999053
    2>  	DefiningProjectDirectory=C:\Program Files (x86)\MSBuild\12.0\bin\
    2>  	DefiningProjectExtension=.targets
    2>  	DefiningProjectFullPath=C:\Program Files (x86)\MSBuild\12.0\bin\Microsoft.Common.CurrentVersion.targets
    2>  	DefiningProjectName=Microsoft.Common.CurrentVersion
    2>  	Directory=Delete\ConsoleApplication13\src\ConsoleApplication1\ClassLibrary1\bin\Debug\
    2>  	Extension=.dll
    2>  	Filename=ClassLibrary1
    2>  	FullConfiguration=Debug|AnyCPU
    2>  	FullPath=C:\Delete\ConsoleApplication13\src\ConsoleApplication1\ClassLibrary1\bin\Debug\ClassLibrary1.dll
    2>  	Identity=C:\Delete\ConsoleApplication13\src\ConsoleApplication1\ClassLibrary1\bin\Debug\ClassLibrary1.dll
    2>  	ModifiedTime=2015-07-19 01:18:52.2070760
    2>  	MSBuildSourceProjectFile=C:\Delete\ConsoleApplication13\src\ConsoleApplication1\ClassLibrary1\ClassLibrary1.csproj
    2>  	MSBuildSourceTargetName=GetTargetPath
    2>  	Name=ClassLibrary1
    2>  	OriginalItemSpec=..\ClassLibrary1\ClassLibrary1.csproj
    2>  	OriginalProjectReferenceItemSpec=..\ClassLibrary1\ClassLibrary1.csproj
    2>  	OutputItemType=
    2>  	Platform=AnyCPU
    2>  	Project={e9288a56-aa1b-4127-97c5-7b3a6d487d63}
    2>  	RecursiveDir=
    2>  	ReferenceOutputAssembly=true
    2>  	ReferenceSourceTarget=ProjectReference
    2>  	RelativeDir=C:\Delete\ConsoleApplication13\src\ConsoleApplication1\ClassLibrary1\bin\Debug\
    2>  	RootDir=C:\
    2>  	SetConfiguration=Configuration=Debug
    2>  	SetPlatform=Platform=AnyCPU
    2>  	Targets=
    2>
    2>Build succeeded.

As I come across more [useful bits of MSBuild](http://www.cazzulino.com/wix-reference-msbuild.html) that 
are generic enough that deserve becoming MSBuilder blocks, I'll surely publish them, so stay tunned.

Enjoy!





  