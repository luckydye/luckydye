import { defineCollection, z } from "astro:content";
import { VektorClient } from "@vektorapp/api";
import { vektorLoader } from "@vektorapp/api/loader";
import type { Loader } from "astro/loaders";

async function createVektorLoader(): Promise<Loader> {
	const client = new VektorClient({
		baseUrl: import.meta.env.VEKTOR_URL,
		accessToken: import.meta.env.VEKTOR_ACCESS_TOKEN,
	});
	const spaceId = import.meta.env.VEKTOR_SPACE_ID;
	if (!spaceId) throw new Error("VEKTOR_SPACE_ID is required");
	// Only documents nested directly under the "home" document make up the site.
	const home = await client.getDocumentBySlug(spaceId, "home-1");
	if (!home) throw new Error("Vektor document \"home-1\" not found");

	return vektorLoader(client, {
		spaceId,
		revision: import.meta.env.PROD ? "published" : "current",
		assetMode: "download",
		propertyFilters: { sourceCollection: null },
		filter: (document) => document.parentId === home.id,
	});
}

const vektorCurrentLoader: Loader = import.meta.env.VEKTOR_URL
	? await createVektorLoader()
	: { name: "vektor-loader-disabled", load: async () => {} };

export const collections = {
	pages: defineCollection({
		loader: vektorCurrentLoader,
		schema: z.object({
			docId: z.string(),
			parentId: z.string().nullable(),
			title: z.string().nullable(),
			headerImage: z.string().nullable(),
			content: z.string().nullable(),
			updatedAt: z.string(),
			currentRev: z.number(),
			publishedRev: z.number().nullable(),
			// A Vektor property holds a single value or a list of them.
			// Keys are lowercased so property names are matched case-insensitively.
			properties: z
				.record(z.union([z.string(), z.array(z.string())]))
				.transform((properties) =>
					Object.fromEntries(
						Object.entries(properties).map(([key, value]) => [
							key.toLowerCase(),
							value,
						]),
					),
				),
		}),
	}),
};
