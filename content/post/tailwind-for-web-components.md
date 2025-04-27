---
title: Using Tailwind CSS Inside Web-Components
description: Learn how to use Tailwind CSS effectively within Web Components and the Shadow DOM without unnecessary duplication.
date: 2025-04-27
author: Tim Havlicek
topics: [tailwind, webdev, tools, vite, javascript]
tags: [webdev]
---

> TL;DR:
Tailwind CSS doesn’t work out-of-the-box inside Web Components because the Shadow DOM isolates styles.
Instead of duplicating global styles or compiling on the client, you can precompile scoped, optimized Tailwind CSS per component at build time.
This keeps your bundles small, your components fully styled, and your theming intact — without unnecessary overhead.

Tailwind is a powerful tool for building components for the web very quickly.
The theming possibility is a very strong point to use Tailwind for a design system.
It provides utility classes, so all styling, markup and logic of a component, can be isolated within the markup alone.

## The Problem

Tailwind generates a global CSS file for the entire page, reducing duplication. But when using the shadowDOM, we cannot use classes defined globally in the document. That's the whole point of the shadowDOM.

So to be able to use Tailwind in the shadowDOM, the styles need to exist inside the shadowDOM as well.

## Possible Solutions

First, let’s try to import the generated css by Tailwind, as a string, in JavaScript.

```javascript
import tailwindStyles from './tailwind.css?inline';
/// ...
const style = document.createElement('style');
style.textContent = tailwindStyles;
shadowRoot.appendChild(style);
```

The problem with this approach is that it imports all styles into the JavaScript bundle, whether they’re needed or not — meaning we load the same styles at least twice: once globally and once inside the Shadow DOM.

Also the theming variables from the global css are overwritten, since they are defined with `:root, :host { ... }` inside the shadowDOM css.


### Compile Tailwind on the client

Another solution would be to simply generate the Tailwind styles on the client for each web-component with something like [twind](https://github.com/tw-in-js/twind/)
But that wastes a lot of compute and defeats the purpose of using Tailwind to precompile the styles for a fast render.

It may be the solution to some problem, but almost never a good one for normal websites.


## The right way

We use a core CSS concept to our advantage: **CSS Variables defined in the document root, are available in shadowDOM too.**

This makes it possible to omit all theme variables from the CSS in the shadowDOM, but still make it use the root theme variables. So if we get the compiled CSS by Tailwind, for each shadowRoot separately, and inject it in JavaScript, we get to use Tailwind with all features and minimal overhead.

### Build Plugin

The compilation needs to happen at build-time, using a plugin like Tailwind CSS's official plugin for Vite. Except unlike the official Vite plugin, we want to compile multiple styles, scoped to a single web-component.

So I wrote this custom build plugin to achieve this.
The code is available at https://github.com/atrium-ui/shadow-tailwind. It will generated a virtual module, basically code that is generated build-time, which contains compiled CSS, of the file it is imported in.

The module contents will look something like this after building:

```javascript
const TAILWIND_CSS = `/*! tailwindcss v4.1.4 | MIT License | https://tailwindcss.com */
.pointer-events-none{pointer-events:none}.static{position:static}.mb-4{margin-bottom:calc(var(--spacing,.25rem)*4)}.block{display:block}.flex{display:flex}.w-full{width:100%}.max-w-4xl{max-width:var(--container-4xl,56rem)}.cursor-pointer{cursor:pointer}.items-center{align-items:center}.justify-between{justify-content:space-between}.gap-x-6{column-gap:calc(var(--spacing,.25rem)*6)}.rounded-md{border-radius:var(--radius-md,.375rem)}.bg-zinc-100{background-color:var(--color-zinc-100,oklch(96.7% .001 286.375))}.px-4{padding-inline:calc(var(--spacing,.25rem)*4)}.py-4{padding-block:calc(var(--spacing,.25rem)*4)}.pb-6{padding-bottom:calc(var(--spacing,.25rem)*6)}.text-left{text-align:left}.text-xl{font-size:var(--text-xl,1.25rem);line-height:var(--tw-leading,var(--text-xl--line-height,calc(1.75/1.25)))}@media (hover:hover){.hover\\:bg-zinc-200:hover{background-color:var(--color-zinc-200,oklch(92% .004 286.32))}}button{appearance:unset;cursor:pointer;background:0 0;border:none;padding:0;font-family:inherit;line-height:1}`;
```

It contains minified and optimized CSS compiled from the Tailwind classes used in the source of the file.

Using [Lit](https://lit.dev/) to illustrate how this can be used within web-components:

```javascript
import { html, LitElement, unsafeCSS } from "lit";
import TAILWIND_CSS from "shadow-tailwind:css";

export class ComponentElement extends LitElement {
  static styles = unsafeCSS(TAILWIND_CSS);

  render() {
    return html`
      <div class="my-4 px-4 py-2 rounded-md bg-zinc-200">
        Hello World!
      </div>
    `;
  }
}

customElements.define("a-comp", ComponentElement);
```

We import the virtual module called `shadow-tailwind:css`, and inject the CSS string into the component styles using `unsafeCSS()`.

---

This approach offers some advantages:

- CSS in the js bundle is **minified and optimized**.
- We can code-split properly, since only classes used within the shadowDOM are included in the bundle for that component.
- All Tailwind utilities and theme variables are also available in web-components.

### Limitations

- The virtual module must be imported in the same file where Tailwind classes are used.
- The CSS injected into the Shadow DOM won't include Tailwind's default CSS reset.

<br/>
<br/>

This technique lets you scale web components cleanly, without sacrificing the benefits of Tailwind.
