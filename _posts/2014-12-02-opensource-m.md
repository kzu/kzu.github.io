---
title: "Open Source Oslo M"
image: http://www.cazzulino.com/img/oslo-m.png
tags: opensource
---
For those of you on the cutting edge of Microsoft technologies that don't ship ;), you probably have fond memories of one particular product that had so much promise: Olso "M". 

Just to refresh your mind on how cool it was, just go and read [Fowler's](http://martinfowler.com/bliki/Oslo.html) or [Clarks's](http://blog.jclark.com/2008/11/some-thoughts-on-oslo-modeling-language.html "James Clark Overview of Oslo M") cool reviews of Oslo.

The product [didn't go anywhere](http://blogs.msdn.com/b/modelcitizen/archive/2010/09/22/update-on-sql-server-modeling-ctp-repository-modeling-services-quot-quadrant-quot-and-quot-m-quot.aspx "Microsoft Discontinuing Oslo"), with Microsoft investing heavily on OData and the Entity Data Model instead (or EDM, the metadata format behind Entity Framework).

Oslo as a whole, owned by the SQL Server group, ended up being a gigantic thing too tied to the database for its repository, and with a grand vision that was very hard to sell. That's why OData and EDM won, in a way: they aren't SQL Server-specific. 

But "M", separated from the rest of the SQL/RDBMS tie-ins, was a great thing in its own right, for building textual DSLs, even with nice almost automatic tooling for Visual Studio. Think keeping just the top box:

![Oslo](http://www.cazzulino.com/img/oslo-overview.jpg)

## Who does modeling anyway?

Well, if you have any sort of configuration for whatever library of framework, and you provide a serialized format for that configuration in some form, you're modeling ;). "Back in the day", people were making up textual DSLs in XML. Editing was so-so (if you could provide an XSD), validation was so-so (unless you needed anything beyond basic structural validation via XSD), but at least XSD gave you something beyond plain text. There never was a true logical model, unless you just did straight XmlSerializer stuff to your POCOs and called that your model. Very rudimentary. A lot of developers didn't even bother with that and just went straight XmlDocument/XDocument. 

If you were mindful about extensibility, you could even allow extensions to your model via XML namespaces and let others take your model further. But even fewer devs went so far. 

Now JSON is all the rage, and you see ASP.NET vNext (K) doing this all over again, as a single-purpose-thing again but on top of Json: little DSLs with hardcoded editing knowledge of (some) JSON schemas, and some hardcoded IDE integration, and again, no logical model unless you do it yourself. (but you can always use it as just a persistence/configuration thing and even read it untyped with Json.NET's JObjects). 

## Not moving forward!

We're never moving forward! We're never moving up to truly executable models, models that can be integrated, reasoned about, extended, etc. JSON-based DSLs are even worse than XML-based ones in that regard, since at least XML had extensibility built-in via namespaces! 

This makes me very sad. We were on the verge of a revolution in modeling and abstractions and executable models with "M", and now we're back to an even pre-XML/Infoset world with even more hardcoded one-off tooling.

At [Xamarin](http://xamarin.com), for example, we have to deal with Android's application manifest (XML) and Apple's unbelievably ugly PList "XML" files, with no hope of having anything more expressive, unless we invest a lot in custom tooling and come up with yet-another-DSL that we'll have to maintain. 

Granted, every possible usage of a textual DSL will be met with questions as to why isn't JSON/XML enough, since parsing is so trivial, etc. And granted, you also face the usual "you can do that with some custom tooling!" (which we know and do anyway). But that's not the point. Of course we can make custom textual DSLs, we've been doing it for way too long already! And every time using the wrong tool for the job: XML in the past, JSON in the present.

Imagine how amazing it would have been if the new configuration system in ASP.NET vNext with all that [Gulp, Grunt, Bower and npm](http://www.hanselman.com/blog/IntroducingGulpGruntBowerAndNpmSupportForVisualStudio.aspx) was based on Oslo instead of being one-off tooling endeavors by the awesome but very unique [Mads Krinstensen](https://github.com/madskristensen). The mere mortal developers can only dream of putting together that kind of tooling for their own projects.


## Open Sourcing Oslo "M"

A general-purpose modeling tool like M has wide applicability, and I'm sure devs would apply it to things we never even thought about. And that's the whole point :).

I sincerely hope that Microsoft considers contributing this part of Oslo to the [.NET Foundation](http://www.dotnetfoundation.org/). Even dumping the whole thing in GitHub would probably spark some interesting experiments.