---
title: "dotnet actions: C# scripting to the rescue"
description: "Ever since C# introduced top-level programs, I've been wanting a full end-to-end scripting experience leveraging all of .NET's capabilities, including NuGet packages, SDKs, Visual Studio for editing, etc. With the goodies in .NET 10 SDK, it's finally possible!"
tags: [dotnet visualstudio github]
---

What a monumental release for .NET scripting is .NET 10! The long journey that started with 
[C# 9 top-level programs](https://devblogs.microsoft.com/dotnet/c-9-0-on-the-record/#top-level-programs) 
has finally culminated in a full-fledged scripting experience that leverages the entire .NET ecosystem in 
.NET 10:

1. [File-based apps](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/file-based-programs) go beyond just C# statements and now supports `#:sdk`, `#:package` and `#:property`
   directives that allow the full breadth of .NET SDKs and NuGet packages to be used in scripts without 
   the need for a project file.
2. [SmallSharp](https://github.com/devlooped/SmallSharp) is a tiny NuGet package / MSBuild SDK that 
   teaches Visual Studio how to edit multiple file-based apps in a single project, using the complete capabilities 
   of the IDE, including IntelliSense, debugging, refactoring, etc.
3. [dnx tool execution](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/sdk#the-new-dnx-tool-execution-script) allows running tools without having to first install them, npx-style.
4. [runcs](https://github.com/devlooped/runcs) is a tiny CLI tool that makes it easy to run (and auto-update) 
   file-based apps hosted on GitHub, GitLab and Azure DevOps.

This means that with the .NET 10 SDK, you can run the following [sample script](https://github.com/devlooped/actions/blob/main/hello.cs) 
without any prior setup:

```csharp
#:package Spectre.Console@0.50.*
using System.Runtime.InteropServices;
using System.Text;
using static Spectre.Console.AnsiConsole;

// Ensure even the dev console on Windows can display UTF-8 characters.
if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
    System.Console.InputEncoding = System.Console.OutputEncoding = Encoding.UTF8;

MarkupLine("[blue]Hello[/] :globe_showing_americas:!");
```

And since the source for it is [hosted on GitHub](https://github.com/devlooped/actions/blob/main/hello.cs), you 
can simply run it with:

```bash
dnx runcs devlooped/actions@main:hello.cs
```

This will download the script, restore its dependencies, compile it and run it, all in one go! And
the next time you run it, it will check for updates and download the latest version if available.

> This is something that might be supported out of the box by `dnx` in the future:
> [![dnx gh maybe](https://raw.githubusercontent.com/kzu/kzu.github.io/main/img/dotnet-actions-refs.png)](https://x.com/ChetHusk/status/1945258449933074881)


This is a game-changer for automation and scripting with .NET, as it combines the best of both worlds:
- The simplicity and ease of use of scripting languages like PowerShell, Python or Bash.
- The power and versatility of a full-fledged programming language like C# and the .NET ecosystem
- The productivity and convenience of modern IDEs like Visual Studio.

![start button](https://raw.githubusercontent.com/devlooped/SmallSharp/main/assets/img/launchSettings.png)

I have done my share of [GitHub Actions](https://github.com/orgs/devlooped/repositories?q=actions-) and 
I'm totally willing to sacrifice the [Marketplace](https://github.com/marketplace?type=actions) visibility 
for the extreme simplicity of just invoking a C# script from a repo from my GitHub workflows.

But for quickly sharing little programs with friends and colleagues, it's also a great way to avoid 
having to create a nuget package, push to nuget.org, only so they can run `dnx mytool` and have it 
auto-update whenever I push a new version. The combination of `dnx`, `runcs` and file-based apps is a
killer combo for sharing code snippets that just work and stay up-to-date.

I have blogged on [SmallSharp](https://www.cazzulino.com/smallsharp.html) before when I released 2.0. 
The latest 2.1 release extends support for file-based apps by also supporting the `#:sdk` directive, 
which means you can now use any .NET SDK in your scripts, not just the default one. It requires switching 
to using SmallSharp as an SDK though:

```xml
<Project Sdk="SmallSharp/2.1.0">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>preview</LangVersion>
  </PropertyGroup>

</Project>
```

Exciting times for all .NET developers and enthusiasts! Happy C# scripting 🚀