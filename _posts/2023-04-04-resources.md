---
title: "Strongly-typed resources with .NET 6+"
excerpt: |
  It would seem that adding a .resx file to your project 
  should be enough to get you started with strongly-typed 
  resources. Unfortunately, it's not that simple. Here's how
  to get it working.
tags: [dotnet, aspnet, blazor]
---

> Copilot (in VS Code) helping me write posts is 🤯

In the era of source generators and .NET 6+, it would seem that adding a `.resx` file 
to your project should be enough to get you started with strongly-typed resources. 
I'd just expect some new source generator would pick `.resx` files (if they don't 
have `%(GenerateResource)` metadata value [set to false](https://github.com/dotnet/msbuild/blob/main/src/Tasks/Microsoft.Common.CurrentVersion.targets#L3327)) 
and generate the corresponding code. 

Despite years going by, this [still doesn't work](https://github.com/dotnet/msbuild/issues/4751) as-is [out of the box](https://github.com/dotnet/sdk/issues/94), which is 
quite annoying. I just spent a while figuring out why and found this excelent 
[blog post](https://www.paraesthesia.com/archive/2022/09/30/strongly-typed-resources-with-net-core/) on how to enable it.
It's *almost* there as a generic solution.

My solution for this is to add a `Directory.Build.targets` file to the root of my 
solution/repo with the following content:

```xml
<Project>
  <PropertyGroup>
    <!-- For VSCode and .razor compat -->
    <CoreCompileDependsOn>PrepareResources;$(CoreCompileDependsOn)</CoreCompileDependsOn>
  </PropertyGroup>

  <ItemGroup>
    <EmbeddedResource Update="@(EmbeddedResource)">
      <Generator>MSBuild:Compile</Generator>
      <StronglyTypedFileName>$(IntermediateOutputPath)\$([MSBuild]::ValueOrDefault('%(RelativeDir)', '').Replace('\', '.').Replace('/', '.'))%(Filename).g$(DefaultLanguageSourceExtension)</StronglyTypedFileName>
      <StronglyTypedLanguage>$(Language)</StronglyTypedLanguage>
      <StronglyTypedNamespace Condition="'%(RelativeDir)' == ''">$(RootNamespace)</StronglyTypedNamespace>
      <StronglyTypedNamespace Condition="'%(RelativeDir)' != ''">$(RootNamespace).$([MSBuild]::ValueOrDefault('%(RelativeDir)', '').Replace('\', '.').Replace('/', '.').TrimEnd('.'))</StronglyTypedNamespace>
      <StronglyTypedClassName>%(Filename)</StronglyTypedClassName>
    </EmbeddedResource>
  </ItemGroup>
</Project>
```

Some notes:
1. The key is `Generator=MSBuild:Compile`, but that requires the other metadata items
2. The `RelativeDir` built-in metadata is used to generate the namespace and unique target 
   file name. We cannot use it without replacing path separators with dots because the 
   resgen tool will not create the directory structure for us.
3. The `StronglyTypedLanguage` is set to the current project `$(Language)` which should 
   work for the supported languages by the [resgen tool](https://learn.microsoft.com/en-us/dotnet/framework/tools/resgen-exe-resource-file-generator).


Enjoy!