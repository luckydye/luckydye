import "@sv/elements/select";
import "@sv/elements/expandable";
import type { OptionElement, Select } from "@sv/elements/select";
import { type ParentProps, createEffect, createMemo, createSignal } from "solid-js";
import { twMerge } from "tailwind-merge";
import { Input } from "./Input";

export function Combobox(props: {
  placeholder?: string;
  name?: string;
  values?: string[];
  required?: boolean;
  onChange?: (values: string[]) => void;
  options: Array<{ label: string; value: string }>;
}) {
  const [values, setValues] = createSignal<Array<string>>(props.values || []);
  const [filter, setFilter] = createSignal("");
  let select: Select | undefined;

  const onKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLInputElement;
    if (e.key === "Backspace" && target.value?.length === 0) {
      const set = [...values()];
      set.pop();
      setValues(set);
    }
  };

  createEffect(() => {
    props.onChange?.(values());
  });

  const availableOptions = createMemo(() => {
    return props.options
      .filter((opt) => !filter() || opt.label.match(filter()))
      .filter((opt) => !values().includes(opt.value))
      .map((option) => (
        <a-option
          key={option.value}
          class={twMerge(
            "block cursor-pointer rounded px-2",
            "hover:bg-zinc-100 active:bg-zinc-200 [&[selected]]:bg-zinc-200",
            "dark:active:bg-zinc-700 dark:hover:bg-zinc-600 dark:[&[selected]]:bg-zinc-700",
          )}
          value={option.value}
        >
          <div>{option.label}</div>
        </a-option>
      ));
  });

  return (
    <a-select
      required={props.required}
      name={props.name}
      // @ts-ignore
      onChange={async (ev: CustomEvent) => {
        // @ts-ignore
        const option: OptionElement = ev.option;
        const currentValues = [...values()];
        if (option && currentValues.indexOf(option.value) === -1) {
          currentValues.push(option.value);
          setFilter("");
          setValues(currentValues);
        }
      }}
      class="relative inline-block w-full"
      ref={select}
    >
      <div slot="trigger" class="w-full">
        <Input
          placeholder="Filter topics..."
          type="search"
          autocomplete="search"
          class="flex flex-wrap gap-1 p-2"
          value={filter()}
          onKeydown={onKeydown}
          onInput={(e) => {
            setFilter((e.target as HTMLInputElement).value);
            select?.open();
          }}
        >
          {values().map((option) => (
            <div
              key={option}
              class={twMerge(
                "mr-1 flex flex-wrap items-center gap-1 rounded bg-zinc-50 py-1 pr-1 pl-2 text-left font-bold text-sm",
                "dark:bg-zinc-800",
              )}
            >
              <span>{props.options.find((o) => o.value === option)?.label}</span>

              <button
                type="button"
                onClick={() => {
                  const arr = [...values()];
                  arr.splice(arr.indexOf(option), 1);
                  setValues(arr);
                }}
                class={twMerge(
                  "dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300",
                  "flex items-center justify-center rounded-full bg-zinc-50 p-0 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400",
                )}
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="h-4 w-4"
                >
                  <title>Remove</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </Input>
      </div>

      <div class="mt-1 rounded-md border border-zinc-700 bg-zinc-50 p-1 dark:bg-zinc-800">
        {availableOptions().length > 0 ? (
          availableOptions()
        ) : (
          <p class="px-2 opacity-50">No results</p>
        )}
      </div>
    </a-select>
  );
}
