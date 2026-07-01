import { VektorClient } from "@vektorapp/api";
import { vektorLoader } from "@vektorapp/api/loader";
import type { Loader } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const vektorCurrentLoader: Loader = import.meta.env.VEKTOR_URL
  ? vektorLoader(
      new VektorClient({
        baseUrl: import.meta.env.VEKTOR_URL,
        accessToken: import.meta.env.VEKTOR_ACCESS_TOKEN,
      }),
      {
        spaceId: import.meta.env.VEKTOR_SPACE_ID,
        revision: "current",
        assetMode: "download",
        propertyFilters: { sourceCollection: null },
        assetProperties: ["images", "assets"],
      },
    )
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
      properties: z.record(z.string()),
    }),
  }),
};
