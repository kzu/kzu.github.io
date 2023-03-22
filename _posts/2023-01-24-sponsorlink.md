---
title: "SponsorLink: trying something new-ish for OSS sustainability"
excerpt: |
  I would love to live in a world where open source developers can make 
  a decent living from their (popular) passion projects. So I decided 
  to try to build something on top of GitHub Sponsors that could enable 
  a more streamlined experience for users and authors alike to connect 
  and support each other. I call it SponsorLink and you can use it right 
  now :)
tags: [oss, github, sponsors, dotnet]
---

Open source sustainability is a tricky topic. I would kindly refer you to 
the [thoughtful post by Eric Sink](https://ericsink.com/entries/sqlitepclraw_sustainability.html) and [Six Labors's license change](https://sixlabors.com/posts/license-changes/) post.

Suffice to say, we all struggle to make this a sustainable proposition 
where we can dedicate full-time to the projects we love. Also, there 
doesn't seem to be a perfect answer for all scenarios, so there's always 
pros and cons. 

With that in mind, let me introduce you to [SponsorLink](https://github.com/devlooped/SponsorLink).

## GitHub Sponsors

![Octocat lifted by a sponsors heart-shaped globe](/img/sponsors-mona.png)

[GitHub Sponsors](https://github.com/sponsors) is a fantastic thing. I'm 
quite convinced it's a step in the right direction, with availability 
throughout most of the world, and constantly adding 
[new regions](https://github.blog/2022-07-28-github-sponsors-available-in-30-new-regions-2/).

![Sponsors map](/img/sponsors-everywhere.png)

They have an [Explorer](https://github.com/sponsors/explore) to find projects to 
sponsor, and for the most part they have figured out how to make the quite tricky 
part of actually *charging* and *paying* people throughout the globe seem like 
a trivial thing. It's quite amazing. No individual could ever have enough bandwidth 
to figure it all out on his own just to attempt to make a few bucks from a passion 
project.

I have been testing it out for a while too with an  
[organization account](https://github.com/sponsors/devlooped), but other than a few 
generous friends and some one-time large-ish sponsorships (very few and far between), 
let's just say it hasn't gotten much traction. Shocking, right? 

As I'm getting ready for a serious amount of work on [Moq vNext](https://github.com/moq/moq), 
I wanted to see if I could come up with something to help me support myself and my 
family while I dedicate to that full-time for a while. So I came up with SponsorLink.

## Introducing SponsorLink

I believe most fellow developers don't have an issue with giving away a buck or two 
a month for a project they enjoy using and delivers actual value. And I'm quite positive 
that if a couple dollars a month is an affordable proposition for an argentinean, it 
surely isn't a crazy thing for pretty much anyone. 

And I'm a firm believer that supporting your fellow developers is something best done 
personally. Having your company pay for software surely doesn't feel quite as rewarding 
as paying from your own pocket, and it surely feels different for me too. We really 
don't need to expense our employers for a couple bucks a month, right??

So the goal of SponsorLink is to connect in the most direct way possible your 
sponsorship with your library author' sponsor account. And since the place where you 
spend most of the time enjoying your fellow developers' open source projects is inside 
an IDE (i.e. Visual Studio or Rider), I figured that's the first place where you 
should be reminded that either: 

1. You are an awesome backer and the project is alive and well thanks to you:

   ![A diagnostics info in VS thanking you for sponsoring](https://raw.githubusercontent.com/devlooped/SponsorLink/main/assets/img/VS-SL04.png)

2. You should not forget to take action *now* to become 1), given it's incredible 
   straightforward and affordable!

   ![A diagnostics warning in VS suggesting you install SponsorLink](https://raw.githubusercontent.com/devlooped/SponsorLink/main/assets/img/VS-SL02.png)

   ![A diagnostics warning in VS suggesting you sponsor the projcet](https://raw.githubusercontent.com/devlooped/SponsorLink/main/assets/img/VS-SL03.png)

### How it works

SponsorLink will *never* interfere with a CI/CLI build, neither a design-time build. 
These are important scenarios where you don't want to be annoying your fellow oss 
users. I don't want to have to deal with setting up licenses on a server, provisioning 
test agents or whatever. Also, if you're building from the command line, it's not as 
if you're enjoying my oss library all that much anyway.

Initially, I built support for [SponsorLink for .NET](https://www.nuget.org/packages/Devlooped.SponsorLink) 
via a nuget package. The backend is agnostic to the client, though, so if this takes 
off, I may add other ecosystems.

The non-dotnet specific way it works for library users is:

1. If the user isn't using an editor or there is no network, there's nothing to 
   do, so bail quickly.
2. A library author runs `git config --get user.email` during build to get the 
   current user's configured email. If there's no `git` or `email`, there's nothing 
   to do. No real work is done nowadays without both, right? :)
3. A quick HTTP HEAD operation is sent to Azure Blob storage to a relative URL 
   ending in `/apps/[user_email]`. If it's a 404, it means the user 
   hasn't installed the [SponsorLink GitHub app](https://github.com/apps/sponsorlink). 
   This app requests *read* access to the users' email addresses, so the previous 
   check can succeed.
4. If the previous check succeeds, a second HTTP HEAD operation is send to Azure Blob 
   storage to a URL ending in `/[sponsor_account]/[user_email]`. If it's a 404, it means 
   the user isn't sponsoring the given account.

In both 3) and 4), users are offered to fix the situation with a quick link to install 
the app, and then sponsor the account.

> NOTE: the actual email is *never* sent. It's hashed with SHA256, then Base62-encoded.
> The only moment SponsorLink actually gets your email address, is *after* you install 
> the [SponsorLink GitHub app](https://github.com/apps/sponsorlink) and give it explicit
> permission to do so.

On the sponsor account side, the way it works at a high level is:

1. One-time [provision of your account](https://github.com/devlooped/sponsorlink#-open-source-developers), 
   by installing the [SponsorLink Admin GitHub app](https://github.com/apps/sponsorlink-admin) and 
   setting up a Sponsors webhook in your dashboard to notify SponsorLink of changes from your sponsors.
2. Integrating the [SponsorLink for .NET](https://www.nuget.org/packages/Devlooped.SponsorLink) 
   nuget package and shipping it with your library: it ships as an analyzer of your library.

And that's it!

From this point on, any new sponsor will immediately be notified to SponsorLink which 
will update the Azure Blob storage account with the right entries so that in mere seconds 
the experience quickly goes from Install GH app > Sponsor account > Thanks!


## Closing

I discussed this approach with fellow developers and it sounded unanimously reasonable. 
Hopefully you will think so too, and perhaps even start using it on your projects. More 
than 20 years after my first steps in open source, for the first time I feel this can 
actually work and be a sustainable endeavor. Let's make it work together!

Please do [report issues](https://github.com/devlooped/SponsorLink/issues) and join 
the [discussions](https://github.com/devlooped/SponsorLink/discussions). I want this 
thing to work and offer the best balance of gentle nudging users to sponsor (without 
being obnoxious) and being easy to integrate in your projects.

You can test the experience by installing any of the latest [ThisAssembly](https://www.nuget.org/packages/?q=ThisAssembly) packages or [NuGetizer](https://www.nuget.org/packages/NuGetizer). If you are sponsoring [Devlooped](https://github.com/sponsors/devlooped), you'd get a couple thank you 💟:

![lots of thanks from ThisAssembly](/img/sponsorlink-thanks.png)


Now, it's time for me to go back to doing what I like most: hacking on more oss stuff.