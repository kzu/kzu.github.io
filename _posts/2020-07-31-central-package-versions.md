---
title: "Central Package Versions"
excerpt: How to manage NuGet packages in a central place without resorting to MSBuild SDKs
tags: [tools]
---

There is some [ongoing work](https://github.com/NuGet/Home/labels/Area%3ARestoreCPVM) in NuGet itself to add support for managing nuget packages in a central manner, make sure you read about the [indented design](https://github.com/NuGet/Home/wiki/Centrally-managing-NuGet-package-versions) since you may want to wait for that to ship in stable form if you require the advanced features outlined there

This showcases how you can adopt this now, with stuff that is already shipping and stable, with acceptable IDE support and some useful out of the box behavior, like [supporting version overrides](https://github.com/NuGet/Home/issues/9465) and friendly error messages.

I think this is also a very good way of understanding a bit more about MSBuild capabilities.

So let's first see what (my) requirements are:

1. Seamless integration with existing MSBuild-based projects, no need to change much (if anything) in existing projects.
2. Acceptable IDE support (i.e. no "broken dependencies" icon in solution explorer).
3. Minimal cognitive overhead over existing PackageReference semantics and syntax.

With that in mind, my approach is:

1. We keep `<PackageReference>` as-is: you can specify a `Version` if you want to.
2. Centrally managed `PackageReference` can either:
    * Specify a `Version`, which will force a version for every project that declares the package reference.
    * Specify a `DefaultVersion`, which will allow overriding individually, but provide a default if `Version` is not set.

I'll use `Packages.props` (the built-in support will be `Directory.Packages.props` instead) to define the central package versions, and this is an example of it:

```xml
<Project>

  <ItemGroup>
    <PackageReference Update="GitInfo" Version="2.0.20" PrivateAssets="all" />
    <PackageReference Update="Newtonsoft.Json" DefaultVersion="12.0.3" />
  </ItemGroup>

</Project>
```

Note we do an `Update`: this means there needs to be an existing `PackageReference` in the project file in order for it to be updated. This does not define a new package reference that is added to all projects. To do that, you could just do an `Include` instead, as usual.

Given the following .csproj:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="GitInfo" />
    <PackageReference Include="Newtonsoft.Json" />
  </ItemGroup>

</Project>
```

Both should be defaulted as:
* GitInfo: `2.0.20`
* Newtonsoft.Json: `12.0.3`


If we update the references like so:

```xml
  <ItemGroup>
    <PackageReference Include="GitInfo" Version="2.0.0" />
    <PackageReference Include="Newtonsoft.Json" Version="11.0.2" />
    <PackageReference Include="Xunit" />
  </ItemGroup>
```

We should see:
* GitInfo causes a build error, since there is a central package version and it's not a mere default. 
* Newtonsoft.Json version override is allowed.
* Xunit also causes a build error, since no version was specified but there is no central package version (default or otherwise).


The implementation ended up being extremely simple, involving just minor adjustments to the (likely already present) "global" directory targets:

1. `Directory.Build.targets`: here we'll first preserve the original version (if any) specified in the .csproj before we update it, and then import the package targets:

```xml
  <ItemGroup>
    <PackageReference Update="@(PackageReference)" OriginalVersion="%(Version)" />
  </ItemGroup>

  <Import Project="Packages.props" />
  <Import Project="Packages.targets" />
```

3. `Packages.targets` implements the actual logic given the requirements:

```xml
<Project>

  <ItemDefinitionGroup>
    <PackageReference>
      <DefaultVersion />
      <Version />
    </PackageReference>
  </ItemDefinitionGroup>

  <Target Name="UpdatePackageVersions" BeforeTargets="_GenerateRestoreGraph;_GenerateRestoreGraphProjectEntry;CollectPackageReferences;PrepareForBuild">
    <Error Code="DL001" Text="Package reference '%(PackageReference.Identity)' cannot specify a version because it is centrally managed." 
           Condition="%(PackageReference.OriginalVersion) != '' And %(PackageReference.Version) != %(PackageReference.OriginalVersion)" />
    <ItemGroup>
      <PackageReference Version="$([MSBuild]::ValueOrDefault('%(Version)', '%(DefaultVersion)'))" />
    </ItemGroup>
    <Error Code="DL002" Text="Package reference '%(PackageReference.Identity)' must specify a version since a centrally managed default version has not been provided." 
           Condition="%(PackageReference.Version) == '' And %(PackageReference.Identity) != ''" />
  </Target>

</Project>
```

The `ItemDefinitionGroup` ensures that all `PackageReference` items have both `Version` and `DefaultVersion` metadata for the comparisons in the target. 
The preserved `OriginalVersion` we saved in step 1 before importing the `Packages.props` works because the `PackageReference` items aren't updated until the import, and once they are updated we can use the original version to check for mismatches. We also leverage the `ValueOrDefault` [property function](https://docs.microsoft.com/en-us/visualstudio/msbuild/property-functions) to only set the `Version` to `DefaultVersion` if it doesn't have a value already.

The `BeforeTargets` basically are:
* `_GenerateRestore*`: these are called by `Restore` when building the graph of package references, so we need to run before that to update the versions.
* `CollectPackageReferences`: this is called by the IDE during design-time build, like right after opening the project and doing the initial automatic restore.
* `PrepareForBuild`: just in case any targets in your project inspect the versions, we also run before builds.

At least for my scenarios, this satisfies all my requirements and is simple enough that I will be able to reason about this in the future if needed.
