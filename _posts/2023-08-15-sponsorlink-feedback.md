---
title: "SponsorLink: feedback and moving forward"
excerpt: |
  It seems that inadvertently, I caused a dotnet drama to unfold. 
  Totally unintentional, but here we are. So in this post I hope 
  to clarify some things, and also share some of the feedback I
   received and how I plan to move forward.
tags: [oss, github, sponsors, dotnet]
---

As I mentioned in my [introduction post on SponsorLink](https://www.cazzulino.com/sponsorlink.html), 
open source sustainability is a tricky topic. I have been doing open source for 
more than 20 years, so I'm not entirely n00b to the space. I don't believe in 
"experts" anyway, so I'm just going off of my personal experience, things I read 
and saw other fellow developers do in the past and so on. So, if it wasn't clear 
enough, I'm not speaking for anyone but myself. I don't represent the "dotnet OSS 
community", or speak as to "how OSS should be/is done" or what is "right" or 
"wrong" here. 

The feedback I got was overwhelingly in the following areas:

## Trust

Many were adamant that there was a serious violation of trust because I was 
doing something completely nefarious and evil, on purpose, and for some 
ulterior obviously bad reason. 

The "obviously nefarious" part was me explaining [6 months ago](https://www.cazzulino.com/sponsorlink.html#how-it-works) 
that I was going to use one-way SHA256 hashes of your git email in a repo to 
try to easily map that to your GitHub sponsorship on the backend (static Azure 
blob storage). The actual plain-text email was not shared at all until 
you explicitly installed a GitHub app that requires explicit consent to 
get your email address(es).

Leaving the "we'll never trust you again", "you have ruined your reputation" 
and "you ruined dotnet OSS for everyone" aside, I think the main issue raised 
that the SHA256 hash was not enough to protect the privacy of the email address 
is a valid one. So that is something I'm definitely [going to fix](https://github.com/devlooped/SponsorLink/issues/31). 
In particular, I'm exploring a very interesting suggestion to use SHA-1 and
[k-anonimity](https://www.troyhunt.com/understanding-have-i-been-pwneds-use-of-sha-1-and-k-anonymity/) 
and a purely offline [check](https://github.com/devlooped/SponsorLink/issues/31#issuecomment-1678438870) 
that also supports org-wide sponsorships.

> NOTE: as a side note for folks claiming how I ruined my reputation. I have  
> never promoted Moq in any way, not doing any talks, not doing any videos, 
> podcasts, interviews, workshops, training or consulting of any kind on it. 
> I barely wrote a few blog posts back in the day like when I shipped 
> [3.0 in 2009](https://weblogs.asp.net/cazzu/moq-3-0-rtm) or when I came 
> up with the super cool (to me at least) [Linq to Mocks](https://weblogs.asp.net/cazzu/linq-to-mocks-is-finally-born)
> feature. I mostly didn't even bring it up in casual conversation with friends 
> and colleages at conferences, MVP summits or whatever. 

So, for those who think I've been pushing Moq down everyone's throat just so 
down the road I can monetize it, I'm sorry to disappoint you. I wasn't even 
all that surprising to me that even some of my favorite coworkers didn't know 
I was the author of Moq:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">hold on, how did I not know that you wrote Moq?? It was you?! Awesome job! I&#39;ve been using it!</p>&mdash; Kirill Osenkov 🇺🇦 (@KirillOsenkov) <a href="https://twitter.com/KirillOsenkov/status/884463408786964481?ref_src=twsrc%5Etfw">July 10, 2017</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>


## Transparency

Many felt that my blogging and tweeting and slowly rolling out the feature to 
my other smaller projects wasn't enough. That it should have been more obviously 
visible, discussed in the project repo itself, with sufficient time for feedback 
from the community and so on, even if I sent a PR to the repo to add the feature 
[4 days](https://github.com/moq/moq/pull/1363) before the first comment from 
users about it and a subsequent [PR to remove it](https://github.com/moq/moq/pull/1373).

I can understand the sentiment, even if I don't entirely agree with it. Perhaps 
I'm too impatient, what can I say. 

## Why are you reinventing the wheel?

It was either:

1. OSS is a thanksless job, everyone knows it. Live with it or don't do it.
2. You should just switch to a commercial license. 
3. Your intention that developers pay from their own pocket is ridiculous 
   and nobody does it that way, it will never work.

I read insightful tweets from many folks I deeply respect, sharing their 
personal experience with OSS and how they have been able to sustain it (or not).
I deeply appreciate all feedback, and I'm not going to try to address each 
one individually, but I'll try to summarize my thoughts on the above.

Any one of the above three points are valid and the whole thing might be a 
waste of my time. But there are some things that are unique this time around, 
I think:

* [GitHub Sponsors](https://www.cazzulino.com/sponsorlink.html#github-sponsors) is 
  still in its infancy, with many commenting that most companies don't even know 
  it exists. Its model is also very different from other approaches in that it 
  encourages individual developers to sponsor other individual developers, for a 
  start. As recently as last April, [GitHub announced](https://github.blog/2023-04-04-whats-new-with-github-sponsors/#organization-funded-sponsorships-now-generally-available/) 
  general availability of organization-funded sponsorships, which is a game changer 
  in that regard. When I started working on [SponsorLink](https://github.com/devlooped/SponsorLink) 
  back in January, this wasn't even a thing yet.
* The dotnet OSS ecosystem is much more mature than when I made the 
  [initial commit](https://github.com/moq/moq/commit/e7ae023021954a3f75ef184d86e374f5ffdeb601) 
  more than 15 years ago, with a lot more projects and a lot more users.
* Being a content creator is an actual thing many folks make a living from, with 
  more and more platforms offering this possiblity way beyond YouTube 
  (i.e. [X](https://x.com) now too!). 

## OSS as content creation

Many don't really agree with my view on this, but I think **producing OSS is also 
a form of content creation**. I sporadically blog and tweet, but what I really enjoy 
doing is just creating useful tools and libraries that make my own life easier or 
are just interesting ideas to explore, and I like doing them as OSS because when 
I started my C#/.NET journey, log4net was almost the only OSS project around with 
a significant code base that I could learn from. I want to pay it forward by also 
sharing what I learn, even if it's just a small thing. 

Most folks probably assume Moq is the only thing I ever did in my 
[20+ years of doing OSS](https://github.com/kzu/dotnetopensrc/commit/30b0df176), 
but I have a [long list of packages](https://www.nuget.org/profiles/kzu) which are 
*all* OSS. Yeah, all 317 of them as of today 😅. Granted, none of them is remotely 
as widely known and used as Moq, but that's probably because they address more 
niche scenarios, which might nevertheless be useful for folks, even if it's just 
to learn some techniques or patterns. For example, I go back to my own 
[ThisAssembly](https://github.com/devlooped/ThisAssembly) quite often when doing 
source generators, and I'm pretty sure it was one of the first to come out.

As such, I don't think it's unreasonable to consider OSS as a form of content 
creation, and as such, it's not unreasonable to consider monetizing it in a different 
way to traditional software comercialization. I'm honestly not all that excited 
by the prospect of setting up a company around a single project. As you can tell 
[from my packages](https://www.nuget.org/profiles/kzu), 
[personal](https://github.com/kzu?tab=repositories&q=&type=source) and 
[organization](https://github.com/orgs/devlooped/repositories?q=&type=source) 
repositories, my interests are varied and I like to explore different things.

## On Moq

That said, anyone who has created a non-trivial library from scratch can tell 
you that it's a significant time investment, unlike a blog post, a tweet or 
even a YouTube video. I'm not saying it's more or less valuable, but it's 
not something you can just do in a couple of hours over a weekend (unless 
it's a sample or a small proof of concept or utility).

Let's take my attempt to rewrite Moq from scratch as an example. I started
working on it back in 2017 (for the `aniveresary` edition as I fondly named 
it [back then](https://twitter.com/kzu/status/884462995719507968?s=20):

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">no more run-time proxies in <a href="https://twitter.com/hashtag/moq?src=hash&amp;ref_src=twsrc%5Etfw">#moq</a> (10th) anniversary edition mean you&#39;ll be able to mock anywhere .NET standard 2.0 is supported!</p>&mdash; Daniel Cazzulino 🇦🇷 (@kzu) <a href="https://twitter.com/kzu/status/884477571601227777?ref_src=twsrc%5Etfw">July 10, 2017</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

I have since renamed the repo to [moq/labs](https://github.com/moq/labs/) 
and archived it as recently as last June 20, 2023. You see, I really really 
did want to give the community a fresh Moq that took advantage of all the 
learnings I accumulated over years of doing all sorts of cool .NET tooling, 
IDE extensibility, code generation and much more. There were many new approaches 
to explore, with a more clear focus on extensibility and composability of 
features, so folks didn't have to send PRs just to add this or that functionality 
(since Moq itself never had extensibility in mind). You can see how I made 
many attempts with [spikes of intense work](https://github.com/moq/labs/graphs/code-frequency) 
over the years:

![moq labs](/img/moq-labs-activity.png)

The large spike at the end of 2020 was when I left Microsoft to pursue other 
interests, and I was able to dedicate a few months to it. I was really excited 
and worked intensely on [Stunts/Avatar(s)](https://github.com/devlooped/avatar), 
which was the core of the new Moq: a brand new proxy generation engine that 
leveraged compile-time source code generation instead of run-time emit like 
Castle Core did. 

![avatars](/img/moq-avatar-activity.png)

I can't find a working tool like Ohlo (from back in the day, to calculate 
man-hours) anymore, but I spent months, working mostly full time on it. Even 
that wasn't enough. I didn't want to give up entirely, so by January 2021 I 
set up a [GitHub Sponsors](https://github.com/sponsors/devlooped) account and 
thought to myself that if I could get enough sponsors, I could dedicate more 
time to it. I didn't really promote it much, but I did get a few sponsors, 
with [Christian Findlay](https://github.com/MelbourneDeveloper) being my first 
ever sponsor by the months' end.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Before people get all bent out of shape about Moq... Let&#39;s take a few things into consideration. <br><br>Firstly, you probably ain&#39;t paying for the libraries you use. Are you even asking your employer to contribute? <br><br>Secondly, handing over data is the price you pay for getting free…</p>&mdash; Christian Findlay (@CFDevelop) <a href="https://twitter.com/CFDevelop/status/1689239154058768385?ref_src=twsrc%5Etfw">August 9, 2023</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

> NOTE: thanks for that Christian, I really appreciate it. 

I added the `Sponsor` badge to the [Moq repo](https://github.com/moq/moq/commit/0242d84382222147e45f7ae03179081caddcd3ec) 
almost a year and a half ago. That's around the time my friend 
[Kirill](https://twitter.com/KirillOsenkov) started sponsoring along with 
a few others. But as many have pointed out, there's really no significant 
take rate of GitHub Sponsors in the dotnet OSS community (or any others?). 

As the months flew by, and I was unable to dedicate more time to it, I started 
to consider ways in which I could make it more sustainable. I continued creating 
and shipping many other OSS projects, but I kept thinking about Moq every now 
and then. Earlier this year, back in [February](https://github.com/devlooped/SponsorLink/commits/main/releases.md),
I shipped the initial release of SponsorLink, which I had been working on for 
a few weeks. I started slowly integrating it into my smaller and newer projects, 
which went over several months with absolutely zero feedback from anyone. 

By the end of June I noticed some things were broken in CI for the main 
Moq repo, and I decided to take a look. That's when I sort of assumed I was 
never going to be able to put any serious work on a new Moq, and I decided 
to rename [moq/moq > moq/labs](https://github.com/moq/labs) and archive it. 
and rename moq/moq4 > moq/moq (since there didn't seem to be a point in 
keeping it stuck at v4 forever now). I also archived the proxy framework 
[devlooped/avatar](https://github.com/devlooped/avatar)

![archived avatar](/img/moq-avatar-archived.png)

> NOTE: the project wasn't entirely ignored by absolutely eveyrone, it did 
> have 132 stars after al! But that didn't generate any significant traction 
> as far as sponsorships or feedback either.

Then at the beginning of this month, I decided to spend some time fixing 
whatever was broken, and thought to myself: let's just give this thing one 
last chance. [Fix all the minor issues](https://github.com/moq/moq/commits/main?author=kzu), 
add SponsorLink and see what happens. Well, let's just say it didn't go 
entirely the way I expected.

Sure, I could have communicated all this at length in the repo itself, but 
honestly: the PR was sent 4 days earlier before even the first comment. 
Even the main project contributor (the awesome [Dominique](https://github.com/stakx)) 
had been slow to respond to folks for quite a while (his last merged PR 
being [from way back in January](https://github.com/moq/moq/pull/1325)).

For all I knew, the project was almost in a zombie state, and I was on 
the verge of entirely giving up for good on it. 

And now after the whole thing blew up, folks are acting like their life 
depended on the project. As if nobody could just fork it and move on while 
I tried to rescue the last breath of enthusiasm I had left for it. 

## On SponsorLink

Now, I understand folks weren't thrilled by my very very early v1 of 
[SponsorLink](https://github.com/devlooped/SponsorLink). Sure, there are 
many rough areas and [things to fix and improve](https://github.com/devlooped/SponsorLink/issues). 
Please DO engage, as I'm most certainly not going to just give up on it 
just yet, and I most definitely disagree with those that think the status 
quo is just fine and we should just leave it at that. 

This is just a statement of fact, take as you want but believe me it's 
my honest feeling at this fork in the road: either SponsorLink works 
acceptably for folks and it gets significant traction (for myself but 
also others wishing to get sponsored for their OSS work), or I'm just 
giving up on OSS entirely. 

I would MUCH rather we put together our significant collective brain 
power to make OSS sponsorships a commonplace occurrence in the dotnet 
OSS community, than just give up on it entirely. 

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

