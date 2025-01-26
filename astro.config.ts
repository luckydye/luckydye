import solid from "@astrojs/solid-js";
import tailwind from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import svgSprite from "svg-sprites/vite";

export default defineConfig({
  output: "static",
  devToolbar: {
    enabled: false,
  },
  integrations: [solid()],
  vite: {
    plugins: [
      //
      svgSprite({
        dir: ["src/assets/icons/*.svg"],
      }),
      tailwind(),
    ],
  },
});
