---
title: "On Messaging as Extensibility API"
description: "An exploration of an alternative Visual Studio extensibility programming style where everything is a message"
tags: [code, patterns]
---

Back in 2012, I was on [a CQRS Journey](http://cqrsjourney.github.io/) together with the fine team at [Microsoft patterns & practices](https://github.com/mspnp). We had a great [advisory board](http://cqrsjourney.github.io/advisors/members/) to discuss and learn from and it was an interesting way to tackle a novel pattern to solve a complex problem. Back then [microservices](https://www.martinfowler.com/microservices/) wasn't even a thing yet, go figure!

Without getting into the [CQRS pattern itself](https://martinfowler.com/bliki/CQRS.html), one of the key concepts I was exposed to was that of [events as messages](https://martinfowler.com/eaaDev/EventNarrative.html), which itself is a sort of command in the classic sense of the great [Gang of Four](http://www.amazon.com/exec/obidos/tg/detail/-/0201633612) book:

![Gang of Four](https://www.cazzulino.com/img/gof.png)
> If you haven't read it yet, stop now and go [get it](http://www.amazon.com/exec/obidos/tg/detail/-/0201633612).

I remember vividly a hallway conversation with [Greg Young](https://twitter.com/gregyoung) where he was posing the (sorta crazy) question "what if everything was a message?". As in, you have no .NET event handlers and method invocations, you just pass messages around via some sort of message bus and create a bunch of message handlers to deal with them. Granted, in today's cloud-based event-driven serverless architectures, this is hardly a revolutionary thought. But what about using this programming style for your own APIs 🤔? At the time, I couldn't really think of any domain where such an API style would even remotely make sense, so I discarded it as a some weird crusade by an [architecture astronaut](https://www.joelonsoftware.com/2001/04/21/dont-let-architecture-astronauts-scare-you/).

But alas, after [15+ years of doing Visual Studio extensibility](https://www.cazzulino.com/on-vs-extensibility.html), I finally think there's a domain where it can really shine! As a brief recap from that post, there are basically two styles of extensibility APIs:

* The all-encompassing "IDE API" that includes everything and the kitchen sink (think DTE)
* The myriad loose services (think IServiceProvider/MEF)

Anyone with experience with either style can probably list a dozen or more drawbacks and challenges for each, including versioning, discoverability, cohesiveness and so on. We all sort of know something is wrong about the whole thing, yet it's hard to come up with something better.

# What if everything was a message?

What if instead of endlessly "dotting" into an all-encompasing API, or reading docs and samples on what services to get from the IDE, you just relied on good intellisense to show you the way?

![events intellisense](https://www.cazzulino.com/img/extensibility-events.png)

![actions intellisense](https://www.cazzulino.com/img/extensibility-actions.png)

Those would be essentially the only two concepts to learn: `IMessageBus.Subscribe<TEvent>` to listen to events, and `IMessageBus.ExecuteAsync` to execute actions (optionally returning a result). Where the events are coming from and which service implements what actions can be ignored entirely by the caller now. And the API is infinitely extensible by just providing more of those messages (either `IEventMessage` or `IActionMessage`). You could even just install an additional nuget package that provides API access to some new IDE extension and it would just show up there, like all the other messages, ready to be discovered by just typing some part of the namespace or name, or just scrolling after `Events.` or `Actions.`, depending on which message bus API you're invoking.

You may have noticed that the above screenshots aren't the usual way intellisense behaves in Visual Studio. This is what a "smart library" can achieve now that Roslyn-powered [custom completion can be provided via NuGet](https://github.com/dotnet/roslyn/issues/30270) (thanks [Sam Harwell](https://twitter.com/samharwell)!).

There are some obvious benefits for the IDE as well: cross-cutting exception handling, logging, telemetry and even flagging misbehaving components are now trivial to implement. And with the advent of [hosted codespaces](https://devblogs.microsoft.com/visualstudio/introducing-visual-studio-codespaces/) (sign up for the [Visual Studio 2019 private preview](https://visualstudio.microsoft.com/vs/private-preview/)), those actions and events can even be provided/handled from the local environment or the cloud one, with no changes to the client programming model!

This is a pattern that has served us well in the Xamarin tooling, albeit with a much reduced scope. The implementation we used there comes from [Merq](https://github.com/MobileEssentials/Merq), which provides separate `IEventStream` and `ICommandBus` for both concepts, but following the same messaging principle.

I think there is real potential to improve the status quo of open-ended extensible APIs like IDEs need with this approach. What do you think, fellow comrade in pain?