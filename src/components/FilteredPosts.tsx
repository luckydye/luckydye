import type { CollectionEntry } from "astro:content";
import { createMemo, createSignal } from "solid-js";
import { byDate } from "../utils";
import { Combobox } from "./Combobox";
import { Post } from "./Post";

export function FilteredPosts(props: {
  posts: CollectionEntry<"post">[];
  tags: {
    id: string;
    title: string;
  }[];
}) {
  const [filter, setFilter] = createSignal(props.tags.map((t) => t.id));

  const posts = createMemo(() => {
    return props.posts
      .filter((post) =>
        post.data.tags?.find((t) => {
          return filter()?.includes(t.id);
        }),
      )
      .sort(byDate)
      .map((post) => (
        <div key={post.id} class="pb-[100px]">
          <Post post={post} />
        </div>
      ));
  });

  return (
    <div>
      <div class="relative z-50 pb-40">
        <Combobox
          values={filter()}
          options={props.tags.map((t) => ({
            label: t.title,
            value: t.id,
          }))}
          onChange={(ev) => {
            setFilter(ev);
          }}
        />
      </div>

      {posts().length > 0 ? posts() : <p>No posts found</p>}
    </div>
  );
}
