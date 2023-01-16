---
title: "How to get Visual Studio 2017 installation path"
description: "From MSBuild it's easy, just use $(VsInstallRoot), but what about 
your VS extension? It's also quite easy, although far less discoverable..."
tags: [vssdk, vsix, visualstudio, msbuild]
---

From MSBuild it's easy, just use $(VsInstallRoot), but what about 
your VS extension? It's also quite easy, although far less discoverable.

Steps are easy enough:

1. Install the [Microsoft.VisualStudio.Setup.Configuration.Interop](https://www.nuget.org/packages/Microsoft.VisualStudio.Setup.Configuration.Interop/) 
   nuget package.

2. From the relevant code, use the following code:

```csharp
var config = (Microsoft.VisualStudio.Setup.Configuration.ISetupConfiguration2)
    Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("177F0C4A-1CD3-4DE7-A32C-71DBBB9FA36D")));
var instance = c.GetInstanceForCurrentProcess();

// There are many other useful members here you might use to inspect the current VS from a 
// setup/installation point of view.
var installPath = instance.GetInstallationPath();
```

That "magic" GUID is the CLSID for the type `Microsoft.VisualStudio.Setup.Configuration.SetupConfigurationClass` in 
the package, which you can't new up because (in my case at least) NuGet set it to embedded interop assembly and 
prevented instantiation directly. F12'ing to the definition, copying the GUID and changing the to Activator was 
simple enough though, and works just fine.

And that it. Enjoy!