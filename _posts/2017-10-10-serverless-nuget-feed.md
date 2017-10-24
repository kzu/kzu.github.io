---
title: "Serverless custom NuGet feeds"
description: "Pretty much all CI systems offer nuget feed hosting. 
But why setup those when you can have a CI-independent, static 
serverless feed virtually for free and almost no effort?"
tags: [msbuild]
---

Some time ago I posted the following [question on twitter](https://twitter.com/kzu/status/860529947303178240):

> has anyone done a serverless @nuget gallery using azure functions and blob storage? I totally need one ;)

I was basically looking for a serverless solution that would be independent 
of our CI so that multiple builds from various sources we have around could push 
nuget packages in a consistent fashion and we could access them reliably without 
the burden of maintaining a nuget gallery. 

> I'd argue the need for a full-blown nuget.org-like website/gallery is typically 
> unnecessary, unless you're hosting this for end users. But for enterprises, 
> internal dogfooding and even personal projects, all you typically need is a 
> reliable and fast feed.

[Justin Emgarten](https://twitter.com/emgarten) from the NuGet team at Microsoft 
pointed me at his super awesome [Sleet](https://github.com/emgarten/Sleet) project 
which allows you to create such feeds and host them in ASP.NET or Azure Blob Storage. 

I wanted an even more streamlined experience for the serverless Azure Blob Storage-based 
solution, with explicit support for MSBuild. Basically I wanted to:

* Install/restore a nuget package
* Declare via MSBuild some .nupkg(s) to push
* Invoke `msbuild /t:push`

So extending his awesome tool, I created the 
[Sleet.Azure](https://www.nuget.org/packages/Sleet.Azure) package, which does 
exactly that.

Since we'll be publishing to Azure Blob Storage, let's first create the required 
storage container for that. Head over to the [Azure Portal](https://portal.azure.com/).
If you don't have a subscription yet, you can [create one for free](https://azure.microsoft.com/en-us/free/).

If you don't have a storage account already, you can [create one now](https://portal.azure.com/#create/Microsoft.StorageAccount-ARM):

[![create storage account](http://www.cazzulino.com/img/serverless-nuget-storage.png)](https://portal.azure.com/#create/Microsoft.StorageAccount-ARM)

The values in that screenshot for Account kind (Blob storage), Access tier (Hot) and 
[Replication](https://docs.microsoft.com/en-us/azure/storage/common/storage-redundancy) (Read-access geo-redundant storage (RA-GRS))
should be the optimal ones for a static nuget feed.

Once you create (or navigate) to the storage account, click on the `+ Container` button to 
create a "folder" within the account, such as *nuget*:

![create storage container](http://www.cazzulino.com/img/serverless-nuget-container.png)

Make sure you select *Blob* for the Public access level if it's intended for anonymous access:

![public blob access](http://www.cazzulino.com/img/serverless-nuget-blob.png)

Finally, head over to the `Settings > Access keys` section and copy the `key1`.

Next on your MSBuild project, all you need to provide are the following properties:


```xml
   <!-- Azure storage access key for the connection -->
   <StorageAccessKey Condition="'$(StorageAccessKey)' == ''" />
   <!-- Azure storage account to use (aka "the sub-domain" in *.blob.core.windows.net or *.azureedge.net for the CDN endpoint) -->
   <StorageAccount Condition="'$(StorageAccount)' == ''" />
   <!-- Azure storage container name where the feed will be stored (aka "the folder") -->
   <StorageContainer Condition="'$(StorageContainer)' == ''" />
```

The firt one would be the `key1` you copied previously. Storage account would be 
`kzunuget` in the screenshots above. And the container would be `nuget` (the folder).


Then, just declare the packages you intend to push:

```xml
<ItemGroup>
   <Package Include="bin\*.nupkg" >
</ItemGroup>
```

And finally just invoke `msbuild /t:push` on that project.

Combined with [trivially created nuget packages in VS2017](https://docs.microsoft.com/en-us/nuget/guides/create-net-standard-packages-vs2017), 
this allows you to quickly get a private Azure Storage-based feed up and running 
with no code and no fuss. And it's even automatically CDN enabled!

By default, `Push` will validate and automatically initialize (if empty or non-existing) 
the feed on every push. This is a somewhat costly and slow-ish operation. So you can 
alternatively set `<SleetInit>false</SleetInit>` (or pass in `/p:SleetInit=false`) and 
run the `Init` target just once before the first `Push` call.

The output for the initialization would be, for example:

```
Project "C:\Delete\sleetnuget\build.proj" on node 1 (push target(s)).
Init:
  "C:\Users\kzu\.nuget\packages\sleet\2.1.0\build\net46\..\..\tools\Sleet.exe" validate -s feed -c C:\Users\kzu\AppData\Local\Temp\tmp3B08.tmp
  Reading feed https://kzuget.blob.core.windows.net/nuget/
  Verifying https://kzuget.blob.core.windows.net/nuget exists.
  Found https://kzuget.blob.core.windows.net/nuget
  https://kzuget.blob.core.windows.net/nuget/ is missing sleet files. Use 'sleet.exe init' to create a new feed.
  The command ""C:\Users\kzu\.nuget\packages\sleet\2.1.0\build\net46\..\..\tools\Sleet.exe" validate -s feed -c C:\Users\kzu\AppData\Local\Temp\tmp3B08.tmp" exited with code 1.
  "C:\Users\kzu\.nuget\packages\sleet\2.1.0\build\net46\..\..\tools\Sleet.exe" init -s feed -c C:\Users\kzu\AppData\Local\Temp\tmp3B08.tmp
  Initializing https://kzuget.blob.core.windows.net/nuget/
  Verifying https://kzuget.blob.core.windows.net/nuget exists.
  Found https://kzuget.blob.core.windows.net/nuget
  Pushing https://kzuget.blob.core.windows.net/nuget/autocomplete/query
  Compressing https://kzuget.blob.core.windows.net/nuget/autocomplete/query
  Pushing https://kzuget.blob.core.windows.net/nuget/index.json
  Compressing https://kzuget.blob.core.windows.net/nuget/index.json
  Pushing https://kzuget.blob.core.windows.net/nuget/sleet.packageindex.json
  Compressing https://kzuget.blob.core.windows.net/nuget/sleet.packageindex.json
  Pushing https://kzuget.blob.core.windows.net/nuget/search/query
  Compressing https://kzuget.blob.core.windows.net/nuget/search/query
  Pushing https://kzuget.blob.core.windows.net/nuget/sleet.settings.json
  Compressing https://kzuget.blob.core.windows.net/nuget/sleet.settings.json
  Successfully initialized https://kzuget.blob.core.windows.net/nuget/
```

And the subsequent Push, something like:

```
Push:
  "C:\Users\kzu\.nuget\packages\sleet\2.1.0\build\net46\..\..\tools\Sleet.exe" push "C:\Code\Personal\corebuild\updater\CoreBuild.Updater.1.0.0.nupkg" -f -s feed -c C:\Users\kzu\AppData\Local\Temp\tmp3B08.tmp
  Reading feed https://kzuget.blob.core.windows.net/nuget/
  Verifying https://kzuget.blob.core.windows.net/nuget exists.
  Found https://kzuget.blob.core.windows.net/nuget
  GET https://kzuget.blob.core.windows.net/nuget/index.json
  Decompressing https://kzuget.blob.core.windows.net/nuget/index.json
  Reading C:\Code\Personal\corebuild\updater\CoreBuild.Updater.1.0.0.nupkg
  Reading feed
  GET https://kzuget.blob.core.windows.net/nuget/sleet.settings.json
  Decompressing https://kzuget.blob.core.windows.net/nuget/sleet.settings.json
  GET https://kzuget.blob.core.windows.net/nuget/autocomplete/query
  Decompressing https://kzuget.blob.core.windows.net/nuget/autocomplete/query
  GET https://kzuget.blob.core.windows.net/nuget/sleet.packageindex.json
  GET https://kzuget.blob.core.windows.net/nuget/search/query
  Decompressing https://kzuget.blob.core.windows.net/nuget/sleet.packageindex.json
  Decompressing https://kzuget.blob.core.windows.net/nuget/search/query
  Reading existing package index
  Pushing CoreBuild.Updater 1.0.0
  Checking if package exists.
  Adding CoreBuild.Updater 1.0.0
  Committing changes to https://kzuget.blob.core.windows.net/nuget/
  Pushing https://kzuget.blob.core.windows.net/nuget/search/query
  Compressing https://kzuget.blob.core.windows.net/nuget/search/query
  Pushing https://kzuget.blob.core.windows.net/nuget/flatcontainer/corebuild.updater/index.json
  Compressing https://kzuget.blob.core.windows.net/nuget/flatcontainer/corebuild.updater/index.json
  Pushing https://kzuget.blob.core.windows.net/nuget/flatcontainer/corebuild.updater/1.0.0/corebuild.updater.1.0.0.nupkg
  Pushing https://kzuget.blob.core.windows.net/nuget/autocomplete/query
  Compressing https://kzuget.blob.core.windows.net/nuget/autocomplete/query
  Pushing https://kzuget.blob.core.windows.net/nuget/flatcontainer/corebuild.updater/1.0.0/corebuild.updater.nuspec
  Pushing https://kzuget.blob.core.windows.net/nuget/sleet.packageindex.json
  Compressing https://kzuget.blob.core.windows.net/nuget/sleet.packageindex.json
  Pushing https://kzuget.blob.core.windows.net/nuget/registration/corebuild.updater/1.0.0.json
  Compressing https://kzuget.blob.core.windows.net/nuget/registration/corebuild.updater/1.0.0.json
  Pushing https://kzuget.blob.core.windows.net/nuget/registration/corebuild.updater/index.json
  Compressing https://kzuget.blob.core.windows.net/nuget/registration/corebuild.updater/index.json
  Successfully pushed packages.
  ```

Your new feed is now available at https://[STORAGE_ACCOUNT].blob.core.windows.net/[STORAGE_CONTAINER]/index.json, 
such as https://kzuget.blob.core.windows.net/nuget/index.json in this example.

You can check the source at the [GitHub project](https://github.com/kzu/Sleet.Azure) 
which coincidentally is a nice simple example of a [corebuild](http://www.corebuild.io/) 
project that [creates its nuget package](https://github.com/kzu/Sleet.Azure/blob/master/build.proj) using [NuGetizer 3000](https://www.nuget.org/packages/NuGet.Build.Packaging) ;).


Happy nugeting!