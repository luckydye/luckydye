---
title: Tailwind for Web-Components
description: How to use tailwind with the shadow-dom correctly
date: 2025-04-30
author: Tim Havlicek
topics: [tailwind, webdev, tools, vite, javascript]
tags: [webdev]
---

This is a guide on how to use tailwind with web-components, utilising the theme and utilities available. Without too much code duplication, so we only bundle the compiled utilities.

Tailwind is a powerful tool for building components for the web very quickly.
The theming possibility is a very strong point to use tailwind for a design system.
It provides utility classes, so all styling, markup and logic of a component, can be isolated within a single file.

We got to be carful, we dont want to bundle all of the tailwind theme and resets within every component, bloating the bundle size with multiples of the same css.

I don't want to maintain a package for this, so I will put everything in this article.

What's the problem?
ShadowDOM.

Wrong approach
Put all css compiled from tailwind in every component.
Client-side compiling


How it can work
CSS Variables defined in the root page are available in shadowDOM too.
We import the compiled tailwind css at build-time as a virtual module.


Pros
minified css in dist files
using utilities with theme vars in web-compoennts

Cons
some style duplication in every shadowDOM
No css resets in shadowDOM


## Code

This using tailwind v4 and lightningcss to minify the css.
https://github.com/atrium-ui/shadow-tailwind

Output of tailwind module
```javascript
const TAILWIND_CSS = `/*! tailwindcss v4.1.4 | MIT License | https://tailwindcss.com */
.pointer-events-none{pointer-events:none}.static{position:static}.mb-4{margin-bottom:calc(var(--spacing,.25rem)*4)}.block{display:block}.flex{display:flex}.w-full{width:100%}.max-w-4xl{max-width:var(--container-4xl,56rem)}.cursor-pointer{cursor:pointer}.items-center{align-items:center}.justify-between{justify-content:space-between}.gap-x-6{column-gap:calc(var(--spacing,.25rem)*6)}.rounded-md{border-radius:var(--radius-md,.375rem)}.bg-zinc-100{background-color:var(--color-zinc-100,oklch(96.7% .001 286.375))}.px-4{padding-inline:calc(var(--spacing,.25rem)*4)}.py-4{padding-block:calc(var(--spacing,.25rem)*4)}.pb-6{padding-bottom:calc(var(--spacing,.25rem)*6)}.text-left{text-align:left}.text-xl{font-size:var(--text-xl,1.25rem);line-height:var(--tw-leading,var(--text-xl--line-height,calc(1.75/1.25)))}@media (hover:hover){.hover\\:bg-zinc-200:hover{background-color:var(--color-zinc-200,oklch(92% .004 286.32))}}button{appearance:unset;cursor:pointer;background:0 0;border:none;padding:0;font-family:inherit;line-height:1}`;
```

Compared to inline css, wihtout minification. (illustration)
```javascript
class { static get styles(){return k`
    :host {
      display: block;
      position: relative;
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    ...
  `}}
```

A string cant be minified without knowing what it is.
