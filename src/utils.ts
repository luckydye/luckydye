import type { WebsitePost } from "./vektor-content";

export function getPostType(post: WebsitePost) {
  if ((post.data.images?.length || 0) > 1) {
    return "images";
  }
  if (post.data.tags?.find((t) => t.id === "project")) {
    return "project";
  }
  return "teaser";
}

export function byDate(a: WebsitePost, b: WebsitePost) {
  return (
    (b.data.date ? new Date(b.data.date).valueOf() : 0) -
    (a.data.date ? new Date(a.data.date).valueOf() : 0)
  );
}
