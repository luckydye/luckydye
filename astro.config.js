import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
	base: "",
	integrations: [
		tailwind({
			config: { applyBaseStyles: false },
		}),
	],
	build: {
		inlineStylesheets: "always",
	},
});
