---
title: How to use .NET module initializers in a concrete real use case
tags: [dotnet, msbuild]
---

[Module initializers in C#](https://einaregilsson.com/module-initializers-in-csharp/) aren't a radical new thing for sure, but they were esoteric enough and they required [a NuGet package](https://www.nuget.org/packages/InjectModuleInitializer/) to work, so it seemed like a sort of unofficial/unsupported feature. [Not anymore](https://github.com/dotnet/csharplang/blob/master/proposals/csharp-9.0/module-initializers.md) since they are now an officially supported feature with first-class language support in C# 9!

So the first thing might be to ask: what would I use them for? Learning a new thing in C# just for the sake of it isn't very productive. 

I just came across a scenario where I totally needed this feature: [unit tests that run MSBuild](https://github.com/kzu/NuGetizer/tree/dev/src/NuGetizer.Tests)! 

## Initializing MSBuild for tests

It turns out that the *right* way of doing MSBuild unit tests is to use the [Microsoft.Build.Locator](https://docs.microsoft.com/en-us/visualstudio/msbuild/updating-an-existing-application?view=vs-2019#use-microsoftbuildlocator) to set the MSBuild to use for the tests. This is the only sane way to get all those targets imports, tasks and SDKs properly resolved. 

Simply enough, you're supposed to invoke `Microsoft.Build.Locator.MSBuildLocator.RegisterMSBuildPath(path);` before *any* MSBuild assemblies are loaded. **And** you can only call it ONCE. Tricky thing eh? Can't really put it in one test class static constructor, maybe in a helper? What if you forget to call the helper from some test class? Everything breaks and it will be tough to diagnose. What you really need is something that runs only once for the entire assembly (which are run in isolation in most (all?) runners). In other words, a Module Initializer!

The basic idea is you create a static class with a static void method, and annotate it with `[ModuleInitializer]` and that's it. Unless you're targeting .NET5, however, you won't have that attribute type defined anywhere to use it. Luckily, you can just declare it in your project and things will Just Work too:

```csharp
namespace System.Runtime.CompilerServices
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class ModuleInitializerAttribute : Attribute { }
}
```

In my particular scenario, I want to use the MSBuild path that was used to compile the test project itself, to account for side-by-side installs. So how can my code access an *MSBuild* property (namely, the [MSBuildBinPath](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-reserved-and-well-known-properties?view=vs-2019) property)? Another C# 9 powered feature to the rescue: [ThisAssembly.Project](https://github.com/kzu/ThisAssembly#thisassemblyproject) source generator! I just need to add the following to the test .csproj:

```xml
  <ItemGroup>
    <PackageReference Include="ThisAssembly.Project" Version="0.10.6" />  
    <ProjectProperty Include="MSBuildBinPath" />
  </ItemGroup>
```

And now the initializer can access it and set the path:

```csharp
internal static class ModuleInitializer
{

    [ModuleInitializer]
    internal static void Run()
    {
        var binPath = ThisAssembly.Project.MSBuildBinPath;
        Microsoft.Build.Locator.MSBuildLocator.RegisterMSBuildPath(binPath);
        // Set environment variables so SDKs can be resolved. 
        Environment.SetEnvironmentVariable("MSBUILD_EXE_PATH", Path.Combine(binPath, "MSBuild.exe"), EnvironmentVariableTarget.Process);
    }
}
```

## What about mobile?

Here's another scenario where I'd love to see it used: all those dreaded `ThatOrThat.Init();` so frequent in Xamarin! I tried the above code in the netstandard library of a Xamarin Forms app, and both **Android and iOS** properly invoked the module initializer before executing any code in the shared library. Moreover, I tried having more than one, and they all invoked too!

So I think that's another amazing improvement that could come at some point from the mobile platform. In that particular case, a source generator would emit the module initializer code so you, the end user, don't have to do anything and things Just Work after simply installing a nuget package :-).  
