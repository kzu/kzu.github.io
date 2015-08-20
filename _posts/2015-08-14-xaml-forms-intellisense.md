---
title: "How to disable Xamarin Forms XAML Intellisense in VS 2015"
description: "What's going on with XF XAML intellisense in VS 2015, and why you may need to disable it until Udpate 1"
layout: post
tags: programming, xamarin, forms, vs2015
---
Straight answer first just in case you're in a hurry:

1. Rename `C:\Program Files (x86)\Microsoft Visual Studio 14.0\Common7\IDE\Extensions\Xamarin\Xamarin\[VERSION]\static.14.pkgdef` to `static.14.pkgundef`
2. Rename the `static.14.pkgdef` to `static.14.pkgundef` in the `extension.vsixmanifest` in the same directory 
2. Run `devenv /updateconfiguration`

In addition to this manual workaround, we'll post an updated Xamarin.Forms pre-release nuget package that won't provide the design assemblies to XAML and will stop the crash from happening. But that won't turn off XAML intellisense, which will be all red (as it is without the 1.5-pre nuget).

Now the long answer if you're interested :)

## XML vs XAML intellisense
For Visual Studio 2012 and 2013, we provide Xamarin.Forms intellisense by extending the core text editor using the same extensibility APIs you use to extend any other text-based editor. Besides being able to use some XML-editor provided APIs to access the current document, we basically have to keep track of keystrokes, completion sessions, dismissal on `Esc` and so on. In addition to also discovering types and members available for completion.

In Visual Studio 2015, the XAML editor became extensible so we could take advantage of all the work already done by Microsoft for WPF by just providing some metadata via the NuGet package itself, and registering our Xamarin.Forms namespace to opt-in XAML intellisense instead. This was the result of close collaboration with the XAML team, since XF is pretty much the first non-WPF flavor of XAML around.

In addition to being a solid editor for many years, opting in for XAML intellisense also means we will get all new features they add to WPF for free. In particular around the data binding expressions and markup extensions.

Unfortunately, when we enabled XAML intellisense for our XML namespace, we triggered a bug that causes the XAML editor to crash VS. Microsoft is [aware of the issue](https://connect.microsoft.com/VisualStudio/feedback/details/1655363/vs-crashes-when-editing-xaml), has identified the issue and is actively looking for ways to ship this to users. Worst case, it should be available in VS2015 Update 1, november-ish.

## How to get XML intellisense back
We will soon release an update to the current stable release that will re-enable the XML-based intellisense for Xamarin.Forms. Stay tunned on the [Release Blog](http://releases.xamarin.com) for news.

 