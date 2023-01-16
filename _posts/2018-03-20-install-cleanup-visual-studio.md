---
title: "How To Install and Cleanup Visual Studio 2017 Instances"
excerpt: |
    Visual Studio 2017 allows multiple side by side installations, which 
    makes experimenting with various versions and extensions a breeze. Here's how you quickly 
    and easily install and optionally cleanup so-called 'instances' that may have become broken 
    for whatever reason.
image: https://www.cazzulino.com/img/multiple-vs.jpg
tags: [visualstudio]
---

Visual Studio 2017 allows multiple side by side installations, which 
makes experimenting with various versions and extensions a breeze:

<a href="https://www.cazzulino.com/img/multiple-vs.jpg"><img alt="multiple visual studio in my start menu" src="https://www.cazzulino.com/img/multiple-vs.jpg" width="400" /></a>

To install those multiple IDEs, you simply head over to http://visualstudio.com, grab 
each of the editions you want to test and just run the installers. 

> NOTE: you can install one of each VS editions (Community, Professional and Enterprise) 
> as well as one of each VS editions from the Preview "channel" from http://visualstudio.com/preview, 
> for a total of potentially up to *6* instances to play with!

Uninstalling, modifying or even launching the instances is trivial from 
the `Visual Studio Installer` UI:

<a href="https://www.cazzulino.com/img/vs2017-installer.png"><img alt="multiple visual studio in my start menu" src="https://www.cazzulino.com/img/vs2017-installer.png" width="450" /></a>

Sometimes, however, the installer may not be able to modify, repair or even uninstall 
a given instance. This may happen when adding/removing VSIXes that mess up the so-called 
`catalog` that drives the VS installer.

Fortunately, VS provides a tool, called [vswhere](https://blogs.msdn.microsoft.com/heaths/2017/04/21/vswhere-is-now-installed-with-visual-studio-2017/) which can give you [comprehensive information](https://blogs.msdn.microsoft.com/heaths/2017/02/25/vswhere-available/) about all installed instances.

With it and a bit of powershell, I came up with the following script to allow you to 
easily cleanup any misbehaving VS instance:

<script src="https://gist.github.com/kzu/91aaea46c020abe52bb21881be88597b.js?file=vscleanup.ps1"></script>

If you want to run it from any Powershell prompt, you can add the following to your 
[powershell profile](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_profiles?view=powershell-6):

<script src="https://gist.github.com/kzu/91aaea46c020abe52bb21881be88597b.js?file=Microsoft.Powershell_profile.ps1"></script>

Running the `Cleanup-VS` from a prompt will show you something like the following:

```
C:\Windows\System32> Cleanup-VS
Installed instances:
[0] Visual Studio Community 2017  - 15.6.1 Preview 1.0                 at C:\Program Files (x86)\Microsoft Visual Studio\External\Pre\Community
[1] Visual Studio Enterprise 2017 - 15.6.3                             at C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise
[2] Visual Studio Enterprise 2017 - 15.7.0 Preview 2.0 [27517.0.d15.7] at C:\Program Files (x86)\Microsoft Visual Studio\External\IntPre

Enter index of instance to cleanup: 
```

After entering the instance index to clean up, and provided you're running as an administrator,
the entire installation folder *and* the instance data will be deleted. I have only neeeded
this sporadically, but I keep forgetting what to delete from where, so I just scripted it 
once and for all!


Enjoy :)