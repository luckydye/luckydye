import type { Loader } from "astro/loaders";
import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";
import { createVektorClient } from "@vektorapp/api";
import { vektorLoader } from "@vektorapp/api/loader";

// Vektor isn't configured for every environment (e.g. no VEKTOR_URL set yet),
// so fall back to a no-op loader instead of failing dev/build on a fetch error.
const emptyLoader: Loader = { name: "vektor-loader-disabled", load: async () => {} };

const pagesLoader = import.meta.env.VEKTOR_URL
  ? vektorLoader(
      createVektorClient({
        baseUrl: import.meta.env.VEKTOR_URL,
        accessToken: import.meta.env.VEKTOR_ACCESS_TOKEN,
      }),
      import.meta.env.VEKTOR_SPACE_ID || undefined,
    )
  : emptyLoader;

export const collections = {
  link: defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./content/link" }),
    schema: z.object({
      title: z.string(),
      link: z.string(),
      target: z.string().optional(),
    }),
  }),
  tags: defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./content/tags" }),
    schema: z.object({
      id: z.string(),
      title: z.string(),
    }),
  }),
  post: defineCollection({
    loader: glob({ pattern: "*.md", base: "./content/post" }),
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        author: z.string().optional(),
        tags: z.array(reference("tags")).optional(),
        topics: z.string().array().optional(),
        date: z.date().optional(),
        url: z.string().optional(),
        links: z.string().array().optional(),
        images: z.array(image()).optional(),
        layout: z.string().optional(),
      }),
  }),
  page: defineCollection({
    loader: glob({ pattern: "*.md", base: "./content/page" }),
    schema: () =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.date().optional(),
      }),
  }),
  pages: defineCollection({
    loader: pagesLoader,
    schema: z.object({
      docId: z.string(),
      parentId: z.string().nullable(),
      title: z.string().nullable(),
      headerImage: z.string().nullable(),
      content: z.string().nullable(),
      updatedAt: z.string(),
      properties: z.record(z.string()),
    }),
  }),
};
