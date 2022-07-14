---
title: "How to avoid hiting GitHub API rate limits in CI workflows"
tags: [devops, github]
---

I have a [dependabot-like workflow](https://github.com/devlooped/oss/blob/main/.github/workflows/dotnet-file.yml) I run on a schedule 
across many repos (it synchronizes arbitrary files across arbitrary repos using [dotnet-file](https://github.com/devlooped/dotnet-file/)), 
which just recently failed since it hit the [GitHub rate limit](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting). 

This is tricky in my particular case since these scheduled workflows all run at the same time. 
Luckily, a bit of powershell is all you need to solidly workaround this.

**TLDR;**

```
- name: ⌛ rate
  shell: pwsh
  run: |
    # add random sleep since we run on fixed schedule
    sleep (get-random -max 60)
    
    # get currently authenticated user rate limit info
    $rate = gh api rate_limit | convertfrom-json | select -expandproperty rate

    # if we don't have at least 100 requests left, wait until reset
    if ($rate.remaining -lt 10) {
        $wait = ($rate.reset - (Get-Date (Get-Date).ToUniversalTime() -UFormat %s))
        echo "Rate limit remaining is $($rate.remaining), waiting for $($wait) seconds to reset"
        sleep $wait
        $rate = gh api rate_limit | convertfrom-json | select -expandproperty rate
        echo "Rate limit has reset to $($rate.remaining) requests"
    }
```

We first sleep the start randomly (0-60 seconds). I wish there was a built-in cron syntax for something like that :).
Next, we use the `gh` CLI to retrieve the current limit with `gh api rate_limit`.

**NOTE**: the `gh` CLI needs the token set as an environment variable. You can do this at the step 
level or for the whole workflow. I prefer the latter to avoid repetition, so you can place this before 
the `jobs`:

<!-- {% raw %} -->
```
env:
  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
<!-- {% endraw %} -->

Importantly, the GH actions when using this built-in token are 
[limited to 1.000 requests per hour per repository](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#requests-from-github-actions). 
Make sure you set your own PAT instead as a secret to get the full 15k requests. I generalize this across 
repos by adding a step that populates `GH_TOKEN` automatically from `GITHUB_TOKEN` if undefined:

<!-- {% raw %} -->
```
- name: 🔍 GH_TOKEN
  if: env.GH_TOKEN == ''
  shell: bash
  env: 
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: echo "GH_TOKEN=${GITHUB_TOKEN}" >> $GITHUB_ENV
```
<!-- {% endraw %} -->

This allows me to selectively bump the requests limit only on repos/orgs I want to.

Next, a bit of [stackoverflow](https://stackoverflow.com/a/47313603/24684) helped get the 
seconds we need to wait until the API limit resets, since we get the GH API reset time in UTC epoch seconds:

```
$wait = ($rate.reset - (Get-Date (Get-Date).ToUniversalTime() -UFormat %s))
```

And then it's just the wait and some logging, basically `sleep $wait`.

Of course, depending on the max workflow run time limits, you may hit a timeout, but I guess 
at that point it's unavoidable.