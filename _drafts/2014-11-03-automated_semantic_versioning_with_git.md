---
title: "Automated Semantic Versioning with Git"
description: "Using a combination of Git knowledge, semantically named tags, a NuGet package and MSBuild, you can have seamless fully automatic versioning of arbitrary artifacts. Here's how."
layout: post
tags: programming, github, automation
---
# Automated Semantic Versioning with Git

Nowadays it's pretty common to adopt [SemVer](http://semver.org) for sane versioning of products, NuGet packages and assemblies. There are a million ways of implementing this for your build process, from continuous integration servers automatically patching files to manually updating a version specifier somewhere in your source tree and having a pre-build process patch everything locally.

It turns out that there's a fairly easy way to automate this in a way that works well for both CI and local builds. I've turned this approach into a NuGet package so I can just do this one-line command in every new project I start and almost completely forget about it, yet have nice version numbers always updated everywhere, with CI builds totally reproducible locally, including the version number.

## Leveraging Git Commits and Tags

Git supports the concept of a tag (also called label in other source control systems), which is nothing more than a named alias for a commit. Unlike commit hashes which aren't very human-friendly, you can name a tag anything, including something like 'v1.0.0'. And of course there's a git command to retrieve tags.

Now, if all you did was replace a hardcoded version file somewhere in your repo with a tag (which is equally hardcoded), you wouldn't be solving the CI issue (having distinct and incrementing version numbers from automated builds).

Turns out that git also can tell you how many commits you have made since you last tagged a repo too. This means that all the information to create an automatic version number based on the combination of a SemVer-named tag plus commits on top of it is readily available. All we need to do is automate its extraction and subsequent file patching during build, which is what [SemanticGit](http://github.com/kzu/SemanticGit) is all about. 

Moreover, GitHub uses these tags to automatically create Releases, so you get that for free too.

## How It Works

SemanticGit automatically provides the following values (via MSBuild properties):

* GitMajor: the major component of a SemVer tag
* GitMinor: the minor component of a SemVer tag
* GitPatch: the patch component of a SemVer tag if no commits were added after the tag was created, or the sum of the original tag patch number plus the number of commits on top of it. For example, if tag was 'v1.0.0' and there were 10 commits after the tag was created (that is, after the tagged commit), then the patch would be 10.
* GitPreRelease: the pre-release suffix of a SemVer tag, if present. i.e. '-beta' in 'v1.0.0-beta'
* GitCommit: the first 7 chars of the current commit hash in the repo.

How does it work with branches? Glad you asked, since whether you are using GitFlow or GitHubFlow or any other variation, this mechanism works great regardless!

Say you keep your development stuff in master, and you branch for releases, which become the hotfix/support branch for a release in the short to mid term. If your master branch is tagged with 'v5.0.0', you can branch for a 4.0 release and tag that branch initially with 'v4.0.0'. From that point on, all commits in that branch will cause the version 4.0.0 to increment, since that's the closest tag that git finds. As you keep pushing commits on both master and release branches, their numbers increment automatically. 

Feature branches (say you're working on a complex feature that will take a while to complete) don't need to be tagged at all, since you don't typically care about their bulid numbers. Therefore, git will find the master tag and increment that instead, since there isn't a closest tag in the feature branch history.

For releases, you can even explicitly tag subsequent builds to get nicer version numbers. Say your initial release was 'v4.0.0' and you fixed 50 bugs on top of it. You don't need to ship a 'v4.0.50' update (or .100 if you're using forks and pull requests for everything, like I'd do). You can just tag again the same release branch (actually, you're always tagging a *commit*) with 'v4.0.1' and that will become the new version. Further commits on top of it will become v4.0.1+commits. Yes, this means that you could end up with duplicated build numbers out of your CI server, but this is an added flexibility if you really need it and is only for publicly visible releases anyway. One benefit of this subsequent tagging (even if you use the same automatically calculated number) is that now GitHub will show it as a proper release :).

## Installation

Being a NuGet package, it's trivial:

	Install-Package SemanticGit

This will provide two MSBuild imports if you install it in a project: a .props file at the top that allows you to customize what and how it patches files, and a .targets file at the end of the project that performs the actual patching on build.

If you don't tag your repo, it will just use 'v0.1.0'.

## Usage
Once you have installed this package, the first thing you'll notice is that projects no longer build :)

```
TODO: MSBUILD OUTPUT WITH DUPLICATE ASSEMBLYVERSION ATTRIBUTE
```

Once you set up SemanticGit, you don't need your 'old' version information in the AssemblyInfo.cs! The goal was to have a way to inject this information at build time, without modifying any repo-owned files that would cause constant commits and merges for a team. Since this information is dynamically calculated, there's no need for the version attributes anymore. 

The MSBuild targets will automatically emmit the atributes in an efficient way (i.e. it won't re-generate them if the current repo head hasn't changed). Moreover, you will also find a new class in your intellisense, `ThisAssembly`:

//TODO: image of ThisAssembly intellisense.

It's a generated partial static class that contain constants with proper summaries that allow you to peek at the current version values being calculated. Very handy if you're unsure of what tag applies to a particular branch.

This information can be used in code to emmit logs, version information dialogs, etc., and will always stay up to date with the generated version number. 

> The AssemblyGuid constant comes from the ProjectGuid MSBuild property, and might be useful too for other purposes. It's used to generate the `[assembly: AssemblyGuid]` attribute.

### Customizing Version Format

These are the default format strings:

After the `SemanticGit` import, you can change it to whatever you need by just re-defining the relevant properties with a new format.  















