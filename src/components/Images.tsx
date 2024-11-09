import "@sv/elements/track";
import type { CollectionEntry } from "astro:content";

export function Images(props: {
  images: CollectionEntry<"post">["data"]["images"];
  title: string;
  date: Date;
}) {
  return (
    <div class="images relative">
      <a-track overflowscroll class="pt-6 overflow-hidden px-6">
        {props.images?.map((image) => {
          const ar = image.width / image.height;
          const height = 520;
          return (
            <div class="flex-none flex items-center pr-2">
              <img
                decoding="async"
                loading="lazy"
                class="overflow-hidden block max-w-[80vw]"
                src={image.src}
                height={height}
                width={height * ar}
                alt={image.src}
              />
            </div>
          );
        })}
      </a-track>

      <div class="overlay pointer-events-none absolute top-0 left-0 w-full h-full" />

      <div class="circle pt-5">
        <div class="title inline-flex justify-between w-[calc(100%-180px)]">
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
