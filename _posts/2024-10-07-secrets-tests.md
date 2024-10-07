---
title: "Condition xunit tests to presence of user secrets"
tags: [dotnet, test, xunit]
---

Sometimes you need some API keys, connection strings and the like in order 
to run your tests. If you're using [user secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-8.0&tabs=windows#secret-manager), 
which is highly recommended, you can share your secrets with your tests 
quite easily by moving the `UserSecretsId` MSBuild property to a [Directory.Build.props](https://learn.microsoft.com/en-us/visualstudio/msbuild/customize-by-directory?view=vs-2022#directorybuildprops-and-directorybuildtargets).

In order for tests to be skipped automatically if the required secrets 
aren't present, you can create custom fact and theory xunit attributes, such as:

```csharp
public class SecretsFactAttribute : FactAttribute
{
    public SecretsFactAttribute(params string[] secrets)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<SecretsFactAttribute>()
            .Build();

        var missing = new HashSet<string>();

        foreach (var secret in secrets)
        {
            if (string.IsNullOrEmpty(configuration[secret]))
                missing.Add(secret);
        }

        if (missing.Count > 0)
            Skip = "Missing user secrets: " + string.Join(',', missing);
    }
}

public class SecretsTheoryAttribute : TheoryAttribute
{
    public SecretsTheoryAttribute(params string[] secrets)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<SecretsTheoryAttribute>()
            .Build();

        var missing = new HashSet<string>();

        foreach (var secret in secrets)
        {
            if (string.IsNullOrEmpty(configuration[secret]))
                missing.Add(secret);
        }

        if (missing.Count > 0)
            Skip = "Missing user secrets: " + string.Join(',', missing);
    }
}
```

With these in place, you can just decorate your tests with the new attributes:

```csharp
public class MyTests
{
    [SecretsFact("OpenAI:Key")]
    public async Task SomeOpenAIApiCallTest()
    {
        // Test code
    }

    [SecretsTheory("OpenAI:Key")]
    [InlineData("gpt-4o")]
    [InlineData("gpt-3.5-turbo")]
    public async Task SomeModelSpecificCall(string model)
    {
        // Test code
    }
}
```

If you perform a clean clone of your repository, the tests will be skipped 
by default, until you provide the required secrets. This also automatically 
avoids running them in CI, for example, unless you populate those secrets 
beforehand. You could do so in GitHub Actions with:

```yml
- name: 🧪 test
run: |
    dotnet user-secrets set --id <your-project-id> "OpenAI:Key" "${{ secrets.OPENAI_KEY }}"
    dotnet tool update -g dotnet-retest
    dotnet retest -- --no-build
```

> NOTE: I'm using the awesome [dotnet-retest](https://github.com/devlooped/dotnet-retest/) 
> to automatically retry (typically transient) test failures, which is not a bad idea when 
> hitting external services like OpenAI, for example.

Enjoy!