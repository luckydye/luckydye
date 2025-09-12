import "@sv/elements/track";
import type { CollectionEntry } from "astro:content";

export function Images(props: {
  images: CollectionEntry<"post">["data"]["images"];
  title: string;
  date: Date;
}) {
  return (
    <div class="images relative">
      <a-track snap class="overflow-visible px-6 pt-6">
        {props.images?.map((image, i) => {
          const ar = image.width / image.height;
          const height = 520;
          return (
            <div key={i} class="flex flex-none items-center pr-10">
              <img
                decoding="async"
                loading="lazy"
                class="block max-w-[80vw] overflow-hidden"
                src={image.src}
                height={height}
                width={height * ar}
                alt={image.src}
              />
            </div>
          );
        })}
      </a-track>

      <div class="overlay pointer-events-none absolute top-0 left-0 h-full w-full" />

      <div class="circle pt-5">
        <div class="title inline-flex w-[calc(100%-180px)] justify-between">
          <span>{props.title}</span>
          {props.date && (
            <span class="opacity-50">
              {props.date.toUTCString().split(" ").slice(2, 4).join(" ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
