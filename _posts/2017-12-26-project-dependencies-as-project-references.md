---
title: "Why do project dependencies become project references?"
description: "Sometimes you want certain projects to be built before others in a solution, 
even if there shouldn't be a project reference between them. This is how you can avoid such 
a build dependency to become a project reference automatically."
tags: [vssdk vsix visualstudio msbuild]
---

Sometimes you want certain projects to be built before others in a solution, 
even if there shouldn't be a project reference between them. An example might 
be a test project that uses artifacts produced by the build of another project, 
yet it does not contain a direct project reference to it. 

If you right-click on the test project (say) to tweak the `Project Build Order...`:

![project build order](http://www.cazzulino.com/img/build-order-menu.png)

you are instructed to use the `Project Dependencies` tab to modify the build order:

![use project dependencies tab](http://www.cazzulino.com/img/build-order.png)

And easy enough, you can just check the project you want to build before the current project:

![check project to depend on](http://www.cazzulino.com/img/project-dependency.png)

There is, however, a "slight" side-effect of doing this. When building from MSBuild, here's the relevant 
[build log](http://msbuildlog.com) before checking that little checkbox:

![before checking the project dependency](http://www.cazzulino.com/img/project-dependency-before.png)

and this is what it looks like after:

![after checking the project dependency, a new project reference was added](http://www.cazzulino.com/img/project-dependency-after.png)

Yes, that's a proper *Project Reference* that's been added for the project dependency you declared 
in the IDE. 

> NOTE: this project reference is only added automatically when building from MSBuild. 
> Visual Studio already determines the build order itself so it won't for IDE builds by default.

When you think about it, it sort of makes sense: how would MSBuild know to build the given projects 
in the right order? It's only mechanism to affect the build order is indeed project references.
But this might have unintended consequences in certain cases (i.e. bringing in dependencies that you 
didn't intend, for example). 

If your build scripts already take care of building the dependent project at the right time, you 
can easily turn off this behavior by adding the following property to the project that declares 
the dependency (i.e. the test project):

```xml
<PropertyGroup>
    <AddSyntheticProjectReferencesForSolutionDependencies>false</AddSyntheticProjectReferencesForSolutionDependencies>
</PropertyGroup>
```

This property comes from the [Microsoft.Common targets](https://github.com/Microsoft/msbuild/blob/master/src/Tasks/Microsoft.Common.CurrentVersion.targets#L1430-L1431) 
which are always an interesting way of learning more about your builds.


Happy MSBuilding!

