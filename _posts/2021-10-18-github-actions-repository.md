---
title: "Get owner and project name from GitHub Actions"
description: |
  GitHub actions provides the GITHUB_REPOSITORY envvar. This shows how to get separate 
  owner and project name from that envvar, which contains both separated by a forward slash, 
  using just parameter expansion.

tags: [github, actions, ci]
---

Say you need to access a GitHub repository owner and project name, separately. We know 
[GitHub Actions environment variables](https://docs.github.com/en/github-ae@latest/actions/learn-github-actions/environment-variables#default-environment-variables) exposes this information as:

* GITHUB_REPOSITORY: The owner and repository name. For example, octocat/Hello-World.

So what's the simplest way in a bash action step to get both separately? The answer is 
[using parameter expansion](https://stackoverflow.com/questions/19482123/extract-part-of-a-string-using-bash-cut-split/19482947#19482947).

Say you want to invoke the [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator/), 
you could use:

```
github_changelog_generator --user ${GITHUB_REPOSITORY%/*} --project ${GITHUB_REPOSITORY#*/} --token ${{ secrets.GITHUB_TOKEN }} --o changelog.md 
```

The `%/*` will get the owner by getting everything *before* the matching expression `/*`, and 
`#*/` will get the project name by getting everything *after* the matching expression `*/`. Super 
convenient, and now I wish [PowerShell](https://github.com/powershell/powershell) had something 
similar and equally terse!

