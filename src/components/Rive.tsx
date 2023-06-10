import riveWASMResource from "@rive-app/canvas/rive.wasm?url";
import { Rive, RuntimeLoader } from "@rive-app/canvas";
import { createSignal } from "solid-js";

RuntimeLoader.setWasmUrl(riveWASMResource);

export default ({ src, width, height }) => {
  const canvas = document.createElement("canvas");
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  const [loaded, setLoaded] = createSignal(false);

  new Rive({
    src: src,
    canvas: canvas,
    autoplay: true,
    onLoad() {
      setLoaded(true);
    },
  });

  return <div class={`${!loaded ? "hidden" : ""}`}>{canvas}</div>;
};
