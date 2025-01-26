import solid from "@astrojs/solid-js";
import tailwind from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import svgSprite from "svg-sprites/vite";

export default defineConfig({
  output: "static",
  devToolbar: {
    enabled: false,
  },
  integrations: [
    // @ts-ignore
    svgSprite({ dir: ["src/assets/icons/*.svg"] }),
    solid(),
  ],
  vite: {
    plugins: [
      //
      tailwind(),
    ],
  },
});
