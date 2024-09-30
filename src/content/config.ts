import { defineCollection, reference, z } from "astro:content";

export const collections = {
  link: defineCollection({
    type: "data",
    schema: z.object({
      title: z.string(),
      link: z.string(),
      target: z.string().optional(),
    }),
  }),
  tag: defineCollection({
    type: "data",
    schema: z.object({
      id: z.string(),
      title: z.string(),
    }),
  }),
  post: defineCollection({
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
    schema: () =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.date().optional(),
      }),
  }),
};
