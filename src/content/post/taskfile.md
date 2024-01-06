---
title: A better way to manage scripts in your projects.
description: Using Taskfiles to provide a streamlined interface for running scripts across projects and teams.
date: 2023-12-01
author: Tim Havlicek
tags: [Taskfile, Scripts, CI]
links: [https://taskfile.dev/usage/, https://taskfile.dev/styleguide/, https://github.com/jdx/rtx]
---

> "Task is a task runner / build tool that aims to be simpler and easier to use than, for example, GNU Make."

I've been using [Taskfiles](https://taskfile.dev) for some time now, and I've found them to be a great way to manage running any kind of scripts in my projects for a couple reasons:

- Keeping a consistent interface for running scripts across projects.
- Tools within tasks can be changed independently, allowing flexibility without modifying the interface to run them.
- Built-in running multiple continuous tasks in parallel.
- Possibility to define dependencies between tasks.
- Language ecosystem independent.
- Easy env variables handling

In the past, I have used between two and three different npm packages to do the same job.

## How I use Taskfiles

I settled on a couple standard tasks I define in almost every project with this dependency hierarchy:

- `task setup` - setup project, installing dependencies etc.
  - `task dev` - starts the project in development mode
  - `task build` - builds the project for production
    - `task test` - runs the tests
  - `task lint` - runs the linter
  - `task fix` - formats the code and fixes linting errors

The `dev` task has a dependency on `setup`, meaning, when I run the `dev`, it will install all dependencies automagically without running `setup` explicitly. This means, I can clone any project of mine and expect that with a single command, `task dev`, it will install and start the project.

Here an example of a full basic Taskfile I would use:

```yaml
version: "3"

dotenv: [".env"]

tasks:
  setup:
    run: once # only run once, even if it is a dependency of multiple tasks
    desc: Setup dependencies
    sources: # only run if any of these files have changed
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
    deps: [setup] # run setup before running this task
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

The `sources` field is used to determine if the task needs to be run again. If any of the files listed in `sources` has changed since the last time the task was run, it will run again. Otherwise, it will be skipped.

Another useful trick for running parallel tasks is to use the `--parallel` flag in a new task.
It also helps for tasks that don't need to be run individually, to omit the "desc" field. That way it won't be shown in the list of `task -l`.

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

I already mentioned _mise (formerly rtx)_ in another post: [Development tools I use daily](/tools).
With _mise_, even installing the tools needed to run the project can be automated within the setup task.

[Install it!](https://github.com/jdx/mise)

## Environment variables

You can tell task to load environment variables from a file with the `dotenv` option in the root.

```yaml
dotenv: [".env"]
```

This standardises how environment variables are loaded across projects and enviroments.
No need to install some npm package to load environment variables from a file.

Additionally, env vars can be defined directly in the task:

```yaml
tasks:
  dev:
    env:
      NODE_ENV=developemnt
    cmds:
      - node scripts/dev.js
```

Like this, instead of having multiple .env files for development / staging / prod. We can define those variables directly with the task that is run.
They can also be defined for all tasks, at the root level of the taskfile.

_For deployments using docker, the production variables should be defined by the docker-compose.yml._

## Run tasks in CI

This also makes writing CI configurations a lot simpler. I can basically only run one task per job.
And I can partially test CI jobs, like linting, locally by just running the same task as the CI job.

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

Instruction for using task in CI: [Install Script](https://taskfile.dev/installation/#install-script)

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
$ task test PACKAGE_SCOPE=packages
```

## Monorepos

Taskfiles also have great potential for monorepos with included Taskfiles.

```yaml
includes:
  docs:
    taskfile: ./docs/Taskfile.yml
    dir: ./docs # defines where to run the tasks from
    optional: true # ignores it, if the taskfile is not found
    aliases: [d]
# $ task d:build
```

But because of some bugs surrounding directory paths of included tasks, I could not explore this much further yet.
