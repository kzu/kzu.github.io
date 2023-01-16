---
title: "How To Migrate PCL and Xamarin.Forms Apps to NETStandard Today"
description: "One of the reasons devs don't update their (Xamarin.Forms) PCL library projects to 
.NETStandard 2.0 is that there are a bunch of NuGet packages that still haven't 
migrated to it. It turns out, that that's not a problem at all!"
tags: [xamarin, mobile, netstandard, dotnet]
---

One of the reasons devs don't update their (Xamarin.Forms) PCL library projects to 
.NETStandard 2.0 is that there are a bunch of NuGet packages that still haven't 
migrated to it. It turns out, that that's not a problem at all!

Basically, the steps are:

1. Open your .csproj and delete *everything*
2. Replace its contents with:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <AssetTargetFallback>portable-net45+netcore45+wpa81+wp8+MonoAndroid10+MonoTouch10+Xamarin.iOS10;portable-net45+win8+wp8+wpa81;portable-win+net45+wp80+win81+wpa81</AssetTargetFallback>
  </PropertyGroup>

</Project>
```

3. Add an `<ItemGroup>` and start adding `<PackageReference>` for the entries in your `packages.config`, such as:

```xml
  <ItemGroup>
    <PackageReference Include="sqlite-net-pcl" Version="1.3.3" />
    <PackageReference Include="SQLitePCLRaw.bundle_green" Version="1.1.5" />
    <PackageReference Include="SQLitePCLRaw.core" Version="1.1.5" />
    <PackageReference Include="Xamarin.Forms" Version="2.5.0.280555" />
  </ItemGroup>
```

The trick of course is that new (in VS2017 15.6) `AssetTargetFallback` property (used to be called `PackageTargetFallback`). 
It tells NuGet restore to consider those additional target frameworks as compatible with the current project, so any package 
that does not provide a `netstandard2.0` lib will automatically get one of those other PCL profiles instead, which should 
work too just fine.

So now you don't have any more excuses for putting up with all those merge conflicts any time someone adds files to the 
project!


Enjoy :)