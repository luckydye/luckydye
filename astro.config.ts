import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import solid from '@astrojs/solid-js';
import prefetch from '@astrojs/prefetch';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	outDir: 'dist',
	site: 'https://luckydye.dev',
	integrations: [
		solid(),
		tailwind({
			applyBaseStyles: false,
		}),
		prefetch(),
		sitemap({
			filter(page: string) {
				return true;
			},
		}),
	],
	build: {
		inlineStylesheets: 'always',
	},
});
