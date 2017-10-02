---
title: "Building like a Pro: A Primer"
description: "In this second installment of the series, I showcase the basic core concepts in 
MSBuild that will get you up and running quickly, with concrete examples to try out the various 
constructs."
tags: [msbuild]
---

In this second installment in [the series]({{ site.baseurl }}{% post_url 2017-09-21-building-like-a-pro-introduction %}), 
I'll showcase the core concepts in MSBuild that will get you up and running quickly, with 
concrete examples to try out the various constructs.

If you have never tweaked your `.csproj`s in any significant way (i.e. beyond adding 
a `Condition` here and there or tweaking a properly value), a quick overview of the 
core concepts in MSBuild would be helpful before we move on to more advanced topics.

A build typically uses *properties* (i.e. `Configuration` with a value of `Release`) 
and *items* (i.e. all `.cs` files in a project) to produce some output (i.e. a `.dll`, 
`.nupkg`, etc.) by processing then using *tasks* (i.e. `Copy` a file, or `Csc` to invoke the 
C# compiler), which are grouped in *targets* (i.e. `Build`, `Compile`, `Publish` and so 
on).

A farily useful analogy with a programming language might be:

* properties > scalar (string) values
* items > arrays
* target > method declaration
* task > method invocation

Make sure you create an empty (say) `test.proj` file in a new empty directory, 
keep it open in an editor (i.e. VS Code or VS 2017+) and also keep a developer 
command prompt opened in the same directory as we go along. That's *key* to 
learning this thing ;).

I suggest you use the following MSBuild switches on *every* `msbuild` run from 
now on:
* `/nologo`: avoids rendering the MBuild version and copyright information, unnecessary 
in order to learn to learn MSBuild ;)
* `/v:m`: short form of `/verbosity:minimal` so that you only see output we render 
  explicitly and nothing more. Useful when learning to cut down the noise

Optionally, for the more advanced scenarios and to understand more of the inner 
workings and the MSBuild evaluation:
* `/bl`: automatically generates an `msbuild.binlog` file for advanced inspection of 
  the build process. Can be opened with the [MSBuild Structured Log Viewer](https://github.com/KirillOsenkov/MSBuildStructuredLog) on Windows

> Pro Tip: except for the core MSBuild XML elements, it's important to remember that pretty much 
> everything is case-insensitive in MSBuild, even target, property, item and task names and even 
> task parameters!

## Targets

Without a `Target` to execute, a project cannot do anything. There is nothing to invoke. All a target needs at a minimum is a name, like:

```xml
<Project>
    <Target Name="Test" />
</Project>
```

If you run `msbuild /nologo /v:m` you will esentially get an empty output in the console. 
Even if such a target seems really pointless right now, there are use cases where it's 
actually useful, which we'll learn in a future post. 

To compare the output, running just `msbuild` would get you something like:

```
Microsoft (R) Build Engine version 15.3.409.57025 for .NET Framework
Copyright (C) Microsoft Corporation. All rights reserved.

Build started 9/22/2017 12:42:49 AM.

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:00.32
```

and `msbuild /nologo`:

```
Build started 9/22/2017 12:43:22 AM.

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:00.32
```

From now on I'll omit `/nologo` and `/v:m` but remember to add them always to get the 
clean output.

> NOTE: unlike *Tasks*, *Targets* cannot receive arguments, so they are more like 
> parameterless void methods or entry points (i.e. `void Main()`).

If your project has more than one target, you can specify which one to run with 
`msbuild /t:TARGET`, such as `msbuild /t:test` (that the target name is case-insensitve 
too). You can also specify that more than one target should run in sequence, like 
`msbuild /t:build;test`

Our empty target would essentially be the equivalent of an empty-bodied method. It needs 
a body now to do something, which is typically made of tasks.

## Tasks

As mentioned, you can think of a task as a (optionally parameterized) method invocation. 
There are many built-in tasks for common operations (like copying, reading, writing and 
deleting files, executing external tools and so on), but you can also author and consume 
custom tasks.

One very useful task while learning is `Message`, which receives just two arguments: 
`Text` and `Importance` and renders that to the output:

```xml
<Project>
    <Target Name="Test">
        <Message Text="Hello World!" Importance="high" />
    </Target>
</Project>
```

If you run `msbuild` you will now get the expected message in the output window:

```
C:\source\test>msbuild test.proj /nologo /v:m
  Hello World!

C:\source\test>
```

Note that since almost everything is case-insensitive in MSBuild, you could also have written that 
as:

```xml
<Project>
    <Target Name="Test">
        <message text="Hello World!" importance="High" />
    </Target>
</Project>
```
But intellisense for the built-in tasks will guide you towards the `PascalCase` style typically.

Now let's say you want to allow the build to configure the message to render in that task. 
That's what you'd use a *Property* for.

## Properties

As mentioned, a property contains a scalar (string) value, and is declared within a
`<PropertyGroup>` enclosing element, such as:

```xml
<Project>
    <PropertyGroup>
        <Message>Hello World!</Message>
    </PropertyGroup>
</Project>
```

Properties are referenced using the `$` sign and enclosed in parenthesis, like `$(Configuration)`. 
Let's replace the `Text` parameter in the task with the property:

```xml
<Project>
    <PropertyGroup>
        <Message>Hello World!</Message>
    </PropertyGroup>

    <Target Name="Test">
        <Message Text="$(Message)" Importance="high" />
    </Target>
</Project>
```

Running `msbuild` will yield the exact same output as before, since we haven't changed the contents 
of the message. 

Note that there is no ambiguity nor conflict between a *Task* named `Message` and a *Property* named 
the same, since the XML element is used in different contexts: the former can only be used as a 
direct child of `<Target>` and the latter as a child of `<PropertyGroup>`. Referencing the property 
always happens either inside an attribute or inside the content of another property, and is always 
wrapped with `$()`. 

You can also mix constant strings with property references, such as:

```xml
<Project>
    <PropertyGroup>
        <Name>kzu</Name>
    </PropertyGroup>

    <Target Name="Test">
        <Message Text="Hello $(Name)!" Importance="high" />
    </Target>
</Project>
```
output:
```
C:\source\test>msbuild test.proj /nologo /v:m
  Hello kzu!
```

Finally, you can also reference properties when declaring other properties:

```xml
<Project>
    <PropertyGroup>
        <Name>kzu</Name>
        <message>Hello $(name)!</message>
    </PropertyGroup>

    <Target Name="Test">
        <Message Text="$(Message)" Importance="high" />
    </Target>
</Project>
```
(which would render the same message as the previous example)

Note that the property names are case-insensitive, and although you could use such a confusing 
mixed casing, I don't recommend doing so for obvious readability reasons ;).

Properties are fully mutable at any point during execution, and they are evaluated in document order. 
If you reference a property before it is declared, or a non-existent property altogether, you just 
get an empty string. There is simply no way to distinguish between an undeclared property and one 
that has an empty value. 

You can also specify a value for a property via the command line, like `msbuild /p:name=Daniel`:

```
    Hello Daniel!
```

It might be a bit confusing to see that message since we are clearly setting the value of the property
to something else in the project. The reason for this is that by default, *any* MSBuild property can be overriden with the command line `/p` switch, even if it's assigned unconditionally in the project.

In order to avoid this default behavior and allow the project-determined value to prevail, you can 
add the following attribute to the `Project`:

```
<Project TreatAsLocalProperty="Name">
    ...
```

This signals to MSBuild that the project can modify the value of the property locally. If you run 
again `msbuild /p:name=Daniel`, you will see that the message is `Hello kzu!` this time around.

In addition, environment variables are automatically exposed as properties, such as `USERNAME`. 
Basically everything you can `echo %VARNAME%` in the console, you can reference in MSBuild with
`$(VARNAME)`.

> Pro Tip: somewhat confusingly, environment variables are *always* overridable by the MSBuild 
> project, without needing the `TreatAsLocalProperty` project attribute.

In the above example, we could replace the hardcoded `kzu` with the corresponding envvar instead:

```xml
<Project>
    <PropertyGroup>
        <Name>$(USERNAME)</Name>
        <Message>Hello $(Name)!</Message>
    </PropertyGroup>

    <Target Name="Test">
        <Message Text="$(Message)" Importance="High" />
    </Target>
</Project>
```

## Items

Say we want to allow more than one name above. We'd use an item group instead:

```xml
<Project>
    <ItemGroup>
        <Name Include="kzu" />
        <Name Include="daniel" />
    </ItemGroup>
</Project>
```

Items are added to the "array" `Name` (the element name within the item group becomes the 
name of the array, so to speak) by "including" them via the `Include` attribute. 

The simplest way to reference the items is with `@(ITEM)`:

```xml
    <Target Name="Test">
        <Message Text="Hello @(Name)" Importance="High" />
    </Target>
```

would render: 

```
Hello kzu;daniel
```

The `Text` attribute/parameter for the `Message` task is a simple string, and therefore an 
automatic conversion from the array `@()` to a string scalar is performed by concatenating 
the items with the default separator `;`. In this case, it would look better if we changed 
the separator to a `, ` instead, which can be done as follows:

```xml
    <Target Name="Test">
        <Message Text="Hello @(Name, ', ')." Importance="High" />
    </Target>
```

Which would render on build like: 

```
Hello kzu, daniel.
```

If we wanted to render a full message for each name, we'd need to `foreach` on the items. 
This can be done by using the `%()` construct instead. Update the target as follows:

```xml
    <Target Name="Test">
        <Message Text="Hello %(Name.Identity)." Importance="High" />
    </Target>
```

Which would render on build like: 

```
  Hello kzu.
  Hello daniel.
```

This is called *batching* and is a key concept we will explore further in future posts because 
it's key to several advanced scenarios including incremental builds.

Note that we can't just do `%(Name)`. The `Identity` is a built-in *item metadata* which is 
the value of the `Include` element in the `<Name>` item declarations. Items can also have 
custom metadata, such as:

```xml
<Project>
    <ItemGroup>
        <Name Include="kzu" FullName="Daniel Cazzulino" />
        <Name Include="daniel" FullName="ditto ;)" />
    </ItemGroup>
</Project>
```

We could reference the new custom metadata just like the built-in metadata:

```xml
    <Target Name="Test">
        <Message Text="Hello %(Name.FullName)." Importance="High" />
    </Target>
```


## Conditions

Conditionally changing the outcome of the build is also a core characteristic in most cases, 
such as building differently for `Debug` vs `Release` builds. MSBuild has a consistent and 
general mechanism for conditionally evaluating all the core elements discussed so far, by 
simply appending a `Condition` attribute on them. A condition attribute must evaluate to 
a string that can be parsed as a boolean (in a case insensitive manner, as everything else, 
such as 'true' or 'False');

Going back to our example of the overridable `Name` property for the greeting message, 
we might want to make the property overridable either via a command line `/p:Name=` argument 
or via an environment variable. As mentioned, the first case is always covered even if we 
assign a "default" hardcoded value within the project, but to account for the environment 
variable override, we must check for an empty value, before assigning the "default", since 
otherwise we'd overwrite the envvar-provided value:

```xml
    <PropertyGroup>
        <Name Condition="'$(Name)' == ''">kzu</Name>
        <Message>Hello $(Name)!</Message>
    </PropertyGroup>
```

That property can now be safely overriden by both environment variables and commadn line 
arguments.

The condition could be placed in the entire `PropertyGroup` too, for the case where the 
entire `Message` is overriden:

```xml
    <PropertyGroup Condition="'$(Message)' == ''">
        <Name Condition="'$(Name)' == ''">kzu</Name>
        <Message>Hello $(Name)!</Message>
    </PropertyGroup>
```

Conditions on targets skip the entire target's execution:

```xml
<Project>
    <Target Name="Test" Condition="'$(RunTest)' == 'true'">
        <Message Text="$(Message)" Importance="High" />
    </Target>
</Project>
```

Individual tasks can also be conditioned exactly the same way:

```xml
<Project>
    <Target Name="Test">
        <Message  Condition="'$(Greet)' == 'true'" Text="$(Message)" Importance="High" />
    </Target>
</Project>
```


That's basically it for the very basic concepts that you can use to start creating build 
scripts, IMO. You can read more at the official [MSBuild Concepts](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-concepts) documentation.

[< Previous: Introduction]({{ site.baseurl }}{% post_url 2017-09-21-building-like-a-pro-introduction %})