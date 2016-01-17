---
title: "Bootstrapping Cross Platform MSBuild with XBuild and NuGet"
description: "Now that MSBuild is open source and cross-platform, you easily bootstrap it via XBuild and NuGet to build on a Mac/*nix too."
tags: programming, msbuild, xbuild, nuget
---
I have to admit I'm a fan of MSBuild. Not necessarily a fan of the file format, 
but of the feature set. [At work](http://www.xamarin.com), I've encountered now 
and then inconsistencies and missing features in XBuild that I just had to work 
around (the most annoying one being the lack of inline code tasks!). Well, no more!

One of the core uses of MSBuild for me is the CI (and full product) build script. 
It allows me to have a single build script that can be run localy as well as on 
a build server and produce identical results. This is invaluable. It can do so 
much more than just build! I can make it calculate product version information from 
git commit information, download and install dependencies, push tags and upload 
releases and what-not.

Since the [xplat branch](https://github.com/Microsoft/MSBuild/tree/xplat) of MSBuild
(or any other, for that matter ;)) hasn't been released officially, I just built it 
on Windows and Mac and bundled both versions as the 
[MSBuild NuGet](http://www.nuget.org/packages/MSBuild), since it's working pretty 
awesomely already for me.

Now bootstrapping it on the Mac/*nix is really simple:

* Install MSBuild NuGet
* Invoke MSBuild with Mono, passing the actual MSBuild project (i.e. build.proj)

Since this is only needed on the Mac, we don't need any fancy conditionals in the 
build project or anything. This is how it looks like currently:

	<Project ToolsVersion="4.0" DefaultTargets="Build"
			 xmlns="http://schemas.microsoft.com/developer/msbuild/2003">

		<Target Name="Build">

			<!-- Restore potentially build-time packages that are restored by build.cmd on Windows -->
			<Exec Command="nuget install packages.config -excludeversion -outputdirectory packages" Condition="Exists('packages.config')" />
			
			<!-- Install MSBuild nuget package if necessary -->
			<Exec Command="nuget install MSBuild -excludeversion -outputdirectory packages" Condition="!Exists('packages/MSBuild/tools/Unix/MSBuild.exe')" />
			
			<!-- Finally build with MSBuild the build.proj itself -->
			<Exec Command="mono packages/MSBuild/tools/Unix/MSBuild.exe build.proj" />

		</Target>

	</Project>

Of course if you need to be able to invoke different targets and pass properties, 
it's not that trivial, but for bootstrapping a CI server that runs on *nix and get 
it going, you don't need anything other than that. You could additionally make it
so that the xbuild project receives a Targets property which you pass on to MSBuild 
to tell what targets to build soo.

I've added this approach to my [default build script](https://github.com/kzu/oss) I use, 
which can be installed simply with:

	nuget install build -excludeversion

This will give you a top-level `build` folder with all you need for this, plus `build.proj`, 
`xbuild.proj` and an empty solution sample. It also implements the 
[Ultimate Cross Platform NuGet Restore](http://www.cazzulino.com/ultimate-cross-platform-nuget-restore.html).