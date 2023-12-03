import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import solid from "@astrojs/solid-js";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  output: "hybrid",
  site: "https://luckydye.dev",
  adapter: vercel({
    analytics: true,
  }),
  integrations: [
    solid(),
    tailwind({
      applyBaseStyles: false
    }),
  ],
  build: {
    inlineStylesheets: "always",
  },
});
