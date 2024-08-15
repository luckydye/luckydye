import { defineConfig } from "astro/config";
import solid from "@astrojs/solid-js";
import prefetch from "@astrojs/prefetch";
import tailwind from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  output: "static",
  site: "https://luckydye.dev",
  experimental: { contentLayer: true },
  integrations: [
    solid(),
    prefetch(),
    sitemap({
      filter() {
        return true;
      },
    }),
  ],
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwind()],
  },
});
