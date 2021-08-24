---
title: "NuGetizer as an alternative to .NET SDK Pack"
description: |
  NuGetizer is not just a workaround to use whenever SDK Pack falls short, but a true 
  alternative built from the ground up with MSBuild usage in mind, therefore supporting 
  an unparalleled range of features and customization options.
tags: [nuget, sdk, dotnet]
---

There is a very long standing feature request for [NuGet Pack](https://github.com/NuGet/Home/issues/3891) to "allow project reference DLLs to be added to the parent nupkg for pack target like IncludeReferencedProjects in nuget.exe". This has been going on for years (5 almost as of 2021) and has had over 260 comments so far. Seems like quite the significant pain point for some customers.

After participating a bit, and getting mentioned a few times with regards to [NuGetizer](https://github.com/devlooped/nugetizer), I thought a proper explanation of what it is and why it's not just a "workaround" for SDK Pack issues.

I will refer to **SDK Pack** as the built-in `Pack` target in .NET SDK projects. It's not technically part of the .NET SDK, but rather a bundled feature contributed by the NuGet team. But it can be entirely replaced via a publicly available property `ImportNuGetBuildTasksPackTargetsFromSdk` which you can set to false in your own project (or a `.props` target in a nuget.). This is exactly how *NuGetizer* replaces its behavior wholesale.

Some users are understandably upset that it's taken so long to "fix" the mentioned issue and "demand" that Microsoft (as if it weren't just a bunch of folks on the NuGet team balancing a gazillion requirements and priorities from all over the .NET/VS ecosystem). I see that attitude as poor approach to the issue. On a substantially different scale, it's as if back in the day when [Newtonsoft.Json](https://www.nuget.org/packages/Newtonsoft.Json) didn't even exist, [James](https://twitter.com/JamesNK) would just come to some issue/ticket and complain about how crappy .NET's support for JSON was and how Microsoft *had* to fix it.

As an open source lover, I've had the oportunity to learn, sometimes contribute (however small bits), to many oss projects. If you're a long-time .NET developer, there's almost no code base that you couldn't have done "better" (for some definition of that anyway). Heck, there isn't a code base of *mine* from a few years ago that I couldn't do better *today*. The point is, there is no magic powers or hardcore knowledge required to (re)do most of the libraries out there. This includes *SDK Pack* too. 

I've had the oportunity to explore that code too, and there are a lot of decisions made likely for historical reasons (remember `project.json`?), that make it ill-suited for certain scenarios. Implementing things that should be easy, are challenging because there are certain assumptions that come from the inevitable evolution of a project with long history.

# NuGetizer Origins

When Xamarin came to the .NET scene, it introduced a number of complexities and challenges for nuget package authors, since they require platform-specific code. This is not typically the case for many libraries, which are mostly content to just provide a `netstandard2.0` implementation and that's it (perhaps some older NS/TF versions too). And all of a sudden, cooking up a manual `.nuspec` isn't as simple anymore.

I was somewhat involved in the MSBuild side of Xamarin too, and with the breath and depth of customization I was used to seeing in the community, I knew that we needed something much more flexible and "MSBuild-native" than the SDK Pack offered. So together with [Mikayla](https://mhut.ch/) we designed the core principles of [NuGetizer](https://github.com/NuGet/Home/wiki/NuGetizer-3000), which are in turn inspired by the prior work by [Andrew Arnott](https://twitter.com/aarnott) on [NuProj](https://github.com/nuproj/nuproj). That is still all there in the Wiki on the main NuGet home, if you want to dig deeper into the principles.

I'm obviously biased, but I don't see [nugetizer](https://www.nuget.org/packages/nugetizer) as a workaround to use only when *SDK Pack* falls short, but as a better designed, stable and totally viable *permanent alternative*. Especially since under the covers, it's using exactly the [same APIs for packaging](https://www.nuget.org/packages/NuGet.Packaging) that the built-in Pack uses itself. 


# An MSBuild-native Alternative

The most important takeaway, is that NuGetizer was designed from the ground up as an MSBuild-native implementation that embraces all of MSBuild features and extensibility points. So much so, that virtually *all* of its functionality is implemented in targets, not in custom tasks. There are in fact only *two* tasks: `AssignPackagePath` and `CreatePackage`. This means you can trivially emit a [binlog](https://www.msbuildlog.com/) and explore in detail how every piece of your ultimate package is collected, modified, augmented. You can choose to run before/after key targets in that process, overwrite or extend every property, item group, and item metadata.

With the benefit of years of experience with both SDK Pack, older `.nuspec` and even some NuProj, it was easier for NuGetizer to come up with more consistent features and extensibility points. For example, the `Pack` attribute is used consistently everywhere, such as:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  ...
  <ItemGroup>
    <ProjectReference Include="..\..." Pack="false" />
  </ItemGroup>

  <ItemGroup>
    <Content Include="..." Pack="false" />
    <None Update="..." Pack="true" />
  </ItemGroup>
```

If you don't want a project reference packed (according to whichever packing inference would apply), you just state so in the project reference, and nothing from that project will make it into the package. Not as dependency, not as content or anything else. Likewise, if you want to pack a file that would otherwise not be packed, you just add `Pack=true` and that's it. 

The consistency of the `Pack` name also applies to how you specify as a project *property* whether you want various items packed by default or not (each item can specify `Pack=true|false` to override that default): `PackSymbols`, `PackFrameworkReferences`, `PackDependencies`, `PackContent`, `PackNone` and so on, all change how package inference works for each of those item types.

Going back to the issue on NuGet that spurred this whole post, consider the following two projects:

```xml
<!-- Common.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="NuGetizer" Version="*" />
  </ItemGroup>
</Project>

<!-- Core.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <PackageId>Core</PackageId>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="NuGetizer" Version="*" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\Common\Common.csproj" />
  </ItemGroup>
</Project>
```

Intuitively, you can see that the Core project is packable, whereas Common is not. Hence, you'd expect the latter to just be packed inside the `lib` folder of the package. Unfortunately, this is not the case for *SDK Pack*. And getting it to pack it is non-trivial, even. In *NuGetizer*, this works out of the box, the way you'd intuitively expect it to. 

The documentation on [package contents inference](https://github.com/devlooped/nugetizer/#package-contents-inference) is quite extensive if you want to explore more closely all the available options and supported features.

## The nugetize tool

Being an MSBuild-native implementation, it's entirely possible to discover and render the contents of a package without actually having to **create** the package (which involves zipping all files to the output .nupkg, which is *not* a cheap task, especially for large packages). When authoring packages, it's quite common to iterate on the MSBuild items and properties until you get the package just the way you want it. Doing a build+pack on each iteration would be a massive waste of time. Enter the [dotnet-nugetize](http://nuget.org/packages/dotnet-nugetize) tool:

```
> dotnet tool install -g dotnet-nugetize
```

You can run the tool on the folder with the `Core.csproj` from above, and you'd get:

![nugetize](https://github.com/kzu/kzu.github.io/raw/main/img/nugetize.png)

If you didn't want the PDBs in there, you'd just add... you guessed it, `PackSymbols=false` to the project, re-run the tool, and now it's:

![nugetize-symbols](https://github.com/kzu/kzu.github.io/raw/main/img/nugetize-2.png)

# First-class Custom Packaging

But if experience in the packing world has taught me anything, it's that no matter how smart the heuristics are, there is always going to be some project with special packing needs that don't fit into any of those heuristics, and where tweaking those rules is just not worth it. So it was super important from the beginning that there was a way to just do away with *any* package content inference *at all* and just manually create your package content directly in MSBuild:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <EnablePackInference>false</EnablePackInference>
    <PackageIcon>icon.png</PackageIcon>
    <PackageId>Custom</PackageId>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="NuGetizer" Version="*" />

    <!-- Add files directly -->
    <PackageFile Include="..\icon.png"  PackagePath="icon.png" />
    <!-- Add package dependencies directly too -->
    <PackageFile Include="Newtonsoft.Json" Version="13.0.1" PackFolder="Dependency" />
  </ItemGroup>
</Project>
```

Since you are building the content manually, you are not constrained even by NuGet's restore rules for projects, since you are not even using a `PackageReference` in this case to declare a dependency on Newtonsoft.Json! 

In this case it's quite likely you'd also not pack the build output of the project, which can be achieved simply by setting `PackBuildOutput=false` on the project. Running `nugetize` on the project folder would show:

![nugetize-custom](https://github.com/kzu/kzu.github.io/raw/main/img/nugetize-3.png)

If you instead wanted instead to have Newtonsoft.Json as a dependency for NS2 but for NS2.1 you wanted to switch to System.Text.Json instead, you could explicitly set the `TargetFramework` for each dependency:

```xml
    <PackageFile Include="Newtonsoft.Json" Version="13.0.1"
                 TargetFramework="netstandard2.0" PackFolder="Dependency" />
    <PackageFile Include="System.Text.Json" Version="5.0.0"
                 TargetFramework="netstandard2.1" PackFolder="Dependency" />
```

Technically, it doesn't really matter for this particular example if the `TargetFramework` of the project itself is `netstandard1.0` or anything else. The output will be the same, as shown by `nugetize`:

![nugetize-dependencies](https://github.com/kzu/kzu.github.io/raw/main/img/nugetize-4.png)

This makes **NuGetizer** an excelent tool for creating meta-packages!

# First-class Authoring in Visual Studio

In the previous example, we had to turn off `PackBuildOutput`, since the project was a .csproj and would therefore build an output assembly. For packaging-only projects, that's clearly unnecessary. So **NuGetizer** offers built-in support for the [Microsoft.Build.NoTargets](https://github.com/microsoft/MSBuildSdks/tree/main/src/NoTargets) SDK too:

```xml
<!-- Packaging.msbuildproj -->
<Project Sdk="Microsoft.Build.NoTargets/3.0.4">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <PackageId>Packaging</PackageId>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="NuGetizer" Version="*" />
  </ItemGroup>
  <ItemGroup>
    <None Include="..\icon.png" PackagePath="icon.png" />
    <PackageReference Include="Newtonsoft.Json" Version="13.0.1"
                      TargetFramework="netstandard2.0" />
    <PackageReference Include="System.Text.Json" Version="5.0.0"
                      TargetFramework="netstandard2.1" />
  </ItemGroup>
</Project>
```

With a project extension of `.msbuildproj`, Visual Studio can even open this project and show it in the solution explorer:

![nugetize-vs](https://github.com/kzu/kzu.github.io/raw/main/img/nugetize-5.png)

The [Microsoft.Build.Traversal](https://github.com/microsoft/MSBuildSdks/tree/main/src/Traversal) SDK is also supported, so you can pack all your packaging projects from a single entry point, such as:

```xml
<!-- Traversal.msbuildproj -->
<Project Sdk="Microsoft.Build.Traversal/3.0.23">
  <ItemGroup>
    <ProjectReference Include="src\**\*.msbuildproj" />
  </ItemGroup>
</Project>
```

I've been using NuGetizer on all my projects for years now, and it's proven invaluable. If it's valuable for your projects too, perhaps you would consider [sponsoring further work](https://github.com/sponsors/devlooped) on it 🙏. Thanks!
