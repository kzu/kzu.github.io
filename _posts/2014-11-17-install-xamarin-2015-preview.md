---
title: "Installing Xamarin for Visual Studio 2015 Preview"
excerpt: |
    If you currently have a previous version of Xamarin installed, you may not get the 2015 bits 
    automatically when installing the new alpha for VS2015 Preview. Here's how to ensure it's properly installed.
tags: xamarin
---
By now you probably got the blurb of last week's Microsoft announcements:

[Microsoft Takes .NET Open Source And Cross-Platform](http://techcrunch.com/2014/11/12/microsoft-takes-net-open-source-and-cross-platform/)
> TechCrunch - Frederic Lardinois
“Unsurprisingly, the company plans to work with the Xamarin-sponsored Mono community, which already produces a cross-platform open source .NET framework based on C#. “We will announce this and then take the next few months working with the Mono community,” Somasegar told me. “We are working very closely with the Xamarin guys on this.”

[With .NET turnaround, Microsoft wants to create ‘one big family’ with open-source community](http://www.geekwire.com/2014/net-turnaround-microsoft-finally-peace-open-source/)
> GeekWire - Todd Bishop
"Miguel is still the man!” said an enthusiastic S. “Soma” Somasegar, the corporate vice president in charge of Microsoft’s Developer Division.  Somasegar made the comments in an interview discussing the company’s plan to open-source .NET and make it possible to use Microsoft’s developer technologies to make software for — you guessed it — Mac, Linux, Android and iOS. Microsoft is working on the initiative with the Mono community and the startup Xamarin, which de Icaza co-founded.”

[Microsoft open-sources server-side .Net, launches Visual Studio 2015 preview](http://www.infoworld.com/article/2846450/microsoft-net/microsoft-open-sources-server-side-net-launches-visual-studio-2015-preview.html)
> InfoWorld - Simon Bisson 
"This doesn’t mean the work on cross-platform client-side .Net will stop. “We’re going to continue partnering deeply with Xamarin,” Somasegar says. That’s borne out by the upcoming release of Visual Studio, which will make it easier to add Xamarin tools to support iOS and Android development alongside Windows apps."

As a testament of our close collaboration with Microsoft, we shipped same-day support for Android Native C++ projects in VS 2015, as well as deep integration with Microsoft's Hyper-V based Android Emulator. 

The experience basically is that now in VS 2015 you have two new templates for Android and iOS:

![New Android App](https://www.cazzulino.com/img/mspreview-breadcrumb-Android.png)

![New iOS App](https://www.cazzulino.com/img/mspreview-breadcrumb-iOS.png)

Launching any of those two templates will create a project that is like an introduction to the product and links to download it (similar to what the Azure templates do when you don't have Azure SDK installed):

![Install Xamarin](https://www.cazzulino.com/img/mspreview-breadcrumb-install.png)

Now you can just click that download button, and get the new integration for 2015!

If you happened to have a previous version of Xamarin for Visual Studio installed, please keep reading as you may not have gotten the 2015 bits installed by default (it's something we're fixing shortly).

## Ensuring 2015 support is installed (only for previous Xamarin users)

By default, Windows Installer will just update the components you have previously installed, when applying an update. Since you previously didn't have 2015 components installed, then by default you won't be getting them installed right now. (we're fixing that soon-ish).

Don't worry, you don't have to go download anything again, here are the easy steps to ensure you turn the bits on for 2015:

1 - Go to Add/Remove programs and search for Xamarin:

![Add/Remove Xamarin](https://www.cazzulino.com/img/mspreview-change.png)

2 - Click Next on the installer window and select Change on the next screen:

![Change MSI](https://www.cazzulino.com/img/mspreview-change-msi.png)

3 - Finally, make sure you check and install locally the Visual Studio 2015 feature:

![Install 2015 Feature](https://www.cazzulino.com/img/mspreview-change-check.png)


After the installer is done applying your changes, the old "starter" templates will be gone and you'll be greeted with a bunch of template that you're surely familiar with already (since this section applies to existing users only ;)). 

In a future post I'll delve a bit more on how we're integrating with Microsoft C++ Android Native projects (hint: you can just add a project reference! ;)).

Enjoy!