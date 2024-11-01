---
title: "Showcase your NuGet package stats with fancy badges"
excerpt: |
  NuGet.org doesn't provide much in the way of useful stats you can embed 
  easily in your sites (blog, project readmes, etc.). Shields.io badges 
  combined with static JSON scraped regularly from nuget.org can help.
tags: [dotnet, openai, ai]
---

As part of developing [SponsorLink v2](https://www.cazzulino.com/sponsorlink2.html) I 
needed a mechanism to determine what packages in nuget.org were popular (in terms of 
daily downloads), as well as their source repositories and contributors. This is not 
readily available from NuGet itself.

What I'll show you here is what powers the [OSS Authors](https://www.devlooped.com/SponsorLink/github/oss/) 
page, where you can lookup arbitrary GitHub accounts (user or organization) and see 
what packages they contributed to, as well as the daily download stats for those packages.

The way it works is three-fold:
1. Scrap a static JSON file from nuget.org with the relevant package stats.
2. Host that JSON file in a public location (i.e. github repo or gist).
3. Use shields.io [dynamic JSON badge](https://shields.io/badges/dynamic-json-badge) to 
   render the stats. 

The first step is done by the [dotnet-sponsor](https://www.nuget.org/packages/dotnet-sponsor) tool:

```shell
dotnet tool update --global dotnet-sponsor
sponsor nuget -?
```

Which renders the options for the command:

```
DESCRIPTION:
Emits the nuget.json manifest with all contributors to active nuget packages

USAGE:
    sponsor nuget [OPTIONS]

OPTIONS:
                        DEFAULT
    -h, --help                     Prints help information
        --force                    Force complete data refresh. Otherwise, resume from 'nuget.json' if found
        --with-token               Read GitHub authentication token from standard input for sync
        --owner                    Specific package owner to fetch full stats for
        --gh-only       True       Only include OSS packages hosted on GitHub
        --oss-only      True       Only include OSS packages
```

The command uses the [NuGet API](https://api.nuget.org/v3/index.json) to search for 
packages by the specified `--owner` and download the nuspec to determine source repository 
information. It then uses the [GitHub CLI](https://cli.github.com/) to fetch the contributors. 

If you're already authenticated with the GH CLI, all you need to run is:

```shell
sponsor nuget --tos --oss-only false --owner [OWNER]
```

Note the `OWNER` is the nuget.org account owner, not the GitHub account. `--tos` automatically 
accepts the `dotnet-sponsor` terms of service. Note how you can get package stats for packages 
that aren't OSS or where the source repository is not on GitHub.

The result of this invocation is a `[OWNER].json` file like [mine](https://github.com/devlooped/nuget/blob/main/kzu.json). 

Once you upload the file somewhere public, you can now create badges like the following:

[![NuGet Packages](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fdevlooped%2Fnuget%2Fraw%2Frefs%2Fheads%2Fmain%2Fkzu.json&query=%24.summary.packages&style=social&logo=nuget&label=packages)](https://www.nuget.org/profiles/kzu)
[![Daily Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fdevlooped%2Fnuget%2Fraw%2Frefs%2Fheads%2Fmain%2Fkzu.json&query=%24.summary.downloads&style=social&logo=nuget&label=daily%20downloads
)](https://www.nuget.org/profiles/kzu)

```markdown
[![NuGet Packages](https://img.shields.io/badge/dynamic/json?url=[URL_OF_OWNER.JSON]&query=%24.summary.packages&style=social&logo=nuget&label=packages)](https://www.nuget.org/profiles/kzu)

[![Daily Downloads](https://img.shields.io/badge/dynamic/json?url=[URL_OF_OWNER.JSON]&query=%24.summary.downloads&style=social&logo=nuget&label=daily%20downloads
)](https://www.nuget.org/profiles/kzu)
```

The `url` parameter must be encoded, in the badges above, it's at `https://github.com/devlooped/nuget/raw/refs/heads/main/kzu.json`.


Note how I use the `query` parameter to extract the relevant data from the JSON file, which looks like the following:

```json
{
  "authors": { },
  "repositories": { },
  "packages": { },
  "summary": {
    "authors": "318",
    "repositories": "48",
    "packages": "324",
    "downloads": "288.2k"
  },
  "totals": {
    "authors": 318,
    "repositories": 48,
    "packages": 324,
    "downloads": 288205
  }
}
```

Totals are the raw numbers, while the summary is a string representation of the totals, which uses [Humanizer](https://www.nuget.org/packages/Humanizer/).

You can fully automate this with a GitHub Actions workflow like the one 
I run at [devlooped/nuget](https://github.com/devlooped/nuget/blob/main/.github/workflows/nuget.yml).

I look forward to seeing those badges in your project readmes!