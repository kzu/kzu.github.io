---
title: "How to include PackageReference DLLs in your VSIX extension"
excerpt: | 
  If you migrate your VSIX package references from packages.config to PackageReference, 
  you will notice they all vanish from your output .vsix file. This is the easy way to bring them 
  all back in a generic fashion.
tags: [vssdk, vsix, visualstudio, msbuild]
---

In the packages.config days, references were added directly to the project and everything would 
get copied to the output and the VSIX by default. 

[PackageReference](https://docs.microsoft.com/en-us/nuget/consume-packages/package-references-in-project-files) 
is a vastly superior approach, but as soon as you switch over, you'll notice that all those 
referenced assemblies from packages are gone from the output VSIX. 
 
Not to worry though, since with a little bit of MSBuild, we can achieve anything we want in a build.

In the VSSDK, the target that determines what items make up the VSIX is called `GetVsixSourceItems` and 
it uses a `$(GetVsixSourceItemsDependsOn)` we can add ourselves to in order to run just before it does 
its thing:

```xml
    <PropertyGroup>
      <GetVsixSourceItemsDependsOn>$(GetVsixSourceItemsDependsOn);IncludeNuGetResolvedAssets</GetVsixSourceItemsDependsOn>
    </PropertyGroup>
```

And the awesome little thingy we need in `IncludeNuGetResolvedAssets` is just:

```xml
	<Target Name="IncludeNuGetResolvedAssets" DependsOnTargets="ResolveNuGetPackageAssets">
      <ItemGroup>
	  	<VSIXCopyLocalReferenceSourceItem Include="@(ReferenceCopyLocalPaths)"  />
      </ItemGroup>
    </Target>
```

And voilà, files are back! Note that doing it this way does not interfere with the built-in 
[VSSDK VsixSupression](https://www.nuget.org/packages/Microsoft.VisualStudio.SDK.VsixSuppression)  package 
that makes sure you don't include assemblies you shouldn't in your VSIX.

And that's all there is to it.

Happy extending!