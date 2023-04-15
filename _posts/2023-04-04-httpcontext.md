---
title: "Access HttpContext from everywhere"
excerpt: |
  Being such a common way to access the current user 
  Claims, I thought Accessing HttpContext.User would be 
  really straightforward in ASP.NET Core. But it's not.
tags: [dotnet, aspnet, blazor]
---

Ok, so I totally get why you shouldn't rely on statics for 
this kind of thing. Makes perfect sense. What doesn't make 
sense is for such a ubiquitous thing as accessing the current
user to be so hard to do in ASP.NET Core. Just look at the 
options in the [official documentation](https://learn.microsoft.com/en-us/aspnet/core/migration/claimsprincipal-current?view=aspnetcore-7.0#retrieve-the-current-user-in-an-aspnet-core-app). 

The One True DI Way should just to be able to add `HttpContext` 
as a dependency anywhere you need it, right? The way to do 
so in ASP.NET Core without "violating" any principles (at 
least the way I understand them) would be to properly expose 
this as a scoped dependency, like so:

```csharp
// Program.cs
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped(sp => sp.GetRequiredService<IHttpContextAccessor>().HttpContext!);
```

Now I can just add `HttpContext` to my fancy primary constructors!
