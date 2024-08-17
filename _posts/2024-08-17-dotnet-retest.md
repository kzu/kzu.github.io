---
title: "How to run dotnet tests with automatic smart retry"
tags: [dotnet, test, cli]
---

When running dotnet test, there is no built-in mechanism 
to retry failed tests, and constructing the filter format 
for re-running them is non-trivial. This post showcases 
a new dotnet global tool [dotnet-retest](https://nuget.org/packages/dotnet-retest) 
that fixes this.

**TL;DR;**:

Install:

```shell
dotnet tool install -g dotnet-retest
```

Run:

```shell
dotnet retest
```

----


Sometimes, flaky tests are just unavoidable for reasons that are outside 
the scope of this post. If you think those should never happen and never 
DO happen to you, this post is not for you :).

I have tried in the past to work around this by doing fancy bash scripting 
for [CI retries](2021-09-24-dotnet-test-retry.md) but that approach had 
several limitations, not least that it required non-trivial work to incorporate 
across repos and workflows, and worst of all, that it doesn't integrate 
easily with my usual flow of `dotnet build / test`.

In addition, I faced some challenges updating the script for some changes 
in how MacOS installs GNU grep and that was enough. Best to rething the 
solution from scratch.

And the result is a new global tool that runs `dotnet test` as a subprocess, 
similar to how `dotnet watch` works:

```shell
dotnet retest [options] -- [dotnet test options]
```

The `--` separates the options for the `retest` tool itself (number of retries, 
reporting options, etc.) from the ones for `dotnet test`, which obviously 
can receive all the arguments you are currently passing in. 

The smart progress reporting reduces console clutter by reusing the same line 
during the tests run, so you can get a glimpse at what's going on, without 
scrolling the view. 

![retest](https://github.com/user-attachments/assets/c614bdeb-bf6f-4240-9f16-b1a900d899bb)

The tool also incorporates automatic enhanced summary reporting by bringing 
in the implementation from [dotnet-trx](2024-08-17-dotnet-trx.md):

![image](https://github.com/user-attachments/assets/0aaedb9a-b849-46a8-94e1-3e085edd04c1)

Learn more about [dotnet-retest](https://nuget.org/packages/dotnet-retest) in the 
[project repository](https://github.com/devlooped/dotnet-retest)

Enjoy!
  