import { z, defineCollection } from "astro:content";

const postCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    author: z.string(),
  }),
});

const projectCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    link: z.string(),
    image: z.string(),
  }),
});

const linkCollection = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    link: z.string(),
    description: z.optional(z.string()),
    icon: z.optional(z.string()),
  }),
});

const gallaryCollection = defineCollection({
  type: "data",
  schema: z.object({
    images: z.array(z.string()),
  }),
});

export const collections = {
  post: postCollection,
  project: projectCollection,
  link: linkCollection,
  gallary: gallaryCollection,
};
