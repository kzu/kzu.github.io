---
title: "Blazor client side debugging"
excerpt: |
  How to avoid the issue where the server-side debugging 
  attaches properly but the client-side (browser) doesn't 
  in time and the connection is dropped or breakpoints 
  don't hit.
tags: [dotnet, aspnet, blazor]
---

I'm playing (and enjoying!) Blazor WebAssembly like hell. 
It's an awesome platform and seems like the Right Way to 
do webdev, at least to a C# junkie like myself.

Anyway, shortly after starting with actual code (and not 
just the default template unfolded by VS), I noticed that 
I had more and more dropped connections where the launched 
browser would just exit and I had to constantly restart the 
debugging session. 

I asked Bing chat and it had this to say:

![Bing chat says it's a known issue](/img/blazor-debugging-bing.png)

> This is a known issue in Blazor projects at this time. The debugger launches slower/quicker than the project assembly and doesn’t have time to “see” the assembly 2. Here is a fix until they solve this: add a delay in Program.cs so that when the project launches in debug mode, it gives the debugger time to attach properly 2.

Bummer! The solutions recommended at github and stackoverload 
weren't very reliable or optimal, so I came up with my own 
approach that essentially involves:

1. New endpoint in server (`Program.cs`) that returns whether it has 
   a debugger attached (it's the one that starts more quickly 
   always in my experience):

  ```csharp
  app.MapGet("host/debugging", () => Debugger.IsAttached);
  ```

2. In the Blazor client `Program.cs`, check for 
   `DOTNET_MODIFIABLE_ASSEMBLIES=="debug"` environment variable 
   (which I found is set when launched for potential hotreloading, 
   which is what I'm interested in), and query the above endpoint. 
   If the server is being debugged, pause the launching of the 
   client until the debugger has time to attach to it too:

  ```csharp
  var app = builder.Build();

  // If running with hotreload capability in place, attempt to wait for the debugger to attach.
  if (Environment.GetEnvironmentVariable("DOTNET_MODIFIABLE_ASSEMBLIES") == "debug")
  {
      var http = app.Services.GetRequiredService<HttpClient>();
      // Get the Debugger.IsAttached directly from the host
      var value = await http.GetStringAsync("host/debugging");
      if (bool.TryParse(value, out var debugging) && debugging)
      {
          Console.WriteLine("Server is being debugged. Waiting for debugger to attach to client too...");
          // Dont' wait indefinitely?
          var cts = new CancellationTokenSource(5000);
          while (!Debugger.IsAttached && !cts.IsCancellationRequested)
          {
              Console.WriteLine("Waiting for debugger to attach...");
              Thread.Sleep(1000);
          }
      }
  }

  await app.RunAsync();
  ```

Usually within the first `while` iteration, the client successfully 
detects the attached debugger and now things work consistently 
*always*.


