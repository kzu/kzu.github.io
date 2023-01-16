---
title: "Compile-time automatic dependency injection registrations for .NET"
tags: [di, dotnet, aspnet]
---

[Minimal APIs](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis) bring 
a fresh and clean approach to developing APIs in (ASP).NET 6, with a focus on easy to read 
and minimal clutter coding.

One area where I've always felt the out of the box [dependency injection](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection) 
isn't doing much towards those goals is service registration. Your startup code ends up 
littered with gazillion `builder.Services.AddSingleton<TService, TImplementation>()` (and 
`AddTransient` and `AddScoped` as needed). These are annoying to maintain and are a boring 
repetition of things already stated (and much easier to find) in the type declarations themselves, 
namely: the implementation type and whatever interfaces it implements.

From the long-time exposure to [Visual Studio MEF](https://github.com/microsoft/vs-mef) which 
is required for most VS extensibility work, I came to deeply appreciate the seamless way you 
just annotate your types and let the host (VS in that case) figure out what to register, when 
and how to do it optimally:

```csharp
[Export(typeof(ICommandHandler))]
class MyCommandHandler 
```

In most cases, it's even just `[Export]` (if you depend on the concrete type elsewhere and 
not a particular interface) and optionally a `[PartCreationPolicy(CreationPolicy.Shared)]`
to opt-in to singleton behavior.

The fact that the attribute is in the class declaration itself makes it very easy to see 
how a particular service is registered and its lifetime, make changes as needed, or even 
remove from the container by just commenting out the attribute.

## Run-time vs compile-time Registrations

In the past, I've dealt with this by simply doing an assembly scanning at app startup 
and just invoking the registration methods, but this can have a non-trivial impact on 
app startup time, especially as the project grows and starts having more and more project 
dependencies that also need to be scanned.

Luckily, Roslyn provides a high-performance mechanism to solve this, called 
[incremental generators](https://github.com/dotnet/roslyn/blob/main/docs/features/incremental-generators.md), 
which can scale to large solutions with many assemblies and types so that build time 
isn't impacted severely while still having great run-time caracteristics since you 
perform all expensive evaluation at compile-time.

## Automatic compile-time codegen for registrations

So I put the idea to test and created an [attributed dependency injection](https://www.nuget.org/packages/Devlooped.Extensions.DependencyInjection.Attributed/) 
generation nuget package that allows you to simply annotate types like you would in 
MEF:

```csharp
[Service]
public class MyService : IMyService
{
}
```

Optionally specifying the desired lifetime (which is otherwise 
[Singleton](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.dependencyinjection.servicelifetime?#fields)):

```csharp
[Service(ServiceLifetime.Scoped)]
public class MyService : IMyService
{
}
```

With the package installed, code will be generated automatically for the services in 
the current project or any dependencies, which is essencially an extension method on `IServiceCollection` 
so you can register all discovered services:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add discovered services to the container.
builder.Services.AddServices();
// ...

var app = builder.Build();

// Configure the HTTP request pipeline.
app.MapGet("/", (IMyService service) => service.Message);

// ...
app.Run();
```

### How it works

The extension method looks like the following:

```csharp
static partial class AddServicesExtension
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        AddScopedServices(services);
        AddSingletonServices(services);
        AddTransientServices(services);

        return services;
    }

    static partial void AddScopedServices(IServiceCollection services);
        
    static partial void AddSingletonServices(IServiceCollection services);

    static partial void AddTransientServices(IServiceCollection services);
}
```

Each partial method is then generated in turn and populated with registration 
calls for each service with the respective lifetime, such as:

```csharp
static partial class AddServicesExtension
{
    static partial void AddScopedServices(IServiceCollection services)
    {
        services.AddScoped<MyService>();
        services.AddScoped<IMyService>(s => s.GetRequiredService<MyService>());
    }
}
```

Note that instead of doing `services.AddScoped<IMyService, MyService>()`, the 
generated code registers the implementation first, and then registers the interface 
to resolve it. This allows proper behavior when the service implements more than 
one interface: resolving the scoped service using any of the implemented interfaces 
will result in the same scoped instance being created/retrieved. This is important 
since the generated code will register your services with all the interfaces they 
implement, so you don't need anything except the `[Service]` attribute :). This is the 
most intuitive thing for me, so I made it a built-in convention.

If you instead do multiple `<TService, TImplementation>` registrations, each 
registration gets its own lifetime in the service collection (somewhat surprisingly, 
since the `TImplementation` is only one...). 

## Installing

Just add a package reference to the main project (doing the service registrations) 
and you will automatically get everything you need.

```xml
<PackageReference Include="Devlooped.Extensions.DependencyInjection.Attributed" Version="*" />
```

or via CLI:

```
dotnet add package Devlooped.Extensions.DependencyInjection.Attributed
```

There are some advanced use cases documented in the 
[package readme](https://www.nuget.org/packages/Devlooped.Extensions.DependencyInjection.Attributed/#readme-body-tab) 
too that may be helpful too.


Enjoy!
