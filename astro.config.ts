import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import solid from '@astrojs/solid-js';
import vercel from '@astrojs/vercel/serverless';
import prefetch from '@astrojs/prefetch';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	output: 'hybrid',
	site: 'https://luckydye.dev',
	adapter: vercel({
		analytics: true,
	}),
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
