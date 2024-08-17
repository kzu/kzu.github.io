---
title: "Beautiful dotnet test summary reports"
tags: [dotnet, test, cli]
---

Running tests across multiple projects in a solution doesn't 
have to look like the 90s in today's console. Now you can 
use a simple dotnet global tool to get an intuitive glimpse 
at what happened with that last test run that resulted in 
gazillion lines of text :)

**TL;DR;**:

----

Install:
```shell
dotnet tool install -g dotnet-trx
```
Run:

```shell
dotnet test -l trx; trx
```

----

The out-of-the-box reporting on test run results in dotnet is at this 
point an embarassment. So I set out to build something for myself that 
brought back some joy in running tests from the console. The result 
is a dotnet global tool that doesn't require any changes in your current 
flow, other than just adding the trx logger. The tool then does its 
magic by loading the generated files and presenting the summary in an 
intuitive rendering:

![Demo](https://raw.githubusercontent.com/devlooped/dotnet-trx/main/assets/img/demo.png)


The tool is trivial to install as it is a dotnet global tool:

```shell
dotnet tool install -g dotnet-trx
```

And can be run from any folder where a previous test run generated 
`.trx` files, and it will perform a recursive discovery and agregation 
of all results. You run it simply with `trx`. You'd typically invoke 
it right after running tests, as follows:

```shell
dotnet test --logger trx; trx [--output].
```

> NOTE: `--output` will collect and add the test console output, i.e. from `ITestOutputHelper` in xUnit.

Of course, one of the places where running tests from the CLI is 
unavoidable, is in CI, particularly in GitHub Actions which is what 
I use the most. In this context, it's quite useful to be able to see 
the summary from the workflow summary itself:

![job summary](https://github.com/user-attachments/assets/9a2b4410-edc0-4ff3-afe0-f3c50a73466c)

But in addition, that report is also aggregated as a single pull request 
comment:

![single comment](https://github.com/user-attachments/assets/adec9488-a22c-414f-a3d9-54c60e6e5bfc)

The coolest part of the report is that it's reused across PR workflow 
runs (so its overwritten by subsequent runs), which avoids polluting 
a PR with one comment for each subsequent commit that adds to the PR. 
Moreover, results are even aggregated across jobs within the same run 
(i.e. from OS-based matrix runs):

![PR comment](https://raw.githubusercontent.com/devlooped/dotnet-trx/main/assets/img/comment.png)

The report leverages GitHub markdown to provide collapsible regions 
for each OS, where you can expand to see individual tests and their 
outcome, or even inspect a failing test error and even console output:

![image](https://github.com/user-attachments/assets/8b6d135b-6060-49e4-84c1-29719d1b6923)

For the GitHub integration, the tool uses the [GitHub CLI](https://cli.github.com) 
tool, which in CI is already present and properly authenticated by default. 


Enjoy!
  