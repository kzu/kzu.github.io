---
name: post
description: >
  Draft, iterate, and publish a kzu.github.io blog post, then an X post with
  optional carbon.now.sh screenshots, persist it as x/{slug}.yml, push, and
  wait until GitHub Pages serves both the article and the yml. Use when the
  user runs /post, asks to draft/publish a blog post, write an X post for a
  blog entry, or babysit Pages after a post.
---

# /post

Gated pipeline for this blog. Detect the phase from files + the last user
message. Do not skip a gate.

```
draft  --(iterate in _drafts/)-->  draft
draft  --("approve" / "draft approved")-->  move to _posts, commit, push
       --> start X draft immediately
x-draft --(iterate copy + screenshots)-->  x-draft
x-draft --("approve")-->  x/{slug}.yml, commit, push, babysit Pages
```

`/post {topic or path}` starts at draft. `/post` with an existing draft, or
"continue" / "approve", resumes.

This skill does not tweet. `x/{slug}.yml` is the handoff. A publisher (or a
human) fetches `https://www.cazzulino.com/x/{slug}.yml`.

## Voice

Read `AGENTS.md` and write as kzu. Imitate 2020–2024 how-tos, not the
2025 Copilot-drafted posts. Canonical: `_posts/2024-08-17-dotnet-retest.md`,
`_posts/2021-07-22-dotnet-evergreen.md`.

## Layout

| Thing | Path | Live URL |
|---|---|---|
| Draft | `_drafts/YYYY-MM-DD-{slug}.md` | not published |
| Post | `_posts/YYYY-MM-DD-{slug}.md` | `/{slug}.html` |
| X post | `x/{slug}.yml` | `/x/{slug}.yml` |
| Screenshots | `img/{slug}-*.png` | `/img/{slug}-*.png` |

`permalink` is `/:title.html`. `{slug}` is the filename after the date, not
the `title:` string. Site: `https://www.cazzulino.com`.

`x/` is a normal folder. Jekyll copies `x/{slug}.yml` as a static file. Do
**not** put YAML front matter (`---`) on it, or Jekyll will treat it as a page.

## Detect phase

1. If `_drafts/YYYY-MM-DD-{slug}.md` exists (or the user is iterating a draft): **draft**.
2. Else if `_posts/YYYY-MM-DD-{slug}.md` exists and `x/{slug}.yml` does not: **x-draft**
   (or Phase 2 if they just said approve on a draft).
3. Else if `x/{slug}.yml` exists and they just approved the X copy: **persist + Pages**.
4. Else if they name a topic or a repo path (`..\ndnx`): **draft**.

If several drafts exist, ask which one.

## Phase 1 — Draft

1. Read `AGENTS.md` and one canonical how-to.
2. If a project path is given, read its README, changelog, and the code that
   explains *why* it exists. Open with that pain, not a lecture.
3. Write `_drafts/YYYY-MM-DD-{slug}.md`.
   - Front matter: `title`, optional `description`/`excerpt`, `tags`.
   - User-facing. Commands before internals. How-tos end with `Enjoy!`.
4. Stop. Show the path. Wait. Iterate **in `_drafts/`**. Do not move, commit, or push.

## Phase 2 — Approve the post

Only on explicit approve ("approve", "draft approved", "move it to posts"):

1. Move `_drafts/YYYY-MM-DD-{slug}.md` → `_posts/YYYY-MM-DD-{slug}.md`.
2. `git add` that file only. Commit: `Add {slug} post` (imperative, sentence
   case, no trailing period — see `AGENTS.md`).
3. `git push` to `main`.
4. Start Phase 3 in the same turn.

## Phase 3 — X draft + screenshots

Same voice. Can be longer than 280. End with
`https://www.cazzulino.com/{slug}.html`.

Screenshots only when a snippet *is* the point (CLI comparison, a number).
Use carbon.now.sh via `npx carbon-now-cli`:

```powershell
$code = @"
dnx  stop --help
ndnx stop --help
"@.Trim()
$code | npx --yes carbon-now-cli --save-to .\img --save-as {slug}-usage --skip-display
```

Pipe on stdin so the window has no filename title. Save as
`img/{slug}-{name}.png`. Show the tweet plus the PNGs. Wait. Iterate in place.

## Phase 4 — Persist X post

Only on explicit approve of the X copy. Write `x/{slug}.yml` with **no**
`---` front matter:

```yaml
# X post for /{slug}.html
text: |
  ...tweet body, including the live URL...
images:
  - /img/{slug}-usage.png
  - /img/{slug}-timing.png
```

Omit `images` if there are none. Image paths are site-root URLs so a
publisher can fetch them from the live site.

## Phase 5 — Commit and push X sidecar

`git add` `x/{slug}.yml` and any new `img/{slug}-*.png`. Commit:
`Add X post for {slug}`. Push `main`.

## Phase 6 — Babysit GitHub Pages

This repo uses the native `pages-build-deployment` workflow.

1. Find the run kicked off by the push:
   `gh run list --repo kzu/kzu.github.io --workflow=pages-build-deployment --limit 3`
2. `gh run watch` until success. On failure, print the log and stop.
3. `GET https://www.cazzulino.com/{slug}.html` — 200, body is the post.
4. `GET https://www.cazzulino.com/x/{slug}.yml` — 200, YAML parses, `text`
   is present, each `images` URL is 200.

Poll every ~15s. Give up after ~5 minutes and report what is still 404.
When live, print both URLs.

## Gates

- Do not move `_drafts/` → `_posts/` without approve.
- Do not write `x/{slug}.yml` without a second approve.
- Do not commit or push until the matching approve.
- Do not put `---` front matter on `x/*.yml`.
- Do not tweet.
- Do not commit unrelated files (`AGENTS.md`, other drafts, `.lock`).
