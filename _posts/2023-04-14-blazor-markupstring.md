---
title: "How to bind to MarkupString in Blazor"
excerpt: |
  While we wait for my PR to be merged in the aspnetcore repo, 
  here's a quick workaround to be able to bind to raw markup 
  variables and properties in Blazor components.
tags: dotnet, aspnet, blazor
---

Blazor [allows rendering raw HTML](https://learn.microsoft.com/en-us/aspnet/core/blazor/components/?view=aspnetcore-7.0#raw-html), 
which can be useful in many cases (i.e. rendered HTML from markdown).

It turns out that Blazor (as of net8.0 preview 3) [does not support binding to MarkupString](https://github.com/dotnet/aspnetcore/issues/47718) 
out of the box, which fails with the following error:

```
WebAssembly.Rendering.WebAssemblyRenderer[100]
      Unhandled exception rendering component: The type 'System.Nullable`1[[Microsoft.AspNetCore.Components.MarkupString, Microsoft.AspNetCore.Components, Version=8.0.0.0, Culture=neutral, PublicKeyToken=adb9793829ddae60]]' does not have an associated TypeConverter that supports conversion from a string. Apply 'TypeConverterAttribute' to the type to register a converter.
System.InvalidOperationException: The type 'System.Nullable`1[[Microsoft.AspNetCore.Components.MarkupString, Microsoft.AspNetCore.Components, Version=8.0.0.0, Culture=neutral, PublicKeyToken=adb9793829ddae60]]' does not have an associated TypeConverter that supports conversion from a string. Apply 'TypeConverterAttribute' to the type to register a converter.
```

Needless to say, you cannot apply this attribute as suggested directly the the `MarkupString` 
type (or its nullable variant as in the above message), as it's a built-in (and sealed) type. But since the 
error mentions a `TypeConverter`, I thought I might just try to apply a really old trick of 
registering a [TypeDescriptionProvider](https://docs.microsoft.com/en-us/dotnet/api/system.componentmodel.typedescriptionprovider?view=net-7.0) 
with the [TypeDescriptor.AddProvider](https://learn.microsoft.com/en-us/dotnet/api/system.componentmodel.typedescriptor.addprovider?view=net-7.0) 
method to suplement the default one. It turned out to work like a charm as a workaround 
until the corresponding [PR is merged](https://github.com/dotnet/aspnetcore/pull/47719):

```csharp
// 👇 Register this before your blazor app.RunAsync()
TypeDescriptor.AddProvider(new MarkupStringTypeDescriptorProvider(TypeDescriptor.GetProvider(typeof(MarkupString))), typeof(MarkupString));
```

Note that I get the current description provider for `MarkupString` and then add my own provider, 
which delegates everything to it except for the [GetConverter](https://learn.microsoft.com/en-us/dotnet/api/system.componentmodel.icustomtypedescriptor.getconverter?view=net-7.0) 
method, where we can suplement the missing converter in the platform. Let's first see the actual 
converter which is quite trivial and I've contributed to the [aspnetcore repo](https://github.com/dotnet/aspnetcore/pull/47719):

```csharp
class MarkupStringTypeConverter : TypeConverter
{
    public override bool CanConvertFrom(ITypeDescriptorContext? context, Type sourceType)
        => sourceType == typeof(string) || base.CanConvertFrom(context, sourceType);

    public override object? ConvertFrom(ITypeDescriptorContext? context, CultureInfo? culture, object value)
    {
        if (value is string markup)
            return (MarkupString)markup;

        return base.ConvertFrom(context, culture, value);
    }

    public override bool CanConvertTo(ITypeDescriptorContext? context, [NotNullWhen(true)] Type? destinationType)
        => destinationType == typeof(string) || base.CanConvertTo(context, destinationType);

    public override object? ConvertTo(ITypeDescriptorContext? context, CultureInfo? culture, object? value, Type destinationType)
    {
        if (destinationType == typeof(string) && value is MarkupString markup)
            return markup.Value ?? "";

        return base.ConvertTo(context, culture, value, destinationType);
    }
}
```

It basically just converts from and to `string` and delegates everything else to the base class.

The registered description provider is also quite simple, delegating pretty much everything 
except returning the above converter:

```csharp
class MarkupStringTypeDescriptorProvider : TypeDescriptionProvider
{
    public MarkupStringTypeDescriptorProvider(TypeDescriptionProvider parent) : base(parent) { }

    public override ICustomTypeDescriptor? GetTypeDescriptor([DynamicallyAccessedMembers((DynamicallyAccessedMemberTypes)(-1))] Type objectType, object? instance) 
        => new MarkupStringTypeDescriptor(base.GetTypeDescriptor(objectType, instance));

    class MarkupStringTypeDescriptor : ICustomTypeDescriptor
    {
        readonly ICustomTypeDescriptor? originalDescriptor;
        public MarkupStringTypeDescriptor(ICustomTypeDescriptor? customTypeDescriptor) => originalDescriptor = customTypeDescriptor;

        // 👇 This is the only method we override
        public TypeConverter? GetConverter() => new MarkupStringTypeConverter();

        public AttributeCollection GetAttributes() => originalDescriptor?.GetAttributes() ?? new AttributeCollection();
        public string? GetClassName() => originalDescriptor?.GetClassName();
        public string? GetComponentName() => originalDescriptor?.GetComponentName();
        public EventDescriptor? GetDefaultEvent() => originalDescriptor?.GetDefaultEvent();
        public PropertyDescriptor? GetDefaultProperty() => originalDescriptor?.GetDefaultProperty();
        public object? GetEditor(Type editorBaseType) => originalDescriptor?.GetEditor(editorBaseType);
        public EventDescriptorCollection GetEvents() => originalDescriptor?.GetEvents() ?? new EventDescriptorCollection(null);
        public EventDescriptorCollection GetEvents(Attribute[]? attributes) => originalDescriptor?.GetEvents(attributes) ?? new EventDescriptorCollection(null);
        public PropertyDescriptorCollection GetProperties() => originalDescriptor?.GetProperties() ?? new PropertyDescriptorCollection(null);
        public PropertyDescriptorCollection GetProperties(Attribute[]? attributes) => originalDescriptor?.GetProperties(attributes) ?? new PropertyDescriptorCollection(null);
        public object? GetPropertyOwner(PropertyDescriptor? pd) => originalDescriptor?.GetPropertyOwner(pd);
    }
}
```

With this in place, you can successfully bind to `MarkupString` or `MarkupString?` variables and properties.

Enjoy!