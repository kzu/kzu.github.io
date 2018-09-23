---
title: "Developer Command Prompt in Visual Studio Code Integrated Terminal"
description: "How to configure the VS Code integrated terminal to launch into a VS developer command prompt by default."
tags: [code]
---

Just add the following two settings via `File | Preferences | Settings`:

```
    "terminal.integrated.shell.windows": "cmd.exe",
    "terminal.integrated.shellArgs.windows": [
        "/k", "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\Tools\\VsDevCmd.bat"
    ]
```

Also, adjust the VS install path to your version/edition of Visual Studio.

You may also find these two settings useful, if you want the same cursor style and blinking in the terminal 
as in the editor:

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

Back to coding...
