---
title: Use Web Workers in less than 10 minutes
description: Fast track to using workers using Vite and Comlink.
date: 2023-09-17
author: Tim Havlicek
topics: [javascript, web-workers, vite]
---

In theory, web workers are a great idea to keep the main thread of your web application free for user interaction. In practice, they are a pain to set up and use.

Starting from your build-system, almost every tool and library we use in modern web development is not designed to work with workers.
Luckily, our savior Vite comes to the rescue. It has built-in support for workers and makes it almost easy to use them.

To be fair, if you would not build/transpile your js, that would not be a problem. But thats currently not realistic in a bigger application.

## So how do we create a worker with Vite?

A worker needs a url pointing to a js file. This part is taken care of by Vite.
When importing a file we can tell Vite to import it as a worker with a `?worker` parameter in the import path.
This will return a function that we can use to create a new worker instance.

```js
// main.ts
import MyWorker from "./worker.js?worker";
const worker = new MyWorker();
```

If we now log `globalThis` inside the worker, we can see that it is a different instance than the main thread.

```js
// worker.ts
console.log(globalThis);
// > DedicatedWorkerGlobalScope {name: '', onmessage: null, onmessageerror: null, cancelAnimationFrame: ƒ, close: ƒ, …}
```

Now we would have to do the whole `postMessage()` and `onmessage` thing to communicate with the worker.

## Enter [Comlink](https://github.com/GoogleChromeLabs/comlink)

With Comlink we can use the worker as if we were calling a function in the main thread.
We just need to wrap the worker we created with the Comlink proxy.

```js
// main.ts
import * as Comlink from "comlink";

const worker = Comlink.wrap(new MyWorker());
```

And expose some functions in the worker.

```js
// worker.ts
import * as Comlink from "comlink";

class MyWorker {
  static doSomething() {
    return "something";
  }
}

Comlink.expose(MyWorker);
```

Now we can call functions directly on the worker and it will return a promise.

```js
// main.ts
const result = await worker.doSomething();
```

Easy.

## TypeScript

Now this wont give us proper types for the worker, but we can fix that.
First we need to export the class in the worker file.

```ts
// worker.ts
export class MyWorker {
  ...
}
```

Then we import only that type in the main file and type the comlink wrapper with it.

```ts
// main.ts
import MyWorker from "./worker.js?worker";

const worker = Comlink.wrap<typeof import("./worker.js").MyWorker>(new MyWorker());

const result = await worker.doSomething();
// result is now typed as string
```

Thats it :)
