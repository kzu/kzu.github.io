---
title: "NuGet central package versions with floating or range versions"
excerpt: |
  Somehow, using central package version is an "enterprise" feature and 
  therefore it has to be obnoxious about not shooting yourself in the foot.
  Fortunately, there's a better way.
tags: [dotnet, aspnet, blazor]
---

Say you're dogfooding the latest and greatest .NET preview, and want to 
simply say "get latest preview 5 bits". Trivial in any .NET project:

```xml
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly" Version="8.0.0-preview.5.*" />
```

Easy enough to bump when preview 6 comes out, right? 

Now, if you happen to use [NuGet's CEntral Package Management](https://learn.microsoft.com/en-us/nuget/consume-packages/Central-Package-Management), 
you will be greeted with a [nice error message](https://learn.microsoft.com/en-us/nuget/reference/errors-and-warnings/nu1011): `Centrally defined floating package versions are not allowed.` 
You see, you're now using what "is considered an enterprise-level feature 
which provides easier version management at scale as well as deterministic and secure restores"! 

You have been doing unsecure, complicated and undeterministic restores 
all along, you freak, and now you're being punished for it.

> Feel free to [upvote the issue to fix this craziness](https://github.com/NuGet/Home/issues/9384)

Now, before the NuGet team decided to lecture you on how to do something 
that's been supported in package references since forever (floating and 
version ranges), there was already a way to do the *same* but natively 
using plain MSBuild SDK/targets stuff. And it works as intuitively as it 
should, supporting everything you can do at the project level, via centrally 
managed versions too: the [Microsoft.Build.CentralPackageVersions MSBuild SDK](https://github.com/microsoft/MSBuildSdks/tree/main/src/CentralPackageVersions).

Steps to migrate from the NuGet way to the MSBuild SDK way is trivial:

1. Rename `Directory.Packages.props` to `Packages.props`

2. In your `Directory.Build.targets` add the SDK:

```xml
<Project>
  <Sdk Name="Microsoft.Build.CentralPackageVersions" Version="2.1.3" />
</Project>
```

3. `Packages.props`: find all `PackageVersion Include` and replace all with `PackageReference Update`. 

Done. Back to sane developing (especially for dogfooding previews).
Integration with Visual Studio isn't great, obviously. If you install or 
update packages from the UI, you'll have to manually move the versions 
to the `Packages.props` file. But dependabot should take care of that 
anyway.


Enjoy!