import type { ParentProps } from "solid-js";

export function Tabs(
  props: ParentProps & {
    items: {
      id: string;
      title: string;
    }[];
  },
) {
  return (
    <ul class="flex gap-2 items-center">
      {props.items.map((item) => (
        <TabsItem key={`tab_${item.id}`} title={item.title} slug={item.id} />
      ))}
    </ul>
  );
}

export function TabsItem(props: {
  title: string;
  slug: string;
}) {
  return (
    <li>
      <a href={`/${props.slug}`}>{props.title}</a>
    </li>
  );
}
