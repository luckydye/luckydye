import { getPostType } from "../utils";
import type { WebsitePost } from "../vektor-content";
import { Project } from "./Project";
import { Teaser } from "./Teaser";

/**
 * A post's `size` is the number of grid columns its tile occupies. The classes
 * are spelled out so Tailwind's scanner picks them up — the value itself comes
 * from the CMS and is never seen at build time.
 */
const sizeClasses: Record<string, string> = {
  "1": "md:col-span-1",
  "2": "md:col-span-2",
  "3": "md:col-span-3",
  "4": "md:col-span-4",
  "5": "md:col-span-5",
  "6": "md:col-span-6",
};

const defaultSize = "2";

export function Post(props: { post: WebsitePost }) {
  const type = getPostType(props.post);
  const size = () => sizeClasses[props.post.data.size?.trim() ?? ""] ?? sizeClasses[defaultSize];

  return (
    <article data-slug={props.post.id} class={`col-span-full ${size()}`}>
      <div class="bg-bg-1 flex items-center justify-center p-4 aspect-video overflow-hidden">
        {props.post.data.headerImage ? (
          <img src={props.post.data.headerImage} alt={props.post.data.title} class="max-h-full object-top" />
        ) : ""}
      </div>
      <div class="block px-8 py-6 hover:bg-bg-1/60">
        {type === "teaser" && <Teaser post={props.post} />}
        {type === "project" && <Project post={props.post} />}
      </div>
    </article>
  );
}
