---
title: "Development tools I use daily"
description: "My every day carry of software."
date: 2023-09-04
author: Tim Havlicek
tags: [Bash, Task, Anytype, RTX]
---

## Bash (aliases, binds and scripts)

This is not mentioned often enough in my opinion.
Take the time and make aliases and scripts for tasks you do many times a week.
Those couple of seconds you waste, during typing the same commands over and over again, stack up fast.
And just in general you should probably learn some bash and GNU tools.

## Taskfile

[https://taskfile.dev/usage/](https://taskfile.dev/usage/)

Managing NPM scripts can get a little crazy in a complex enough project. Pnpm helped a little with recursive scripts, but I think there is a better way: A Taskfile

It is written in go and can be installed in a single binary. It's a great tool to standardize scripts even projects.

### Some Highlights:

- .env support
- Task Dependencies
- Task Variables
- Parallel execution
- Preconditions
- Prevent unnecessary work by fingerprinting

### Example:

```yaml
version: "3"

dotenv: [".env"]

tasks:
  # setup will be skipped if there are no changes in its sources
  setup:
    desc: Install dependencies
    dir: "{{.TASKFILE_DIR}}"
    sources:
      - .rtx.toml
      - bun.lockb
      - package.json
    cmds:
      - rtx install 2> /dev/null || true # ignore if rtx is not found
      - bun install

  # dev can be executed without running setup, because its a dependency
  dev:
    desc: Run dev server
    deps: [setup]
    cmds:
      - bun run dev
```

## RTX

[https://github.com/jdx/rtx](https://github.com/jdx/rtx)

A _Polyglot runtime manager_. You can basically think of it as a package manager,
that can install multiple versions of tools at the same time.

For example you can install node 16 for one project, node 20 for another, and it will automatically use the correct one for the project. The specific versions are pinned in a .rtx.toml file in your project directory.
That also has the advantage of having a place to look for what versions were used for the project.

```toml
[tools]
bun = "1.0.2"
task = "3"
protoc = "21"
```

(it will also find some other version management tool configs like .nvmrc)

### It's not just for node,

you can manage versions for _python_, _go_, _protoc_, _bun_, even _task_ and many more.
If you ever spent time uninstalling and installing different python versions, the befits are obvious.

## Anytype

[https://anytype.io/](https://anytype.io/)

In the past I have used many different note taking apps.
From Apple Notes to Notion and Obsidian, but anytype has been the best experience so far.

I use it to manage my work tasks, progress of personal projects and any random notes im taking, even on the go with the mobile app. Everything is peer-to-peer synced across devices seamlessly with a local-first principle. And it's open source!

Anytype is still young, but even now it is already a great tool with even greater features on the roadmap.

## Skate and Gum

[https://github.com/charmbracelet/skate](https://github.com/charmbracelet/skate)

[https://github.com/charmbracelet/gum](https://github.com/charmbracelet/gum)

A encrypted key-value store cli with a distributed database (which can be self-hosted).
I use it to store my access tokens and other secrets I use from time to time.

It is also really nice in combination with Gum.
A small cli tool to generate little terminal UI for things like: _choose_ or _filter_ from a list, _prompts_, _confirmations_ and more.

### Example:

```
export KEY=$(skate get $(skate list -k | gum choose))
```

This tiny script will print a nice select interface, which can be controlled using arrow keys.
After selecting an entry from the list, the `$KEY` env var will hold the token value.
