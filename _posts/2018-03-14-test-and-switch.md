---
title: "Test and Switch: testable yet high performance cross-platform libraries"
description: "How to write cross-platform libraries without resorting to abstractions 
that slow down an app at run-time while still being able to unit test logic that consumes 
those libraries. Just like bait & switch gave us the trick to leverage platform-specific 
code in cross-platform libraries, test & switch gives us the trick to author them in a 
testable and still high performance way."
tags: [xamarin, mobile, testing]
---

If you are writing Xamarin apps, there's a high chance you are also leveraging the MVVM pattern:

[![MVVP Pattern](https://github.com/kzu/kzu.github.io/raw/master/img/mvvm.png)](https://msdn.microsoft.com/en-us/library/hh848246.aspx)

And if you like your separation of concerns, you may also be using constructor dependency injection (whether for a Xamarin.Forms app or Xamarin Native):

[![Dependency Injection Pattern](https://github.com/kzu/kzu.github.io/raw/master/img/injector.gif)](https://martinfowler.com/articles/injection.html)

(where your "assembler" may be a proper DI framework, or maybe just our humble [DependencyService](https://docs.microsoft.com/en-us/xamarin/xamarin-forms/app-fundamentals/dependency-service/))

If so, it's quite likely that your [view models](https://github.com/Microsoft/SmartHotel360-mobile-desktop-apps/blob/master/src/SmartHotel.Clients/SmartHotel.Clients/ViewModels/BookingViewModel.cs#L28-L29) look something like this:

```csharp
    public class BookingViewModel : ViewModelBase
    {
        public BookingViewModel(
            IAnalyticService analyticService,
            IHotelService hotelService)
        {
            ...
        }
        ...
    }
```

And [your services](https://github.com/Microsoft/SmartHotel360-mobile-desktop-apps/blob/master/src/SmartHotel.Clients/SmartHotel.Clients/Services/Hotel/HotelService.cs#L14) something like:

```csharp
    public class HotelService : IHotelService
    {
        public HotelService(IRequestService requestService)
        {
            ...
        }
        ...
    }
```

Where "magic happens" and everything is wired up automatically.

The unfortunate news you may already suspect is that all [that magic isn't free](https://www.reddit.com/r/IAmA/comments/81hcsi/iama_miguel_de_icaza_ama/dv3vk9r/). I know, as .NET developers, it's easy to dismiss this. After all, it was never a problem for ASP.NET, WPF, or any other kind of desktop project, right?

Alas, on mobile, not everything looks as pretty. Even if [Google calls it a myth](https://developer.android.com/training/articles/perf-tips.html#Myths), it does so with a telling intro: 

> On devices without a JIT, it is true that invoking methods via a variable with an exact type rather than an interface is slightly more efficient. 

(and it may be so in Android's case). Xamarin also runs on iOS and that fits perfectly the "*without a JIT*" part. And we know that if it were for [Miguel](http://tirania.org/blog/), [Dependency Injection would be banned](https://www.reddit.com/r/IAmA/comments/81hcsi/iama_miguel_de_icaza_ama/dv3dtv3/) from usage ;)

>  I wish more developers used a profiler, so they would stop using Dependency Injection on their apps.

With that background intro, it should not be very surprising that the approach taken by the [recently announced](https://twitter.com/migueldeicaza/status/970892902325825536) project [Caboodle](https://github.com/xamarin/Caboodle) is to just go to the extreme minimalist approach of just being a bunch of [platform-specific static methods](https://github.com/xamarin/Caboodle/tree/master/Caboodle/Geocoding), [invoked directly from the view models](https://github.com/xamarin/Caboodle/blob/master/Samples/Caboodle.Samples/ViewModel/GeocodingViewModel.cs#L65):

```csharp
    public class GeocodingViewModel : BaseViewModel
    {
        public GeocodingViewModel()
        {
            // NO CONSTRUCTOR DEPENDENCY INJECTION? OH MY!
        }

        async void OnGetPosition()
        {
            ...
            // HOW AM I SUPPOSED TO UNIT TEST THIS VIEW MODEL NOW?!
                var locations = await Geocoding.GetLocationsAsync(Address);
                var location = locations?.FirstOrDefault();
                if (location == null)
                ...
```

Needless to say, this is going to perform extremely well at run-time. There's a fairly good chance that the entire `GetLocationsAsync` method will be inlined in its entirety even. And this is a *very* good thing if you want to keep your app snappy and your users happy, for sure!

> NOTE: You may wonder how is it possible for `Caboodle` to know that when your view model calls `Geocoding.GetLocationsAsync`, it should call [the Android version](https://github.com/xamarin/Caboodle/blob/master/Caboodle/Geocoding/Geocoding.android.cs) if the app is running on Android, [the iOS one](https://github.com/xamarin/Caboodle/blob/master/Caboodle/Geocoding/Geocoding.ios.cs) in iOS and so on. After all, your main app logic isn't saying which one! This approach is called [bait and switch](https://log.paulbetts.org/the-bait-and-switch-pcl-trick/) and in [Caboodle's project](https://github.com/xamarin/Caboodle/blob/master/Caboodle/Caboodle.csproj#L5) it's implemented using a new feature in VS2017 that allows creating so-called [multi-targeting projects](https://oren.codes/2017/01/04/multi-targeting-the-world-a-single-project-to-rule-them-all/). The gist is that the nuget package includes one DLL for each target framework, and your (Android, iOS, etc.) app, via nuget, automatically references the platform-specific one, even if your library referenced the `netstandard` one. They are effectively *switched* at the app level, but your shared logic uses the *bait* to compile ;-)

So, how can you preserve the run-time characteristics you want (namely, high performace!) while still being able to replace the implementation (say, for a mock `IGeocoding` or the like) in the example above?

# The Test And Switch Pattern

In many cases, ensuring your app logic is properly covered by tests, authoring and running those tests for the desktop is enough. After all, you don't typically need to unit test the actual underlying platform APIs, since ensuring those work properly is the task of the platform/library providers (i.e. Xamarin, Google, Apple).

In this case, when the desktop test project references your shared app library project, it will **switch** the reference to Caboodle for the `netstandard` one, since it will be the closest to the test project target framework (i.e. `net461`). For the Caboodle example, the [test project](https://github.com/kzu/Caboodle/blob/testable/Samples/Caboodle.Samples.Tests/Caboodle.Samples.Tests.csproj) would look like the following:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net461</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Moq" Version="4.8.2" />
    <PackageReference Include="xunit" Version="2.3.1" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.3.1" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\Caboodle.Samples\Caboodle.Samples.csproj" />
  </ItemGroup>

</Project>
```

We can take advantage of the knowledge about the *switch* behavior and provide the necessary testable abstractions **only on the netstandard** *bait* library. The original [GeoCoding.netstandard.cs](https://github.com/xamarin/Caboodle/blob/master/Caboodle/Geocoding/Geocoding.netstandard.cs) looks like this currently:

```csharp
public partial class Geocoding
{
    public static Task<IEnumerable<Placemark>> GetPlacemarksAsync(double latitude, double longitude) =>
        throw new NotImplentedInReferenceAssembly();

    public static Task<IEnumerable<Location>> GetLocationsAsync(string address) =>
        throw new NotImplentedInReferenceAssembly();
}
```

We can [modify it as follows](https://github.com/kzu/Caboodle/blob/testable/Caboodle/Geocoding/Geocoding.netstandard.cs):

```csharp
public partial class Geocoding
{
    // Allows parallel tests to set their own IGeocoding
    static AsyncLocal<IGeocoding> current;

    // Public setter for tests to replace the implementation
    public static IGeocoding Current
    {
        get => current.Value;
        set => current.Value = value;
    }

    // Backwards-compatible change to pass-through to the replaced implementation if found
    public static Task<IEnumerable<Placemark>> GetPlacemarksAsync(double latitude, double longitude) =>
        Current?.GetPlacemarksAsync(latitude, longitude) ?? throw new NotImplentedInReferenceAssembly();

    public static Task<IEnumerable<Location>> GetLocationsAsync(string address) =>
        Current?.GetLocationsAsync(address) ?? throw new NotImplentedInReferenceAssembly();
}

// This interface exists *only* in this file, therefore, *only* on netstandard target framework
public interface IGeocoding
{
    Task<IEnumerable<Placemark>> GetPlacemarksAsync(double latitude, double longitude);

    Task<IEnumerable<Location>> GetLocationsAsync(string address);
}
```

With that in place, and without *any* changes to the view model, which continues to invoke the static `Geocoding` methods, we can successfully replace the implementation with a mock like you'd typically do:


```csharp
[Fact]
public void Get_Address()
{
    Geocoding.Current = Mock.Of<IGeocoding>();

    Mock.Get(Geocoding.Current)
        .Setup(x => x.GetPlacemarksAsync(10, 20))
        .ReturnsAsync(new Placemark[] { new Placemark { FeatureName = "Test" } });

    var viewModel = new GeocodingViewModel();

    viewModel.Latitude = "10";
    viewModel.Longitude = "20";

    viewModel.GetAddressCommand.Execute(null);

    Assert.NotNull(viewModel.GeocodeAddress);
    Assert.Contains("FeatureName: Test", viewModel.GeocodeAddress);
}
```

And now you have a fully testable Geocoding that still is very performant at run-time when you ship your app. You can [take a look at the whole PR](https://github.com/xamarin/Caboodle/pull/81) that showcases this approach against the current `Geocoding` API.

## Benefits and Trade-Offs

One benefit of *test and switch* is that your shared app library logic is somewhat simpler, since you have one less dependency in its constructor (if you continue using it for the other dependencies, you don't need to pass `IGeocoding` around anymore, say), while still retaining its testability. You might even decide it's flexible enough to leverage in your custom libraries too!

Also, the run-time performance that you'd expect from not having a null ref check (for a singleton access or even constructor dependency-set field) as well as no virtual method lookup (from an interface) is preserved. 

The trade-off is that you cannot use this trick to run tests on device or simulator, since the device runner will pick up the platform-specific *switch* API. So if you want to author device tests, you still need something else, possibly some IL-emitting thing at either compile-time or run-time (i.e. https://github.com/tonerdo/pose). 

But those on-device tests are likely more acceptance/integration tests anyway, so it might be that you don't need this at all.

Alternatively, a separate NuGet package (such as `Caboodle.Mocks`) that you can install directly on the device tests can replace the *switch* assembly with one that has the same API as the `netstandard` *test and switch* one I showed above.


I would love to hear your feedback on this approach and if it makes sense in the context of Xamarin and unit testing your apps.

Thanks!