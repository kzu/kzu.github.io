---
title: "Access Git Information from MSBuild and Code"
description: "Leveraging Git information can be quite useful for generating version numbers, logging information at runtime, embedding it in assemblies and so on. Here's one way to do it easily and in a cross-platform way."
layout: post
tags: [ "programming", "git", "msbuild" ]
---
# Why use git information

Regardless of how you generate your version numbers, it's quite useful to embed 
the `git` repository information in an assembly (and/or its version information), 
such as the branch and commit that generated it. It can be invaluable in 
troubleshooting issues with a shipped product, and are opaque enough that they 
don't typically represent a secret you would care to hide. Logging code inside 
your app/library could also trace this information, so that error logs or crash 
reports could include this information too, further facilitating troubleshooting.

In addition, if you're using [GitFlow](http://nvie.com/posts/a-successful-git-branching-model/), 
[GitHubFlow](https://guides.github.com/introduction/flow/) or some other variation, 
your branches or tags may also have additional meaning with regards to versioning, 
and thus may also be relevant information you might want to consume as assembly 
metadata or directly from code. 


## Retrieving and using the information

There is of course an infinite number of ways to do this, from powershell that 
generate text files with the info, to MSBuild targets that generate JSON files, 
continuous integration servers automatically patching files for you or manually 
updating a version specifier somewhere in your source tree and having a pre-build 
process patch everything locally.
 
In many cases I've seen in the wild, these are intended to be consumed from build 
scripts that patch AssemblyInfo.cs files automatically and that's about it. Maybe 
expose some environment variable that you can consume in some way too from those 
build scripts. Others would provide format strings and customization hooks to 
tweak how the version numbers or assembly info is generated, requiring some 
learning on the way. I've done so myself too at some point with 
[SemanticGit](https://www.nuget.org/packages/SemanticGit). In the case of 
[GitVersion](https://github.com/GitTools/GitVersion), 
it goes to the extreme of being [awfully complicated](http://gitversion.readthedocs.org/en/latest/more-info/how-it-works/).


I came to the conclusion that for .NET/MSBuild based projects, simple MSBuild 
properties populated automatically (such as `$(GitBranch)`, `$(GitCommit)`, 
`$(GitSha)` and the like) coupled with source code exposure of the values via 
generated constants, strikes the perfect balance of simplicity and flexibility.

Thus, [GitInfo](https://github.com/kzu/GitInfo) was born.

When you install the package in your project that lives in a `git` repo, you 
automatically get the following MSBuild properties, ready to be consumed 
by any target that depends on the provided `GitInfo` target:

* `$(GitRoot)`: the root directory (without trailing slash) of the git repository.
                It's smart enough to also work for submodules, properly returning 
                the containing repository root, not the submodule's.
* `$(GitBranch)`: the branch being built
* `$(GitCommit)`: the short (7 chars) commit sha being built
* `$(GitSha)`: the full commit sha being built

That may be all the information you need if you're not leveraging the commits 
for versioning information. If so, in addition to consuming this from MSBuild 
properties you can also consume it from from code (C# and VB projects only 
for now). For this, `GitInfo` leverages a fairly common pattern in the .NET
framework, which is to create a class named `ThisAssembly` that holds these 
values as constants. 

For projects with a supported language, `GitInfo` will generate a partial class
named `ThisAssembly` in the intermediate output directory, like the following:

	namespace Contoso
	{
		/// <summary>Provides access to the current assembly information.</summary>
		partial class ThisAssembly
		{
			/// <summary>Provides access to the git information for the current assembly.</summary>
			public partial class Git
			{
				/// <summary>Branch: master</summary>
				public const string Branch = "master";

				/// <summary>Commit: 5335c2f</summary>
				public const string Commit = "5335c2f";

				/// <summary>Sha: 5335c2f914b56ddd3dab4c0c71b44aa0e070f059</summary>
				public const string Sha = "5335c2f914b56ddd3dab4c0c71b44aa0e070f059";
				...
		}
	}

Notice how the generated values are also exposed as the member summary, so that 
from anywhere in your codebase, you can easily find out what the current values 
are by just hovering on any code consuming `ThisAssembly.Git.Branch` for example.

Once thing you don't want is this fancy addition ruining your carefully tunned 
incremental builds, so I've been extremely vigilant of that aspect too. The
[targets](https://github.com/kzu/GitInfo/blob/master/src/GitInfo/build/GitInfo.targets) 
have been carefully crafted with proper `Inputs/Outputs` and smart caching of 
the git information (you can peek at the `GitInfo.cache` file in the intermediate 
output directory) and refreshing it only when the current git HEAD changes 
(i.e. you create a new commit, switch branches, pull commits, create a tag, etc.).

Additionally, this information is (by default) exposed as assembly metadata too 
via `AssemblyMetadataAttribute`s which are new in .NET 4.5, as follows:

	[assembly: System.Reflection.AssemblyMetadata("GitInfo.Branch", Contoso.ThisAssembly.Git.Branch)]
	[assembly: System.Reflection.AssemblyMetadata("GitInfo.Commit", Contoso.ThisAssembly.Git.Commit)]
	[assembly: System.Reflection.AssemblyMetadata("GitInfo.Sha", Contoso.ThisAssembly.Git.Sha)]


## Leveraging git information for product versioning 

It's quite common to derive a product version number from a branch or tag name 
plus the number of commits since the branch/tag was created, [SemVer](http://semver.org)
style. The idea being that if the branch is named 'v3.0.0' and there have 
been 40 commits to it since it was branched,
then the version number is 'v3.0.40'. Pretty straightforward and very useful, 
since now you can locally build any branch and commit (or tag) and generate a 
fully equivalent product (including version!) from what a continuous integration 
server would generate. The same technique is usually applied to a version file 
in the repository root, which is updated after branching for a release (this is 
how most of us do it at Xamarin, for example).

Git can easily tell you how many commits you have made since you created a tag or 
branch or since you last commited to a particular file. This means that all the 
information to create an automatic version number based on the combination of a 
SemVer-named tag/branches (or a version file contents) plus commits on top of 
it them readily available. All we need to do is automate its extraction and 
expose that information to your code so you can build up whatever version 
numbers you wish.

Rather than providing MSBuild properties or scripts with format strings you 
have to learn in order to put together your version numbers, `GitInfo` simply 
exposes the determined version-related values via MSBuild and code constants 
(through `ThisAssembly.Git.BaseVersion` and `ThisAssembly.Git.SemVer`) so 
you can freely build the version number you want by just concatenating the 
values yourself.

`GitInfo` exposes two version structures: 

* `BaseVersion`: this is the base version determined from the branch, tag 
  or version file contents. It's expected to be a SemVer-like format, and 
  it's exposed as its individual components `Major`, `Minor` and `Patch`, 
  following SemVer naming conventions.
* `SemVer`: this is the determined version obtained by adding the number 
  of commits on top of the branch/tag/file, plus any pre-release labels 
  specified in the base version (i.e. `-pre`, `-beta`). It's also exposed 
  in its individual components `Major`, `Minor` and `Patch` but also adds 
  `Label` (i.e. `pre` or `beta`), `DashLabel` (i.e. `-pre` or `-beta`) and
  `Source` (which can be `Branch`, `Tag` or `File`). The `DashLabel` allows 
  for easily composing a semver string regardless of whether there was a 
  pre-release label or not, since it defaults to an empty string if no 
  label was found. 


In MSBuild, any target that depends on the provided `GitVersion` target can 
access the following properties for the above values:

* $(GitBaseVersion)
* $(GitBaseVersionSource)
* $(GitBaseVersionMajor)
* $(GitBaseVersionMinor)
* $(GitBaseVersionPatch)
* $(GitCommits)
* $(GitTag)
* $(GitBaseTag)
* $(GitSemVerMajor)
* $(GitSemVerMinor)
* $(GitSemVerPatch)
* $(GitSemVerLabel)
* $(GitSemVerDashLabel)
* $(GitSemVerSource)

The difference between `GitTag` and `GitBaseTag` is apparent in these two 
sample values from an actual repo: 

* GitTag: v0.2.63-145-g5335c2f
* GitBaseTag: v0.2.63

Code like the following is emitted for the `ThisAssembly` partial class:

```
  partial class ThisAssembly
  {
    /// <summary>Provides access to the git information for the current assembly.</summary>
    public partial class Git
    {
      /// <summary>Branch: master</summary>
      public const string Branch = "master";

      /// <summary>Commit: 5335c2f</summary>
      public const string Commit = "5335c2f";

      /// <summary>Sha: 5335c2f914b56ddd3dab4c0c71b44aa0e070f059</summary>
      public const string Sha = "5335c2f914b56ddd3dab4c0c71b44aa0e070f059";

      /// <summary>Commits on top of base version: 145</summary>
      public const string Commits = "145";

      /// <summary>Tag: v0.2.63-145-g5335c2f</summary>
      public const string Tag = "v0.2.63-145-g5335c2f";

      /// <summary>Base tag: v0.2.63</summary>
      public const string BaseTag = "v0.2.63";

      /// <summary>Provides access to the base version information used to determine the <see cref="SemVer" />.</summary>      
      public partial class BaseVersion
      {
        /// <summary>Major: 0</summary>
        public const string Major = "0";

        /// <summary>Minor: 2</summary>
        public const string Minor = "2";

        /// <summary>Patch: 63</summary>
        public const string Patch = "63";
      }

      /// <summary>Provides access to SemVer information for the current assembly.</summary>
      public partial class SemVer
      {
        /// <summary>Major: 0</summary>
        public const string Major = "0";

        /// <summary>Minor: 2</summary>
        public const string Minor = "2";

        /// <summary>Patch: 208</summary>
        public const string Patch = "208";

        /// <summary>Label: </summary>
        public const string Label = "";

        /// <summary>Label with dash prefix: </summary>
        public const string DashLabel = "";

        /// <summary>Source: Tag</summary>
        public const string Source = "Tag";
      }
	}
  }
``` 

The generated `ThisAssembly` file is in the intermediate output directory 
in a file named `ThisAssembly.GitInfo.g.cs` (or .vb).

Note that `GitInfo` hasn't generated a single `[AssemblyVersion]` attribute :). 
That is intentional! With the above information, you can trivially create one 
yourself, share it however you like (linked files, shared asset project, common
targets imported from all your projects, etc.) among your projects. For example, 
in *Xamarin for Visual Studio*, we have a `GlobalAssemblyInfo.cs` like the 
following:

```
// AssemblyVersion = full version info, since it's used to determine agents versions
[assembly: AssemblyVersion(Xamarin.ThisAssembly.Version)]
// FileVersion = release-like simple version (i.e. 3.11.2 for cycle 5, SR2).
[assembly: AssemblyFileVersion(Xamarin.ThisAssembly.SimpleVersion)]
// InformationalVersion = full version + branch + commit sha.
[assembly: AssemblyInformationalVersion(Xamarin.ThisAssembly.InformationalVersion)]

namespace Xamarin
{
	partial class ThisAssembly
	{
		/// <summary>
		/// Simple release-like version number, like 4.0.1 for a cycle 5, SR1 build.
		/// </summary>
		public const string SimpleVersion = Git.BaseVersion.Major + "." + Git.BaseVersion.Minor + "." + Git.BaseVersion.Patch;

		/// <summary>
		/// Full version, including commits since base version file, like 4.0.1.598
		/// </summary>
		public const string Version = SimpleVersion + "." + Git.Commits;
		
		/// <summary>
		/// Full version, plus branch and commit short sha, like 4.0.1.598-cycle6+39cf84e
		/// </summary>
		public const string InformationalVersion = Version + "-" + Git.Branch + "+" + Git.Commit;
    }
}
```

You can of course just use the values directly in the version attributes, 
rather than having separate constants, for simplicity:

```
[assembly: AssemblyVersion (ThisAssembly.Git.SemVer.Major + "." + ThisAssembly.Git.SemVer.Minor + "." + ThisAssembly.Git.SemVer.Patch)]
[assembly: AssemblyInformationalVersion (
	ThisAssembly.Git.SemVer.Major + "." +
	ThisAssembly.Git.SemVer.Minor + "." +
	ThisAssembly.Git.SemVer.Patch + "-" +
	ThisAssembly.Git.Branch + "+" +
	ThisAssembly.Git.Commit)]
// i..e ^: 1.0.2-master+c218617
```

Extending the generated `ThisAssembly` class with the formatted version strings 
is quite useful however, since you can avoid repeating that formatting across your 
codebase if you happen to consume it elsewhere, such as in logging.

## Installation

Being a NuGet package, it's trivial:

	Install-Package GitInfo

If a base version can't be determined, a warning will be issued and the 
version values will default to `0.1.0`.

### Customizations

Right after installation, a readme will open up showing the available customization 
points via MSBuild, copied here as of this writing:

```
  $(GitThisAssembly): set to 'false' to prevent assembly 
                      metadata and constants generation.

  $(GitThisAssemblyMetadata): set to 'false' to prevent assembly 
                              metadata generation only. Defaults 
                              to 'false'.
	
  $(ThisAssemblyNamespace): allows overriding the namespace
                            for the ThisAssembly class.
                            Defaults to the global namespace.
											
  $(GitDefaultBranch): determines the base branch used to 
                       calculate commits on top of current branch.
                       Defaults to 'master'.
	
  $(GitVersionFile): determines the name of a file in the Git 
                     repository root used to provide the base 
                     version info.
                     Defaults to 'GitInfo.txt'.
										 
  $(GitInfoReportImportance): allows rendering all the retrieved
                              git information with the specified
                              message importance ('high', 
                              'normal' or 'low').
                              Defaults to 'low'.

  $(GitIgnoreBranchVersion) and $(GitIgnoreTagVersion): determines 
                            whether the branch and tags (if any) 
                            will be used to find a base version.
                            Defaults to empty value (no ignoring).
```

I find `$(GitInfoReportImportance)` particularly useful in release 
builds:

    <PropertyGroup>
        <GitInfoReportImportance Condition="'$(Configuration)' == 'Release'">high</GitInfoReportImportance>
    </PropertyGroup>

Which causes the following msbuild log entry:

    GitInfoReport:
      Git Info:
        GitRoot:              C:/Contoso
        GitBranch:            master
        GitCommit:            39cf84e
        GitSha:               39cf84eb9027ca669c8aa6cb4fe5f238009d42ba
        GitBaseVersion:       99.0.0
        GitBaseVersionSource: C:\Contoso\Contoso.Version
        GitBaseVersionMajor:  99
        GitBaseVersionMinor:  0
        GitBaseVersionPatch:  0
        GitCommits:           2611
        GitTag:
        GitBaseTag:
        GitSemVerMajor:       99
        GitSemVerMinor:       0
        GitSemVerPatch:       2611
        GitSemVerLabel:
        GitSemVerDashLabel:
        GitSemVerSource:      File

This is nice especially if you just do it on the main build script for 
a project, which can of course also benefit from `GitInfo` even without 
being a regular project containing code: it just needs to import the 
targets and make its targets depend on 
[GitInfoReport](https://github.com/kzu/GitInfo/blob/master/src/GitInfo/build/GitInfo.targets#L84)!

But to me the best part is that all of the behavior is implemented in 
a single .targets file, with plain native MSBuild with no custom tasks, 
even [adding the commits to the base patch](https://github.com/kzu/GitInfo/blob/master/src/GitInfo/build/GitInfo.targets#L584)
so it makes for an interesting read if you're looking to learn some 
MSBuild tricks too :).

Happy MSBuilding!
