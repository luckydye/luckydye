import type { CollectionEntry } from "astro:content";
import { createMemo, createSignal } from "solid-js";
import { byDate } from "../utils";
import { Post } from "./Post";
import "@sv/elements/toggle";
import { twMerge } from "tailwind-merge";

export function FilteredPosts(props: {
  posts: CollectionEntry<"post">[];
  tags: {
    id: string;
    title: string;
  }[];
}) {
  const [filter, setFilter] = createSignal([]);

  const posts = createMemo(() => {
    return props.posts
      .filter(
        (post) =>
          filter().length === 0 ||
          post.data.tags?.find((t) => {
            return filter()?.includes(t.id);
          }),
      )
      .sort(byDate)
      .map((post) => <Post key={post.id} post={post} />);
  });

  return (
    <div class="pt-10">
      <div class={twMerge(
        "grid grid-cols-6 max-w-[1600px] mx-auto gap-4",
        "[&_article]:first:col-span-4"
      )}>
        {posts().length > 0 ? posts() : <p>No posts found</p>}
      </div>
    </div>
  );
}
