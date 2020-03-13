---
title: "Xamarin Mac Build Host Versioning"
description: "How Xamarin versions the build host across Visual Studio versions to make it future-proof in a side-by-side world."
tags: [msbuild, xbuild, xamarin, ios]
---
Before I eventually get to the protocol layer underlying the new build host in Xamarin 4 (as promissed 
in a [previous post that introducing it](https://www.cazzulino.com/how-vs-builds-on-mac-with-xamarin.html), 
I wanted to mention how we architected it from the get go for a key scenario that we'll want to enable 
in the future: side-by-side (SxS) versioning.

## Why would I care about SxS?

Visual Studio update and release cadence has been accelerating, and we want to support users that are on 
the bleedging edge. At the same time, there is a very real world of users that are still on Visual Studio 
2012 or 2013 that we also need to support. At the same time, Xamarin also has a different release cadence
than Visual Studio, and it even supports the concept of Stable, Beta and Alpha channels, as well as the 
occassional web preview for new features.

The way this currently works in Xamarin is you install from whichever channel (or VS-bundled version), 
and you get a single Xamarin install that applies to all IDEs you have installed in the machine. This is 
clearly not SxS ;). That's not at all how Visual Studio itself works, where you can have an early CTP of
vNext (i.e. Dev15 right now) while using a very stable Visual Studio 2013 Update 5 for your daily work.

This is obviously a good place to be: you get early feedback on upcoming versions, with minimal disruption 
of your daily work environment. We want to get there for Xamarin for Visual Studio (XVS from now on) too.

## Step by step

The first part of such a SxS story, and you might even say the most critical one, is the build host. 

The build host is tightly bound to the matching XVS version, since it's a core part of the iOS MSBuild
infrastructure, and there must be an exact match of tasks inputs/outputs, serialization, connectivity 
and the like.

So it was clear from the beginning that we needed to version the install location on the Mac for the 
build host and all its agents. For versioning, we use the very awesome (if I might say so myself) 
[GitInfo](https://www.nuget.org/packages/GitInfo) package which versions all assemblies automatically 
without patching AssemblyInfos ;). We use the semver-like version on the build host (we call it the 
"broker" for reasons that will be evident when we talk about the protocol ;)) and the agents to 
determine which process to talk to on the Mac side.

> NOTE: our version numbers are like [platform version].[cycle counter within platform].[service release].[build],
> so currently, our latest stable release as of this writing is Xamarin 4, shipped in our first "cycle 6" release,
> Service 4, so it's: 4 (platform) .0 (cycle 6) .4 (service release 4) .4 (fourth build of the bits after we 
> branched for the release. The upcoming cycle7 release is 4.1.0.x (4 = same major platform version, 1 = one cycle 
> on top of the original cycle 6 when it shipped first, 0 = first release, x = whatever build)

When XVS detects that the specific version of the broker that bundles isn't installed on the Mac, it will 
automatically deploy a new broker and all agents. So if as a user you use VMs to isolate your production vs 
"cutting edge" environments, and connect with them to the same Mac, the build host will happily install 
side-by-side with other build hosts.

> NOTE: this does not necessarily mean that Xamarin.iOS or Xamarin.Mac on the Mac support this kind of 
> side-by-side right now, it's just that from XVS' point of view, we do. We hope to get there eventually. 

## Updating the Build Host

You may have noticed (or figured out if you read carefully), that there is no self-update process from the 
broker/build host itself. Since the whole install/run/update is drive by XVS, there is no need for it, and 
this significantly simplifies the user experience.

On the Mac, you can notice this versining scheme when looking for logs, which are located at 
`~/Library/Logs/Xamarin-[MAJOR.MINOR]`, as well as the actual broker and agents, installed under the 
`$HOME/Library/Caches/Xamarin/XMA` (XMA stood for "Xamarin Mac Agent" originally). You can see a structure 
like the following there:

```
Broker/
    ...
    4.0.4.4/
Agents/
    IDB/
        ...
        4.0.4.4/
    Build/
        ...
        4.0.4.4/
```

