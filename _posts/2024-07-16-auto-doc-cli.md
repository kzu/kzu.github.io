---
title: "Auto-document CLI tool via markdown readmes"
tags: [tool, dotnet, markdown, github]
---

Every time I create a new CLI tool, I face the challenge of keeping the project and 
package readme (for dotnet tools like [dotnet-trx](https://github.com/devlooped/dotnet-trx)) 
up to date with the evolving tool itself. 

It's annoying and repetitive (run with `--help`, copy-paste) and it's not uncommon to end up with stale docs.

Here's one way to automate the whole thing so you can just focus on making your tool awesome.

1. Have your project emit the help to a text file, say `help.txt`:

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

2. Create a project `readme.md` that uses [+Mᐁ includes](https://github.com/devlooped/actions-includes), like:

    ```markdown
    # My Awesome Tool
    Tool options: 
    <!-- include src/dotnet-trx/help.txt -->
    ```

3. Set up a github workflow that keeps the readme up-to-date with changes in the 
   auto-generated help file:

    ```yml
    on: 
      push:
        branches:
          - 'main'
        paths:
          - '**.md'
          - '**.txt'

    jobs:
      includes:
        runs-on: ubuntu-latest
        steps:
          - name: 🤘 checkout
            uses: actions/checkout@v2

          - name: +Mᐁ includes
            uses: devlooped/actions-include@v1

          - name: ✍ pull request
            uses: peter-evans/create-pull-request@v3
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

4. Merge the docs PR whenever it shows up, and you're done!

Real example: 
- [PR that adds auto-doc help file](https://github.com/devlooped/dotnet-trx/pull/25) 
- [Automated PR that updates main readme](https://github.com/devlooped/dotnet-trx/pull/26)

If instead of a project readme, the goal is to keep a package readme up-to-date, you can 
instead use [NuGetizer](https://nuget.org/packages/nugetizer), which supports the same syntax 
for markdown inclusion in the [package readme](https://github.com/devlooped/nugetizer?tab=readme-ov-file#package-readme) file, such as:

    ```markdown
    # My Awesome Tool
    Tool options: 
    <!-- include help.md -->
    ```

At pack time, the include is expanded and the readme inside the package will 
contains the latest help output.