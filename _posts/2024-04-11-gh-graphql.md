---
title: "GitHub GraphQL API Full Screen"
tags: [github]
---

The [GitHub GraphQL explorer](https://docs.github.com/en/graphql/overview/explorer) 
is an awesome way to explore the GitHub API. It's a great way to learn about GraphQL 
too, as you can see the schema, the types, and the queries you can make.

Perhaps it's not well-known, but it's basically powered by an iframe that embeds the 
[graphiql tool](https://github.com/graphql/graphiql), which is pretty much the standard 
way to explore GraphQL APIs nowadays.

I find the way GitHub configured it to be claustrophobically small, though.

![GraphQL explorer in regular screen](/img/graphql-small.png)

And no matter how wide your monitor is, it stays put with the same tiny width.

![GraphQL explorer in wide screen](/img/graphql-wide.png)

It's almost unusable. Not a big deal if you use it every now and then. You can 
just open the developer tools and change styles here and there to make it better.

But lately I had to use it a lot, and it was getting on my nerves. So I decided 
to make it full screen, predictably and consistently. Here are the easy steps:

1. Install the [Custom Style Script](https://microsoftedge.microsoft.com/addons/detail/custom-style-script/eocdolakkgkbmnfojgicnicdnmimfhoo) extension for your browser (optionally from the [Chrome Web Store](https://chromewebstore.google.com/detail/custom-style-script/ecjfaoeopefafjpdgnfcjnhinpbldjij) if you haven't switched to the better browser yet).
2. Then use the following settings to add a custom CSS to the GitHub GraphQL explorer:

     -  URL: `https://docs.github.com/en/graphql/overview/explorer`
     -  CSS ([gist here](https://gist.github.com/kzu/8a205bebfd0a88eab3b5bf66e37a4e77)): 

```css
[data-container=nav] {
  display: none !important;
}

footer { 
  display: none !important;
}

#main-content .container-xl {
  max-width: unset;
}

#main-content .container-xl > div[class^=Box-sc-] > div[class^=Box-sc-]:nth-child(1) {
  display: none !important;
}

#main-content .container-xl > div[class^=Box-sc-] > div[class^=Box-sc-]:nth-child(2) {
  display: none !important;
}

#article-contents > div:first-child {
  display: none !important;
}

iframe {
  height: 87vh !important;
}

#graphiql {
  height: 90vh !important;
}

.graphiql-ide {
    height: 90vh !important;
}
```

After adding the script, ensure the `IFRAME` option is checked (so it applies to the graphiql iframe) 
and uncheck the `DOMAIN` option (so it applies to the specific URL) as follows:

![Checking IFRAME option for custom CSS](/img/graphql-customcss.png)

Reload the [GraphQL explorer](https://docs.github.com/en/graphql/overview/explorer) 
after typing the CSS above, and you should see it full screen:

![GraphQL explorer in wide screen](/img/graphql-fullscreen.png)

You can enjoy it in gigantic widescreen glory now. 🎉

![GraphQL explorer in gigantic screen](/img/graphql-gigantic.png)
