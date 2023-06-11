// 1. Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";

const postCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    author: z.string(),
  }),
});

const linkCollection = defineCollection({
  type: "data",
  schema: z.object({}),
});

const gallaryCollection = defineCollection({
  type: "data",
  schema: z.object({
    images: z.array(
      z.object({
        // title: z.string()
      })
    ),
  }),
});

export const collections = {
  post: postCollection,
  project: postCollection,
  link: linkCollection,
  gallary: gallaryCollection,
};
