---
title: Escaping Lightroom
description: A new era of photo editing in a decentralized world
date: 2023-12-02
author: Tim Havlicek
images: ["./images/escaping-lightroom-2.png"]
tags: [photography, Solid.JS, Rust, Tauri]
---

![Escaping Lightroom](./images/escaping-lightroom.png)

<br/>

Introducing a new project that I've been working on for the past few months.
It's a new photo editing app that I'm building to replace Adobe Lightroom. I'm building it because I'm tired of Adobe's subscription model and I want to own my files and the software I use to edit them.

Tokyo (working title) is a Work in Progress professional Photo Editor built on Rust and Solid.JS. It runs on all platforms including iOS, Mac, Windows, Linux.

Tokyo does not care about where your photos are stored, accessing them should be easy and fast. They can be on your local machine or on a NAS, escaping from the Cloud-only solutions, without leaving its benefits behind. Tokyo will still sync all your edits and presets between devices.

Tokyo takes you from accessing your photos to editing them, to exporting them, all in one place, from any device.

## Architecture

The desktop and mobile app is built on Tauri, a lightweight Rust framework for building multi-platform frontends, with a Solid.JS frontend.

> The apps can dig into your computer or check out stuff from a faraway library server. All those libraries are chillin' in an Sqlite database. And, just so you know, the clients and server shoot the breeze using protobufs. -- gpt3

https://github.com/luckydye/tokyo
