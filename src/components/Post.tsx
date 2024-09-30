import type { CollectionEntry } from "astro:content";
import { getPostType } from "../utils";
import { Images } from "./Images";
import { Project } from "./Project";
import { Teaser } from "./Teaser";

export function Post(props: { post: CollectionEntry<"post"> }) {
  const type = getPostType(props.post);

  return (
    <div data-slug={props.post.id}>
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
