import type { CollectionEntry } from "astro:content";

const MAX_TOPICS = 3;

export function Teaser(props: { post: CollectionEntry<"post"> }) {
  return (
    <article class="teaser relative grid grid-cols-[1fr] gap-10 md:grid-cols-[auto_1fr]">
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
          <h2 class="pb-2 text-3xl hover:underline">{props.post.data.title}</h2>
        </a>
        <div class="flex flex-wrap items-center gap-4">
          <div class="text-base opacity-75">
            {props.post.data.date?.toLocaleDateString()}
          </div>

          <ul class="flex flex-wrap items-center gap-2">
            {props.post.data.topics
              ? props.post.data.topics.slice(0, MAX_TOPICS).map((topic, index) => {
                  return (
                    <li
                      key={index}
                      class="inline-block rounded-md bg-zinc-800 px-2 py-1 text-sm capitalize opacity-70"
                    >
                      {topic}
                    </li>
                  );
                })
              : null}
            {props.post.data.topics && props.post.data.topics.length > MAX_TOPICS && (
              <li class="inline-block rounded-md bg-zinc-800 px-2 py-1 text-sm capitalize opacity-70">
                +{props.post.data.topics.length - MAX_TOPICS}
              </li>
            )}
          </ul>
        </div>
        <div class="pt-2 text-lg">
          <p>{props.post.data.description}</p>
        </div>
      </div>
    </article>
  );
}
