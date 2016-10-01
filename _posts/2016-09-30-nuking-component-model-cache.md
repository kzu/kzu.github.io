---
title: "How to nuke the Visual Studio MEF component model cache from an MSI"
description: "Sometimes Visual Studio just won't refresh the MEF cache properly after you install a new extension via an MSI. This is how you can nuke the cache cleanly."
tags: [vsx, msi]
---

A quick search on the web for [InvalidMEFCacheException](https://www.google.com.ar/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=InvalidMEFCacheException) 
will yield quite a few results. If you have faced it, you know it's annoying like hell. 

> I wonder, if VS already detected its cache is invalid, why doesn't it auto-nuke it 
> and offer a quick Restart action?

Two very common ways you can corrupt the MEF cache are:

1. Improperly include VS assemblies that provide MEF components in your extension 
2. Providing different versions of your own assemblies that provide MEF components in different extensions 

The first issue can be solved easily by installing the 
[Microsoft.VisualStudio.SDK.VsixSuppression](https://www.nuget.org/packages/Microsoft.VisualStudio.SDK.VsixSuppression/) 
nuget package into your project. Sometimes some assemblies are missing from the suppression, 
but the team is super responsive and will ship an updated nuget package the moment you report 
the [missing suppression in their gitter chat](https://gitter.im/Microsoft/extendvs?at=57b67be9b64a3a016f4aa766). 
That's one of the many benefits of shipping granular nuget packages out of band :).

If you want to be 100% future-proof, you can add this target to your VSIX project and be sure 
that no missing assemblies ever go into your VSIX:

    <Target Name="ExcludeVisualStudioAssemblies"
            AfterTargets="GetVsixSourceItems"
            BeforeTargets="RemoveVSSDKAssemblies"
            Condition="'$(IncludeCopyLocalReferencesInVSIXContainer)' == 'true'">
        <ItemGroup>
        <SuppressPackaging Include="@(VSIXSourceItem)"
                           Condition="$([System.String]::new('%(Filename)').StartsWith('Microsoft.VisualStudio'))" />
        </ItemGroup>
    </Target>

The second case will require you to carefully factor your assemblies so that the actual MEF implementations 
live in a single place and are distributed by a single extension, possibly declaring a dependeny on that one 
in the other extensions' manifests.


If users continue to see random (and usually hard to repro) MEF exceptions, it might be that it's not you who 
is distributing those duplicate assemblies, and with VS vibrant ecosystem of extensions, it's hard to make sure 
in advance that doesn't ever happen. In that case, you might still want to ensure a clean MEF cache on the next 
VS start after you install your product.

If you're installing via the VS gallery as a VSIX, then you're out of luck ;). But if you have an MSI that 
installs your extension, then it's fairly straightforward.

Partially based on the (fairly old) blog post [tactical directory nukes](https://www.joyofsetup.com/2011/01/21/tactical-directory-nukes/), 
I came up with the following, which works great:

* Add the [WixUtilExtension](http://wixtoolset.org/documentation/manual/v3/howtos/general/extension_usage_introduction.html) to your WiX project. 
   I usually add it like this directly to the `.wixproj`:

```
   <WixExtension Include="WixUtilExtension">
      <HintPath>$(WixExtDir)WixUtilExtension.dll</HintPath>
      <Name>WixUtilExtension</Name>
   </WixExtension>
```
 
* Add the XML namespace to your WiX file: `xmlns:util="http://schemas.microsoft.com/wix/UtilExtension"`

* Declare and initialize a property for each of the VS MEF caches you support and are going to potentially clean:

```
   <SetProperty Id="MEF14" Value="[%LOCALAPPDATA]\Microsoft\VisualStudio\14.0\ComponentModelCache" Before="CostInitialize" /> 
```

* Finally, add the following element to a component installed by each VS version you support:

```
   <util:RemoveFolderEx On="both" Property="MEF14" Id="CleanMEF14" />
```

> Of course, have as many `MEF[n]` properties as you need, like `MEF11`, `MEF12`, etc., and initialize 
> the property to point to the right ComponentModelCache folder appropriately.


The `On="both"` ensures you clean the cache after an install or uninstall, so you always leave VS 
in a pristine MEF state. The slight performance hit on the first run after an install is not terrible 
and certainly a rare event unless you're testing VS extensions for a living ;)