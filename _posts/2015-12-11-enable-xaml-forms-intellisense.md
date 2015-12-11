---
title: "How to enable Xamarin.Forms XAML Intellisense in VS 2015 Update 1"
description: "Visual Studio excelent built-in language service for XAML can now be used for Xamarin.Forms editing. Learn how to get an early preview and help us polish the experience!"
layout: post
tags: programming, xamarin, forms, vs2015
---
As explained in [XML vs XAML intellisense](http://www.cazzulino.com/xaml-forms-intellisense.html) section of my blog post, Xamarin 4 ships with an XML-based intellisense for Xamarin.Forms we wrote from scratch. We have worked with Microsoft to make it possible to use the excelent built-in XAML language service instead, which knows about XAML's specifics, and is driven by metadata provided by the Xamarin.Forms library.


In Visual Studio Update 1, a number of key issues were resolved that make the XAML language service quite usable for Xamarin.Forms XAML editing, so we're releasing [a Visual Studio extension to enable experimental support](https://visualstudiogallery.msdn.microsoft.com/8195a8e2-a842-4389-a8cb-34e4672e2e13) for it so that we can gather early feedback on what works and what doesn't. Please file bug reports at our [Xamarin Bugzilla](https://bugzilla.xamarin.com) tracker, for the `Visual Studio Extensions` product, under the `Xamarin.Forms` component.

You need to be using the latest stable version of the Xamarin.Forms nuget package, which contains the XAML language metadata required to provide intellisense. 

We are providing [this extension](https://visualstudiogallery.msdn.microsoft.com/8195a8e2-a842-4389-a8cb-34e4672e2e13) as an early preview and to gather feedback about things that should be improved or don't work as expected. So please give it a shot and let us know how it works!

## How do you tell if XAML language service is editing your file and not the XML language service? 

If your XAML document contains an XML declaration, it will be in blue collor, rather than red:

![XAML language service](http://www.cazzulino.com/img/xaml-editor.png)

Versus:

![XML language service](http://www.cazzulino.com/img/xaml-editor-xml.png)


(you can play "spot the other difference too ;))

## Will this break anything on my stable dev environment?

Luckily, this is a minimally disruptive extension that just provides a bit of registry information to Visual Studio to know that it's safe to open Xamarin.Forms XAML files with the XAML language service, that's all. For additional reassurance, I've just put the [extension source in GitHub](https://github.com/MobileEssentials/EnableXamlForms) if you rather see for yourself ;). 

Given that, if anything breaks badly, recovery steps are:

- [File a bug report](https://bugzilla.xamarin.com)!
- Uninstall the `Enable XAML Language for Xamarin.Forms` extension from Visual Studio's Extension Manager (or Extensions and Updates dialog nowadays).

And you'll be back to normal.


Thanks and please let us know how it works! 