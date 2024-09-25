---
title: "Deploying dotnet-isolated function app from CLI"
tags: [dotnet, azure, cli]
---

Whether you're creating a brand-new .NET isolated function app or 
[migrating an existing one](https://learn.microsoft.com/en-us/azure/azure-functions/migrate-dotnet-to-isolated-model?tabs=net8), 
if you're deploying it using the [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-core-tools-reference?tabs=v2), 
you might encounter this error:

```shell
Your Azure Function App has 'FUNCTIONS_WORKER_RUNTIME' set to 'dotnetIsolated' while your local project is set to 'dotnet'.
You can pass --force to update your Azure app with 'dotnet' as a 'FUNCTIONS_WORKER_RUNTIME'
```

The suggestion would do the exact opposite of what we want to achieve!

There is an undocumented flag `--dotnet-isolated` that you can use to specify the dotnet worker runtime, which 
combined with `--force` will ensure the app is updated to use that runtime too, just in case:

```shell
func azure functionapp publish <FunctionAppName> --dotnet-isolated --force
```

This took me quite a while to figure out, so I hope it helps you too.

Enjoy!