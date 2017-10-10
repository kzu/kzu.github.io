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

All you need to provide are the following properties:


```xml
   <!-- Azure storage access key for the connection -->
   <StorageAccessKey Condition="'$(StorageAccessKey)' == ''" />
   <!-- Azure storage account to use (aka "the sub-domain" in *.blob.core.windows.net or *.azureedge.net for the CDN endpoint) -->
   <StorageAccount Condition="'$(StorageAccount)' == ''" />
   <!-- Azure storage container name where the feed will be stored (aka "the folder") -->
   <StorageContainer Condition="'$(StorageContainer)' == ''" />
```

Then the packages you intend to push:

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

You can check the source at the [GitHub project](https://github.com/kzu/Sleet.Azure) 
which coincidentally is a nice simple example of a [corebuild](http://www.corebuild.io/) 
project that [creates its nuget package](https://github.com/kzu/Sleet.Azure/blob/master/build.proj) using [NuGetizer 3000](https://www.nuget.org/packages/NuGet.Build.Packaging) ;).


Happy nugeting!