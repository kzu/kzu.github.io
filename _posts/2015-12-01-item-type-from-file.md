---
title: "How to get the item type or build action of a file in a project"
description: "Sounds like it should be pretty easy, getting the item type (shown in Visual Studio as the build action) of an arbitrary file given its containing project identifier. Yeah, right..."
tags: [vsx]
---

When working inside a Visual Studio extension, it's not rare to need to go back and 
forth between the two. Projects can be uniquely identified in a solution by their Guid. This is the 
ProjectGuid MSBuild property of a project, available from the IVsHierarchy 
[VSHPROPID_ProjectIDGuid](https://msdn.microsoft.com/en-us/library/microsoft.visualstudio.shell.interop.__vshpropid.aspx) property that uniquely identifies the project in a solution. And files are frequently need to be located 
within a project given their path.

In my case, I needed to retrieve the item type (build action in the property browser), given those two values: project id, file path. Tell me it 
doesn't give you the creeps:

	static string GetItemType (IServiceProvider services, Guid projectId, string filePath)
	{
		var solution = services.GetService<SVsSolution, IVsSolution> ();

		IVsHierarchy project;
		uint itemId;
		object projectItem;
		string itemType = null;

		if (ErrorHandler.Succeeded (solution.GetProjectOfGuid (projectId, out project)) &&
			ErrorHandler.Succeeded (project.ParseCanonicalName (filePath, out itemId)) &&
			itemId != (uint)VSConstants.VSITEMID.Nil &&
			ErrorHandler.Succeeded (project.GetProperty (itemId, (int)__VSHPROPID.VSHPROPID_ExtObject, out projectItem)) &&
			projectItem != null && projectItem is ProjectItem) {
			itemType = ((ProjectItem)projectItem).Properties.Item ("ItemType").Value.ToString ();
		}

		return itemType;
	}

It's pretty awesome to come across posts that say things like [Who said building Visual Studio Extensions was hard?](http://www.diaryofaninja.com/blog/2014/02/18/who-said-building-visual-studio-extensions-was-hard)...

*shudder*