---
title: "Auto-notifying cascading values in Blazor"
excerpt: |
  When using Blazor cascading values, especially root-level, 
  the build-in mechanism will not notify other components of 
  changes in the value properties. This post showcases an 
  improved mechanism that leverages CascadingValueSource 
  and INotifyPropertyChanged to automatically notify all 
  components.
tags: [dotnet, aspnet, blazor]
---

When using Blazor cascading values, especially root-level, 
the build-in mechanism will not notify other components of 
changes in the value properties. This post showcases an 
improved mechanism that leverages `CascadingValueSource` 
and `INotifyPropertyChanged` to automatically notify all 
components.

As [reported to the team](https://github.com/dotnet/aspnetcore/issues/53257) the 
problem is that the `CascadingValueSource` doesn't itself 
invoke its [NotifyChangedAsync](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.components.cascadingvaluesource-1.notifychangedasync?view=aspnetcore-8.0#microsoft-aspnetcore-components-cascadingvaluesource-1-notifychangedasync) 
method so that components consuming the cascading value can 
refresh their rendering. This is a problem when you change 
properties of the shared object across components that are 
otherwise not in the same hierarchy (parent-child where 
the cascading value is provided by the parent).

So far, the team responded that the provided mechanism is 
sufficient. From the documentation on [CascadingValue component](https://learn.microsoft.com/en-us/aspnet/core/blazor/components/cascading-values-and-parameters?view=aspnetcore-8.0#cascadingvalue-component):

> Blazor Web Apps provide alternative approaches for cascading values
> * Wrap the markup of the Routes component in a CascadingValue

and then:  
> In the App component (Components/App.razor), adopt an interactive render mode for the entire app

Hm, seems like quite the limitation not being able to use 
`InteractiveAuto` render mode. Hopefully there's another alternative: 

> Specify a root-level cascading value as a service by calling the AddCascadingValue extension method on the service collection builder.

But as mentioned in the bug report, this doesn't work either.

This can be seen in action in [a repro project](https://github.com/kzu/CascadingValueNotification/) 
as follows:

1. You have a regular DTO that will be your cascading value, such as: 

      ```csharp
      public class User
      {
         public int Clicks { get; set; }
      }
      ```

2. You add the value as a root-cascading value via the app builder (both 
   Server and Client projects, for `InteractiveAuto` support:

      ```csharp
      builder.Services.AddCascadingValue(s => new CascadingValueSource<User>(new User(), isFixed: false));
      ```

3. Two otherwise unrelated components consume the cascading value as usual, such as:

      ```razor
      @rendermode InteractiveAuto

      <h3>UserInfo</h3>
      <p role="status">User clicks: @User.Clicks</p>

      @code {
         [CascadingParameter] public required User User { get; set; }
      }
      ```

   The second component, for example, makes changes to the value, either programmatically
   (e.g. a button click) or via bi-directional binding:

      ```razor
      @rendermode InteractiveAuto

      <h3>Counter</h3>
      <p role="status">Current count: @User.Clicks</p>
      <button @onclick="IncrementCount">Increment</button>

      <p>
         <!-- binding to value directly -->
        <input type="number" title="Clicks" @bind-value:event="oninput" @bind-value="User.Clicks">
      </p>

      @code {
         [CascadingParameter] public required User User { get; set; }

         void IncrementCount() => User.Clicks++;
      }
      ```
4. When using these two components in a single page, you will notice that clicking 
   (or setting the input value directly) doesn't cause the other component to refresh. 


> FWIW, I couldn't make the wrapper `ComponentValue` and app-wide 
> interactive server-side rendering (SSR) work across sibling
> components either.

## Good old INotifyPropertyChanged to the rescue

According to the [API documentation](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.components.cascadingvaluesource-1.notifychangedasync?view=aspnetcore-8.0#microsoft-aspnetcore-components-cascadingvaluesource-1-notifychangedasync), 
we can invoke `NotifyChangedAsync` to notify "subscribers that the value has changed (for example, if it has been mutated).", which seems just like what we need. 

We can create our own `CascadingValueSource` factory class that supports 
`INotifyPropertyChanged` and automatically invokes `NotifyChangedAsync` 
when the value changes:

```csharp
public static class CascadingValueSource
{
    public static CascadingValueSource<T> CreateNotifying<T>(T value, bool isFixed = false) where T : INotifyPropertyChanged
    {
        var source = new CascadingValueSource<T>(value, isFixed);

        value.PropertyChanged += (sender, args) => source.NotifyChangedAsync();

        return source;
    }
}
```

We can use it now in our app builder:

```csharp
builder.Services.AddCascadingValue(s => CascadingValueSource.CreateNotifying(new User()));
```

And of course, we need to implement `INotifyPropertyChanged` in our DTO:

```csharp
public class User : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;
    int clicks;

    public int Clicks
    {
        get => clicks;
        set
        {
            if (clicks != value)
            {
                clicks = value;
                OnPropertyChanged();
            }
        }
    }

    protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = default)
       => PropertyChanged?.Invoke(this, new(propertyName));
}
```

And that's it. No changes needed anywhere in any components. All components 
consuming the cascading value will now automatically refresh when the value 
changes, even if the components are not in the same hierarchy. This makes for 
a very convenient way to share state across components!

Hopefully this is something that will become built-in in the future, but 
in the meantime, this is a very simple workaround that can be used in any
Blazor app.

Now for the running demo of the above code: first part shows the out of the 
box problem, with the clicking and binding only updating the top component 
on the page, but not the one below the separator line, which is another 
entirely different component. The second part shows the same components 
working as expected, with the cascading value automatically notifying all
components of changes in the value, even a component that lives in the 
navbar as part of the layout.

<video src="https://github.com/kzu/kzu.github.io/assets/169707/dbc02082-8005-473e-b56e-8e946535f66d" controls="controls" style="max-width: 732px;">
</video>


Happy coding!