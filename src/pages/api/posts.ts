import { getCollection } from "astro:content";
import { sourceCollection, toWebsitePost } from "../../vektor-content";

export async function GET() {
  const posts = (await getCollection("pages"))
    .filter((entry) => sourceCollection(entry) === "post")
    .map(toWebsitePost)
    .filter((post) => !post.id.includes("-draft-"));

  return new Response(JSON.stringify(posts), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
