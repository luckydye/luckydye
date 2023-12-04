---
title: Why you probably should use tailwind
description: Maintainable Styling
date: 2023-09-30
author: Tim Havlicek
tags: [Tailwind]
---

I spent allot of time in projects that heavily use and abuse SCSS with all its features.

And my experiences with tailwind have been sooo much better.

# Separation of concerns

Bullshit.

```scss

```

# Nesting with BEM

```scss
.block {
  // this is hard to read and reason about
  &__element {
    &--modifier {
      color: red;
    }
  }
}
```
