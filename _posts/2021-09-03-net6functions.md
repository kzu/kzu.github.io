---
title: "Running (Mostly) Minimal .NET 6 APIs in Azure Functions"
description: |
  A distilled version of a day+ of struggling to get this up and 
  running with in-process .NET 6 Azure Functions in current stable 
  runtime v3, using GitHub Actions for deployment.

tags: [dotnet, azure, functions, serverless]
---

Ok, I have to admit that the [provided instructions](https://github.com/Azure/Azure-Functions/wiki/V4-early-preview#net-60-in-process) aren't bad at all. 
They actually state (most) of the required steps to do this, with a couple key missing pieces that 
caused me some trouble and resulted in quite a few 
[trial-and-error attempts](https://github.com/kzu/MinimalFunctions/commits/main). I'm writing this 
down for my own future reference and hopefully it will save you some time too.

## Why 

First, why is any of this needed at all? Well, basically, at the time of this writing, neither 
.NET 5 nor .NET 6 are officially supported in Azure Functions. This means there isn't a simple 
dropdown to just set the runtime to the upcoming v4:

![screenshot of functions runtime settings page](/img/net6functions-runtimeversion.png)

Up to .NET 5, the documentation stated that the only way to get a newer version of .NET running 
in the current stable Azure Functions runtime was to use out-of-process (OOP), which comes with a 
non-trivial amount of [limitations and requires large changes to your code](https://docs.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide#logging). The 
[stated benefits](https://docs.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide?tabs=browser&pivots=development-environment-vs#benefits-of-running-out-of-process) of this model 
don't outweight the drawbacks, IMHO (at least at this point). Local debugging of the OOP model 
turned out to be quite annoying too, requiring [custom launch profiles](https://github.com/kzu/MinimalFunctions/blob/57ffd73/src/DefaultFunc/Properties/launchSettings.json) 
plus some [startup code](https://github.com/kzu/MinimalFunctions/blob/57ffd73/src/DefaultFunc/Program.cs#L24-L25) 
to make it passable. 

I also usually use [zip deploy from Azure CLI](https://docs.microsoft.com/en-us/azure/azure-functions/deployment-zip-push#cli) in my GitHub Actions which wasn't enough to set the app with the right 
configuration to run .NET 6. 

So, let's get to the *How*.

## How

If you just want to go explore the [sample repo](https://github.com/kzu/MinimalFunctions), just go ahead. 
This remaining of this post explains what's done there, which is also documented in the repo readme.

### Project

The project is basically the same as any other functions project, with the updated `TargetFramework`:

```xml

<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
    <AzureFunctionsVersion>v3</AzureFunctionsVersion>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Azure.Functions.Extensions" Version="1.1.0" />
    <PackageReference Include="Microsoft.NET.Sdk.Functions" Version="3.0.11" />
  </ItemGroup>

  <ItemGroup>
    <None Update="host.json" CopyToOutputDirectory="PreserveNewest" />
    <None Update="local.settings.json" CopyToOutputDirectory="PreserveNewest" CopyToPublishDirectory="Never" />
  </ItemGroup>

</Project>
```

> NOTE: I tried also making the deploy self-contained to work around the az cli deployment
> but that ended up not being necessary when using func CLI for publish


### GitHub Actions Build/Deploy

Even though this goes against [the recommended way, using a publish profile](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions?tabs=dotnet#generate-deployment-credentials), I 
find it much more convenient for CI to use an [Azure Service Principal](https://github.com/Azure/functions-action#using-azure-service-principal-for-rbac-as-deployment-credential) instead. 
The reason is that I can scope these credentials easily to the entire resource group, and perform 
other `Azure CLI` operations I typically need while deploying a real app to production from a 
workflow. 

For this, run the following Azure CLI command:

```
az ad sp create-for-rbac --name [APP_NAME] --role contributor --scopes "/subscriptions/[SUBSCRIPTION_ID]/resourceGroups/[RESOURCE_GROUP]" --sdk-auth
```

Copy the resulting JSON that in the output and add it as a secret to the repo, such as `AZURE_CREDENTIALS`. 
The workflow uses this secret to perform an [Azure Login](https://github.com/marketplace/actions/azure-login) 
with:

```yml
      - name: 🔓 login
        if: github.ref == 'refs/heads/main'
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
```

> NOTE: since I'm deploying only from `main` branch, condition the step to that. This also ensures 
> we don't try to use the secret for PR from forks, for example, where it wouldn't be available by default.

Next comes the Azure Functions v4 CLI tools. As noted [in preview instructions](https://github.com/Azure/Azure-Functions/wiki/V4-early-preview#net-60-in-process), you *need* to deploy using their v4 func CLI tools. 

Zip deployment with the [Azure CLI](https://docs.microsoft.com/en-us/azure/azure-functions/deployment-zip-push#cli) **will not work**. This caused me quite some pain, since even if you 
*can* explicitly set the `FUNCTIONS_EXTENSION_VERSION` function app configuration in the portal 
to `~4`, there is an additional `netFrameworkVersion` setting the func v4 tools sets but can't 
be (I tried!) set manually. The func publish command mentions it when it runs:

```
pwsh> func azure functionapp publish minimalfunction --force
Setting Functions site property 'netFrameworkVersion' to 'v6.0'
...
```

So the [build workflow](https://github.com/kzu/MinimalFunctions/blob/main/.github/workflows/build.yml) 
basically first installs func v4:

```yml
      - name: ⚙ func 4.x
        run: npm i -g azure-functions-core-tools@4 --unsafe-perm true  
```

And then builds and publishes:

```yml
    - name: 🚀 deploy
      if: github.ref == 'refs/heads/main'
      working-directory: ./src/MinimalFunction
      run: func azure functionapp publish [APP_NAME] --force --dotnet-cli-params -- -c:Release
```

You may be tempted to [pass the flag](https://docs.microsoft.com/en-us/azure/azure-functions/functions-core-tools-reference?tabs=v2#func-azure-functionapp-publish) `--no-build` to speed things up here. 
This didn't work for me and I ended up with a non-working function app. Since you will typically need to 
tweak build arguments, it's neat that the func tool will just invoke `dotnet publish` passing any args you 
specify after `--dotnet-cli-params`. Note the ` -- ` (surrounded by whitespace) that's required to seamlessly 
pass additional args verbatim (without resorting to additional quotes or anything).

And here's proof that it's indeed running .NET 6.0:

![screenshot of running functions app with dotnet 6](/img/net6functions-running.png)


## Minimal APIs with Azure Functions?

I know [ASP.NET Core 6 minimal APIs](https://www.bing.com/search?q=asp.net+core+6+minimal+apis) 
are getting quite a bit of attention, but [this looks pretty minimal](https://github.com/kzu/MinimalFunctions/blob/main/src/MinimalFunction/Person.cs) to me for a typical Azure 
Function app:

```csharp
record Person(string FirstName, string LastName, string Runtime, string Version);

record PersonApi(ILogger<Person> Log)
{
    [FunctionName(nameof(GetPerson))]
    public Person GetPerson([HttpTrigger(AuthorizationLevel.Anonymous, "GET", Route = "person")] HttpRequestMessage req)
    {
        Log.LogInformation("We got DI too :)");
        return new Person("Daniel", "Cazzulino", RuntimeInformation.FrameworkDescription, ThisAssembly.Info.InformationalVersion);
    }
}
```

Using records to inject dependencies is so nice, as well as for the payloads themselves.
And since you will most likely be annotating parameters with bindings and other cross-cutting 
concerns, I don't find the lambda-based minimal APIs all that compelling. My guess is that 
you'll end up moving those to separate methods anyway, and that point all you're gaining is 
not having the "wrapper" class. But that's what gives you nice class-level DI that's shared 
across all functions/methods, which is nicer than repeating all arguments in each method 
anyway... Dunno, we'll see how people use that in the wild, I guess.

As for additional configuration you might need before your app starts (the *builder* phase 
of minimal APIs), Azure Functions provides a simple enough [hook to do that too](https://github.com/kzu/MinimalFunctions/blob/main/src/MinimalFunction/Startup.cs):

```csharp
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

[assembly: FunctionsStartup(typeof(Startup))]

public class Startup : FunctionsStartup
{
    public override void ConfigureAppConfiguration(IFunctionsConfigurationBuilder config) 
    {
        var context = config.GetContext();
        var env = context.EnvironmentName;
        var appPath = context.ApplicationRootPath;

        config.ConfigurationBuilder
                .AddJsonFile(Path.Combine(appPath, "appsettings.json"), optional: true, reloadOnChange: false)
                .AddDotNetConfig(appPath)
                .AddJsonFile(Path.Combine(appPath, $"appsettings.{env}.json"), optional: true, reloadOnChange: true)
                .AddJsonFile(Path.Combine(appPath, "local.settings.json"), optional: true, reloadOnChange: true);
    }

    public override void Configure(IFunctionsHostBuilder builder)
    {
        // TODO: configure builder.Services
    }
}
```

In this case, I'm adding ASP.NET's [appsettings](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/?view=aspnetcore-5.0) and [dotnetconfig](https://dotnetconfig.org/), 
for example, and I could also configure DI/services to inject too, just like in "regular" ASP.NET.

I'd say Azure Functions remains my go-to platform for doing serverless compute :) 


Happy NET6-ing! (netsixing?)
