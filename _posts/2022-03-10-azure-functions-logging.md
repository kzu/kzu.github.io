---
title: "How to do Azure Functions Logging with DI"
description: |
  Dependency injection-based logging via ILogger<T> in 
  Azure Functions doesn't quite work the way you would 
  expect. In this post, I show the problem, and the 
  solution.

tags: [dotnet, azure, functions]
---

**TL;DR;**:
<details>
  <summary>Just show me the code!</summary>
  
```csharp
[assembly: FunctionsStartup(typeof(Startup))]

public class Startup : FunctionsStartup
{
    public override void Configure(IFunctionsHostBuilder builder)
    {
        // Replace ILogger<T> with the one that works fine in all scenarios 
        var logger = builder.Services.FirstOrDefault(s => s.ServiceType == typeof(ILogger<>));
        if (logger != null)
            builder.Services.Remove(logger);

        builder.Services.Add(new ServiceDescriptor(typeof(ILogger<>), typeof(FunctionsLogger<>), ServiceLifetime.Transient));
    }

    class FunctionsLogger<T> : ILogger<T>
    {
        readonly ILogger logger;
        public FunctionsLogger(ILoggerFactory factory)
            // See https://github.com/Azure/azure-functions-host/issues/4689#issuecomment-533195224
            => logger = factory.CreateLogger(LogCategories.CreateFunctionUserCategory(typeof(T).Name));
        public IDisposable BeginScope<TState>(TState state) => logger.BeginScope(state);
        public bool IsEnabled(LogLevel logLevel) => logger.IsEnabled(logLevel);
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            => logger.Log(logLevel, eventId, state, exception, formatter);
    }
}
```

</details>

There is a bit of an unfortunate situation with [Azure Functions' ILogger](https://github.com/Azure/Azure-Functions/issues/1256) 
implementation. To sumarize: the DI-injected `ILogger<T>` at the class level, won't log to the 
[Console by default](https://github.com/Azure/Azure-Functions/issues/1256), and even if you bump 
the logging level like so in `host.json`:

```json
{
  "version": "2.0",
  "logging": {
    "logLevel": {
      "<namespace>.MyService": "Information"
    }
  }
}
```

it won't then [log to the log stream](https://github.com/Azure/Azure-Functions/issues/1256#issuecomment-609368420).

There is a [convoluted workaround](https://github.com/Azure/azure-functions-host/issues/4689#issuecomment-533195224) 
documented for it, but heck, it makes the DI side totally *not* transparent. The workaround involves changing your 
dependency from `ILogger<T>` to `ILoggerFactory` and calling it passing the user category obtained from calling 
`Microsoft.Azure.WebJobs.Logging.LogCategories.CreateFunctionUserCategory("{FunctionName}")`. Yuck. 

So, the entirely DI-based and transparent solution for this is to simply replace the registered service type 
for `ILogger<T>` with an implementation that does the right thing.

We start by creating a functions startup class:

```csharp
[assembly: FunctionsStartup(typeof(LoggingStartup))]

public class LoggingStartup : FunctionsStartup
{
    public override void Configure(IFunctionsHostBuilder builder)
    {
    }
}
```

You can have multiple such startup classes, so you can nicely factor each responsibility separately.

The overriden configuration will next lookup the relevant service registration and remove it, 
and finally add the new one:

```csharp
    public override void Configure(IFunctionsHostBuilder builder)
    {
        // Replace ILogger<T> with the one that works fine in all scenarios 
        var logger = builder.Services.FirstOrDefault(s => s.ServiceType == typeof(ILogger<>));
        if (logger != null)
            builder.Services.Remove(logger);

        builder.Services.Add(new ServiceDescriptor(typeof(ILogger<>), typeof(FunctionsLogger<>), ServiceLifetime.Transient));
    }
```

Finally, the new generic logger takes care of doing what the documented workaround suggests, and 
passes through all method calls to the inner logger:

```csharp
    class FunctionsLogger<T> : ILogger<T>
    {
        readonly ILogger logger;

        public FunctionsLogger(ILoggerFactory factory)
            // See https://github.com/Azure/azure-functions-host/issues/4689#issuecomment-533195224
            => logger = factory.CreateLogger(LogCategories.CreateFunctionUserCategory(typeof(T).FullName));

        public IDisposable BeginScope<TState>(TState state) => logger.BeginScope(state);
        public bool IsEnabled(LogLevel logLevel) => logger.IsEnabled(logLevel);
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            => logger.Log(logLevel, eventId, state, exception, formatter);
    }
```

With this, your function classes can now take a proper dependency via the constructor:

```csharp
namespace Devlooped;

public record Hub(ILogger<Hub> Log)
{
    [FunctionName(nameof(Echo))]
    public string Echo(
        [HttpTrigger(AuthorizationLevel.Anonymous, "GET", Route = "echo/{message?}")] HttpRequestMessage req,
        string? message)
    {
        Log.LogInformation("This works! Got '{0}'", message);
        return message;
    }
}
```

And you can see the results in:

![screenshot of functions logging](/img/azure-functions-logging.png)

Which you see after tweaking the `host.json` to bump the log level for the relevant category:

```json
{
  "version": "2.0",
  "logging": {
      ...
    },
    "logLevel": {
      "default": "Warning",
      "Function.<part or full namespace + type name>": "Warning"
    }
  }
}
```

Since the custom logger is using `LogCategories.CreateFunctionUserCategory(typeof(T).FullName))`, you 
can bump logging selectively by namespaces, say. Note that the category will always 
start with `Function`, and that's what the log streaming uses on the server side to 
filter out messages, which is why the first "solution" doesn't quite work as-is.

Enjoy!