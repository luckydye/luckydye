import riveWASMResource from "@rive-app/canvas/rive.wasm?url";
import { Rive, RuntimeLoader } from "@rive-app/canvas";
import { createSignal } from "solid-js";

RuntimeLoader.setWasmUrl(riveWASMResource);

export default ({ src, width, height }) => {
  const canvas = document.createElement("canvas");
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;

  canvas.style.width = `var(--width, ${width + "px"})`;
  canvas.style.height = `var(--height, ${height + "px"})`;

  const effectCanvas = document.createElement("canvas");
  effectCanvas.width = width * window.devicePixelRatio;
  effectCanvas.height = height * window.devicePixelRatio;

  effectCanvas.style.width = `var(--width, ${width + "px"})`;
  effectCanvas.style.height = `var(--height, ${height + "px"})`;

  const effectContext = effectCanvas.getContext("2d");

  const [loaded, setLoaded] = createSignal(false);

  new Rive({
    src: src,
    canvas: canvas,
    autoplay: true,
    onLoad() {
      setLoaded(true);
    },
  });

  function tick() {
    effectContext.clearRect(0, 0, canvas.width, canvas.height);

    effectContext.globalAlpha = 0.5;
    effectContext.filter = "blur(15px)";

    effectContext.drawImage(canvas, 0, 0);

    effectContext.globalAlpha = 1;
    effectContext.filter = "blur(0px)";

    effectContext.drawImage(canvas, 0, 0);

    requestAnimationFrame(tick);
  }

  tick();

  return <div class={`rive ${!loaded ? "hidden" : ""}`}>{effectCanvas}</div>;
};
