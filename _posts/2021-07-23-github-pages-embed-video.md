---
title: "How to embed videos in GitHub pages without growing the repository size"
tags: [github]
---

Just a couple months ago GitHub [announced video uploads](https://github.blog/2021-05-13-video-uploads-available-github/) 
support, which allows you to just drag&drop an `.mp4` or `.mov` onto an issue,  
pull request or discussion and have it uploaded and hosted by GitHub for free 😍.

If you are hosting a blog or website with [GitHub pages](https://pages.github.com/), 
this also makes them a good choice for embedding some nice videos there too!

So the first step is to create an issue and drop the video in there, like I 
[did here](https://github.com/devlooped/dotnet-evergreen/issues/4). If you edit 
the issue, you can see the final URL for the uploaded video, something like 
[https://user-images.githubusercontent.com/NUMBER/NUMBER+GUID.mp4](https://user-images.githubusercontent.com/169707/126715420-991ad821-9ac8-4b66-b79e-e0966e0f3a89.mp4) 
and looks like the following once saved:

![screenshot of embedded video](/img/embed-video.png)

You can use the browner's devtools to inspect the HTML used to display it, which for 
this issue looks like:

```xml
<details open="" class="details-reset border rounded-2">
  <summary class="px-3 py-2 border-bottom">
    <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-device-camera-video">
    <path fill-rule="evenodd" d="..."></path>
</svg>
    <span aria-label="Video description dotnet-evergreen.mp4" class="m-1">dotnet-evergreen.mp4</span>
    <span class="dropdown-caret"></span>
  </summary>

  <video src="https://user-images.githubusercontent.com/169707/126715420-991ad821-9ac8-4b66-b79e-e0966e0f3a89.mp4" data-canonical-src="https://user-images.githubusercontent.com/169707/126715420-991ad821-9ac8-4b66-b79e-e0966e0f3a89.mp4" controls="controls" muted="muted" class="d-block rounded-bottom-2 width-fit" style="max-height:640px;">

  </video>
</details>
```

The `details` and `summary` elements make up the [collapsible section](https://gist.github.com/pierrejoubert73/902cc94d79424356a8d20be2b382e1ab) so users can hide the entire video. 
The interesting part is that `<video>` element which is just the standard [HTML5 video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) element.

Which you can embed directly in your GitHub pages-powered site like I did 
[in my recent blog post on dotnet-evergreen](https://raw.githubusercontent.com/kzu/kzu.github.io/main/_posts/2021-07-22-dotnet-evergreen.md):

```xml
<video src="https://user-images.githubusercontent.com/169707/126715420-991ad821-9ac8-4b66-b79e-e0966e0f3a89.mp4" controls="controls" style="max-width: 730px;">
</video>
```

Which looks great on the [published post]({% link _posts/2021-07-22-dotnet-evergreen.md %})
and doesn't take any space in the actual git repository when cloning on a fresh machine 😍.