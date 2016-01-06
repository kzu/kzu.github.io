---
title: "How to access project reference metadata from WiX project in MSBuild"
description: "Accessing project references metadata, such as the typical $(var.MyCustomAction.TargetDir) is pretty common from WiX fragments. Here's how to do the same from MSBuild"
layout: post
tags: programming, msbuild, wix, installer
---
I've been doing quite a bit of WiX work lately. One thing that is very 
convenient in WiX is the ability to reference metadata about project 
references directly from your WiX files (i.e. fragments or includes). You 
could, for example, include a file from a project reference easily with:

    <File Id="MyFile" Source="$(var.MyReference.TargetDir)\MyFile.dll" />

WiX has a task that automatically fetches metadata about project references 
and turns them into those vars you can use, which are then passed to the 
rest of the WiX compile process (candle, light, etc.). The resulting 
command-line for those tools end up looking something like:

    candle.exe ... 
        -dMyReference.Configuration=Debug
        -d"MyReference.FullConfiguration=Debug|x86" 
        -dMyReference.Platform=x86 
        -dMyReference.ProjectExt=.csproj 
        -dMyReference.ProjectFileName=MyReference.csproj 
        -dMyReference.ProjectName=MyReference 
        -dMyReference.TargetDir=[FULL_PATH_HERE]\MyReference\bin\Debug\ 
        -dMyReference.TargetExt=.dll 
        -dMyReference.TargetFileName=MyReference.dll
        -dMyReference.TargetName=MyReference
        ...

If you're doing some pre-processing of the project reference, including 
some of its output as compile contents or what-not, it would be very 
useful to access those values from MSBuild. This is one of those cases 
where you wish WiX's MSBuild integration went a bit further, but fortunately 
it's all just plain MSBuild in the end so we can do whatever we want to 
make it better. In this case, the target that adds those project reference 
vars is called `AddCompilerDefineConstants` and has a convenient 
`AddCompilerDefineConstantsDependsOn` property which we can extend as follows:

    <PropertyGroup>
      <AddCompilerDefineConstantsDependsOn>
        $(AddCompilerDefineConstantsDependsOn);
        AddProjectReferenceMetadata
      </AddCompilerDefineConstantsDependsOn>
    </PropertyGroup>

And the new `AddProjectReferenceMetadata` will create an item ("group" of 
just one item) named `MyReference` that I can then use as:

    <ItemGroup>
        <Compile Include="%(MyReference.TargetDir)*.wxs" />
    </ItemGroup>

That would bring in all the `.wxs` files that are in the output directory 
of the referenced project, for example.

Here's the `AddProjectReferenceMetadata` target:

    <Target Name="AddProjectReferenceMetadata" Condition=" '@(_ResolvedProjectReferencePaths)' != '' ">
      <!-- Fist invoke the built-in task, but retrieve the outputs as items
             rather than a single property, which is what the built-in targets do -->
      <CreateProjectReferenceDefineConstants
        ProjectReferencePaths="@(_ResolvedProjectReferencePaths)"
        ProjectConfigurations="$(VSProjectConfigurations)">
        <Output TaskParameter="DefineConstants" ItemName="_ProjectReferenceConstants" />
      </CreateProjectReferenceDefineConstants>
   
      <ItemGroup>
        <!-- Via a cascading item metadata process, we determine the index of the first '.' in the project constants 
             retrieved by the task, since we want to use that as the grouping 'ReferenceName' item name instead. -->
        <_ProjectReferenceConstants>
          <!-- Note how we create a new string with static method syntax, to be able to use property function syntax with item metadata -->
          <ReferenceName>$([System.String]::new('%(Identity)').Substring(0, $([System.String]::new('%(Identity)').IndexOf('.'))))</ReferenceName>
          <ReferenceStart>$([System.String]::new('%(Identity)').IndexOf('.'))</ReferenceStart>
        </_ProjectReferenceConstants>
        <_ProjectReferenceConstants>
          <!-- The we actually need to add 1 to the index of the dot for the substring. 
               For better readability, we do it in two steps, saving the value above, and then calling the built-in Add function here, which 
               updates the metadata value. -->
          <ReferenceStart>$([MSBuild]::Add(%(ReferenceStart), 1))</ReferenceStart>
        </_ProjectReferenceConstants>
   
        <!-- Here we change the item name on purpose, to drop all the items that have the
             reference name prefix intentionally. Note that since we're creating a new item
             group, we need to reference the original ones by their full item.metadata name. -->
        <ProjectReferenceMetadata Include="@(_ProjectReferenceConstants -> '$([System.String]::new('%(_ProjectReferenceConstants.Identity)').Substring(%(_ProjectReferenceConstants.ReferenceStart)))')">
          <ReferenceName>%(_ProjectReferenceConstants.ReferenceName)</ReferenceName>
        </ProjectReferenceMetadata>
      </ItemGroup>
      
      <!-- Finally, create a new item group with the name of the reference, which leverages task batching and automatically 
           groups the ProjectReferenceMetadata group by their reference name -->
      <CreateItem Include="%(ProjectReferenceMetadata.ReferenceName)" AdditionalMetadata="@(ProjectReferenceMetadata)">
        <Output TaskParameter="Include" ItemName="%(ProjectReferenceMetadata.ReferenceName)"/>
      </CreateItem>
    </Target>
