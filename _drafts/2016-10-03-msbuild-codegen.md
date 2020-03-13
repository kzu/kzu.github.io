---
title: "Build Time Code Generation in MSBuild"
description: "If you are not leveraging build-time code generation via MSBuild, here are a number of concrete examples that showcase what you're missing, and why it might be a very powerful addition to your developer toolbox."
tags: [ai2, azure, functions]
---

There are basically two ways of doing build-time code generation with MSBuild:

1. [T4 templates](https://msdn.microsoft.com/en-us/library/ee847423.aspx)
2. [Plain MSBuild](https://mhut.ch/journal/2015/06/30/build_time_code_generation_msbuild)

I've grown steadily against the first one, for the following reasons:

* Transforming the templates on build is *slow*
* It's very hard to determine proper inputs/outputs in a general way, 
  since the T4 template can basically access anything on the machine, 
  making incremental build hard too.
* Requires the VSSDK to be installed (as documented at MSDN, but you can 
  also use [Mono.TextTemplating](https://www.nuget.org/packages/Mono.TextTemplating)
* The transformed source usually ends up in the user' solution


The second approach is significantly better in a number of ways:

* Full control of inputs/outputs for incremental build support
* Deep integration with the project properties and items
* Trivial to generate code that users' don't "see" in their solutions, 
  yet they get full intellisense
* Proven and solid, as shown by the XAML compilation in VS that's been 
  there for ages.


## MSBuild Code Generation Basics

My friend [Mikayla](https://mhut.ch/) already did a great job explaining how 
it works and [how to implement it effective](https://mhut.ch/journal/2015/06/30/build_time_code_generation_msbuild) 
so I won't repeat her words here. It's a great post, so if you read this far, 
you should stop, go read it and come back, or what follows won't make a lot of sense. 

My approach to implementing it is exactly the same Mikayla describes:

* Add a new target to the `CoreCompileDependsOn` property, i.e.:

        <PropertyGroup>
            <CoreCompileDependsOn>
                ...
                GitThisAssembly;
                $(CoreCompileDependsOn)
            </CoreCompileDependsOn>
        </PropertyGroup>

* The new target depends on a code-generating target:

        <PropertyGroup>
            <GitThisAssemblyDependsOn>
                ...
                _GitGenerateThisAssembly
            </GitThisAssemblyDependsOn>
        </PropertyGroup>

* This new target adds the (newly or previously) generated code as `Compile` items:

        <Target Name="GitThisAssembly" DependsOnTargets="$(GitThisAssemblyDependsOn)"
                BeforeTargets="BuildOnlySettings">
            <ItemGroup>
                <Compile Include="$(GitInfoThisAssemblyFile)" />
            </ItemGroup>
        </Target>

* The code-generating target has proper inputs/outputs for incremental code-gen support:

        <Target Name="_GitGenerateThisAssembly" 
                Inputs="@(_GitInput)" Outputs="$(GitInfoThisAssemblyFile)">
            ...
        </Target>


Within the code-generating target, you can use a number of approaches for writing the 
actual output file, which can be as simple as a bunch of calls to the  
[WriteLinesToFile](https://msdn.microsoft.com/en-us/library/ms164305.aspx) task, replacing 
strings in a template file or even invoke a custom task that uses T4 
["run-time text templates"](https://msdn.microsoft.com/en-us/library/ee844259.aspx) if 
the generated code is more involved and requires the flexibility of a templating language.

With that basic structure in mind, let's see a few concrete examples that use the variety 
of approaches mentioned above for code generation.

## 


## GitInfo: Git and SemVer info for MSBuild/C#/VB

I've [written recently](https://www.cazzulino.com/git-info-from-msbuild-and-code.html) on the 
[GitInfo nuget package](https://www.nuget.org/packages/GitInfo) that allows you to consume your 
Git information from code as follows:

![ThisAssembly.Git intellisense](https://www.cazzulino.com/img/msbuild-codegen-1.png)

You can imagine using that information for building your [AssemblyInfo](https://github.com/kzu/GitInfo/blob/master/src/GitInfo/readme.txt#L26-L31) like:

    [assembly: AssemblyVersion (ThisAssembly.Git.SemVer.Major + "." + ThisAssembly.Git.SemVer.Minor + "." + ThisAssembly.Git.SemVer.Patch)]
    [assembly: AssemblyInformationalVersion (
        ThisAssembly.Git.SemVer.Major + "." +
        ThisAssembly.Git.SemVer.Minor + "." +
        ThisAssembly.Git.SemVer.Patch + "-" +
        ThisAssembly.Git.Branch + "+" +
        ThisAssembly.Git.Commit)]

The [GitInfo targets](https://github.com/kzu/GitInfo/blob/master/src/GitInfo/build/GitInfo.targets) file isn't 
exactly trivial, but we'll just focus on the code generation part.











I do sometimes use T4 ["run-time text templates"](https://msdn.microsoft.com/en-us/library/ee844259.aspx), 
which is fundamentally different since it's basically a StringBuilder automated via  
T4 syntax: what you get from those T4 templates is a statically compiled class that can 
take whatever input parameters you define and turn them into a string of the generated 
stuff. You can see an example of this in this [C# interface proxy generator](https://github.com/moq/moq.proxy/blob/0f1b0d7fefa55750d44da9bd632e281f5768ec36/src/Moq.Proxy.Static/Templates/CsInterfaceProxy.tt) 
which "compiles" into the [following text-transforming class](https://github.com/moq/moq.proxy/blob/0f1b0d7fefa55750d44da9bd632e281f5768ec36/src/Moq.Proxy.Static/Templates/CsInterfaceProxy.cs) 
which you [can invoke from code directly](https://github.com/moq/moq.proxy/blob/0f1b0d7fefa55750d44da9bd632e281f5768ec36/src/Moq.Proxy.Tests/GeneratorTests.cs#L27-L34) 
with no T4 dependencies whatsoever.

