---
title: "How use Visual Studio, MSBuild or Roslyn previews in GitHub or DevOps CI"
tags: [roslyn, msbuild, ci, github, devops]
---

If you want to leverage the many [awesome C# 9 features](https://devblogs.microsoft.com/dotnet/welcome-to-c-9-0/), including [roslyn source generators](https://devblogs.microsoft.com/dotnet/introducing-c-source-generators/) like [ThisAssembly](https://github.com/kzu/ThisAssembly), all of which require the [latest and greatest .NET 5.0 preview](https://devblogs.microsoft.com/dotnet/announcing-net-5-0-rc-1/), it would be a pity to have to give up the safety net of your CI builds (whether GitHub Workflows or Azure DevOps pipelines) just because they don't provide hosted images with the relevant bits. 

This post shows how to install and use the latest Visual Studio preview from your build script.

> Yes, it might just be enough to install the .NET Core RC and use `dotnet build` and `dotnet test`. In some cases you do need a full Visual Studio depending on your project.

The key to enabling this scenario is a little awesome (if I might say so) dotnet global tool called [dotnet-vs](https://github.com/kzu/dotnet-vs): "A global tool for running, managing and querying Visual Studio installations". It's a cool little thing [Adrian Alonso](https://github.com/adalon) and myself created to more easily manage multiple versions of Visual Studio installed side by side. It can get [quite crazy at times](https://twitter.com/kzu/status/935212419445555201). 

The tool allows, among other things, to query installed VS versions and install new ones, including adding/removing components. It internally uses [vswhere](https://github.com/Microsoft/vswhere) as well as the [Visual Studio installer command line](https://docs.microsoft.com/en-us/visualstudio/install/use-command-line-parameters-to-install-visual-studio?view=vs-2019) to achieve a seamless experience.

So, on to the actual scripts that are really quite simple.

## GitHub Workflow

The [whole build workflow](https://github.com/kzu/NuGetizer/blob/main/.github/workflows/build.yml) (which you can [see in action](https://github.com/kzu/NuGetizer/actions) too) is:

```yml
name: build
on: push

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-dotnet@v1
        with:
          dotnet-version: 3.1.x
      - run: dotnet tool update -g dotnet-vs
      - run: echo "::set-env name=MSB::$(vs where preview --prop=InstallationPath)"
      - run: vs install preview --quiet +Microsoft.VisualStudio.Component.ManagedDesktop.Core +Microsoft.NetCore.Component.DevelopmentTools
        if: env.MSB == ''
      - run: echo "::add-path::$(vs where preview --prop=InstallationPath)\MSBuild\Current\Bin"
      - run: msbuild -r
      - run: msbuild -t:test
```

Relevant steps:

1. Install/update to latest & greatest dotnet-vs by simply using `dotnet tool update -g`. That will install the tool if it's not there, and ensure it's the latest otherwise. I do this because if VS preview requires some newer command args in the future, the latest `dotnet-vs` tool will likely support that too.
2. The syntax for [setting an environment from a GH action](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#setting-an-environment-variable) is a bit weird, but the notable thing here is that the `run` command will actually run Powershell Core by default, unlike on DevOps where it runs cmd.exe (on Windows agents, in both cases):
   
   ![RunPwsh.png](https://raw.githubusercontent.com/kzu/img/main/2020/09/23-16-30-25-RunPwsh.png)
   So we take advantage of that fact and just run  the `vs where` command inline to set the value of the installation directory for a preview version of VS. The `dotnet-vs` tool [where command](https://github.com/kzu/dotnet-vs#where) will return the raw value from that execution, or an empty string if no such version is found.
3. We use that as the condition for the `vs install` so that we only do so if the preview isn't there already. Note how you can add any [supported workload or component ID](https://docs.microsoft.com/en-us/visualstudio/install/workload-component-id-vs-community?view=vs-2019) to the installation with the simple `+[ID]` syntax. There are also [shorter aliases](https://github.com/kzu/dotnet-vs#workload-id-switches) for common workloads like `+core +desktop +azure +mobile`, say. The ones I'm installing in this case are just the minium I need, so I can get the install in [just about ~5 minutes](https://github.com/kzu/NuGetizer/runs/1156719236)! 
4. We finally use the same "trick" as step 2 for adding the MSBuild path to the `%PATH%` so that we can finally just run `msbuild`.



All in all, pretty straightforward and concise. I love it how GitHub `run` actions are rendered by default using the frst line of the command. I wish Azure DevOps did the same, instead of showing just `CmdLine` and forcing you to always annotate steps with `displayName`.



## Azure DevOps

 The [whole build pipeline](https://github.com/kzu/NuGetizer/blob/main/azure-pipelines.yml) (which you can [see in action](https://github.com/kzu/NuGetizer/runs/1155971002) too) is:

```yml
pool:
  vmImage: 'windows-2019'
steps:
- checkout: self

- task: UseDotNet@2
  inputs:
    packageType: sdk
    version: 3.1.x
    performMultiLevelLookup: true

- script: dotnet tool update -g dotnet-vs
- pwsh: echo "##vso[task.setvariable variable=MSB]$(vs where preview --prop=InstallationPath)"
- script: vs install preview --quiet +Microsoft.VisualStudio.Component.ManagedDesktop.Core +Microsoft.NetCore.Component.DevelopmentTools
  condition: eq(variables['MSB'], '')
- pwsh: echo "##vso[task.prependpath]$(vs where preview --prop=InstallationPath)\MSBuild\Current\Bin"
- script: msbuild -r
- script: msbuild -t:test
```

(I removed all the `displayName` for conciseness). 

You can see that the structure is pretty much the same as for GitHub workflows. Note that we need to explicitly choose to run with powershell by using `pwsh` instead of `script`, so that the inline execution of `vs` commands when expanding the string for the variables works the same way. We use the `##vso[task.XXX]` syntax in this case instead. 

The condition syntax in GitHub workflows is also so much nicer :).



And that is all you need to install quickly (both in ~5' in this combination of components) and build in CI using the latest and greatest C# features!
