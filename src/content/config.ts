import { z, defineCollection } from "astro:content";

const linkCollection = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    link: z.string(),
    target: z.string().optional(),
  }),
});

const postCollection = defineCollection({
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
});

export const collections = {
  post: postCollection,
  link: linkCollection,
};
