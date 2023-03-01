---
title: "NuGet packing best practices analyzers"
excerpt: |
  NuGetizer, the ultimate NuGet packing tool for serious library 
  developers, has gotten a new feature that's going to make it 
  easier to remember those best practices you read here and there: 
  a bunch of brand-new analyzers give you helpful suggestions and 
  warnings so your package doesn't end up looking like a n00b's 
  job on nuget.org :)
tags: [oss, dotnet, nuget]
---

Recently I was catching up on the latest & greatest guidance for NuGet 
package authors (such as [Meziantou's blog](https://www.meziantou.net/ensuring-best-practices-for-nuget-packages.htm) and the new Microsoft 
docs [on packaging best practices](https://learn.microsoft.com/en-us/nuget/create-packages/package-authoring-best-practices)) and I realized it's non-trivial 
to keep track of those on every library project you ship.

So I decided to supercharge [NuGetizer](https://clarius.org/nugetizer) with 
the knowledge of these guidelines, so it can be even more helpful when 
authoring non-trivial nuget packages!

So let's see what's in store for your new package!

## NG0101: Default description detected

Perhaps you came across some of these popular packages and thought 
"How come they all came up with the same crappy description?": 

![packages with default description](/img/nugetizer-defaultdescription.png)

Turns out that the .NET built-in [NuGet targets](https://github.com/NuGet/NuGet.Client/blob/dev/src/NuGet.Core/NuGet.Build.Tasks.Pack/NuGet.Build.Tasks.Pack.targets#L34)
set this automatically for you, which isn't actually very helpful, is it?

NuGetizer will detect this and issue a warning now:

![warning for default description](/img/nugetizer-ng0101.png)

## NG0103: Package icon missing

Highly recommended to get a more professional look on nuget.org!

![info for missing icon](/img/nugetizer-ng0103.png)

## NG0104: Package readme missing

[Package readme on nuget.org](https://learn.microsoft.com/en-us/NuGet/nuget-org/package-readme-on-nuget-org) 
can greately improve the experience for new users! It's a great way to 
highlight the key features of your project, and you should definitely consider 
adding one.

> NOTE: if you have multiple packages and want to reuse common 
> sections of markdown across them, [NuGetizer makes this straightforward](https://www.cazzulino.com/pack-readme-includes.html) too!

![info for missing readme](/img/nugetizer-ng0104.png)

As noted, NuGetizer will make sure the readme you specified as a project 
property is properly packed without any further configuration on your part!

## NG0105 and NG0106: Package license missing or duplicate

A must-have piece of metadata. 

![info for missing license](/img/nugetizer-ng0105.png)

> NOTE: NuGetizer uses [SponsorLink](https://www.cazzulino.com/sponsorlink.html) to 
> properly attribute your sponsorship to help keep the project healthy and actively 
> maintained. You'll see the heartfelt thanks there too every now and then 💜.

It will also error if you have duplicate license attributes, which is not allowed:

![info for missing license](/img/nugetizer-ng0106.png)

## NG0107, NG0108, NG0110: Source control information missing

Only when packing (either inside Visual Studio or via `dotnet pack`), additional 
analyzers will check whether you're providing the `RepositoryCommit` and `RepositoryUrl`. 
These are populated automatically when using [Source Link](https://learn.microsoft.com/en-us/dotnet/standard/library-guidance/sourcelink), so the diagnostics link to it automatically.

![info for missing source control info](/img/nugetizer-ng0107-10.png)

While they may seem redundant, they are not! NG0107 checks for `RepositoryCommit` 
specifically. You might have installed Source Link but may be building a package from 
a non-source controlled location. 

`NG0110` checks for Source Link itself, and `NG0108` checks for `RepositoryUrl`: this 
property might not be appropriate to all projects, especially if they are not open 
source. The diagnostic suggests setting `PublishRepositoryUrl=true` for your project 
if you want the Source Link-determined repo url to be published.

For example, for a non-oss project, you'll likely still want to have `RepositoryCommit` 
populated for troubleshooting purposes, but not `RepositoryUrl`. 

## NG0109: Project URL missing

While `RepositoryUrl` is inteded for source control software consumption, the 
`PackageProjectUrl` project property should be set to a user-facing home page 
where users can engage with you.

NuGetizer will default both to the same value, but suggest that you provide a 
unique one for the latter. It might be OK for both to be the same in case your 
project home page is the same as your repo home page.

![info for missing project url](/img/nugetizer-ng0109.png)

## NG0111: EmbedUntrackedSources not set

When EmbedUntrackedSources is set to 'true', Source Link will embed in your PDB 
the items that participated in the compile, but not are included in source control.
This improves the debugging experience for your users:

![info for missing embed sources](/img/nugetizer-ng0111.png)


As more recomendations become best practices, we'll incorporate more diagnostics. 
You can also recommend new ones on the [NuGetizer](https://github.com/devlooped/nugetizer) 
repository.


If you find NuGetizer useful, please consider [sponsoring the project](https://github.com/sponsors/devlooped). [Learn more about GitHub Sponsors](https://github.com/sponsors).


Happy packing!