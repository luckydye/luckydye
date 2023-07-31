import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import solid from "@astrojs/solid-js";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  output: "hybrid",
  adapter: vercel({
    analytics: true,
    imageService: true,
  }),
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
