---
title: "Dynamic Xamarin Forms From XAML and JSON"
description: "How to dynamically load XAML for Xamarin.Forms, as well as creating dynamic data-only view models using JSON."
tags: programming, xamarin, forms, xaml
---
Yes, I'm well aware that the official API set for Xamarin.Forms only allows loading the compiled XAML into its "owning" view, using the `LoadFromXaml<TView>(this TView view, Type callingType)` extension method from the `Xamarin.Forms.Xaml.Extensions` class. And this is of course the actual real and supported way of doing it (for whatever reason, I'm not part of the Xamarin.Forms team :)). 

But, being just a .NET assembly, I got curious as to how they loaded that XAML in that case. So a bit of .NET Reflector revealed the internal `Xamarin.Forms.Xaml.XamlLoader` class, with the following nice overload:

	public static void Load(BindableObject view, string xaml)

So nothing prevents us from invoking that via reflection, you know? ;). Of course that is hardly a well-performing way of developing an entire app, but if you happen to need it for something, it's totally doable and works acceptably well IMHO. I turned it into [an extension method](https://github.com/MobileEssentials/DynamicForms/blob/master/src/Xamarin.Forms.Dynamic.Desktop/BindingObjectExtensions.cs#L38) and was back in business in no time.
    
Another thing I was pretty excited to try out with this new knowledge, was a way to dynamically bind data too, so that I could load a dynamic view, then a dynamic data/view model (using JSON, but why not also any arbitrary key/value dictionary?), and have the app display both, bi-directional data binding and all. 

For this I did have to send a PR to the Xamarin.Forms team for a little feature contribution, and they thankfully merged it :). It's currently available in the [pre-release nuget package for Xamarin.Forms](https://www.nuget.org/packages/Xamarin.Forms/1.4.3.6358-pre2):

	PM> Install-Package Xamarin.Forms -Pre

This feature allows the BindingContext to provide its own reflection via the `System.Reflection.IReflectableType` interface. The implementation of that interface isn't exactly trivial (I'd have liked it better if ICustomTypeDescriptor was available for PCLs) but it's like 99% boilerplace. So I've made it generic enough that it can be reused for other dynamic models. I implemented an [IDictionary-based model](https://github.com/MobileEssentials/DynamicForms/blob/master/src/Xamarin.Forms.Dynamic.Desktop/DictionaryModel.cs) as well as a [Linq to JSON](http://www.newtonsoft.com/json/help/html/LINQtoJSON.htm)-based [JsonModel](https://github.com/MobileEssentials/DynamicForms/blob/master/src/Xamarin.Forms.Dynamic.Desktop/JsonModel.cs).

For convenience, I've put it all in a [Xamarin.Forms.Dynamic](https://www.nuget.org/packages/Xamarin.Forms.Dynamic) package that takes a dependency on the pre-release Xamarin.Forms package:

	PM> Install-Package Xamarin.Forms.Dynamic -Pre

With that in place, you can simpy do:

	var page = new ContentPage();
	string xaml = // load XAML string from wherever.
	string json = // load JSON string from wherever.
	page.LoadFromXaml(xaml);
    page.BindingContext = JsonModel.Parse(json);

And that will do exactly what my [Xamarin Forms Player demo](http://screencast.com/t/lqvxYSbti) does :). Of course, there is a tiny bit more involving trivial SignalR + Azure in there too, to send the payloads from VS to the app on the device, but that's also [available to explore](https://github.com/MobileEssentials/FormsPlayer) if you want to see how I did it. Quite a few asked about this at the Xamarin event we did a few days ago at Microsoft Argentina, so there you go ;)

 
  


 
