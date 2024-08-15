import { z, defineCollection } from "astro:content";
import { glob } from "astro/loaders";

export const collections = {
  link: defineCollection({
    loader: glob({
      pattern: "**/*.json",
      base: "./data/link",
    }),
    schema: z.object({
      title: z.string(),
      link: z.string(),
      target: z.string().optional(),
    }),
  }),
  post: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: "./data/post",
    }),
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        author: z.string().optional(),
        tags: z.string().array().optional(),
        date: z.date().optional(),
        url: z.string().optional(),
        links: z.string().array().optional(),
        images: z.array(image()).optional(),
      }),
  }),
  page: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: "./data/page",
    }),
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.date().optional(),
      }),
  }),
};
