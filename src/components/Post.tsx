import type { CollectionEntry } from "astro:content";
import { getPostType } from "../utils";
import { Images } from "./Images";
import { Project } from "./Project";
import { Teaser } from "./Teaser";
import { twMerge } from "tailwind-merge";

export function Post(props: { post: CollectionEntry<"post"> }) {
  const type = getPostType(props.post);

  const widths = {
    teaser: "col-span-full md:col-span-4",
    project: "col-span-full md:col-span-4",
    images: "col-span-full",
  };

  return (
    <div data-slug={props.post.id} class={twMerge("pb-[100px]", widths[type])}>
      {type === "images" && (
        <Images
          title={props.post.data.description}
          date={props.post.data.date}
          images={props.post.data.images}
        />
      )}
      {type === "teaser" && <Teaser post={props.post} />}
      {type === "project" && <Project post={props.post} />}
    </div>
  );
}
