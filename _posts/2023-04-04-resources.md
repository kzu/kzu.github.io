---
title: "Strongly-typed resources with .NET 6, 8, Blazor and beyond"
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
    <!-- Required for intellisense -->
    <CoreCompileDependsOn>CoreResGen;$(CoreCompileDependsOn)</CoreCompileDependsOn>
  </PropertyGroup>

  <ItemGroup>
    <EmbeddedResource Update="@(EmbeddedResource -> WithMetadataValue('Generator', 'MSBuild:Compile'))" Type="Resx">
      <StronglyTypedFileName>$(IntermediateOutputPath)\$([MSBuild]::ValueOrDefault('%(RelativeDir)', '').Replace('\', '.').Replace('/', '.'))%(Filename).g$(DefaultLanguageSourceExtension)</StronglyTypedFileName>
      <StronglyTypedLanguage>$(Language)</StronglyTypedLanguage>
      <StronglyTypedNamespace Condition="'%(RelativeDir)' == ''">$(RootNamespace)</StronglyTypedNamespace>
      <StronglyTypedNamespace Condition="'%(RelativeDir)' != ''">$(RootNamespace).$([MSBuild]::ValueOrDefault('%(RelativeDir)', '').Replace('\', '.').Replace('/', '.').TrimEnd('.'))</StronglyTypedNamespace>
      <StronglyTypedClassName>%(Filename)</StronglyTypedClassName>
    </EmbeddedResource>
  </ItemGroup>
</Project>
```

This triggers the generation of the typed resource class just as if it had the (legacy?) 
`ResXFileCodeGenerator` (or `PublicResXFileCodeGenerator`) custom tool set in the `.resx` file 
properties. The benefit of this approach is that you don't get the `.Designer.cs` file 
checked into your repo. In order to trigger the code generation, you instead set the 
custom tool to `MSBuild:Compile` in the `.resx` file properties.

The reason to keep a custom tool (and not assigning it automatically to all `.resx` files)
is that you only need the strongly-typed resource class for the root/neutral `.resx`, not 
the per-locale ones. You might also have other resource files you don't want to generate 
code for.

Some notes on the implementation of item metadata above:
1. The `RelativeDir` built-in metadata is used to generate the namespace and unique target 
   file name. We cannot use it without replacing path separators with dots because the 
   resgen tool will not create the directory structure for us.
2. The `StronglyTypedLanguage` is set to the current project `$(Language)` which should 
   work for the supported languages by the [resgen tool](https://learn.microsoft.com/en-us/dotnet/framework/tools/resgen-exe-resource-file-generator).


Enjoy!