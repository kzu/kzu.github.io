---
title: "Developer PowerShell Core Prompt in Visual Studio Code Integrated Terminal"
description: "How to configure the VS Code integrated terminal to launch into a VS developer PowerShell Core prompt by default."
tags: [code]
---

Visual Studio recently got a new [Developer PowerShell](https://devblogs.microsoft.com/visualstudio/the-powershell-you-know-and-love-now-with-a-side-of-visual-studio/) 
command prompt, which is super useful since it has all the environment variables properly set up to do 
things like `msbuild` from command line and have it pick the "right" MSBuild.

As a follow up to my post on [Developer Command Prompt in Visual Studio Code Integrated Terminal](http://www.cazzulino.com/code-developer-command-prompt.html), 
this is how you get the new powershell prompt in VS Code. 

This time, however, I'll add a twist: I recently learned that you can get [PowerShell Core](https://github.com/PowerShell/PowerShell) 
installed as a [.NET Global Tool](https://devblogs.microsoft.com/powershell/introducing-powershell-as-net-global-tool/), which makes 
it super easy to install and run even on CI machines. You will want to get at least version 7.0.0-rc.1 to get a [key fix](https://github.com/PowerShell/PowerShell/pull/10461): 

```
dotnet tool update -g --version 7.0.0-rc.1 PowerShell
```

> NOTE: yes, `update` will also `install` if it's not installed. And it will ensure at least that 
> version is installed. If you want to use this in CI, you will want to make sure the command never 
> returns an error code by appending `>nul || dotnet tool list -g`, say.

> NOTE2: you'll need at least .NET Core 3.1 for that version of the powershell global tool to work.

Now that you have the `pwsh` dotnet global tool, let's configure it for VS Code to use by default 
in a Windows terminal. Open `File | Preferences | Settings` and click the very undiscoverable `Open Settings (JSON)` 
icon at the top-right of your window, right next to the left of the Split Editor icon, and add the following 
lines:

```
    "terminal.integrated.shell.windows": "${env:USERPROFILE}\\.dotnet\\tools\\pwsh.exe",
    "terminal.integrated.shellArgs.windows": 
    [
        "-noe",
        "-c",
        "\"&{Import-Module '${env:PROGRAMFILES(x86)}\\Microsoft Visual Studio\\2019\\Preview\\Common7\\Tools\\Microsoft.VisualStudio.DevShell.dll'; Enter-VsDevShell 0c9b3655}\""
    ],
    "terminal.integrated.automationShell.windows": null,
```

Things to note:

1. You can access environment variables in your settings by just using `${env:}`. .NET Core global 
   tools live in that folder shown above
2. The fancy looking `Import-Module` contains the install directory for your VS, so it will typically be 
   `...\\2019\\[Enterprise|Professional|Communit|Preview]`, unless you customize it at install time.
3. That final string argument to `Enter-VsDevShell` is specific to your local installation. To get the 
   value, right-click your new `Developer PowerShell for VS 2019` start menu entry that Visual Studio provides 
   and select `Open file location`. Then right-click again the shortcut file that's automatically selected 
   for you and select `Properties`. The magic string will be at the end of the `Target` property for the 
   shortcut.
4. The last line resets the [settings for automation shells](https://code.visualstudio.com/Docs/editor/tasks#_can-a-task-use-a-different-shell-than-the-one-specified-for-the-integrated-terminal)
   (i.e. running tasks), so that we don't interfere with them.


Like in my [previous post](http://www.cazzulino.com/code-developer-command-prompt.html), I still find the following 
two settings useful, if you want the same cursor style and blinking in the terminal as in the editor:

```
    "terminal.integrated.cursorBlinking": true,
    "terminal.integrated.cursorStyle": "line",
```

Finally, the default `Ctrl+K` keybinding to clear the terminal window won't work in `cmd.exe`, just rendering 
a useless `^K`, so I also set it to `Ctrl+Shift+K` instead via the `File | Preferences | Keyboard Shortcuts` 
menu by adding the following:

```
[
    {
        "key": "ctrl+shift+k",
        "command": "workbench.action.terminal.clear",
        "when": "terminalFocus"
    }
]
```

Enjoy!
