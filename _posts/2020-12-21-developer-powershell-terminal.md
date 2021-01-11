---
title: "Shareable Windows Terminal profile for installed Visual Studio Developer PowerShell"
description: "How to configure Windows Terminal with profiles that work on any machine to launch Visual Studio Developer Powershell using installed version(s)."
tags: [code]
---

As [I mentioned in another post](/code-developer-powershell-prompt.html), Visual Studio now provides a [Developer PowerShell](https://devblogs.microsoft.com/visualstudio/the-powershell-you-know-and-love-now-with-a-side-of-visual-studio/) 
command prompt shortcut, which is super useful since it has all the environment variables properly set up to do 
things like `msbuild` from command line and have it pick the "right" MSBuild, as well as launching VS by just typing `devenv`. There is a not-so-minor drawback to these shortcuts though: they hardcode the VS installation ID, so just copy/pasting the command line in your Windows Terminal profile won't roam nicely across machines:

```
C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe -noe -c "&{Import-Module """C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\Common7\Tools\Microsoft.VisualStudio.DevShell.dll"""; Enter-VsDevShell 67c816dd}"
```

In addition, it hardcodes launching the old, non-cross-platform Powershell included in Windows.

So I figured I would combine the approach in that [blog post](/code-developer-powershell-prompt.html) with [dotnet-vs](https://github.com/devlooped/dotnet-vs) to have a flexible and "forwards compatible" profile that will just launch the developer powershell for whichever version of VS you have installed, both for stable and preview versions of VS.

First step is installing [dotnet-vs](https://github.com/devlooped/dotnet-vs):

```
dotnet tool install -g dotnet-vs
```

The tool can do a *ton* of things with your VS installations, but we'll just focus on how it surfaces the [vswhere](https://github.com/Microsoft/vswhere) tool. To get your installed VS versions, you just run `vs where`. To get one specific property from the located VS, you run, for example `vs where -prop=InstallationPath`:

```
❯ vs where -prop=InstallationPath
C:\Program Files (x86)\Microsoft Visual Studio\2019\Community
C:\Program Files (x86)\Microsoft Visual Studio\2019\Preview
C:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools
```

In my case, I have two versions, plus a build tools SKU too. If we just want the stable release of the full Visual Studio, we can instead run:

```
❯ vs where release -prop=InstallationPath
C:\Program Files (x86)\Microsoft Visual Studio\2019\Community
```

The added `release` argument filters only stable VS versions. If you have more than one stable release installed, you can also pass in `-first` and you'll just pick whichever is returned first. Finally, you can pass in `preview` instead of `release` and get the preview version (if any).

Armed with this, we can now build the command line to use for launching Powershell 7 (formerly Core). 

The `Enter-VsDevShell` powershell command provided by the `Microsoft.VisualStudio.DevShell.dll` shown in the built-in shortcut for *Developer Powershell* shows the following help (run after starting a regular developer powershell from the provided shortcut):

```
❯ Enter-VsDevShell -?

NAME
    Enter-VsDevShell

SYNTAX
    Enter-VsDevShell -VsInstallPath <string> [-SkipExistingEnvironmentVariables] [-StartInPath <string>] [-DevCmdArguments <string>] [-DevCmdDebugLevel {None | Basic | Detailed | Trace}]
    [-SkipAutomaticLocation] [-SetDefaultWindowTitle] [-ReportNewInstanceType {PowerShell | Cmd | LaunchScript}]  [<CommonParameters>]
```

Fortunately for us, we can pass in a `-VsInstallPath` instead of the installation ID! **And** we can get that install path dynamically for the current machine using `vs where` as shown above. Nice :)

So our profile entry (open with `Ctrl+,` or via the Settings menu in Windows Terminal) looks something like this:

```json
{
    "guid": "{SOME_GUID}",
    "name": "Dev",
    "commandline" : "pwsh -noe -c \"&{ $dev=(vs where release -first -prop=InstallationPath); Write-Host Using $dev; Import-Module ($dev + '\\Common7\\Tools\\Microsoft.VisualStudio.DevShell.dll'); Enter-VsDevShell -VsInstallPath $dev"
},
```

You can optionally also pass `-StartInPath` to always open in your preferred code directory. You can add another entry for each of your VSes, by just tweaking the `vs where` arguments. I have another with `preview` instead of `release` and that's it.

I usually also set a different background to quickly know which one I'm on, with `"background" : "#011a3d"`, say.





See also [Customizing Windows Terminal with Visual Studio tabs](/devenv-terminal.html).

Enjoy!
