import { ParentProps, createSignal, onMount } from "solid-js";

export default ({ children }: ParentProps) => {
  const [mobile, setMobile] = createSignal(false);

  const format = () => {
    setMobile(globalThis.innerWidth < 900);
  };

  onMount(() => {
    addEventListener("resize", () => format());
    format();
  });

  return <sv-slider pointercontrols={mobile()}>{children}</sv-slider>;
};
