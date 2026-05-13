import type { CollectionEntry } from "astro:content";
import { getPostType } from "../utils";
import { Images } from "./Images";
import { Project } from "./Project";
import { Teaser } from "./Teaser";
import { twMerge } from "tailwind-merge";

export function Post(props: { post: CollectionEntry<"post"> }) {
  const type = getPostType(props.post);

  const widths = {
    teaser: "col-span-full md:col-span-6 lg:col-span-4",
    project: "col-span-full md:col-span-6 lg:col-span-4",
    images: "col-span-full",
  };

  return (
    <article data-slug={props.post.id} class={twMerge(widths[type])}>
      <div class="block h-full px-4 py-6 hover:bg-zinc-800/20">
        {type === "teaser" && <Teaser post={props.post} />}
        {type === "project" && <Project post={props.post} />}
      </div>
    </article>
  );
}
