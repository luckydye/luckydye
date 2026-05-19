---
title: Writing a decompiler for Valve's Source Engine 3D assets.
description: A decompiler for compiled Source Models and Maps written in JS with WebGL renderer.
author: Tim Havlicek
url: https://vsource-viewer.web.app/
images: [./images/vsource.jpg]
date: 2021-08-10
links: [https://github.com/luckydye/vsource-decompiler, https://vsource-viewer.web.app/]
tags: [tools]
---

The idea behind this project was to render a full map of the game in the browser, to allow for real-time visualization of a live game for spectating.

When I started, I had no knowledge about most things this project covered. Never heard of GoldSrc, or any of the Source engine specific file-formats. Generally, file-formats, were mostly a black box to me.

I started learning about different types of files and formats, byte layouts, file headers and magic bytes ✨.

Then step by step, I started to understand the file formats and could parse them into a structured format. 
Which I could then use to render the map in the browser, covering alot of topics like texture compression, displacements, models and entities, and how level are built and stored.

<br/>
<br/>
<br/>
<br/>

Before going into the actual game assets, I tried finding a model of the map online. 
I only found one glb file of an old version of the map, which was not satisfactory for waht I had in mind.

![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-150854.png)

<br/>
<br/>

Then I realized, since I have the game installed, I should have all the map assets available locally.
So in my naive nature, I started to explore the game's file system, trying to make sense of the files and data I had.

<br/>
<br/>

![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145414.png)
![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145425.png)
![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145431.png)

<br/>
<br/>

Eventually, after lots of digging and trial and error, I started seeing something I recognized.

This visualization shows just the brush planes of a level.

<br/>

![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145123.png)

<br/>
<br/>

And more 

<br/>
<br/>

![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145134.png)

Here with most of the models and entities of the level, but mostly untextured. (noticeably, its running at over 100fps in the browser)

![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145143.png)

Getting the hang of texture decompression and rendering textures entities.

![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145225.png)
![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145240.png)
![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145255.png)
![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145326.png)

These are models of the maps, rendered using Blender with custom lighting and shading.
This required converting the level and model information from the game's source assets into a format that Blender could understand.

![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145314.png)
![vsource-decompiler](./vsource-decompiler/pasted-2026-02-08-145758.png)

I also built a model-viewer that allows you to explore the models and entities in the level.
