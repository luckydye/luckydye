import riveWASMResource from '@rive-app/canvas/rive.wasm';
import { Rive, RuntimeLoader } from '@rive-app/canvas';
import {createSignal } from "solid-js";

RuntimeLoader.setWasmUrl(riveWASMResource);

export default () => {


  const riveInstance = new Rive({
    src: src,
    ...
  });

  return (
    <div>
      <div>Count value in solid is {count()}</div>
      <div>Also btw vue says: {globalCount()}</div>
    </div>
  );
};
