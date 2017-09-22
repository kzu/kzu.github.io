---
title: "Building like a Pro: Introduction"
description: "This is the first of a series of posts where I intend to explore the challenges and showcase 
approaches to building a product using MSBuild, beyond just building a `.csproj` or `.sln` of course ;)."
tags: [msbuild]
---

This is the first of a series of posts where I intend to explore the challenges and showcase 
approaches to building a product using MSBuild, beyond just building a `.csproj` or `.sln` of course ;).

Index so far:

* [Introduction]({{ site.baseurl }}{% post_url 2017-09-21-building-like-a-pro-introduction %})

<br />

## Why MSBuild 

Like it or not, MSBuild is here to stay. Moreover, it's getting some much needed love now, 
and improving in leaps and bounds in Visual Studio 2017 and beyond. 

Also, it is the thing that builds all of your .NET code, whether on Windows, Mac or even Linux. 
As such, learning and mastering it should be as important (or maybe even more so) as any other 
C#/.NET library or framework you happen to use for a given project.

It's tempting to think that it's just a piece of infrastructure used by your IDE that you 
don't need to understand, much like, say, garbage collection, the inner workings the CLR, 
and other "low level thingies". That would be quite naïve though, since in my experience, 
anything beyond the most trivial product requires some sort of build script that goes beyond 
what the IDE can automagically do for you.

Understanding it as an independent technology from the IDEs that use it, will also free you 
to optimize, simplify and extend your build process (even for your "normal" projects) despite 
whatever limitations the IDE may have in expressing its full capabilities. 

I won't get into a comparison between alternative ways of building. First, because I only 
consider myself highly proficient in MSBuild. I have used `make` and `rake` to some extent, 
and have toyed with `cake`, but I wouldn't make justice to any of them.

I'll show concrete examples I currently use as part of my job keeping Visual Studio Tools for 
Xamarin (aka XamarinVS or XVS) building for VS2015 and VS2017, which involves code from a few 
dozen projects across half a dozen repositories and non-trivial dependencies between XVS and 
artifacts produced by different independent (CI) build processes.

## How To Learn MSBuild

It's tempting to just get one of your current projects, edit its source from Visual Studio, 
peek at its source, and just add an `AfterBuild` target to start playing with these concepts. 
After all, you even get a commented-out target named just that for precisely that purpose 
from most C# project templates, right?

In my experience, this is totally worthless since your project will typically be fairly 
complicated and take several seconds (or more!) to build, therefore making the process 
way more tedious and full of "noise" from build output that is totally unrelated to your 
experiments. If you attempt to do this by unload-edit-reload-build, then it's going to be 
very wasteful.

Instead, I prefer to keep a `build.proj` MSBuild file somewhere in a scratch location, which 
is fully disposable (there's never anything worth keeping in it), just for the purpose of 
learning and trying things out. I also use the 
[MSBuild Structured Log Viewer](https://github.com/KirillOsenkov/MSBuildStructuredLog) to 
inspect a build with very fine-grained detail. You just build it from the Viewer and you 
can easily explore everything that's going on during the build.

I like Visual Studio's completion style for editing MSBuild/XML files, rather than Visual 
Studio Code, but the latter is quite good also for this. 

Finally, to run the builds, you just need to run the Visual Studio "Developer Command Prompt" 
shortcut from your Start menu. As mentioned, you can also build directly from the structured 
log viewer. From there, you can just run `msbuild [YOUR_PROJECT]` and be done. To generate 
the binary log for consumption in the viewer, just add `/bl` to the call and you'll get 
an `msbuild.binlog` (this requires Visual Studio 2017 15.3 or greater).

If your scratch folder contains just that one `.proj` file (no other `.targets`, `.sln` 
or `.csproj` files in there), even better, since you can avoid telling MSBuild which 
project to build, saving a few keystrokes on every try (that needs different command 
line arguments).

Finally, it's pointless to start learning a flavor of MSBuild that will be obsolete the 
moment everyone is on Visual Studio 2017+. Make yourself a favor and get the latest 
version which is great and includes MSBuild 15, which has some much needed improvements 
over the previous versions. You can even use the free Community Edition while you learn 
this on your own.

## Let The Journey Begin

Like learning any other programming language, you can't learn MSBuild by just reading 
blog posts about it. You have to write the code, run `msbuild` on it, see the results 
and repeat, until the concepts sink in. So go ahead and create that first `build.proj` 
in a scratch location, a boilerplate one looks like the following:

```
<Project>
	<Target Name="Build">
		<Message Importance="high" Text="Hello World!" />
	</Target>
</Project>
```

If you just type `msbuild` from a "Developer Command Prompt for VS 2017", you'll get 
output like the following:

```
Microsoft (R) Build Engine version 15.1.458.808
Copyright (C) Microsoft Corporation. All rights reserved.

Build started 2017-01-09 11:39:13 PM.
Project "C:\Temp\build.proj" on node 1 (default targets).
Build:
  Hello World!
Done Building Project "C:\Temp\build.proj" (default targets).
```

I usually specify `/nologo /v:minimal` when trying things out to cut down the noise. 
With those two in after `msbuild`, you'd get just:

```
  Hello World!
```

> Pro Tip: you can create a file named `msbuild.rsp` alongside your `.proj` and specifiy 
> default values for command line arguments, like `/v:minimal`. This allows you to avoid 
> repeating values on every invocation. `/nologo` has to be passed in via the cmdline arg, 
> unfortunately.'[;]

On the next post, I'll go over the key concepts in a nutshell. They aren't all that 
many, I promise ;)