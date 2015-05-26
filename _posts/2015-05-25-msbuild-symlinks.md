---
title: "How to use symlinks with MSBuild"
description: "Symlinks are very useful. This post shows how to leverage them for conditional processing using MSBuild item groups."
layout: post
tags: programming, msbuild
---
I needed to conditionally re-create symlinks to a known location in the machine from the output of an C# project file (MSBuild custom tasks and targets, that should go to `$(MSBuildExtensionsPath)\[Company]\[Product]`).

Of course, copying over and over the files wasn't a very good solution in the long run, and would also force me to always open VS elevated, which is something I'm not fond of. 

The obvious solution: create symlinks from the elevation-required location pointing to the project output directory, so that once the symlinks are created (by building from an elevated process), I'd no longer need to run elevated, as long as the file count and location remained the same.

So, first gathering the files that would be the input to [mklink](https://technet.microsoft.com/en-us/library/cc753194.aspx):

    <Target Name="GetMkLinkItems">
      <ItemGroup>
        <MkLinkTarget Include="$(OutputPath)*.*" />
        <MkLinkCandidate Include="@(MkLinkTarget -> '$(MSBuildExtensionsPath)\Xamarin\iOS\%(Filename)%(Extension)')">
          <IsSymLink>false</IsSymLink>
          <Exists>false</Exists>
        </MkLinkCandidate>

The `MkLinkCandidate` item group contains the transformed location from each of the files in the current project's output path. We default all the items' IsSymLink metadata attribute to false since in order to use item metadata in conditions, all items must have a value for them. Ditto for the Exists metadata, which makes the `Delete` task we'll use later easier to author by leveraging an [item function](https://msdn.microsoft.com/en-us/library/ee886422.aspx).

The next part is the key to conditional processing of symlinks: annotate each `MkLinkOutput` with an IsSymLink metadata attribute. We can only do that if the file exists, though, since otherwise retrieving the file attributes would fail:

      <MkLinkCandidate Condition="Exists('%(FullPath)')">
        <IsSymLink Condition="$([MSBuild]::BitwiseAnd(1024, $([System.IO.File]::GetAttributes('%(FullPath)')))) == '1024'">true</IsSymLink>
        <Exists>true</Exists>
      </MkLinkCandidate>
      <MkLinkName Include="@(MkLinkCandidate)" Condition="!Exists('%(FullPath)') Or '%(IsSymLink)' == 'false'" />
 
At this point, the `@(MkLinkName)` contains all links we have to create, that currently are files we must delete (or don't exist) and subsequently mklink to their actual target in the current project output:

    <Target Name="MkLink" DependsOnTargets="GetMkLinkItems" Condition="'@(MkLinkName)' != ''>
      <Delete Files="@(MkLinkName -> WithMetadataValue('Exists', 'true'))" ContinueOnError="true" />
      <Exec Command='mklink "%(MkLinkName.Identity)" "$(OutputPath)%(MkLinkName.Filename)%(MkLinkName.Extension)"' ContinueOnError="true" />
      <Warning Text="New symlink files couldn't be created for the current project output. Try running the build at least once from an elevated process."
               Condition="'$(MSBuildLastTaskResult)' == 'False'" />
    </Target>  

I've set the `ContinueOnError` to `true` since this will surely fail if run from a regular (non-elevated) process. A little-known trick is that you can use the `$(MSBuildLastTaskResult)` property to determine if the last executed task succeeded or not, which in this case allows me to issue a nice descriptive warning.

Another trick shown above which is very useful when using `Exec` tasks, is alternating the use of single quotes and double quotes, which is makes it possible to avoid cluttering the command to execute with a myriad of `&quot;` entity references.

In my case, I only wanted to do this in Debug builds, so it was just a matter of appending these two targets to the `BuildDependsOn`:

    <PropertyGroup>
      <BuildDependsOn Condition="'$(Configuration)' == 'Debug'">
        $(BuildDependsOn);
        GetMkLinkItems;
        MkLink;
      </BuildDependsOn>
    </PropertyGroup>

With that, I only need to build from an elevated process only once (typicaly) and after that, simply rebuilding the project will cause all the right file versions to be "in place". And I'll get a build warning if new files are added that haven't been symlinked yet :) (but only in debug builds).

Gotta love MSBuild!