---
title: "Best vite + tailwind setup with a single config file."
description: "The easy way to use Tailwind with vite."
date: 2023-09-30
author: Tim Havlicek
tags: [Vite, Tailwind, PostCSS, TypeScript]
---

I like using tailwind, but I can never remember how the configs are set-up.

Here is the fix:

## Copy this vite config

You could just use the `npx create vite` command, but sometimes all I need is just a build tool for my little html file or replace wepback on some older project.

So let's just create the config manually:

```typescript
// /vite.config.ts
import path from "node:path";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

export const config = defineConfig({
  plugins: [solid()],
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        tailwind({
          content: [path.resolve(__dirname, "../src/**/*.{html,js,ts,jsx,tsx}")],
          theme: {
            extend: {},
          },
          plugins: [],
        }),
      ],
    },
  },
});
```

This config assumes you use solid-js, but that can be replaced with whatever plugin you like.

It turns out, all the configs can be defined inside the vite config.
If you don't need to configure much, or share the tailwind config, this is a lot simpler than looking up how to generate all the other config files.

After installing all the dependencies:

```bash
npm install tailwindcss autoprefixer vite vite-plugin-solid
```

we are all set up. You can run a build:

```bash
npx vite build
```

or start the dev server:

```bash
npx vite
```

## Alternatively,

if you just want to build a single js bundle for a different backend:

```typescript
export const config = defineConfig({
  base: '/static/dist/',
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        dir: './dist',
        assetFileNames: '[name].[hash][extname]',
        entryFileNames: '[name].[hash].js'
      },
      input: {
        style: './styles/index.scss',
        main: './js/main.js'
      }
    }
  },
  ...
});
```

This will generate a `manifest.json` for other backends to use.

In case the manifest needs to have a different structure than provided, here is a little plugin to accomplish this:

```typescript
import fs from "node:fs";

export const config = defineConfig({
  plugins: [
    ...,
    {
      name: "rewrite-manifest",
      writeBundle(options, bundle) {
        const manifestChunk = bundle["manifest.json"];
        const manifest = JSON.parse(manifestChunk.source);
        for (const key in manifest) {
          manifest[key] = path.join("dist", manifest[key].file);
        }
        fs.writeFileSync(
          path.resolve(options.dir, manifestChunk.fileName),
          JSON.stringify(manifest, null, "  ")
        );
      },
    },
  ],
});
```

For the vite dev-server to work with this, the backend needs to provide asset URLs to the dev-server instead of its own paths in DEV mode.
