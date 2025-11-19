---
layout: post
title: "Streamlining Remote C# Scripts with .NET 10 runfile"
description: "Run C# scripts directly from remote git repositories with the new runfile global tool."
tags: [code, dotnet, csharp, script]
---

> TL;DR: Run remote scripts instantly with the ref format `[host/]owner/repo[@ref][:path]`.
> 
> ```shell
> dnx runfile kzu/run:clean.cs
> ```

With .NET 10, we are seeing continued improvements in how we can run C# code directly. The new `runfile` feature allows for a more streamlined execution of local C# files, making it easier than ever to treat C# as a scripting language.

## The Problem: Sharing Scripts

However, what if your scripts aren't local? What if you want to share useful utility scripts across your team or the world without requiring everyone to clone a repository or copy-paste code?

Enter the **runfile** global tool.

## The Solution: `dnx runfile`

I created the [runfile](https://github.com/devlooped/runfile) global tool to bridge the gap between local execution and remote collaboration. It streamlines running files directly from remote git repositories, whether they are on GitHub, GitLab, or Azure DevOps.

Key features include:
*   **Remote Execution**: Run scripts directly from a URL or repository reference.
*   **Private Repositories**: Seamlessly works with private repositories using your existing Git Credential Manager authentication.
*   **Gist Support**: Run scripts directly from GitHub Gists.
*   **Caching**: Downloads are cached using ETags, so you don't pay the network cost on every run.

## A Concrete Example: Recursive Cleanup

To demonstrate how useful this can be, let's look at a common problem: cleaning up `bin` and `obj` folders recursively in a project. I've documented this script in my [run repository](https://github.com/kzu/run?tab=readme-ov-file#clean-binobj-recursively).

Instead of remembering a complex PowerShell or Bash command, you can simply run:

```bash
dnx runfile kzu/run:clean.cs
```

This command fetches the `clean.cs` script from the `main` branch of the `kzu/run` repository and executes it.

Here is the full source code of the script, which uses `Spectre.Console` for nice output and `ConsoleAppFramework` for argument parsing:

```csharp
// Cleans bin/obj recursively
#:package Spectre.Console@0.51.*
#:property Nullable=enable
#:property ImplicitUsings=enable
#:package ConsoleAppFramework@5.*

using Spectre.Console;
using ConsoleAppFramework;

ConsoleApp.Run(args, () => DeleteDirectories(Directory.GetCurrentDirectory()));

static void DeleteDirectories(string dir)
{
    // Delete bin and obj in current directory
    TryDeleteDirectory(Path.Combine(dir, "bin"));
    TryDeleteDirectory(Path.Combine(dir, "obj"));

    // Recurse into subdirectories
    foreach (string subDir in Directory.GetDirectories(dir))
    {
        DeleteDirectories(subDir);
    }
}

static void TryDeleteDirectory(string dir)
{
    if (Directory.Exists(dir))
    {
        try
        {
            Directory.Delete(dir, true);
            AnsiConsole.MarkupLine($":check_mark_button: .{dir.Substring(Directory.GetCurrentDirectory().Length)}");
        }
        catch (Exception ex)
        {
            AnsiConsole.MarkupLine($":cross_mark: .{dir.Substring(Directory.GetCurrentDirectory().Length)}: {ex.Message}");
        }
    }
}
```

        }
    }
}

## Aliasing

If you run a script frequently, you don't want to type the full repository reference every time. `runfile` supports aliasing:

```bash
dnx runfile --alias clean kzu/run:clean.cs
```

Now you can simply run:

```bash
dnx runfile clean
```

This script demonstrates the power of single-file C# programs. It declares its own dependencies (like `Spectre.Console`) and properties, making it self-contained and easy to share.

Give `runfile` a try and start sharing your C# scripts with the world!

Enjoy!
