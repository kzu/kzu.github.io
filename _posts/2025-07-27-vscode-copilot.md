---
title: "VSCode shipping cadence: AI coding is real"
description: "We have all read about how awesome GitHub Copilot is, how Microsoft is (supposedly?) using it right now to ship production features, etc. But is that real o just marketing?"
tags: [dotnet vscode copilot]
---

I started playing with the [MCP C# SDK](https://github.com/modelcontextprotocol/csharp-sdk) soon after it came out, and soon realized that there 
was a gap in functionality: setting the log level in the MCP server-specific output pane in 
VSCode was not invoking my MCP server's corresponding log-level change handler. 

So I naturally opened an [issue in the VSCode repo](https://github.com/microsoft/vscode/issues/256180) and 
even provided some context that Copilot gave me about where the potential issue was and how to fix it. I 
didn't go as far as providing a PR, and a friend on X even challenged me to do so. 

A few days went by, and I decided to give it a try to see how hard it was to implement the fix, only 
to find the issue had already been fixed and shipped in the latest VSCode Insiders build. Impressive, right? 

But that was not all! A developer on the team had assigned the issue to Copilot, which worked on it 
and sent an [initial PR](https://github.com/microsoft/vscode/pull/256267) with in-depth explanations of 
the changes made, and even a test case to verify the fix!

The developer then suggested: 

> @copilot handle this internally within McpServerRequestHandler. The logger passed there already has an event.

Which resulted in a follow-up commit and subsequent comment explaining the new changes.

It was then approved, merged, and shipped in the next VSCode Insiders build. All within the same say in the span of a few hours:

![Timeline of copilot](https://raw.githubusercontent.com/kzu/kzu.github.io/main/img/vscode-copilot.png)

Pretty mind-blowing. Microsoft is not kidding around with AI coding.