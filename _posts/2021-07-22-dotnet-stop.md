---
title: "Clean cross-platform process shutdown for dotnet"
description: |
  How to cleanly shutdown processes in a cross-platform way by sending 
  Ctrl+C (SIGINT) instead of abruptly stopping them with Process.Kill.

tags: [dotnet, tools]
---

While developing [dotnet-evergreen]({% link _posts/2021-07-22-dotnet-evergreen.md %}), 
I needed to figure out a way to cleanly terminate a process in a cross-platform 
way without resorting to a (somewhat violent) `Process.Kill`.

In Ubuntu/macOS this was trivial and worked nicely by just running `kill -s SIGINT [ProcessId]` 
as a new process, as [documented on termination signals](https://www.gnu.org/software/libc/manual/html_node/Termination-Signals.html).

On Windows, this was far trickier. I read on [Ctrl+C an Ctrl+Break signals](https://docs.microsoft.com/en-us/windows/console/ctrl-c-and-ctrl-break-signals), 
on [GenerateConsoleCtrlEvent](https://docs.microsoft.com/en-us/windows/console/generateconsolectrlevent), 
looked at how [ASP.NET Core hosting](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.Extensions.Hosting/src/Internal/ConsoleLifetime.cs) 
handles its [application lifetime](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.Extensions.Hosting/src/Internal/ApplicationLifetime.cs), 
found (shocking!) [an answer on StackOverflow](https://stackoverflow.com/questions/813086/can-i-send-a-ctrl-c-sigint-to-an-application-on-windows/15281070#15281070), 
and determined that approach I needed was 
[FreeConsole](https://docs.microsoft.com/en-us/windows/console/freeconsole) ->  
[AttachConsole](https://docs.microsoft.com/en-us/windows/console/attachconsole) -> 
[GenerateConsoleCtrlEvent](https://docs.microsoft.com/en-us/windows/console/generateconsolectrlevent) then wait for [Process.HasExited](https://docs.microsoft.com/en-us/dotnet/api/system.diagnostics.process.hasexited).

Since this is somewhat involved and I wanted to make it cross-platform and easily 
reusable, I created the [dotnet-stop](https://www.nuget.org/packages/dotnet-stop/) 
tool which I can now depend on and invoke from any other dotnet tool. The whole tool 
fits nicely in a single [C# 9 top-level Program.cs](https://github.com/devlooped/dotnet-stop/blob/main/src/Program.cs).

On Windows, invoking a separate tool for this was unavoidable (as far as I could 
manage), since I couldn't re-acquire the console after signaling the external process, 
which left the calling tool in a broken state (wouldn't even respond to Ctrl+C at 
that point). But this was perfectly acceptable for my 
[dotnet-evergreen](https://www.nuget.org/packages/dotnet-evergreen/) scenario anyway.

Usage is trivial, with a couple options to tweak how the stopping is done:

```
dotnet-stop
  Sends the SIGINT (Ctrl+C) signal to a process to gracefully stop it.

Usage:
  dotnet stop [options] <id>

Arguments:
  <id>  ID of the process to stop.

Options:
  -t, --timeout <timeout>  Optional timeout in milliseconds to wait for the process to exit.
  -q, --quiet              Do not display any output. [default: False]
  --version                Show version information
  -?, -h, --help           Show help and usage information
```
