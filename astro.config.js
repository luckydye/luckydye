import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import solid from "@astrojs/solid-js";

export default defineConfig({
  base: "",
  experimental: {
    assets: true,
  },
  integrations: [
    solid(),
    tailwind({
      config: { applyBaseStyles: false },
    }),
  ],
  build: {
    inlineStylesheets: "always",
  },
});
