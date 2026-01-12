import type { CollectionEntry } from "astro:content";
import { createMemo, createSignal } from "solid-js";
import { byDate } from "../utils";
import { Post } from "./Post";
import "@sv/elements/toggle";

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
    <div>
      <div class="relative z-50 flex flex-wrap items-center gap-12 pt-12 pb-20">
        <h2 class="my-2 text-3xl leading-tight">Work</h2>

        <form
          class="flex min-w-[320px] flex-1 flex-wrap justify-center gap-4 md:pr-24"
          onChange={(ev) => {
            const data = new FormData(ev.currentTarget);
            setFilter(
              [...data].filter((value) => value[1] === "true").map((value) => value[0]),
            );
          }}
        >
          {props.tags.map((t) => {
            return (
              <a-toggle
                key={t.id}
                name={t.id}
                value={filter().includes(t.id)}
                class="group cursor-pointer whitespace-nowrap rounded-full focus-within:ring-2"
              >
                <span class="block rounded-full bg-fg-1 px-5 py-2 text-[1.125rem] text-white leading-[1.75rem] group-hover:bg-zinc-700 group-active:scale-[0.985] group-[&[value='true']]:bg-zinc-600 group-hover:group-[&[value='true']]:bg-zinc-500">
                  {t.title}
                </span>
              </a-toggle>
            );
          })}
        </form>
      </div>

      <div class="grid grid-cols-8 gap-y-10 sm:gap-x-20">
        {posts().length > 0 ? posts() : <p>No posts found</p>}
      </div>
    </div>
  );
}
