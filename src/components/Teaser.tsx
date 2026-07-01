import { formatDate, type WebsitePost } from "../vektor-content";

const MAX_TOPICS = 3;

export function Teaser(props: { post: WebsitePost }) {
  return (
    <article class="teaser relative">
      <div>
        <div class="mb-4 flex gap-8 -mx-1">
          <ul class="flex flex-wrap items-center gap-2 w-full">
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
          <div class="flex flex-wrap items-center gap-4">
            <div class="text-base opacity-75">
              {formatDate(props.post.data.date)}
            </div>
          </div>
        </div>
        
        <div class="flex justify-between items-center">
          <a class="block" href={`/${props.post.id}`} style="text-decoration: none;">
            <h2 class="text-3xl hover:underline">{props.post.data.title}</h2>
          </a>
        </div>
        <div class="pt-2 text-lg max-w-[40rem]">
          <p>{props.post.data.description}</p>
        </div>
      </div>
    </article>
  );
}
