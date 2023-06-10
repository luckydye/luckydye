import { onCleanup, createSignal } from "solid-js";

const [globalCount] = signal;

export default () => {
  const [count, setCount] = createSignal(0);
  const interval = setInterval(() => setCount((count) => count + 1), 1000);
  onCleanup(() => clearInterval(interval));

  return (
    <div>
      <div>Count value in solid is {count()}</div>
      <div>Also btw vue says: {globalCount()}</div>
    </div>
  );
};
