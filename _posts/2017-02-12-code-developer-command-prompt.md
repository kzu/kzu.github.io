---
title: "Developer Command Prompt in Visual Studio Code Integrated Terminal"
description: "How to configure the VS Code integrated terminal to launch into a VS developer command prompt by default."
tags: [code]
---

Just add the following two settings:

```
    "terminal.integrated.shell.windows": "cmd.exe",
    "terminal.integrated.shellArgs.windows": [
        "/k ""C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\Tools\\VsDevCmd.bat"""
    ]
```

The editor will show red squiglies for the "funny" quoting of the VsDevCmd.bat path, but it's the right one.

Also, adjust the VS install path to your version/edition of Visual Studio.

Back to coding...