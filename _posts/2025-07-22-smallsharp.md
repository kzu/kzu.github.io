---
title: "SmallSharp 2.0: The End of ConsoleApplication128"
description: ".NET 10 can run standalone C# files now. Wouldn't it be awesome if you could edit them in Visual Studio with the full power of its editor and ebugger? Moreover, wouldn't it be awesome to be able to keep multiple such files in a SINGLE project and just select the startup one and have package references and MSBuild properties automatically figured out from its #:package and #:property directives? This is precisely what SmallSharp allows. Read on to learn more!"
tags: [dotnet, visualstudio]
---

# SmallSharp 2.0: The End of ConsoleApplication128

## The New Era: `dotnet run app.cs`

With .NET 10, you can now run a single C# file directly:

```sh
dotnet run app.cs
```

No project file, no ceremony. Just write your code and go. You can even add NuGet packages or MSBuild properties right in your `.cs` file:

```csharp
#:package Humanizer@2.14.1
#:property LangVersion preview

using Humanizer;

var dotNet9Released = DateTimeOffset.Parse("2024-12-03");
var since = DateTimeOffset.Now - dotNet9Released;
Console.WriteLine($"It has been {since.Humanize()} since .NET 9 was released.");
```

For more, check out [Microsoft's announcement](https://devblogs.microsoft.com/dotnet/announcing-dotnet-run-app/).

## The Problem: One File, Limited Experience

While this is a huge leap for C#, editing these files in VS Code is still a bit rough. You miss out on the full Visual Studio experience: rich debugging, refactoring, and all the productivity features that make C# shine. And if you try to use these files in Visual Studio, you’re limited to a single top-level program per project, and those handy `#:package` and `#:property` directives are not even valid (as of today ;)).

SmallSharp has supported multiple top-level files for a while now, but dependency management was a pain: you ended up with one project 
containing the aggregate dependencies of EVERY top-level program. Nevermind if you needed incompatible ones...

## Enter SmallSharp: Multiple Files, Full Power

This is where [SmallSharp](https://github.com/devlooped/SmallSharp) 2.0 comes in. SmallSharp lets you:

- Add as many top-level C# files as you want to a single project
- Use `#:package` and `#:property` directives in each file for isolated dependencies and build customization
- Switch the startup file from the Visual Studio Start button dropdown
- Enjoy full IDE support: debugging, IntelliSense, refactoring, and more

![Start Button Dropdown](https://raw.githubusercontent.com/devlooped/SmallSharp/main/assets/img/launchSettings.png)

No more shuffling files or commenting out code. Just pick the file you want to run, and SmallSharp takes care of the rest.

### Perfect for Learning and API Experimentation

If you’ve ever used tools like RoslynPad or LinqPad, you know how liberating it is to just open a new tab, paste some code, and see what happens—no project setup, no dependency juggling. SmallSharp brings that same spirit to Visual Studio, but with the full power of the IDE and the ability to persist your experiments as real files in your repo.

Want to try out a new NuGet package? Just add a `#:package` directive at the top of your file and start coding. Curious how a new API works? Spin up a new `.cs` file, play around, and keep your experiments organized alongside your main codebase. Each file is its own little playground, with its own dependencies and build settings, so you can experiment freely without breaking anything else.

This makes SmallSharp a fantastic tool for:

- Learning new APIs or .NET features in isolation
- Prototyping ideas without polluting your main project
- Keeping a library of code snippets, utilities, or “what if?” explorations

All with the safety net of version control and the productivity of Visual Studio. It’s like having RoslynPad or LinqPad, but native to your workflow and always ready for real-world use.



## How It Works

SmallSharp leverages MSBuild magic to:

- Exclude all `.cs` files from compilation by default
- Only include the selected file as `<Compile>`
- Restore NuGet packages and set MSBuild properties based on the selected file’s directives
- Keep the Start button dropdown in sync as you add or remove files

![Run Humanizer File](https://raw.githubusercontent.com/devlooped/SmallSharp/main/assets/img/runfile1.png)

You can even share code between your top-level programs by placing shared files in subdirectories—they’ll be included as normal compile items.

## Directives in Action

Here’s how you can use the new directives:

**Add a NuGet package:**

```csharp
#:package Humanizer@2.14.1
```

**Set an MSBuild property:**

```csharp
#:property LangVersion preview
```

**Full example:**

```csharp
#:package Newtonsoft.Json@13.0.3
#:property DefineConstants DEBUG;TRACE

using Newtonsoft.Json;

var obj = new { Name = "SmallSharp", Version = "2.0.0" };
Console.WriteLine(JsonConvert.SerializeObject(obj));
```


## Beyond One File: Organize and Experiment

With SmallSharp, you can keep all your experiments, scripts, and utilities together in a single project. Each file can have its own dependencies and build settings, and you can switch between them instantly. No more “ConsoleApplication128” cluttering your solution!

![Run MCP File](https://raw.githubusercontent.com/devlooped/SmallSharp/main/assets/img/runfile2.png)

---

## Try It Out

To get started, just add SmallSharp to your project as an SDK:

```xml
<Project Sdk="Microsoft.NET.Sdk">
   <Sdk Name="SmallSharp" Version="2.0.0" />
   <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net10.0</TargetFramework>
   </PropertyGroup>
</Project>
```

Or as a package reference:

```xml
<Project Sdk="Microsoft.NET.Sdk">
   <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net10.0</TargetFramework>
   </PropertyGroup>
   <ItemGroup>
      <PackageReference Include="SmallSharp" Version="*" />
   </ItemGroup>
</Project>
```

Then just add your `.cs` files, use the directives, and enjoy the freedom!



## The End of ConsoleApplication128

SmallSharp 2.0 is the smoothest way to go from “what if?” to “it works!”—with all your ideas in one place, and the full power of Visual Studio at your fingertips. Give it a try, and finally retire that ConsoleApplication128 for good.

---

## A Note on Open Source Maintenance Fee (OSMF)

If you’re using SmallSharp in a revenue-generating organization, you’ll notice that the project now requires an [Open Source Maintenance Fee (OSMF)](https://opensourcemaintenancefee.org/). OSMF is a new model for sustaining open source projects: the code remains MIT-licensed and freely available, but organizations that use it to generate revenue are expected to pay a modest monthly fee. This helps ensure the long-term health and support of the project (and all other Devlooped projects!), while keeping it accessible to individuals, fellow open-source enthusiasts, students, and non-commercial users.

You can read more about the philosophy and details behind OSMF at [opensourcemaintenancefee.org](https://opensourcemaintenancefee.org/). In short, it’s about making open source more sustainable for maintainers, without resorting to restrictive licenses or dual-licensing.

If you’ve followed my work, you might know I previously tried a similar approach with [SponsorLink](https://www.devlooped.com/SponsorLink/), which automatically checked for sponsorships to unlock features. While SponsorLink hasn’t really taken off so far, I’m giving OSMF a try as a more transparent and community-friendly alternative.

If your company benefits from SmallSharp, please consider supporting its continued development through [GitHub Sponsors](https://github.com/sponsors/devlooped) and the OSMF. It makes a real difference!


SmallSharp FTW!

![SmallSharp Icon](https://raw.githubusercontent.com/devlooped/SmallSharp/main/assets/img/icon-32.png)