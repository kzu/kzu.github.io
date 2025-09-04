---
title: "Serverless redirection to save us from ugly URLs"
tags: [azure, serverless]
---

I'm a fan of CI-independent [serverless nuget feeds](https://www.cazzulino.com/serverless-nuget-feed.html): you can push 
packages from arbitrary systems to a single feed that is highly available and requires no maintenance. It can also be 
made public access (which [Azure Artifacts](https://docs.microsoft.com/en-us/azure/devops/artifacts/nuget/consume?view=vsts&tabs=new-nav)/VSTS still doesn't allow).

There is one minor issue, though: the URL isn't all that memorable or particularly short. Its format is `https://[ACCOUNT].blob.core.windows.net/[CONTAINER]/index.json`. 
It's still better than a VSTS packaging feed: `https://[ACCOUNT].pkgs.visualstudio.com/_packaging/[NAME]/nuget/v3/index.json`, but wouldn't it be nice to have something even shorter, like `http://[account].nuget.cloud/index.json`? After all, it's just a trivial HTTP redirect we need. Serverless to the rescue!

> NOTE: why even have that `index.json` at the end? Turns out, that is what tells NuGet to consider the feed as a v3 feed :(

The things we'll need for this are:

1. A nice short domain
2. An [Azure DNS](https://portal.azure.com/#blade/HubsExtension/Resources/resourceType/Microsoft.Network%2FdnsZones) zone and records for the domain
3. An [Azure Functions](https://portal.azure.com/#create/Microsoft.FunctionApp) app to perform the redirects

I head over namecheap.com, typed "nuget" and found `nuget.cloud` for ~$3. Then I went to Azure DNS and created a new DNS zone for it. 

> NOTE: turns out that renewing that domain a year later was ~$21. I'm not going to renew it, but all instructions here are still precise and will work with your own domain, whichever one you choose ;)

![create DNS zone](https://www.cazzulino.com/img/serverless-redirection-dnszone.png)


> NOTE: best way to find stuff in the Azure Portal is to just type in the search box

![search DNS in azure portal](https://www.cazzulino.com/img/serverless-redirection-search.png)


Then back to namecheap to configure the DNS for the domain.

After creating the functions app, I created a `redirect` function which is simple enough:

```
using System.Net;
using System.Web;

public static HttpResponseMessage Run(HttpRequestMessage req, TraceWriter log) 
{
    log.Info($"Redirecting {req}");
    
    var account = req.Headers.GetValues("DISGUISED-HOST").First().Replace(".nuget.cloud", "");
    var response = req.CreateResponse(HttpStatusCode.MovedPermanently);
    response.Headers.Location = new Uri($"https://{account}.blob.core.windows.net/nuget/index.json");

    return response;
}
```

Over in the function app's *Platform features* tab, we can configure the custom domain for it:

![configure custom domain](https://www.cazzulino.com/img/serverless-redirection-domain.png)

I added `*.nuget.cloud` since I want the redirection be usable by anyone creating their custom serverless nuget feeds.

Back at the DNS zone, I added a recordset for `*.nuget.cloud` to CNAME it to the azure function (`nugetcloud.azurewebsites.net` in my case) host name:

![add recordset](https://www.cazzulino.com/img/serverless-redirection-record.png)

Finally, we need to make azure function accessible from `*.nuget.cloud/index.json`. 
The function URL is currently `https://nugetcloud.azurewebsites.net/api/redirect`. In order to make it accessible 
via a different URL, we just need to create a Proxy with the desired route:

![add proxy](https://www.cazzulino.com/img/serverless-redirection-proxy.png)

With that in place, anyone using [serverless Azure nuget feeds](https://www.cazzulino.com/serverless-nuget-feed.html) can use 
a nice sort url like `http://kzu.nuget.cloud/index.json`. The only requisite is that your storage container name must be `nuget`, 
and the storage account becomes the subdomain of `nuget.cloud`.
