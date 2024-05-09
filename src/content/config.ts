import { z, defineCollection } from "astro:content";

export const collections = {
  link: defineCollection({
    type: "data",
    schema: z.object({
      title: z.string(),
      link: z.string(),
      target: z.string().optional(),
    }),
  }),
  post: defineCollection({
    type: "content",
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
    type: "content",
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.date().optional(),
      }),
  }),
};
