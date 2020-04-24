---
title: "Building like a Pro: Defining Process"
description: "In this third installment in the series, we'll explore ways to define the steps in a build process, and the various ways it can be defined."
tags: [msbuild]
---

In this third installment in [the series]({{ site.baseurl }}{% post_url 2017-09-21-building-like-a-pro-introduction %}), we'll explore ways to define the steps in a build process, and the various ways it can be defined.

As explained in [the previous post in the series]({{ site.baseurl }}{% post_url 2017-09-21-building-like-a-pro-a-primer %}), targets are like method declarations 
containing a set of "statements" that usually processes a set of items and properties 
to produce some item, by passing them to tasks, which are akin to parameterized method 
invocations)

There are many ways you can invoke a set of targets in a sequence. You may recall that 
you can invoke multiple targets from the command line:

```
msbuild /t:build;test;installer;publish
```

But if `build` involved its own set of independent steps/targets, it would be quite 
inconvenient to have to list all of them every time. It would also make `build` callers 
aware of the internal details of what `build` does and therefore make them more brittle 
and susceptible to breaking as you keep evolving your build project.

## DependsOnTargets

The first mechanism to define target execution order is to  declare in the target itsef,
what it *depends on* for its work. This dependency chain constitutes the order of 
invocation. A typical example is a `Rebuild` target, which typically involves invoking 
a `Clean` target that removes previously built output and intermediate artifacts, 
followed by a call to `Build`, which produces the new output. 
This is achieved with:

```xml
<Project>
    <Target Name="Build">
        <Message Text="Built!" Importance="High" />
    </Target>

    <Target Name="Clean">
        <Message Text="Cleaned!" Importance="High" />
    </Target>

    <Target Name="Rebuild" DependsOnTargets="Build;Clean" />
</Project>
```

> As you can see, this is a real world case where empty targets make 
perfect sense in MSBulid. 

As expected, if you run `msbuild /t:rebuild /v:m /nologo` you'd get the following 
output:

```
  Built!
  Cleaned!
```

You could also define the `DependsOnTargets` list in a property, since properties 
can be referenced anywhere in the project:

```xml
<Project>
    <PropertyGroup>
        <RebuildDependsOn>
            Clean;
            Build
        </RebuildDependsOn>
    </PropertyGroup>
    ...
    <Target Name="Rebuild" DependsOnTargets="$(RebuildDependsOn)" />
</Project>
```

The effect would be exactly the same. Note that whitespace is not significant in the 
list of targets for a `DependsOnTargets`, so you are free to make it more readable 
when the list grows, which is one typical use case for leveraging this syntax.

Another main use case for this syntax is whenever you want to make the list of 
targets to execute dependent on some condition. For example, if you wanted your CI 
(continuous integration) builds to do additional work in addition to what a local 
build does, you could define the main `Build` target dependencies in the `BuildDependsOn` 
property initialization, and add to it via a conditional property assignement for 
CI scenarios:

```xml
<Project>
    <PropertyGroup>
        <BuildDependsOn>
            DownloadLibs;
            CoreBuild;
            Package;
        </BuildDependsOn>
        <BuildDependsOn Condition="'$(CI)' == 'true'">
            SetupEnvironment;
            DownloadArtifacts;
            $(BuildDependsOn);
            GenerateSummary;
            ReportGitHubStatus;
        </BuildDependsOn>
    </PropertyGroup>
    ...
    
    <Target Name="Build" DependsOnTargets="$(BuildDependsOn)" />
</Project>
```

Whenever `$(CI)` is set to `true`, the extra targets will run as defined, before and 
after the "default" `Build` target dependencies.

Let's modify the `test.proj` to test this out "for real". Paste the following:

```xml
<Project>
    <PropertyGroup>
        <BuildDependsOn>
            CoreBuild;
            Package;
        </BuildDependsOn>
        <BuildDependsOn Condition="'$(CI)' == 'true'">
            $(BuildDependsOn);
            GenerateSummary;
        </BuildDependsOn>
    </PropertyGroup>

    <Target Name="Build" DependsOnTargets="$(BuildDependsOn)">
        <Message Importance="high" Text="Build" />
    </Target>

    <Target Name="CoreBuild">
        <Message Importance="high" Text="CoreBuild" />
    </Target>

    <Target Name="Package">
        <Message Importance="high" Text="Package" />
    </Target>

    <Target Name="GenerateSummary">
        <Message Importance="high" Text="GenerateSummary" />
    </Target>
</Project>
```

For the `'$(CI)' == 'true'`, we're just adding another target that will run after the rest
of the `BuildDependsOn` targets.

If you run `msbuild /v:m /nologo`, you'll get the following output:

```
  CoreBuild
  Package
  Build
```

And adding `/p:CI=true` results in:

```
  CoreBuild
  Package
  GenerateSummary
  Build
```

Note that the `BuildDependsOn` targets are run in ful before the `Build` target runs.

The main benefit of using a `*DependsOn` property to declare dependencies is that it makes it 
easier to clearly visualize the execution order.

## BeforeTargets/AfterTargets

An alternative (or perhaps complementary) mechanism is to instead declare that a given 
target should run before or after another one. For example, in our case above, if we wanted 
to inject a target to run before `GenerateSummary`, we'd have to overwrite the `BuildDependsOn` property to both include the original value it had (`CoreBuild;Package;`) as well as the `CI`-only
ones, injecting yours just before `GenerateSummary`. This is particularly problematic when you're 
extending targets that aren't yours (i.e. when extending the build process for a .NET project).

So instead of trying to extend the `*DependsOn` property, you can just declare that your new 
target needs to run before `GenerateSummary`:

```xml
    <Target Name="BeforeSummary" BeforeTargets="GenerateSummary">
        <Message Importance="high" Text="BeforeSummary" />
    </Target>
```

Without any further changes, running `msbuild /v:m /nologo` results in:

```
  CoreBuild
  Package
  Build
```

Same as before, since the `/p:CI=true` was not specified and therefore the `GenerateSummary` was 
not scheduled to run. Building again with `msbuild /v:m /nologo /p:CI=true` this time, results in:

```
  CoreBuild
  Package
  BeforeSummary
  GenerateSummary
  Build
```

## What's the "right" way?

We could certainly rewrite the entire project to use Before/After targets exclusively:

```xml
<Project>
    <Target Name="Build">
        <Message Importance="high" Text="Build" />
    </Target>

    <Target Name="CoreBuild" BeforeTargets="Build">
        <Message Importance="high" Text="CoreBuild" />
    </Target>

    <Target Name="Package" AfterTargets="CoreBuild">
        <Message Importance="high" Text="Package" />
    </Target>

    <Target Name="GenerateSummary" BeforeTargets="Build" Condition="'$(CI)' == 'true'">
        <Message Importance="high" Text="GenerateSummary" />
    </Target>

    <Target Name="BeforeSummary" BeforeTargets="GenerateSummary" Condition="'$(CI)' == 'true'">
        <Message Importance="high" Text="BeforeSummary" />
    </Target>
</Project>
```

That would achieve the same results, but notice how much harder it is now to figure what's the 
execution order:
- Both `CoreBuild` and `GenerateSummary` have `BeforeTargets=Build`, but which will run first?
- Now `Package` knows about `CoreBuild`
- We had to duplicate the condition on `BeforeSummary`: this is because the `BeforeTargets` in 
  this case is evaluated always for all builds, even if the condition for `GenerateSummary` 
  returns `false`. Previously, `GenerateSummary` wasn't even listed as a dependency on `Build` 
  unless the `CI` property was `true`.

We could also rewrite the entire project to use `DependsOnTargets` exclusively:

```xml
<Project>
    <Target Name="Build" DependsOnTargets="CoreBuild;Package;GenerateSummary">
        <Message Importance="high" Text="Build" />
    </Target>

    <Target Name="CoreBuild">
        <Message Importance="high" Text="CoreBuild" />
    </Target>

    <Target Name="Package">
        <Message Importance="high" Text="Package" />
    </Target>

    <Target Name="GenerateSummary" DependsOnTargets="BeforeSummary" Condition="'$(CI)' == 'true'">
        <Message Importance="high" Text="GenerateSummary" />
    </Target>

    <Target Name="BeforeSummary">
        <Message Importance="high" Text="BeforeSummary" />
    </Target>
</Project>
```

But now `Build` knows about `GenerateSummary`. Although now the condition on that target doesn't 
need to be duplicated on `BeforeSummary` because the dependent targets are only executed if the 
primary target's condition is `true` (or it has no condition).

An important thing to note is that even though `Build` lists all the dependencies, we can still 
explicitly add the dependencies to the invidivual targets. For example, `Package` surely depends on 
`CoreBuild`, and `GenerateSummary` likewise should depend on `Package`:

```xml
<Project>
    <Target Name="Build" DependsOnTargets="GenerateSummary">
        <Message Importance="high" Text="Build" />
    </Target>

    <Target Name="CoreBuild">
        <Message Importance="high" Text="CoreBuild" />
    </Target>

    <Target Name="Package" DependsOnTargets="CoreBuild">
        <Message Importance="high" Text="Package" />
    </Target>

    <Target Name="GenerateSummary" DependsOnTargets="Package;BeforeSummary" Condition="'$(CI)' == 'true'">
        <Message Importance="high" Text="GenerateSummary" />
    </Target>

    <Target Name="BeforeSummary">
        <Message Importance="high" Text="BeforeSummary" />
    </Target>
</Project>
```
