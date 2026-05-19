import type { CollectionEntry } from "astro:content";
import { getPostType } from "../utils";
import { Images } from "./Images";
import { Project } from "./Project";
import { Teaser } from "./Teaser";
import { twMerge } from "tailwind-merge";

export function Post(props: { post: CollectionEntry<"post"> }) {
  const type = getPostType(props.post);

  return (
    <article data-slug={props.post.id} class={twMerge("col-span-full md:col-span-2", props.post.data.layout)}>
      <div class="bg-zinc-800 flex items-center justify-center p-4 aspect-video overflow-hidden">
        {props.post.data.images?.[0]?.src ? (
          <img src={props.post.data.images?.[0]?.src} alt={props.post.data.title} class="max-h-full object-top" />
        ) : ""}
      </div>
      <div class="block px-8 py-6 hover:bg-zinc-800/20">
        {type === "teaser" && <Teaser post={props.post} />}
        {type === "project" && <Project post={props.post} />}
      </div>
    </article>
  );
}
