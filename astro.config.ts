import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import solid from "@astrojs/solid-js";
import vercelEdge from "@astrojs/vercel/edge";

export default defineConfig({
  output: "server",
  adapter: vercelEdge(),
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
