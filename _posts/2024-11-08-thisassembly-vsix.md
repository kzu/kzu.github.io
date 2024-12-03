---
title: "Consuming VSIX metadata from C#"
description: "Avoid duplicating strings and other values from the VSIX extension manifest and your code by leveraging ThisAssembly.Vsix package and compile-time code generation"
tags: [vsx, visualstudio]
---

Sometimes it's useful to render VSIX manifest metadata in logs, or some UI in your extension.
You could just duplicate the values in your code, but that's error-prone and tedious.

The [ThisAssembly.Vsix](https://www.nuget.org/packages/ThisAssembly.Vsix) package can help you avoid that by generating a 
`ThisAssembly.Vsix` class with all the metadata from your VSIX manifest.

![](https://raw.githubusercontent.com/devlooped/ThisAssembly/main/img/ThisAssembly.Vsix.png)

In addition to making the [VSIX manifest metadata](https://learn.microsoft.com/en-us/visualstudio/extensibility/vsix-extension-schema-2-0-reference?view=vs-2022#metadata-element) 
properties available as constants, the package also provides targets for those properties 
with sensible defaults from project properties so that the manifest can leverage 
[placeolder syntax](https://learn.microsoft.com/en-us/visualstudio/extensibility/vsix-extension-schema-2-0-reference?view=vs-2022#metadata-element) 
and avoid duplication in the `source.extension.vsixmanifest`:

```xml
<PackageManifest Version="2.0.0" ...>
  <Metadata>
    <!-- You can use the |ProjectName;TargetName| syntax throughout this manifest, BTW -->
    <Identity Id="|%CurrentProject%;VsixId|" Version="|%CurrentProject%;VsixVersion|" Language="|%CurrentProject%;VsixLanguage|" Publisher="|%CurrentProject%;VsixPublisher|" />
    <DisplayName>|%CurrentProject%;VsixDisplayName|</DisplayName>
    <Description>|%CurrentProject%;VsixDescription|</Description>
  </Metadata>
  ...
</PackageManifest>
```

The available properties and their default values are:

| Name              | Default Value                       |
|-------------------|-------------------------------------|
| VsixID            | `$(PackageId)` or `$(AssemblyName)` |
| VsixVersion       | `$(Version)`                        |
| VsixDisplayName   | `$(Title)`                          |
| VsixDescription   | `$(Description)`                    |
| VsixProduct       | `$(Product)`                        |
| VsixPublisher     | `$(Company)`                        |
| VsixLanguage      | `$(NeutralLanguage)` or 'en-US'     |

As shown in the example above, the syntax for using these properties from the `source.extension.vsixmanifest` is 
`|%CurrentProject%;[PROPERTY]|`. This is because the package defines a corresponding target to 
retrieve each of the above properties. You can provide a different value for each property via 
MSBuild as usual, of course.

Since the `$(PackageId)` property can be used as the VSIX ID, the `Pack` target is redefined to 
mean `CreateVsixManifest`, so "packing" the VSIX is just a matter of right-clicking the VSIX 
project and selecting "Pack".

Happy extending!
