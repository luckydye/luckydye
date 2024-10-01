import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import svgSprite from "svg-sprites/vite";

export default defineConfig({
  output: "static",
  site: "https://luckydye.dev",
  integrations: [
    solid(),
    tailwind(),
    sitemap(),
    svgSprite({ dir: ["src/assets/icons/*.svg"] }),
  ],
});
