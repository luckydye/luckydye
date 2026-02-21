import type { CollectionEntry } from "astro:content";
import { getPostType } from "../utils";
import { Images } from "./Images";
import { Project } from "./Project";
import { Teaser } from "./Teaser";
import { twMerge } from "tailwind-merge";

export function Post(props: { post: CollectionEntry<"post"> }) {
  const type = getPostType(props.post);

  const widths = {
    teaser: "col-span-full md:col-span-6 lg:col-span-4 -ml-[1px] -mt-[1px] border border-zinc-600",
    project: "col-span-full md:col-span-6 lg:col-span-4 -ml-[1px] -mt-[1px] border border-zinc-600",
    images: "col-span-full",
  };

  return (
    <article data-slug={props.post.id} class={twMerge(widths[type])}>
      <div class="block h-full px-10 py-18 hover:bg-zinc-800/20">
        {type === "teaser" && <Teaser post={props.post} />}
        {type === "project" && <Project post={props.post} />}
        {type === "images" && (
          <Images
            title={props.post.data.description}
            date={props.post.data.date}
            images={props.post.data.images}
          />
        )}
      </div>
    </article>
  );
}
