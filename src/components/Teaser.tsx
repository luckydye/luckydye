import type { CollectionEntry } from "astro:content";

export function Teaser(props: { post: CollectionEntry<"post"> }) {
  return (
    <div class="teaser relative pl-10 px-2 grid grid-cols-[1fr] md:grid-cols-[auto_1fr] gap-10">
      {props.post.data.images?.[0] ? (
        <div>
          <img
            loading="eager"
            class="background-image"
            src={props.post.data.images[0].src}
            width={280}
            height={280}
            alt={props.post.data.title}
          />
        </div>
      ) : null}
      <div class="py-2">
        <a class="block py-2" href={`/${props.post.id}`} style="text-decoration: none;">
          <h2 class="pb-2 text-3xl font-normal hover:underline">
            {props.post.data.title}
          </h2>
        </a>
        <div class="flex flex-wrap gap-2 items-center">
          {props.post.data.topics
            ? props.post.data.topics.map((topic) => {
                return (
                  <div class="capitalize text-sm rounded-md bg-zinc-800 opacity-70 inline-block px-2 py-1">
                    {topic}
                  </div>
                );
              })
            : null}
          <div class="text-base opacity-75">
            {props.post.data.date?.toLocaleDateString()}
          </div>
        </div>
        <div class="text-lg pt-2">
          <p>{props.post.data.description}</p>
        </div>
      </div>
    </div>
  );
}
