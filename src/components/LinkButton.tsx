export function LinkButton(props: { url: string; children: any }) {
  return (
    <a
      target="_blank"
      href={props.url}
      class="border border-fg-1 px-4 py-2 text-base transition-all hover:bg-bg-1 active:bg-inherit whitespace-nowrap"
      rel="noreferrer"
      style="text-decoration: none;"
    >
      {props.children}
    </a>
  );
}
