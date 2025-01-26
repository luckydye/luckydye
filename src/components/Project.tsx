import type { CollectionEntry } from "astro:content";
import { LinkButton } from "./LinkButton";

export function Project(props: { post: CollectionEntry<"post"> }) {
  return (
    <div class="card grid grid-cols-[1fr] md:grid-cols-[auto_1fr]">
      <div class="background flex items-center justify-center p-8">
        {props.post.data.images?.[0] ? (
          <img
            loading="eager"
            class="background-image"
            src={props.post.data.images[0].src}
            width={300}
            alt={props.post.data.title}
          />
        ) : null}
      </div>
      <div class="caption px-4 py-10">
        <h2 class="headline-accent font-headline">{props.post.data.title}</h2>

        <div class="flex items-center gap-2 py-2 opacity-80">
          {props.post.data.topics?.map((topic) => {
            return (
              <div class="inline-block rounded-md bg-zinc-800 px-2 py-1 text-sm capitalize">
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
            <LinkButton url={props.post.data.url}>Open in browser</LinkButton>
          ) : null}
          {props.post.data.links
            ? props.post.data.links.map((link) => {
                if (link.match("github.com"))
                  return (
                    <LinkButton url={link}>
                      <span>Source</span>
                      <svg-icon class="ml-2" name="arrow-right" />
                    </LinkButton>
                  );

                return (
                  <LinkButton url={link}>
                    <span>Website</span>
                    <svg-icon class="ml-2" name="arrow-right" />
                  </LinkButton>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}
