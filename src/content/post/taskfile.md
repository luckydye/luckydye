---
title: An interface for developer tooling
description: Taskfiles serve as a great interface for running project scripts across projects and teams.
date: 2023-12-01
author: Tim Havlicek
tags: [Taskfile, Scripts, CI]
---

I've been using [Taskfiles](https://taskfile.dev) for a while now, and I've found them to be a great way to manage running any kind of scripts in my projects.

Keeping a consistent interface for running scripts across projects.
Keeping the mental overhead of remembering how to start up a project locally as low as possible.


From notes

Its hard when there are different scripts and commands to run on every project. 
But at the same time, there are always better tools coming to the market.
Taskfiles serve as a interface towards the developer.
Behind those tasks, the tools actually used and run, can change independently from what command the developer actually types in.

Npm scripts are not an alternative. They are too restrictive.

Behind the scenes, tasks can run npm scripts, turbo pipelines, vite builds etc.



## How I use Taskfiles

I settled on a couple standard tasks I define in every project with this dependency hierarchy:

- `task setup` - installing dependencies etc.
  - `task dev` - starts the project in development mode
  - `task build` - builds the project for production
    - `task test` - runs the tests
  - `task lint` - runs the linter
  - `task fix` - formats the code and fixes linting errors

The "dev" task has a dependency on "setup", meaning, when I run the "dev" task, it will first run the "setup" task automagically. This means, I can clone any project of mine and expect that with a single command, `task dev`, it will install and start the project.

Here an example of a Taskfile I would use:

```yaml
version: "3"
```

This also makes writing CI configurations a lot simpler. I basically only run one task per job.
And I can test CI jobs locally by just running the same task as the CI job.

## Combine with other tools

I already mentioned RTX in another post: [Development tools I use daily](/tools).
With RTX, even installing the tools needed to run the project can be automated within the setup task.
