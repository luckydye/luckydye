import { z, defineCollection, image } from "astro:content";

const postCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string(),
  }),
});

const projectCollection = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      link: z.string(),
      image: image(),
    }),
});

const linkCollection = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    link: z.string(),
    target: z.string().optional(),
  }),
});

const gallaryCollection = defineCollection({
  type: "data",
  schema: ({ image }) =>
    z.object({
      images: z.array(image()),
    }),
});

export const collections = {
  post: postCollection,
  project: projectCollection,
  link: linkCollection,
  gallary: gallaryCollection,
};
