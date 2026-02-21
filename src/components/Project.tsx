import type { CollectionEntry } from "astro:content";
import { LinkButton } from "./LinkButton";

export function Project(props: { post: CollectionEntry<"post"> }) {
  return (
    <div class="relative grid grid-cols-[1fr] gap-8 sm:grid-cols-[auto_1fr]">
      <div class="background flex items-start justify-start">
        {props.post.data.images?.[0] ? (
          <img
            loading="eager"
            src={props.post.data.images[0].src}
            width={220}
            alt={props.post.data.title}
          />
        ) : null}
      </div>
      <div class="caption absolute inset-0">
        <h2 class="headline-accent">{props.post.data.title}</h2>

        <div class="flex items-center gap-2 py-2 opacity-80">
          {props.post.data.topics?.map((topic) => {
            return (
              <div
                key={topic}
                class="inline-block rounded-md px-2 py-1 text-sm capitalize"
              >
                {topic}
              </div>
            );
          })}
          <div class="text-base opacity-75">
            {props.post.data.date?.toLocaleDateString()}
          </div>
        </div>

        <div class="description pt-2">{props.post.data.description}</div>

        <br />

        <div class="flex gap-2">
          {props.post.data.url ? (
            <a
              target="_blank"
              href={props.post.data.url}
              class="border border-zinc-700 px-4 py-2 text-base transition-all hover:bg-zinc-900 active:bg-inherit whitespace-nowrap"
              rel="noreferrer"
              style="text-decoration: none;"
            >
              <span>Open in browser</span>
              <svg
                class="svg-icon ml-2"
                viewBox="0 0 9 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>arrow-right</title>
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M0.191712 15.81C-0.063904 15.5567 -0.063904 15.146 0.191712 14.8927L7.14706 8L0.191712 1.10731C-0.0639038 0.853999 -0.0639038 0.443298 0.191712 0.189984C0.447328 -0.063329 0.861763 -0.063329 1.11738 0.189984L8.53556 7.54134C8.79118 7.79465 8.79118 8.20535 8.53556 8.45866L1.11738 15.81C0.861763 16.0633 0.447328 16.0633 0.191712 15.81Z"
                  fill="white"
                />
              </svg>
            </a>
          ) : null}

          {props.post.data.links
            ? props.post.data.links.map((link) => (
                <a
                  key={link}
                  target="_blank"
                  href={link}
                  class="border border-zinc-700 px-4 py-2 text-base transition-all hover:bg-zinc-900 active:bg-inherit whitespace-nowrap"
                  rel="noreferrer"
                  style="text-decoration: none;"
                >
                  <span>{link.match("github.com") ? "Source" : "Website"}</span>
                  <svg
                    class="svg-icon ml-2"
                    viewBox="0 0 9 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>arrow-right</title>
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M0.191712 15.81C-0.063904 15.5567 -0.063904 15.146 0.191712 14.8927L7.14706 8L0.191712 1.10731C-0.0639038 0.853999 -0.0639038 0.443298 0.191712 0.189984C0.447328 -0.063329 0.861763 -0.063329 1.11738 0.189984L8.53556 7.54134C8.79118 7.79465 8.79118 8.20535 8.53556 8.45866L1.11738 15.81C0.861763 16.0633 0.447328 16.0633 0.191712 15.81Z"
                      fill="white"
                    />
                  </svg>
                </a>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
