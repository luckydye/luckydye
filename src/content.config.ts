import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

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
};
