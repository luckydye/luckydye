---
title: Tailwind for Web-Components
description: How to use tailwind with the shadow-dom correctly
date: 2025-04-30
author: Tim Havlicek
topics: [tailwind, webdev, tools, vite, javascript]
tags: [webdev]
---

This is a guide on how to use tailwind with web-components, utilising the theme and utilities available. Without unnecessary code duplication.

Tailwind is a powerful tool for building components for the web very quickly.
The theming possibility is a very strong point to use tailwind for a design system.
It provides utility classes, so all styling, markup and logic of a component, can be isolated within the markup alone.

<br/>

All examples expect vite to be used for bundling.

## Problem

Tailinwd is made to generate a global css file for all elements of the page to reference.
Which reduces duplication of written css.

But when using the shadowDOM, we cannot use styles defined globally in the document. That's the whole point of the shadowDOM.

So to be able to use tailwind in the shadowDOM, the styles need to exist inside the shadowDOM as well.

## Possible Solutions

First, lets try to just import the generated css file by tailwind into the shadowDOM.

```javascript
import tailwindStyles from './tailwind.css?inline';
...
const style = document.createElement('style');
style.textContent = tailwindStyles;
shadowRoot.appendChild(style);
```

The problem with this approach, is that it will import all of the styles, used in the shadowDOM or not, into the js bundle. Which means we load the same code, at least twice.

Also the theming variables from the global css are overwritten, since they are defined with `:root, :host`.


### Client-Side tailwind

Another solution would be to simply generate the tailwind styles on the client for each web-component with something like [twind](https://github.com/tw-in-js/twind/)
But that wastes alot of compute and defeats the purpose of using tailwind to precompile the styles for a fast render.

It may be the solution to some problem, but almost never for normal websites.


## The right way

We use some core css concepts to our advantage.

- CSS Variables defined in the root page are available in shadowDOM too.


---

We import the compiled tailwind css at build-time as a virtual module.

---


### Code

This using tailwind v4 and lightningcss to minify the css.
https://github.com/atrium-ui/shadow-tailwind

Output of tailwind module
```javascript
const TAILWIND_CSS = `/*! tailwindcss v4.1.4 | MIT License | https://tailwindcss.com */
.pointer-events-none{pointer-events:none}.static{position:static}.mb-4{margin-bottom:calc(var(--spacing,.25rem)*4)}.block{display:block}.flex{display:flex}.w-full{width:100%}.max-w-4xl{max-width:var(--container-4xl,56rem)}.cursor-pointer{cursor:pointer}.items-center{align-items:center}.justify-between{justify-content:space-between}.gap-x-6{column-gap:calc(var(--spacing,.25rem)*6)}.rounded-md{border-radius:var(--radius-md,.375rem)}.bg-zinc-100{background-color:var(--color-zinc-100,oklch(96.7% .001 286.375))}.px-4{padding-inline:calc(var(--spacing,.25rem)*4)}.py-4{padding-block:calc(var(--spacing,.25rem)*4)}.pb-6{padding-bottom:calc(var(--spacing,.25rem)*6)}.text-left{text-align:left}.text-xl{font-size:var(--text-xl,1.25rem);line-height:var(--tw-leading,var(--text-xl--line-height,calc(1.75/1.25)))}@media (hover:hover){.hover\\:bg-zinc-200:hover{background-color:var(--color-zinc-200,oklch(92% .004 286.32))}}button{appearance:unset;cursor:pointer;background:0 0;border:none;padding:0;font-family:inherit;line-height:1}`;
```

Example using lit.

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

---

This approach offers some advantages:

- We can code-split properly, since only classes used within the shadowDOM are included in the bundle for that component. As tailwind intended.
- Styles in the js bundle are minified and optimized.
- All tailwind utilities and theme vars are also available in web-components.

### Limitations

- Since we cannot share classes used in the shadowDOM, they may be duplicated for each web-component.
- Styles in the shadowDOM do not include CSS resets included with tailwind.


## End

Bye
