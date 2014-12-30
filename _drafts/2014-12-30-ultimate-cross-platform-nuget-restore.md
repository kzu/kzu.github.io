---
title: "Ultimate Cross Platform NuGet Restore"
description: "Now that 'Enable NuGet Package Restore' is the deprecated non-recommended way of doing package restores, everyone is coming up with a different way of doing it in a way that works on build servers and command line builds. Here is an approach that follows NuGet's own guidance but also works from command line MSBuild, build servers, Linux/Mac via Mono's xbuild and even Xamarin Studio. Oh, and it requires NO tuning of your build process, you just continue to build your solution files as usual."
layout: post
tags: programming, msbuild, xbuild, nuget, xamarin
---
Back in the day, when NuGet just came out, you were supposed to just right-click on your solution node in Visual Studio, and click "Enable NuGet Package Restore". You may be surprised to still find that context menu command even when the [latest recommendation](http://docs.nuget.org/docs/reference/package-restore "Package Restore Documentation") by the NuGet team is to NOT use it. 

The new way is to just run nuget.exe restore before building the solution. And of course there are a gazillion ways of doing it, from batch files, to a [separate MSBuild file](http://chris.eldredge.io/blog/2014/01/29/the-newer-new-nuget-package-restore/) that is built instead of the main solution, to powershell scripts, etc. Oh, and you should probably download nuget.exe from nuget.org too before doing the restore ;).

With the unstoppable rise of Xamarin for development (ok, maybe I'm slightly biased ;)), it's highly desirable that whatever solution you adopt also works on a Mac too, Xamarin Studio, and why not xbuild in addition to MSBuild command line builds?

It turns out that such a cross-platform solution is pretty straight-forward to implement and very simple, by just leveraging a little-known extensibility hook in MSBuild/xbuild. 

> If you just want the straight solution, download this file 


## IDE vs Command Line Builds

Both Xamarin Studio and Visual Studio build solutions differently than their command line counterparts xbuild and MSBuild. Both IDEs read the solution file and construct their in-memory representations of the included projects. From that point on, it's the IDE that controls the build, not the command-line xbuild/msbuildn tools. 

But since the solution file is not an MSBuild file, on command line builds a [temporary MSBuild file is created from the solution](http://sedodream.com/2010/10/22/MSBuildExtendingTheSolutionBuild.aspx), and this file is built instead. And luckily, it also has some extensibility points itself that we can leverage.

It's important to keep in mind though that these extensibility points are for the command line builds only, which is a really nice plus in this case, since both IDEs already do their own NuGet package restore automatically (and that's why the project-level MSBuild-based package restore from before is no longer recommended, it's just duplicate behavior that just slows down every build).

So, part of the good news is: if you just want IDE-driven NuGet package restore, you don't have to do anything at all :). But who does IDE-only builds these days anyway? So let's see how we tweak the command line builds so that they work from the very same solution file as the IDE.

##  Command Line Automated Package Restore

The approach is to basically have a file named Before.[solution file name].targets (like Before.MyApp.sln.targets) alongside the solution. As [explained by the awesome Sayed in his blog](http://sedodream.com/2010/10/22/MSBuildExtendingTheSolutionBuild.aspx "Extending the solution build"), this targets file is imported alongside the temporary MSBuild project generated for the solution, and can therefore provide targets that run before/after any of the built-in ones it contains:

- Build
- Rebuild
- Clean
- Publish

For package restore, we'll just provide a target that runs before Build. On a Mac, if Xamarin Studio is installed and you're performing a command line build, the "nuget" (no ".exe" extension) command will already be available in the path, so we need to conditionally do things slightly different there than on Windows.




