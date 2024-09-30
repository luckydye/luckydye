export function LinkButton(props: { url: string; children: any }) {
  return (
    <a
      target="_blank"
      href={props.url}
      class="text-base transition-all active:bg-inherit px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
      rel="noreferrer"
      style="text-decoration: none;"
    >
      {props.children}
    </a>
  );
}
