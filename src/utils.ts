import type { CollectionEntry } from "astro:content";

export function getPostType(post: CollectionEntry<"post">) {
  if ((post.data.images?.length || 0) > 1) {
    return "images";
  }
  if (post.data.tags?.includes("project")) {
    return "project";
  }
  return "teaser";
}

export function byDate(a: CollectionEntry<"post">, b: CollectionEntry<"post">) {
  return (
    (b.data.date ? new Date(b.data.date).valueOf() : 0) -
    (a.data.date ? new Date(a.data.date).valueOf() : 0)
  );
}
