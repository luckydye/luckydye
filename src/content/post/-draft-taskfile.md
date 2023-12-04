---
title: An interface for running scripts
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

For more detailed usage and examples, check out the [Taskfile Usage](https://taskfile.dev/usage/) and the [Styleguide](https://taskfile.dev/styleguide/).

## How I use Taskfiles

I settled on a couple standard tasks I define in every project with this dependency hierarchy:

- `task setup` - setup project, installing dependencies etc.
  - `task dev` - starts the project in development mode
  - `task build` - builds the project for production
    - `task test` - runs the tests
  - `task lint` - runs the linter
  - `task fix` - formats the code and fixes linting errors

The "dev" task has a dependency on "setup", meaning, when I run the "dev" task, it will first run the "setup" task automagically. This means, I can clone any project of mine and expect that with a single command, `task dev`, it will install and start the project.

Here an example of a full basic Taskfile I would use:

```yaml
version: "3"

dotenv: [".env"]

tasks:
  setup:
    run: once
    desc: Setup dependencies
    sources:
      - .rtx.toml
      - package.json
      - pnpm-lock.yaml
      - "**/package.json"
    cmds:
      - cp .env.example .env
      - rtx install 2> /dev/null || true # error ignored in case user is not using rtx
      - pnpm install

  dev:
    desc: Start the development server
    deps: [setup]
    cmds:
      - npx vite --host --port 3000 app

  build:
    desc: Build the project
    cmds:
      - npx vite build app

  test:
    desc: Run tests
    deps: [build]
    cmds:
      - npx vitest

  fix:
    deps: [setup]
    cmds:
      - npx biome lint --apply-unsafe .
      - npx biome format --write .

  lint:
    deps: [setup]
    cmds:
      - npx biome lint --log-level=error --log-kind=compact --max-diagnostics=200 .
```

No matter if the project is using plain npm, pnpm, vite or webpack. I can always run the same commands.

Another useful trick for running parallel tasks is to use the `--parallel` flag in a new task.
It also helps for tasks that don't need to be run individually, to omit the "desc" field. That way it wont be shown in the list of `task -l`.

```yaml
tasks:
  dev:backend:
    cmd: run be
  dev:frontend:
    cmd: run fe

  dev:
    desc: Run for development
    cmds:
      - task --parallel dev:backend dev:frontend
```

## Installing tooling

I already mentioned _rtx_ in another post: [Development tools I use daily](/tools).
With _rtx_, even installing the tools needed to run the project can be automated within the setup task.

[Install it!](https://github.com/jdx/rtx)

## Run tasks in CI

This also makes writing CI configurations a lot simpler. I can basically only run one task per job.
And I can partially test CI jobs locally by just running the same task as the CI job.

Example Gitlab CI job configuration:

```yaml
image: ubuntu:latest

stages:
  - test

test:
  script: task test
  stage: test
  only:
    - main
```

## Environment variables

You can tell task to load environment variables from a file with the `dotenv` option in the root.

```yaml
dotenv: [".env"]
```

This standardizes how environment variables are loaded across projects and CI.
No need to install some npm package to load environment variables from a file.

## Task Variables

Tasks can also have variables. This is useful for example when you want to run the same task with different options.

```yaml
tasks:
  # how the version is created is only defined once and can be reused
  version:
    deps: [build]
    requires:
      vars: [type]
    cmds:
      - npm version {{.type}}

  version:minor:
    desc: "Create minor version"
    cmds:
      - task: version
        vars:
          type: minor
```

## Running tasks in different directories

With the `dir` option, we can set the directory the task should run in.

```yaml
tasks:
  test:packages:
    desc: Test only packages
    dir: "./packages"
    cmds:
      - npx vitest
```

Now we can run `task test:packages` from anywhere in the project and it will always run the tests in the packages directory.

The directory it run in could also be a variable.

```yaml
env:
  PACKAGE_SCOPE:

tasks:
  test:
    desc: Run tests
    dir: "./{{.PACKAGE_SCOPE}}"
    cmds:
      - npx vitest
```

Run like this:

```bash
$ task test:packages PACKAGE_SCOPE=packages
```
