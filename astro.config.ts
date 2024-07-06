import { defineConfig } from "astro/config";
import solid from "@astrojs/solid-js";
import prefetch from "@astrojs/prefetch";
import tailwind from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  output: "static",
  site: "https://luckydye.dev",
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
