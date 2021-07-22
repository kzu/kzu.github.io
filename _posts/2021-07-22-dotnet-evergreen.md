---
title: "Running evergreen version of a dotnet tool"
description: |
  dotnet global tools are an awesome way of packaging (in a cross-platform way) 
  little bits of functionality you need to easily deploy to users or CI. When 
  the tools are long-running, though, there is no built-in way to check for 
  updates and restart the tool as needed. This post shows one way to do it 
  reliably in all supported dotnet platforms.
tags: [dotnet, tools]
---

I've been doing quite a few [dotnet global tools](https://www.nuget.org/packages?packagetype=dotnettool&q=kzu&prerel=true) 
and had a need for a long-running tool to update itself over time, as updates 
are pushed to a nuget feed. 

This is tricky, since you cannot update a tool that is currently running 
(`dotnet update` will try to uninstall the existing version and that will 
fail since the tool will be running). You could resort to starting an 
external process with a shell script that would wait for the tool process 
to exit, then run `dotnet update` and then launch the tool again, but 
you would lose the current terminal, for example, and it's quite ad-hoc 
and looks messy.

What I really wanted was something as close to *dotnet native* as possible.
Kind of like `dotnet watch`, but that watches for updates and restarts the 
tool. So [dotnet-evergreen](https://www.nuget.org/packages/dotnet-evergreen/) 
was born.

## dotnet evergreen

Let's say you need to run [dotnet-tor](https://www.nuget.org/packages/dotnet-tor/) 
and want it to self-update as new versions are published. With `dotnet-evergreen` 
this is trivial:

```
> dotnet evergreen dotnet-tor
```

If the tool being run is not installed, `evergreen` will automatically 
install it on first run, then monitor for changes as long as the tool 
continues to run. Since no parameters have been provided, changes will be 
polled from the nuget.org feed. This can be overriden to point to a custom 
feed. I use the offitial [NuGet.Protocol](https://www.nuget.org/packages/NuGet.Protocol) 
for this.

Here you can see side by side [dotnet-echo](https://www.nuget.org/packages/dotnet-echo/) 
running via `evergreen` on Windows and [dotnet-tor](https://www.nuget.org/packages/dotnet-tor/)
running on Ubuntu:

<video src="https://user-images.githubusercontent.com/169707/126715420-991ad821-9ac8-4b66-b79e-e0966e0f3a89.mp4" controls="controls" style="max-width: 730px;">
</video>

Note how the output, even the fancy progress under Ubuntu, is properly displayed. 

The tool usage is mostly self explanatory:

```
dotnet evergreen
  Run an evergreen version of a tool

Usage:
  dotnet evergreen [options] [<tool> [<args>...]]

Arguments:
  <tool>  Package Id of tool to run.
  <args>  Additional arguments and options supported by the tool

Options:
  -s, --source <source>      NuGet feed to check for updates. [default: https://api.nuget.org/v3/index.json]
  -i, --interval <interval>  Time interval in seconds for the update checks. [default: 5]
  -q, --quiet                Do not display any informational messages.
  -?, -h, --help             Show help and usage information
  --version                  Show version information
```

Any options for `evergreen` come *before* the `tool` argument, and all arguments 
after that are passed as-is to the tool. The tool *command* doesn't need to 
match the package id. Internally, `evergreen` will lookup the installed tool by 
package id and execute the actual command provided by it, as shown when you 
run `dotnet tool list -g` manually.

When the tool needs to be restarted for updates, I use 
[dotnet-stop]({% link _posts/2021-07-22-dotnet-stop.md %}), which properly signals 
`Ctrl+C` (or `SIGINT`) to it and waits for termination, so the tool can properly 
shutdown just as if the user had hit `Ctrl+C` himself.