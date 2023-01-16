---
title: "Open Source is never Abandonware"
excerpt: |
    Back in the day, friend Scott Hanselman used Schematron as an example of abandoware. 
    That ends today, thanks to the community, as it should.
---

Some time ago, [Scott Hanselman posted on Abandonware](http://www.hanselman.com/blog/WhatIsAbandonware.aspx) and 
used my original Schematron.NET, which made it even to an 
[MSDN article](https://msdn.microsoft.com/en-us/library/aa468554.aspx#schematron_topic4) by the (back then) 
.NET XML PM [Dare Obasanjo](http://www.25hoursaday.com/weblog/), as an example of abandonware:

> Conclusion: The Schematron .NET implementation is total abandonware and I'm going to use it anyway. 

As it happens, I got contacted by [Pedro Frederico](https://twitter.com/pmgfrederico) who had already done 
the heavy lifting of polishing up the original source a bit, bringing it to GitHub, and contacting me about how 
to proceed. That prompted me to contribute back a few minor changes, set up a 
[new repo for it](https://github.com/kzu/Schematron), configure [AppVeyor](https://ci.appveyor.com/project/MobileEssentials/schematron) and voila: now we even have a CI-pushed 
[nuget package for Schematron](https://www.nuget.org/packages/Schematron).

So, dear Scott: I think that's what we should all do with "abandoneware". Bring it back to life, into modern life, 
as we happen to come across it and find good uses for it.

> Moral: What you care about, often ain't what the other guy cares about.

As long as you make it stupidly easy for the original author to be on board (as Pedro did!), abandoneware doesn't 
mean more than "up for grabs". The original author might not be too interested anymore in the project, but that 
doesn't mean it can't still provide value to others, and continue flourishing on its own.

> True Abandonware is closed-source software the original authors don't care about anymore. 


I for one are very happy to see Schematron alive again. Thanks Pedro!


PS: you can contribute PRs, report issues, etc. via [GitHub](https://github.com/kzu/Schematron), I'll be happy to merge away, as well as support any documentation efforts ;).