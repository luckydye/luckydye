import { createMemo, createSignal } from "solid-js";
import { byDate } from "../utils";
import type { WebsitePost, WebsiteTag } from "../vektor-content";
import { Post } from "./Post";
import "@sv/elements/toggle";
import { twMerge } from "tailwind-merge";

export function FilteredPosts(props: {
  posts: WebsitePost[];
  tags: WebsiteTag[];
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
    <div class="pt-10 px-5">
      <div class={twMerge(
        "grid grid-cols-6 max-w-[1600px] mx-auto gap-x-4 gap-y-8"
      )}>
        {posts().length > 0 ? posts() : <p>No posts found</p>}
      </div>
    </div>
  );
}
