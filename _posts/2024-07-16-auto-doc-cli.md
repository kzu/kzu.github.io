---
title: "Auto-document dotnet CLI tool via dynamically generated markdown readme fragments"
tags: [tool, dotnet, markdown, github]
---

Every time I create a new CLI tool, I face the challenge of keeping the project and 
package readme (for dotnet tools like [dotnet-trx](https://github.com/devlooped/dotnet-trx)) 
up to date with the evolving tool itself. 

It's annoying and repetitive (run with `--help`, copy-paste) and it's not uncommon to end up with stale docs.

Here's one way to automate the whole thing so you can just focus on making your tool awesome.

First, have your project emit the help to a text file, say `help.md`:

   ```xml
   <Target Name="RenderHelp" AfterTargets="Build">
     <WriteLinesToFile Lines="```shell" Overwrite="true" File="help.md" />
     <Exec Command="dotnet run --no-build -- --help &gt;&gt; help.md" 
           EnvironmentVariables="NO_COLOR=true" />
     <WriteLinesToFile Lines="```" Overwrite="false" File="help.md" />
   </Target>
   ```

   > NOTE: I'm passing [NO_COLOR](https://github.com/spectreconsole/spectre.console/issues/1236#issuecomment-1742539809) 
   > to disable Spectre console colors in the output.

Next, if you only need to include the help in the package readme, include the auto-generated 
help file using the following syntax:

   ```markdown
   # My Awesome Tool
   Tool options: 
   <!-- include help.md -->
   ```

> NOTE: the file path must be relative to the including file.

Then install [NuGetizer](https://nuget.org/packages/nugetizer) to perform the packing instead, 
which supports this markdown inclusion feature via the [package readme](https://github.com/devlooped/nugetizer?tab=readme-ov-file#package-readme).

> NOTE: nugetizer is pretty much 100% compatible with SDK pack, in particular for dotnet tools, 
> unless you have fancy customization of the package contents via MSBuild or nuspec.

At pack time, **nugetizer** will resolve the includes and expand them in the package readme.


If you also want to keep a repository readme up-to-date, you can use a GitHub workflow that
automatically updates the readme with the latest help output after a commit to the main branch:

1. Create a project `readme.md` that uses [+Mᐁ includes](https://github.com/devlooped/actions-includes), using the same syntax above for package readme:

    ```markdown
    # My Awesome Tool
    Tool options: 
    <!-- include src/dotnet-trx/help.md -->
    ```

   > NOTE: the path is now relative to the root of the repository, as an example.

2. Set up a github workflow that keeps the readme up-to-date with changes in the 
   auto-generated help file:

    ```yml
    on: 
      push:
        branches:
          - 'main'
        paths:
          - '**.md'

    jobs:
      includes:
        runs-on: ubuntu-latest
        steps:
          - name: 🤘 checkout
            uses: actions/checkout@v2

          - name: +Mᐁ includes
            uses: devlooped/actions-include@v1

          - name: ✍ pull request
            uses: peter-evans/create-pull-request@v6
            with:
              add-paths: '**.md'
              base: main
              branch: markdown-includes
              delete-branch: true
              labels: docs
              commit-message: +Mᐁ includes
              title: +Mᐁ includes
              body: +Mᐁ includes
    ```

3. Merge the docs PR whenever it shows up, and you're done!

Real example: 
- [PR that adds auto-doc help file](https://github.com/devlooped/dotnet-trx/pull/25) 
- [Automated PR that updates main readme](https://github.com/devlooped/dotnet-trx/pull/26)


> NOTE: at this time, if you use the awesome [Spectre.Console](https://github.com/spectreconsole/spectre.console/) project for your CLI, an issue with the `NO_COLOR` environment variable is 
> causing the help output to contain some formatting that shouldn't be there. Hopefully my 
> [PR](https://github.com/spectreconsole/spectre.console/issues/1583) will be merged soon 🙏.


Happy coding! 🚀