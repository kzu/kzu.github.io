---
title: "How to retry failing dotnet tests in GitHub Actions"
description: |
  When running dotnet test, there is no built-in mechanism 
  to retry failed tests. This post shows how to achieve this 
  with a bit of bash scripting that can run on all dotnet 
  supported OSes in GitHub Actions.

tags: [dotnet, github, ci]
---

**TL;DR;**:

```yml
  - name: 🧪 test
    shell: bash --noprofile --norc {0}
    env:
      LC_ALL: en_US.utf8
    run: |
      counter=0
      exitcode=0
      reset="\e[0m"
      warn="\e[0;33m"
      while [ $counter -lt 6 ]
      do
          if [ $filter ]
          then
              echo -e "${warn}Retry $counter for $filter ${reset}"
          fi
          # run test and forward output also to a file in addition to stdout (tee command)
          dotnet test --no-build --filter=$filter | tee ./output.log
          # capture dotnet test exit status, different from tee
          exitcode=${PIPESTATUS[0]}
          if [ $exitcode == 0 ]
          then
              exit 0
          fi
          # cat output, get failed test names, join as DisplayName=TEST with |, remove trailing |.
          filter=$(cat ./output.log | grep -o -P '(?<=\sFailed\s)\w*' | awk 'BEGIN { ORS="|" } { print("DisplayName=" $0) }' | grep -o -P '.*(?=\|$)')
          ((counter++))
      done
      exit $exitcode
```

I had some networking-related tests that were (expectedly) kinda flaky. But rather than 
disable them in CI, I thought it would be better to just retry failed tests a few times 
to ensure good coverage and avoid unexpected *actual* failures. Unfortunately, the isn't 
a way with plain `dotnet test` to automatically rerun failed ones, and there isn't a 
[built-in task like in Azure Pipeline](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/test/vstest?view=azure-devops) that will do that. 

So after a couple hours brushing up my (non-existent) bash-fu, I came up with the above 
script.

> NOTE: I could have used Powershell Core, sure. But I wanted to see what it would look 
> like in bash too. Also, pwsh isn't everyone's favorite shell either, so why not?

So, explaining what the above does beyond the obvious:

* `shell: bash --noprofile --norc {0}`: since the script detects `dotnet test` failures, 
  we need to disable [fail-fast behavior](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#exit-codes-and-error-action-preference) 
  which is [on by default](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#using-a-specific-shell) 
  when using just `shell: bash`. The thing that does the trick is the `{0}` template string. 
  Here we just copy the other options that GH Actions uses by default, and exclude the 
  `pipefail` one which is the one that can trip the script.
  
* `LC_ALL: en_US.utf8`: I've no idea what this was all about, but it kept failing *just* on 
  Windows. So, [StackOverflow](https://stackoverflow.com/questions/61456142/grep-p-supports-only-unibyte-and-utf-8-locales-in-jenkins) to the rescue, and it Just Works ¯\_(ツ)_/¯
  
* `reset` and `warn` values: these are used to color the *Retry* message in the output. 
  It was another [trip to the web](https://techstop.github.io/bash-script-colors/#:~:text=Colors%20in%20bash%20scripts%20can%20be%20used%20to,Background%20colors%20can%20be%20used%20for%20section%20separation.).

* `tee` command after `dotnet test`: I wanted to let the test run output show in the console, 
  but also need to capture that output to a file to detect failed tests easily. That's precisely 
  what that [tee](https://linuxize.com/post/linux-tee-command/) command does.
  
* `${PIPESTATUS[0]}`: since I pipe `dotnet test` to `tee`, but I still want to get the 
  final exit code from the former, not the latter, so, [another learning](https://unix.stackexchange.com/questions/14270/get-exit-status-of-process-thats-piped-to-another)! Since that variable is reset as soon as another pipeline is executed, I 
  need to capture its value in `exitcode`, for later reference when exiting the loop after 
  the 5 retries.

* `$filter`: you can pass an empty `--filter=` argument to `dotnet test` and it will happily 
  run all tests in that case. Which is why I can place it directly inside the `while`. The 
  [format for the filter](https://docs.microsoft.com/en-us/dotnet/core/testing/selective-unit-tests?pivots=xunit)
  is a pipe (`|`) separated list of `DisplayName=[TEST]`. Populating this as a single string 
  using a pipeline of various *nix primitives took a bit of time, but the result looks super 
  compact and clean. Let's go over it by segment:
  
  - `cat ./output.log`: just read the file written by `tee`
  - `grep -o -P '(?<=\sFailed\s)\w*'`: the output you see in the console when you run `dotnet test`
    contains `[xUnit...] DISPLAYNAME_OF_TEST [FAIL]` but the actual log doesn't have that format. 
    It's simply ` Failed DISPLAYNAME_OF_TEST [n ms]`, so I regex for that using a positive 
    look-behind. From what I gathered, the `-P` switch is required to allow for that kind of 
    expression, and `-o` means "output just the matched string, not the entire line".
  - `awk 'BEGIN { ORS="|" } { print("DisplayName=" $0) }'`: oh boy, concatenating all values from 
    `grep` with `|` took some digging. Yeah, I'm *that* newbie. But what this command does is 
    set the "record separator" to `|` before running the other "lambda" in a loop for each value 
    and concatenating them all. 
  - `grep -o -P '.*(?=\|$)')`: the resulting string from the concatenation contains a trailing 
    `|` at this point, and amazingly, there is no `TrimEnd` feature at all in bash. So, another 
    regex but this time with a positive look-ahead instead ¯\_(ツ)_/¯
    
And that's about it. 22 LoC with no dependencies whatesoever and that can run everywhere.

## A note on macOS

Turns out the `-o` and `-P` options do not exist in BSD grep (which ships with macOS) but are 
from GNU grep \o/. The "right" version can trivially be installed with `brew install grep` but 
that will *not* become the `grep` in the `PATH`. Changing the script to use `ggrep` instead 
as mentioned [in StackOverflow](https://stackoverflow.com/questions/59232089/how-to-install-gnu-grep-on-mac-os) 
is hardly convenient. So changing the `PATH` to prepend the new `grep` path seems best.

There are various options for [changing PATH within a shell script](https://unix.stackexchange.com/questions/23426/how-to-alter-path-within-a-shell-script) 
but the one I found easiest to integrate with GH Actions was to conditionally generate a 
`.bash_profile` file in a step and conditionally load it from the main script if the file 
exists, like so:

```yml
  - name: ⚙ GNU grep
    if: matrix.os == 'macOS-latest'
    run: |
      brew install grep
      echo 'export PATH="/usr/local/opt/grep/libexec/gnubin:$PATH"' >> .bash_profile

  - name: 🧪 test
    shell: bash --noprofile --norc {0}
    env:
      LC_ALL: en_US.utf8
    run: |
      [ -f .bash_profile ] && source .bash_profile
      ...
```

In this particular case I'm using a matrix strategy like:

```yml
  strategy:
    matrix:
      os: [ubuntu-latest, windows-latest, macOS-latest]
```

Which drives the conditional `if` above. The first line in the script shown at the beginning 
now just needs to source the file if it exists: `[ -f .bash_profile ] && source .bash_profile`.


Enjoy!
  