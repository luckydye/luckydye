import { getCollection } from "astro:content";

const excludeTags = ["gallary", "project", "post"];

export async function GET() {
  const posts = await getCollection("post").then((posts) => {
    return posts.filter((post) => !post.id.includes("-draft-"));
  });

  return new Response(JSON.stringify(posts), {
    headers: {
      "Content-Type": "application/json",
    }
  });
}
