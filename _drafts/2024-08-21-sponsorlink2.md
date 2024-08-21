---
title: "SponsorLink v2: A New Hope"
excerpt: |
  After collecting feedback from last year's attempt, reflecting 
  on many very valid points, I went back to the drawing board on 
  SponsorLink and I'm ready to start rolling out v2. Read on to 
  learn about what's new and entirely rewritten ;-).
tags: [oss, github, sponsors, dotnet]
---

Almost exactly a year after [my SponsorLink feedback post](https://www.cazzulino.com/sponsorlink-feedback.html), 
I think I have worked out most of the issues and would like to give this another 
try with a completely rewritten **SponsorLink v2**. 

A lot has happened in the intervening year, including valuable experiences trying 
to monetize OSS by other popular libraries (like ImageSharp, PrismLib and others).
Many things stayed the same, though, including pitiful sponsoring uptick since I 
removed all traces mentioning the ability to sponsor my libraries from build and 
analyzer tools.

Just as last time, an obvious disclaimer first:

> I'm not speaking for anyone but myself. 
> I don't represent the "dotnet OSS community", or speak as to 
> "how OSS should be/is done" or what is "right" or "wrong" here. 

## Overview

The new v2 implementation is a complete rewrite and has reoriented several 
areas based on the [feedback I got](https://www.cazzulino.com/sponsorlink-feedback.html). 

Broadly, the following areas have been redesigned based on it.

### Privacy and GDPR

It was a pretty bad mistake on my part attempting to make SponsorLink work 
too "magically" last time and just "light-up" without asking users for explicit 
consent on what was being done, why and allowing easy opt-out, only made worse 
by a poor technical choice for user identification for sponsor linking purposes.

This time around, things are much more consciensous in this regard:

1. No network access is ever performed without user consent at any time
2. No network access is ever needed to check for sponsorship status
3. Fully random "installation id" is the only thing backend uses for telemetry
   1. TODO: CHECK
4. Sponsor linking is explicitly opt-in and requires multi-step acceptance:
   1. On a CLI console app that syncs sponsorship status, on first use
   2. On GitHub.com as an OAuth app that shows what information will be shared
5. Revoking access and opting out is similarly straightforward:
   1. CLI tool allows to remove all traces
   2. Directs users to relevant GitHub.com settings to revoke access

An explicit [privacy policy](TODO) is also provided, which is also shown in the CLI 
tool on first use.

### Transparency

Another pretty bad mistake was attempting to make the system hard to circumvent.
This involved some really stupid ideas like making the sponsor checking closed 
source and obfuscated. Bundling this with OSS libraries was just the icing on 
the cake of bad ideas. 

The new approach is 100% OSS end-to-end: the sync tool, the backend, the sample 
analyzer, the manifest-based spec.

I have been asking for feedback for months now, and I feel the new approach is 
pretty solid. It makes things Just Work, without resorting to "security by 
obscurity" that we all know is just dumb.

### Scalability

Rather than attempting to offer a one-solution-fits-all approach where other 
potential OSS developers/organizations would rely upon my implementation, the 
new SponsorLink v2 instead offers a manifest-based reference implementation 
only, which others may self-host. The tooling is smart to detect support for 
the manifest and invokes well-defined endpoints that can be implemented by a 
user or organization in any way they like. Self-hosting of the backend reference 
implementation is made (fairly) straight forward as an Azure Functions app, 
but there's no requirement to use my implementation at all.

Remote and local manifests are placed in well-known locations specified in the 
[spec](TODO: link), and they are [standard JWT](https://jwt.io) (down to the 
actual claim types used, such as `issuer`, `audience` and so on).

Another piece of feedback was organization sponsorships and how that would 
allow easier scaling in scenarios where users are just forced to use certain 
libraries by their employers. 

**SponsorLink v2** now considers the following kinds of sponsorship "roles", 
in order of precedence: 
* `user`: the user is a direct sponsor
* `contrib`: the user is considered a sponsor because it has contributed to 
  the project via commits that have been merged.
* `org`: the user is a member of a sponsoring organization.

Any combination of these roles can be present simultaneously.

### Benefits for users

It was also pointed out that it looked like sponsoring users didn't get any 
benefits beyond removing annoyances. The most egregious annoyance was a one-time 
(for the lifetime of the IDE) build pause.

> As an OSS-luminary friend noted: if you're building Swift code, the build pause 
> will go entirely unnoticed since the build already takes forever 😂

The previous analyzer-based approach is now just a sample that libraries may 
or may not adopt. If they do, it now involves a single solution-wide, IDE-only,
never-error (even with `WarningAsErrors`), per-product warning when sponsorship 
status is unknown. Just like before, this warning is never reported in CLI or 
CI builds.

But a few new areas are now integrated into SponsorLink:
1. Auto-labeling of issues and pull requests: there is even an extensible 
   mechanism to use custom labels depending on the sponsorship tier. This 
   feature allows improved prioritization of feedback and contributions from 
   active sponsors. //TODO: check if PRs are also labeled
2. Real-time push notification of sponsor's issues and issue comments by 
   leveraging [Pushover](https://pushover.net).
3. Backing issues: one-time sponsorships can now be linked to an issue and 
   become the "bounty" for it, increasing the chances it gets prioritized 
   and fixed sooner. // TODO: implementation complete?

For now, there is no automated distribution of the bounty to contributors 
that send a PR that fixes the backed issue after it's merged. I will consider 
this if it becomes too much manual work. For now, I'll do this manually as 
needed.

> NOTE: automating the distribution is non-trivial as it would require 
> automatically sending a one-time sponsorship to the contributor, and there 
> is no API to do that at the moment, AFAIK.

## The Future

I'll first focus on the GitHub issues/PR integration, possibly developing 
something to more easily prioritize/visualize sponsored activities.

I'd like to continue [creating OSS content](https://www.cazzulino.com/sponsorlink-feedback.html#OSS-as-content-creation), so for now, I'll continue 
to pursue sponsorships as a potential income source. I appreciate the feedback 
on alternative approaches but in particular [ImageSharp](https://sixlabs.com //TODO LINK)
and [PrismLib](//TODO: TALK) experiences switching to a paid licenses has convinced
me that's not the path I'd like to take. As I mentioned in the past, you can tell 
[from my packages](https://www.nuget.org/profiles/kzu), 
[personal](https://github.com/kzu?tab=repositories&q=&type=source) and 
[organization](https://github.com/orgs/devlooped/repositories?q=&type=source) 
repositories that my interests are varied and I would like to continue to 
explore different things rather than set up shop around a single product/project.

### On Moq

I would still like to create a brand-new Moq. I have many interesting ideas to 
explore for it (//TODO: link to vNext post from years ago) and smart ways to 
leverage SponsorLink to provide a differenciated experience to sponsors that 
makes it worthwhile to contribute.

To some extend, how much time I dedicate to it might depend on sponsorships 
taking off, so we'll see how v2 goes.

I'm hessitant to reintroduce even this v2 in existing Moq at this point. I'll 
first collect feedback specifically for it and make a decision after a sufficient 
period (3 months? more? less?).

I've by now realized that most of the loud criticism was by a minority, and 
fellow OSS developers were actually quite supportive of my efforts. Downloads 
haven't even noticed the drama, so I think Moq's loudly predicted demise 
has been greatly exaggerated. 

//TODO: stats.

So 

This is just a statement of fact, take it as you want but believe me it's 
my honest feeling at this fork in the road: either SponsorLink works 
acceptably for folks and it gets significant traction (for myself but 
also others wishing to get sponsored for their OSS work), or I'm just 
giving up on OSS entirely. 

I would MUCH rather we put together our significant collective brain 
power to make OSS sponsorships a commonplace occurrence in the dotnet 
OSS community, than just give up on it entirely. 

### How about organizations?

My initial intention was/is that SponsorLink should encourage fellow 
developers that one day might be OSS developers themselves too, to 
sponsor the projects they use and enjoy. As a matter of personal 
gratitude and to achieve some level of a personal connection that 
goes beyond simply reporting issues and complaining when things 
don't work great.

One area where I think most OSS devs are in agreement is that doing 
this seems like not only a thankless job, but an actually hostile 
one at times. Too many demands, sometimes not even politely asked, 
and you simply never get to hear from folks that are actually 
happy using it. This is not exclusive of OSS software, mind you. 
When I was at both Xamarin and Microsoft (Visual Studio) afterwards, 
it was easy to feel the same, since your only feedback channel 
is typically the issue tracker where folks report problems.

If you had a more personal relationship (even if is through the $1 
sponsorship), you would keep in mind the individual(s) behind the 
project because you *actively* reached out for your pocket. So 
when it's time to report an issue, I think you'll be more likely 
to remember the person and be kinder.

As an OSS developer, seeing an issue report tagged with a Sponsor 
label, likewise, will remind you that they care about you, 
*personally*, and you are likely going to be more eager to help.


That said, I realize that not everyone chooses the libraries they
use, in particular in larger organizations. So I think now that 
there is growing support for org-wide sponsorships from GitHub 
Sponsors, it [should also be supported](https://github.com/devlooped/SponsorLink/issues/47).

The way this would work is to consider developers that belong to 
the given organization (i.e. they have an email that matches the  
org-validated domain) as sponsors too.


### How could it scale?

Many have pointed out that if 300 OSS packages used SponsorLink, it would 
be a nightmare of diagnostic messages in the editor, and that it would 
be an economic disaster if they had to personally sponsor each one 
even if it was with $1 each.

This is a fair point, even if I think it's a bit early to plan for 
basically a v3+ of SponsorLink. One way this can be solved is by 
sponsoring a (say) `Sponsorware` organization, which collects a 
Spotify-like fee, which is then split based on usage.

## Closing thoughts

Imagine if you could have an experience like the following:

1. You find an issue with a library you use, which is sponsorable
2. You open an issue, and sponsor the repo with a one-time donation 
   mentioning the issue you'd like fixed for the $X amount you're 
   sponsoring for. (YES, even reading your issue and responding to it 
   takes time and therefore *money*)
3. SponsorLink detects all this automatically and auto-tags the 
   issue as "up for grabs for $X"
4. More folks can up-vote the issue *with more money* via one-time 
   sponsorships just like the first guy.
5. At some point, someone is assigned the issue and works on a fix. 
   Once the PR that fixes it is merged, the accumulated money goes 
   automatically as a one-time sponsorship to the contributor.

And now you have an ecosystem where folks can get paid for their work,
and you can get your issues fixed faster by sponsoring them.

So don't tell me the status quo is just fine. It's not. It's not fine 
that a newcomer to the project, looking to learn something but also 
earn something, has no way to get paid for their work. 



Hopefully we can all work together to make this (or some version of 
it) a reality.

