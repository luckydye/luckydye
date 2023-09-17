import { z, defineCollection } from "astro:content";

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

const postCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string(),
    tags: z.string().array().optional(),
    createdAt: z.date().optional(),
  }),
});

const teaserCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    link: z.string(),
    createdAt: z.date().optional(),
  }),
});

const gallaryCollection = defineCollection({
  type: "data",
  schema: ({ image }) =>
    z.object({
      title: z.string().optional(),
      date: z.string().optional(),
      images: z.array(image()),
      createdAt: z.date().optional(),
    }),
});

export const collections = {
  post: postCollection,
  teaser: teaserCollection,
  project: projectCollection,
  link: linkCollection,
  gallary: gallaryCollection,
};
