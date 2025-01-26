import type { CollectionEntry } from "astro:content";

export function Teaser(props: { post: CollectionEntry<"post"> }) {
  return (
    <div class="teaser relative grid grid-cols-[1fr] gap-10 px-2 pl-10 md:grid-cols-[auto_1fr]">
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
          <h2 class="pb-2 font-headline text-3xl hover:underline">
            {props.post.data.title}
          </h2>
        </a>
        <div class="flex flex-wrap items-center gap-2">
          {props.post.data.topics
            ? props.post.data.topics.map((topic) => {
                return (
                  <div class="inline-block rounded-md bg-zinc-800 px-2 py-1 text-sm capitalize opacity-70">
                    {topic}
                  </div>
                );
              })
            : null}
          <div class="text-base opacity-75">
            {props.post.data.date?.toLocaleDateString()}
          </div>
        </div>
        <div class="pt-2 text-lg">
          <p>{props.post.data.description}</p>
        </div>
      </div>
    </div>
  );
}
