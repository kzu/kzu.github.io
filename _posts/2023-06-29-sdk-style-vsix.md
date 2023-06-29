---
title: "How to create SDK-style VSIX project"
excerpt: |
  Pretty much everyone on the .NET ecosystem moved to 
  the so-called SDK-style projects. But for whatever 
  reason, VSIX projects still today use the legacy format. 
  This post shows you how to enjoy the goodies of the 
  SDK-style projects in your VSIX projects.
tags: [visualstudio]
---

Pretty much everyone on the .NET ecosystem moved to the so-called SDK-style projects. 
Amazingly, even today (as of now, VS 2022 17.7 Preview 2.0) the out of the box template 
for VSIX projects still uses the legacy (and awfully verbose) format. 

So, forget the built-in VSIX template and just create a plain class library, and 
tweak it as follows:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net472</TargetFramework>
    <!-- If you don't have a VS Package -->
    <GeneratePkgDefFile>false</GeneratePkgDefFile>
    <!-- Import build tools -->
    <CustomAfterMicrosoftCSharpTargets Condition="$(VsSDKInstall) != ''">$(VsSDKInstall)\Microsoft.VsSDK.targets</CustomAfterMicrosoftCSharpTargets>
  </PropertyGroup>

  <PropertyGroup>
    <!-- Enables F5 -->
    <StartAction>Program</StartAction>
    <StartProgram>$(DevEnvDir)devenv.exe</StartProgram>
    <StartArguments>/rootSuffix Exp /log</StartArguments>
  </PropertyGroup>

  <ItemGroup>
    <!-- Minimal references that should allow pretty much everything -->
    <PackageReference Include="Microsoft.VisualStudio.SDK" Version="17.6.36389" />
    <PackageReference Include="Microsoft.VSSDK.BuildTools" Version="17.6.2164" PrivateAssets="all" />
  </ItemGroup>

  <!-- Allows vsixmanifest to retrieve dynamically-determined version, just like nuget packages -->
  <Target Name="GetVersion" Returns="$(Version)" />

</Project>
```

An equally minimalistic VSIX manifest would be:

```xml
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" 
                 xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" 
                 xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <!-- You can use the |ProjectName;TargetName| syntax throughout this manifest, BTW -->
    <Identity Id="Vsix" Version="|Vsix;GetVersion|" Language="en-US" Publisher="kzu" />
    <DisplayName>SDK-Style VSIX</DisplayName>
    <Description>A minimal VSIX that uses SDK-style project</Description>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Community" Version="[17.0,)">
      <ProductArchitecture>amd64</ProductArchitecture>
    </InstallationTarget>
  </Installation>
  <Prerequisites>
    <Prerequisite Id="Microsoft.VisualStudio.Component.CoreEditor" Version="[17.0,)" DisplayName="Visual Studio core editor" />
  </Prerequisites>
</PackageManifest>
```

Now you can F5 or Ctrl+F5 and have "fun" extending VS 😉.

Enjoy!