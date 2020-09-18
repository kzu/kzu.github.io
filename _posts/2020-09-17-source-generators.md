---
title: "How to generate code using Roslyn source generators in real world scenarios"
tags: [roslyn, codegen]
---

Roslyn (as of 16.8 Preview 3) now brings first-class support for source code 
generators that run as part of a project compilation. The provided 
[cookbook](https://github.com/dotnet/roslyn/blob/master/docs/features/source-generators.cookbook.md) 
is a fantastic resource to get to know the capabilities and some specific scenarios 
this feature was created for. The carefully chosen set of features, driven by 
concrete scenarios, make for a powerful and flexible toolset to supercharge your 
nuget packages with. In this blog post I'll outline how I'm using it, in light 
of my first real-world use case: [ThisAssembly](https://cazzulino.com/ThisAssembly).

![](https://github.com/kzu/ThisAssembly/raw/main/img/ThisAssembly.Metadata.png)

> NOTE: if you haven't read the aforementioned [cookbook](https://github.com/dotnet/roslyn/blob/master/docs/features/source-generators.cookbook.md), this would be a good time.

One conspicuous detail left out of the cookbook is how to actually put together 
the generated code. Surely we're not expected to use string concatenation for 
real, right?

## How to actually create the generated code

Most (all?) of the code generators I've seen resort to "simple" string 
concatenating approaches to codegen. I happened to have done codegen for 
long enough to deeply distrust the "simplicity" they offer. There's a 
reason why template-based codegen has a multitude of options and has 
been around for so long: that *simplicity* is just a shortcut. It works 
for a hello world sample, but it just doesn't scale, it's not maintainable, 
it's hard to tweak and modify, even harder to grasp what the output really 
will look like (with loops and conditionals in between actual text), it's 
plain awful and painful to work with.

I've used a whole bunch of approaches to this over the years, all the way 
from CodeDom back in the day to Roslyn raw APIs nowadays, with everything 
in-between (such as T3/T4 and Razor, reflection emit and expression tress). 
One thing I've definitely have come to realize is that what works best is:

* Build a model
* Apply a template

Any and all logic to process whatever your source is goes into the model 
building side of things (which can be nicely unit tested as needed), and 
the template is a very simple thing that just acts on that model and translates 
it to some output which is your generated stuff (can be code, XML, JSON, 
HTML, whatever).

After reading quite a bit on all the .NET-native approaches, I found 
[Scriban](https://github.com/lunet-io/scriban) to be the best suited for 
the job. I love the author's [extensive background](https://xoofx.com/blog/2017/11/13/implementing-a-text-templating-language-and-engine-for-dotnet/) 
and experience in various approaches and toolkits, which seem to have greatly 
informed his design choices with Scriban.

## How to use Scriban in your source generator

As [explained in the cookbook](https://github.com/dotnet/roslyn/blob/master/docs/features/source-generators.cookbook.md#use-functionality-from-nuget-packages), 
your generator nuget dependencies must be included with your analyzer. I'm not 
a fan of the way the packaging of analyzers in general is suggested there, so 
I do it slightly different.

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <BuildOutputTargetFolder>analyzers</BuildOutputTargetFolder>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Scriban" Version="2.1.2" PrivateAssets="all" Pack="true" />
  </ItemGroup>
</Project>
```

The `BuildOutputTargetFolder` property means our assembly will end up in 
*analyzers/netstandard2.0* inside the package, so it will not become a lib dependency 
for consumers. 

> NOTE: this does mean that the analyzer would run for any language, as long as the 
> **consuming** project targets netstandard2.0. This may or may not be what you want.  
> The documented alternative to have more control over that is to use explicit `None` 
> items with `PackagePath` metadata pointing to *analyzers/[tfm]/[lang]* instead.

Presently, however, *netstandard2.0* virtually equates *dotnet* (as in, all currently 
supported target frameworks/runtimes), and targeting all three main languages (C#, F# 
and VB) is quite trivial when using a text template. Moreover, as of .NET5.0 I believe 
source generators will only be supported for C#, so they wouldn't even run for the 
other two, the extra simplicity of `BuildOutputTargetFolder` works for me.

The `Pack=true` metadata on the `PackageReference` works as I explained in my 
[TIL: How to include package reference files in your nuget](https://til.cazzulino.com/msbuild/how-to-include-package-reference-files-in-your-nuget-package).

You basically place this target in your *Directory.Build.targets*:

```xml
  <!-- For every PackageReference with Pack=true, we include the assemblies from it in the package -->
  <Target Name="AddPackDependencies" Inputs="@(RuntimeCopyLocalItems)" Outputs="%(RuntimeCopyLocalItems.NuGetPackageId)" AfterTargets="ResolvePackageAssets">
    <ItemGroup>
      <NuGetPackageId Include="@(RuntimeCopyLocalItems -> '%(NuGetPackageId)')" />
    </ItemGroup>
    <PropertyGroup>
      <NuGetPackageId>@(NuGetPackageId -&gt; Distinct())</NuGetPackageId>
    </PropertyGroup>
    <ItemGroup>
      <PackageReferenceDependency Include="@(PackageReference -&gt; WithMetadataValue('Identity', '$(NuGetPackageId)'))" />
    </ItemGroup>
    <PropertyGroup>
      <NuGetPackagePack>@(PackageReferenceDependency -> '%(Pack)')</NuGetPackagePack>
    </PropertyGroup>
    <ItemGroup Condition="'$(NuGetPackagePack)' == 'true'">
      <_PackageFiles Include="@(RuntimeCopyLocalItems)" PackagePath="$(BuildOutputTargetFolder)/$(TargetFramework)/%(Filename)%(Extension)" />
      <RuntimeCopyLocalItems Update="@(RuntimeCopyLocalItems)" CopyLocal="true" Private="true" />
      <ResolvedFileToPublish Include="@(RuntimeCopyLocalItems)" CopyToPublishDirectory="PreserveNewest" RelativePath="%(Filename)%(Extension)" />
    </ItemGroup>
  </Target>
```

With this convention in place, adding extra nuget packages to the code generator is 
trivial

This is what an [actual template](https://github.com/kzu/ThisAssembly/blob/main/src/ThisAssembly.Metadata/CSharp.sbntxt) looks like:

```
/// <summary>
/// Provides access to the current assembly information as pure constants, 
//  without requiring reflection.
/// </summary>
partial class ThisAssembly
{
    /// <summary>
    /// Gets the assembly metadata.
    /// </summary>
    public static partial class Metadata
    {
        {{~ for md in Metadata ~}}
        public const string {{ md.Key }} = @"{{ md.Value }}";

        {{~ end ~}}
    }
}
```

I simply embed the template files in the assembly, which is the most convenient way
for me. Again, this can be done in a single place in the *Directory.Build.targets*:

```xml
  <ItemGroup>
    <EmbeddedResource Include="@(None -&gt; WithMetadataValue('Extension', '.sbntxt'))" />
  </ItemGroup>
```

Then a simple helper method allows us to get its content at run-time:

```csharp
    static class EmbeddedResource
    {
        public static string GetContent(string relativePath)
        {
            var baseName = Assembly.GetExecutingAssembly().GetName().Name;
            var resourceName = relativePath
                .TrimStart('.')
                .Replace(Path.DirectorySeparatorChar, '.')
                .Replace(Path.AltDirectorySeparatorChar, '.');

            using var stream = Assembly.GetExecutingAssembly()
                .GetManifestResourceStream(baseName + "." + resourceName);

            if (stream == null)
                throw new NotSupportedException();

            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }
```

Since the Scriban template makes it so easy to support multiple target 
languages, I basically future-proof my generators by including templates 
for all three now, and they will just "light up" whenever Roslyn adds support 
for them in the future. Therefore, the code to lookup the template content 
and apply it to a model, is always the same and generic for all target 
languages:

```csharp
[Generator]
public class MetadataGenerator : ISourceGenerator
{
    public void Initialize(GeneratorInitializationContext context) { }

    public void Execute(GeneratorExecutionContext context)
    {
        var model = ...; // build the model
        var language = context.ParseOptions.Language;
        // lookup CSharp.sbntxt, VisualBasic.sbntxt or FSharp.sbntxt
        var file = language.Replace("#", "Sharp") + ".sbntxt";
        var template = Template.Parse(EmbeddedResource.GetContent(file), file);
        // apply the template
        var output = template.Render(model, member => member.Name);

        // add the file
        context.AddSource("[HINT_NAME_OF_OUTPUT]", SourceText.From(output, Encoding.UTF8));
```

> NOTE: even if I don't provide a template for VB/F#, this code won't fail 
> presently since it will only be invoked for C# ;-)


Now on to some concrete scenarios I used that showcase the power and flexibility 
of source generators.

## Debugging source generators

Basically, just add a `System.Diagnostics.Debugger.Launch()` :). 

For a bit more added flexibility, and to avoid having to comment/uncomment that 
line all the time, I make debugging a configurable [option via MSBuild](https://github.com/dotnet/roslyn/blob/master/docs/features/source-generators.cookbook.md#consume-msbuild-properties-and-metadata).

There are two parts to enabling MSBuild configuration for your generator:

1. Declaring the name of the property in targets file
2. Reading it in the generator.

For debugging I define the following properties in a file named after the generator 
package ID (i.e. [ThisAssembly.Metadata.targets](https://github.com/kzu/ThisAssembly/blob/main/src/ThisAssembly.Metadata/ThisAssembly.Metadata.targets)):

```xml
<Project>
  <ItemGroup>
    <CompilerVisibleProperty Include="DebugSourceGenerators" />
    <CompilerVisibleProperty Include="DebugThisAssemblyMetadata" />
  </ItemGroup>
</Project>
```

The first property, when set to `true` in a build, will cause the `Debugger.Launch` 
to run for all generators. The second allow debugging a specific generator instead.
Usage would be: `msbuild -p:DebugThisAssemblyMetadata=true`, for example.

We next have to include the targets file with the analyzer, but it needs to go to 
the `build` package folder. This can be done generically too in the *Directory.Build.targets*:

```xml
  <ItemGroup>
    <_PackageFiles Include="*.props" PackagePath="build/$(TargetFramework)" />
    <_PackageFiles Include="*.targets" PackagePath="build/$(TargetFramework)" />
  </ItemGroup>
```

(I include *.props* generically too since some generators need those too)

Finally, the debugger check helper:

```csharp
static class GeneratorExtensions
{
    public static void CheckDebugger(this GeneratorExecutionContext context, string generatorName)
    {
        if (context.AnalyzerConfigOptions.GlobalOptions.TryGetValue("build_property.DebugSourceGenerators", out var debugValue) &&
            bool.TryParse(debugValue, out var shouldDebug) &&
            shouldDebug)
        {
            Debugger.Launch();
        }
        else if (context.AnalyzerConfigOptions.GlobalOptions.TryGetValue("build_property.Debug" + generatorName, out debugValue) &&
            bool.TryParse(debugValue, out shouldDebug) &&
            shouldDebug)
        {
            Debugger.Launch();
        }
    }
}
```

> NOTE: if I wanted this capability only for *DEBUG* builds, I could simply
> add `[Conditional("DEBUG")]` to the above method. 

We simply access the MSBuild property as documented in the cookbook and attempt 
to parse it as a boolean to determine whether the debugger should be launched. 
Now all my generators can include a single line of code (usually the first in 
the *Execute* method) that I never have to remove:

```csharp
context.CheckDebugger("ThisAssemblyMetadata");
```

## Generating ThisAssembly.Metadata

Once scenario I've used codegen in the past and am quite fond of, is to access 
values provided by the build via MSBuild project properties and items. In the 
past I created [MSBuilder.ThisAssembly.Metadata](https://github.com/MobileEssentials/MSBuilder/tree/master/src/ThisAssembly.Metadata), 
for example, to pull assembly attributes into a code class with constants. 

I ported the concept to Roslyn source generators and the result is available 
as the [ThisAssembly.Metadata](https://github.com/kzu/ThisAssembly#thisassemblymetadata) package:

![](https://github.com/kzu/ThisAssembly/raw/main/img/ThisAssembly.Metadata.png)

The basic concept is that in any project (.NET 5.0 SDK or later), you 
can readily add assembly metadata by simply adding items via MSBuild 
(support [added by yours truly](https://github.com/dotnet/sdk/pull/3440) ;)):

```xml
    <ItemGroup>
      <AssemblyMetadata Include="Foo" Value="Bar" />
    </ItemGroup>
```

Which is automatically turned into the following attribute in the generated 
AssemblyInfo.cs in your *obj* folder:

```csharp
  [assembly: System.Reflection.AssemblyMetadataAttribute("Foo", "Bar")]
```

Even though you can access that metadata by using reflection, that's comparatively 
slower and more annoying than simply accessing a constant like `ThisAssembly.Metadata.Foo`, 
say.

This is probably the simplest of generators, since we don't need to access 
MSBuild information and can instead just rely on the current compilation 
passed to the generator to contain the attributes shown above.

The generator basically accesses the current compilation and looks for all 
attributes in it:

```csharp
[Generator]
public class MetadataGenerator : ISourceGenerator
{
    public void Initialize(GeneratorInitializationContext context) { }

    public void Execute(GeneratorExecutionContext context)
    {
        var metadata = context.Compilation.Assembly.GetAttributes()
            .Where(x => x.AttributeClass?.Name == nameof(System.Reflection.AssemblyMetadataAttribute) &&
                Microsoft.CodeAnalysis.CSharp.SyntaxFacts.IsValidIdentifier((string)x.ConstructorArguments[0].Value))
            .ToDictionary(x => (string)x.ConstructorArguments[0].Value, x => (string)x.ConstructorArguments[1].Value);
        ...
    }
}
```

That metadata becomes my *Model* for the template:

```csharp
    public class Model
    {
        public Model(IEnumerable<KeyValuePair<string, string>> metadata) => Metadata = metadata.ToList();

        public string Version => Assembly.GetExecutingAssembly().GetName().Version.ToString(3);

        public List<KeyValuePair<string, string>> Metadata { get; }
    }
```

Which is rendered with the following template:

```
partial class ThisAssembly
{
    public static partial class Metadata
    {
        {{~ for md in Metadata ~}}
        public const string {{ md.Key }} = @"{{ md.Value }}";

        {{~ end ~}}
    }
}
```

The entirety of the [shipping](https://nuget.org/packages/ThisAssembly.Metadata) generator 
is:

```csharp
[Generator]
public class MetadataGenerator : ISourceGenerator
{
    public void Initialize(GeneratorInitializationContext context) { }

    public void Execute(GeneratorExecutionContext context)
    {
        context.CheckDebugger("ThisAssemblyMetadata");

        var metadata = context.Compilation.Assembly.GetAttributes()
            .Where(x => x.AttributeClass?.Name == nameof(System.Reflection.AssemblyMetadataAttribute) &&
                Microsoft.CodeAnalysis.CSharp.SyntaxFacts.IsValidIdentifier((string)x.ConstructorArguments[0].Value))
            .Select(x => new KeyValuePair<string, string>((string)x.ConstructorArguments[0].Value, (string)x.ConstructorArguments[1].Value))
            .Distinct(new KeyValueComparer())
            .ToDictionary(x => x.Key, x => x.Value);

        var model = new Model(metadata);
        var language = context.ParseOptions.Language;
        var file = language.Replace("#", "Sharp") + ".sbntxt";
        var template = Template.Parse(EmbeddedResource.GetContent(file), file);
        var output = template.Render(model, member => member.Name);

        context.ApplyDesignTimeFix(output, "ThisAssembly.Metadata", language);
        context.AddSource("ThisAssembly.Metadata", SourceText.From(output, Encoding.UTF8));
    }
}
```

The next ones are similarly simple and concise.

## Generating ThisAssembly.Project

This generator results in a similar end-user experience:

![](https://github.com/kzu/ThisAssembly/raw/main/img/ThisAssembly.Project.png)

But the goal here is to allow arbitrary MSBuild properties to end up there, 
without having corresponding assembly-level attributes, like the previous 
generator. I [hacked this](https://www.nuget.org/packages/MSBuilder.ThisAssembly.Project) 
in the past with MSBuild, but [it was sketchy](https://github.com/MobileEssentials/MSBuilder/blob/master/src/ThisAssembly.Project/build/MSBuilder.ThisAssembly.Project.targets#L96-L100) 
(using [reflection to access MSBuild properties](https://github.com/MobileEssentials/MSBuilder/blob/master/src/Introspect/Introspect/Introspect.cs) by name, ugh). 
This time around, I can be legit :).

The intended usage is to declare properties you want to get as constants via 
MSBuild items, similar to `AssemblyMetadata` items:

```xml
<Project>
  <ItemGroup>
    <ProjectProperty Include="PackageId" />
  </ItemGroup>
</Project>
```

The generator includes a few [out of the box](https://github.com/kzu/ThisAssembly/blob/main/src/ThisAssembly.Project/ThisAssembly.Project.props) too in this very fashion.

This source generator is interesting because we have to coordinate more deeply 
the MSBuild side and the generator side. Namely: we have to turn those items into 
compiler visible properties, but also need to tell the source geneator which properties 
were opted-in to codegen, since we don't want to just emit all `CompilerVisibleProperty` 
since that might include others used internally for other generators.

The [targets file](https://github.com/kzu/ThisAssembly/blob/main/src/ThisAssembly.Project/ThisAssembly.Project.targets) builds up a property containing the oped-in props and does the item group 
conversion as needed:

```xml
  <Target Name="InjectThisAssemblyProject" BeforeTargets="PrepareForBuild;CompileDesignTime">
    <PropertyGroup>
      <ThisAssemblyProject>@(ProjectProperty, '|')</ThisAssemblyProject>
    </PropertyGroup>
    <ItemGroup Condition="'$(ThisAssemblyProject)' != ''">
      <CompilerVisibleProperty Include="@(ProjectProperty)" />
      <CompilerVisibleProperty Include="ThisAssemblyProject" />
    </ItemGroup>
  </Target>
```

The source generator will receive a `|` separated list of opted-in properties to 
using the `ThisAssemblyProject` MSBuild property. And it will also have access to 
all the compiler visible properties as usual, so it can use the first to filter 
the second.

The way these compiler visible properties work is that the built-in SDK targets 
will generate a .editorconfig in your *obj/Debug* folder (plus target framework), 
containing the values. So for the out of the box + `PackageId` property, it will 
look like the following when you [install ThisAssembly.Project](https://nuget.org/packages/ThisAssembly.Project):

```editorconfig
is_global = true
build_property.DebugSourceGenerators = 
build_property.DebugThisAssemblyProject = 
build_property.RootNamespace = ClassLibrary6
build_property.AssemblyName = ClassLibrary6
build_property.TargetFrameworkVersion = v2.0
build_property.TargetFrameworkIdentifier = .NETStandard
build_property.TargetFrameworkMoniker = .NETStandard,Version=v2.0
build_property.PackageId = ClassLibrary6
build_property.ThisAssemblyProject = RootNamespace|AssemblyName|TargetFrameworkVersion|TargetFrameworkIdentifier|TargetFrameworkMoniker|PackageId
```

The astute reader will notice that the semi-colon character `;` marks the 
beginning of a comment in *.editorconfig*, so if we had used the default 
concatenation for items in MSBuild:

```xml
    <PropertyGroup>
      <ThisAssemblyProject>@(ProjectProperty)</ThisAssemblyProject>
    </PropertyGroup>
```

We would have ended with this in the .editorconfig:

```editorconfig
build_property.ThisAssemblyProject = RootNamespace;AssemblyName;TargetFrameworkVersion;TargetFrameworkIdentifier;TargetFrameworkMoniker;PackageId
```

Which would be interpreted as `RootNamespace` followed by a comment! The generator 
would only ever see the first property in the `@(ProjectProperty)` item group! (this 
was quite the head scratcher ;))

Back at the [generator code](https://github.com/kzu/ThisAssembly/blob/main/src/ThisAssembly.Project/ProjectPropertyGenerator.cs) 
now, we first read the propertly list and then get all the properties using the 
same mechanism, filtering only those that do have a value:

```csharp
public void Execute(GeneratorExecutionContext context)
{
    context.CheckDebugger("ThisAssemblyProject");

    if (!context.AnalyzerConfigOptions.GlobalOptions.TryGetValue("build_property.ThisAssemblyProject", out var properties))
        return;

    var metadata = properties.Split('|')
        .Select(prop => new KeyValuePair<string, string>(prop,
            context.AnalyzerConfigOptions.GlobalOptions.TryGetValue("build_property." + prop, out var value) ? 
            value : null))
        .Where(pair => pair.Value != null)
        .Distinct(new KeyValueComparer())
        .ToDictionary(x => x.Key, x => x.Value);

    var model = new Model(metadata);
    ...
}
```

The rest of the method is the same as the previous generator, and the template 
is almost the same too, except for the nested class name which is `Project` now 
instead of `Metadata`.

## Generating ThisAssembly.Info

The third and final generator for this point emits constants for the common 
attributes applied to the assembly by default when you build an SDK-style 
project:

![](https://github.com/kzu/ThisAssembly/raw/main/img/ThisAssembly.AssemblyInfo.png)

With the discussion of the previous two generators, I think you, dear reader, 
will have no problems making sense of [its source](https://github.com/kzu/ThisAssembly/tree/main/src/ThisAssembly.AssemblyInfo), 
since it looks (unsurprisingly) very similar to the ones shown above.


Next up is the (somewhat popular) [netfx-System.StringResources](https://www.nuget.org/packages/netfx-System.StringResources) :)


Stay tunned for more source generator galore!