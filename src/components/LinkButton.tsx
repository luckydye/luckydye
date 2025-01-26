export function LinkButton(props: { url: string; children: any }) {
  return (
    <a
      target="_blank"
      href={props.url}
      class="border border-zinc-700 px-4 py-2 text-base transition-all hover:bg-zinc-900 active:bg-inherit"
      rel="noreferrer"
      style="text-decoration: none;"
    >
      {props.children}
    </a>
  );
}
