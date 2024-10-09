---
title: "Typed chat completions with OpenAI and .NET 9"
excerpt: |
  How to combine OpenAI structured outputs with .NET 9 ability to 
  export JSON schemas to provide a strong-typed API for chat completions.
tags: [dotnet, openai, ai]
---

> TLDR: grab the [source code](https://github.com/devlooped/catbag/blob/main/OpenAI/Chat/ChatClientTypedExtensions.cs) or add it 
locally with `dotnet file add https://github.com/devlooped/catbag/blob/main/OpenAI/Chat/ChatClientTypedExtensions.cs .` 
(leveraging [dotnet-file](https://www.nuget.org/packages/dotnet-file#readme-body-tab)).

Open AI recently introduced support for [structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 
in the API, and the [final stable release](https://www.nuget.org/packages/OpenAI) of the .NET API 
for it released a mere 9 days ago has full support for leveraging that. By then, 
[a post on X by David Fowler](https://learn.microsoft.com/en-us/dotnet/api/system.text.json.schema.jsonschemaexporter?view=net-8.0) 
on a new [JsonSchemaExporter](https://learn.microsoft.com/en-us/dotnet/api/system.text.json.schema.jsonschemaexporter?view=net-8.0) 
made total sense (and I'm sure something official is coming down the pipe soon for the official SDK).

So I set out to try combining all things together in a simple extension method:

```csharp
var client = new OpenAIClient(configuration["OpenAI:Key"]!);
var chat = client.GetChatClient("gpt-4o");

var movies = await chat.CompleteChatAsync<Movie[]>([
    // message(s)
]);
```

The generic version of the existing `CompleteChatAsync` method should do the following 
automatically:

1. Use the new JsonSchemaExporter to generate a schema for the type `T`
2. Cache the schema for future use
3. Set the relevant option in the OpenAI API to use the schema
4. Parse the response into the type `T` and return it.
5. If the type is an array/enumerable, wrap your T in a `Values<T>` to workaround the 
   OpenAI limitation that the schema root element must be an object (not an array).

<script src="https://gist.github.com/kzu/ce03963cdb0fd48ce1bbef6e6bcad52b.js"></script>

The code is fairly straightforward, with some things to note:

* I add support for fetching the `[Description(...)]` attribute from properties, 
  since that can be helpful for the LLM to interpret how to parse a given property.
  This is done with a `TransformSchemaNode` callback in the `JsonSchemaExporterOptions`:

    ```csharp
    var node = JsonSchemaExporter.GetJsonSchemaAsNode(jsonOptions, typeof(T), 
        new JsonSchemaExporterOptions
        {
            TreatNullObliviousAsNonNullable = true,
            TransformSchemaNode = (context, node) =>
            {
                var description = context.PropertyInfo?.AttributeProvider?.GetCustomAttributes(typeof(DescriptionAttribute), false)
                    .OfType<DescriptionAttribute>()
                    .FirstOrDefault()?.Description;

                if (description != null)
                    node["description"] = description;

                return node;
            },
        });
    ```

* The exporter allows passing a JsonSerializerOptions, and I found that requiring 
  strict number handling works best:

    ```csharp 
    static JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web)
    {
        TypeInfoResolver = new DefaultJsonTypeInfoResolver(),
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.Strict,
    };       
    ````

* Since the OpenAI API requires the root element to be an object, I wrap the 
  array in a `Values<T>` class:

    ```csharp
    public class Values<T>
    {
        public required T Data { get; set; }
    }
    ```

  I detect this at the beginning of the method by checking for an array element type 
  or generic type parameter (for `IEnumerable<T>`, `List<T>`, etc.) and adjust the 
  code to use the `Values<T>` wrapper accordingly before returning the actual `Data` 
  for the requested type.

So let's try this in a simple console app that scraps an IMDB list such as 
[popular thriller movies rated 6+ with over 50k votes](https://www.imdb.com/chart/moviemeter/?ref_=nv_mv_mpm&genres=thriller&user_rating=6%2C&sort=user_rating%2Cdesc&num_votes=50000%2C):

Let's first see what we'll render: 

![IMDB Thriller Movies](/img/typed-chat-imdb.png)

We'll need a couple simple record classes to hold that movie info:

```csharp
public record Movie(string Title, int Year, TimeSpan Duration, string AgeRating, StarsRating Stars, string Url);

public record StarsRating(double Stars, long Votes);
```

Then let's set the console encoding plus collect the URL and we'll just use a user secret 
for the OpenAI key:

```csharp
Console.OutputEncoding = Encoding.UTF8;

var url = "https://www.imdb.com/chart/moviemeter/?ref_=nv_mv_mpm&genres=thriller&user_rating=6%2C&sort=user_rating%2Cdesc&num_votes=50000%2C";
// Allow passing the URL as an argument to the script
if (args.Length > 0)
    url = args[0];

var configuration = new ConfigurationBuilder()
    .AddUserSecrets(Assembly.GetExecutingAssembly())
    .Build();

var client = new OpenAIClient(configuration["OpenAI:Key"] ?? throw new InvalidOperationException("Missing OpenAI key"));
var chat = client.GetChatClient("gpt-4o");
```

Web pages typically have a lot of stuff that we don't really need for scraping, namely 
the `<head>` section, styles and scripts, etc. I use my [Devlooped.Web](https://www.nuget.org/packages/Devlooped.web) library that does that cleanup already by default for me:

```csharp
using var http = new HttpClient();
http.DefaultRequestHeaders.AcceptLanguage.Add(new("en-US"));

var html = await http.GetStringAsync(url);
var body = HtmlDocument.Parse(html).CssSelectElement("body")!.ToString(SaveOptions.DisableFormatting);
```

Now for the actual typed chat invocation that will do the magic scraping and return the 
a typed array of `Movie` objects from IMDB:

```csharp
var movies = await chat.CompleteChatAsync<Movie[]>(
    [
        new SystemChatMessage(
            """
            You are an HTML page scraper. 
            You use exclusively the data in the following HTML page to parse and return a list of movies.
            You perform smart type conversion and parsing as needed to fit the result schema in JSON format.
            """),
        new UserChatMessage(body),
    ]);
```

That's literally ALL it takes. Now let's render it nicely using [Spectre.Console](https://www.nuget.org/packages/Spectre.Console):

```csharp
var table = new Table()
    .Border(TableBorder.Rounded)
    .Title("Top Thriller Movies")
    .AddColumn("Title")
    .AddColumn("Year/[italic]Rating[/]")
    .AddColumn("[dim]Duration[/]")
    .AddColumn("Stars (Votes)");

foreach (var movie in movies!)
{
    table.AddRow(
        $"[bold][blue][link={movie.Url}]{movie.Title}[/][/][/]",
        $"{movie.Year} [italic]{movie.AgeRating}[/]",
        $"[dim]{movie.Duration.Humanize(2, collectionSeparator: " ")}[/]",
        $"[yellow]:star: {movie.Stars.Stars:0.0}[/] ({((double)movie.Stars.Votes).ToMetric()})");
}

AnsiConsole.Write(table);
```

Pretty mind-boggling what LLMs can do these days. Combined with a strong-typed API on top of 
the basic chat, this is becoming a very powerful tool for automating all sorts of tasks.

Enjoy!