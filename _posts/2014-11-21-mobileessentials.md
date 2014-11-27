---
title: "Mobile Essentials: Productivity Tools for Mobile Developers"
layout: post
tags: programming, mobile, xamarin
---
A bunch of mobile development and tooling enthusiasts here at the office wanted to put out some tools, templates and general productivity enhancements for mobile developers, so we decided to set up a custom Visual Studio gallery that you can set up to get these tools in an integrated fashion in the Extensions and Updates dialog (a.k.a. Extension Manager). These will generally be projects we work on the side, on weekends and nights and hackathons.

The goal of these extensions is to be completely independent of your other tools in VS (like your Xamarin installation) so that you can try them without risking breaking your stable development environment. If something doesn't quite work, you just remove the extension and you're done. Pristine environment back!

At Xamarin, we may use this gallery also for early prototypes or spikes we do on top of the [Xamarin Platform](http://www.xamarin.com), so that we can gather early feedback without disrupting your stable installation and without requiring you to switch between official channels. Whatever we put out will be for use "at your own risk" so to speak. As I said, it could become a way for us to also share bits earlier and get timely feedback for things that may make it into the core product. It also would allow us to discard ideas that don't get traction :).

The source code for the gallery itself as well as installation instructions are [available on GitHub](https://github.com/MobileEssentials/Gallery). I'm copying the [instructions](https://github.com/MobileEssentials/Gallery/blob/master/README.md) here for convenience:

Mobile Essentials Gallery Beta
=======

The Mobile Essentials Gallery provides a custom Visual Studio Gallery (also called [Private Galleries](http://msdn.microsoft.com/en-us/library/hh266746.aspx), but ours is pretty public ;)) with experimental and early prototypes and tools for mobile development on the Xamarin platform.

All extensions are provided free to use and experiment. We welcome your feedback on the tools at our [UserVoice](http://mobileessentials.uservoice.com/) forum!

## Installing

In order to get the new gallery in your Visual Studio 2012 (or later), open `Tools | Options` and configure the page `Environment > Extension Manager` as follows, using the gallery url `http://gallery.mobileessentials.org/feed.atom`:

![Gallery Setup](http://gallery.mobileessentials.org/img/setup.png)

Once the gallery is set up, you can go to Visual Studio's `Tools | Extensions and Updates...` menu and a new Mobile Essentials node will appear under the Online category, where you can explore and install the tools:

![Using the Gallery](http://gallery.mobileessentials.org/img/using.png)


Updates also show in this same window, under the respective category `Updates > Mobile Essentials`:

![Using the Gallery](http://gallery.mobileessentials.org/img/update.png)
 

# Remarks

As you can see, one of the first extensions we've uploaded is an initial version of Xamarin.Forms intellisense. You probably guessed that that's one that will definitely make it into the main Xamarin installation in the future ;). 

