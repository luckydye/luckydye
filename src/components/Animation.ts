// import rive n stuff
import riveWasm from "@rive-app/canvas-advanced/rive.wasm?url";
import * as Rive from "@rive-app/canvas-advanced";
import {
  LitElement,
  css,
  html,
  type HTMLTemplateResult,
  type PropertyValueMap,
} from "lit";

/**
 * A simple interface to include Rive animations in html, as if it was just an image.
 *
 * @customEvent load - Emitted when animation has loaded.
 * @customEvent play - Emitted when animation has started playing.
 * @customEvent pause - Emitted when animation has been paused.
 *
 * @example
 * ```html
 * <a-animation
 *   height="200"
 *   width="200"
 *   src="/loading.riv"
 * />
 * ```
 *
 * @see https://svp.pages.s-v.de/atrium/elements/a-animation/
 */
export class AnimationElement extends LitElement {
  public static styles = css`
    :host {
      display: inline-block;
    }
    canvas {
      display: block;
      width: inherit;
      height: inherit;
      max-width: 100%;
      max-height: 100%;
    }
  `;

  protected render(): HTMLTemplateResult {
    return html`${this.canvas}`;
  }

  static properties = {
    src: { type: String, reflect: true },
    layout: { type: String, reflect: true },
    width: { type: Number, reflect: true },
    height: { type: Number, reflect: true },
    autoplay: { type: Boolean, reflect: true },
    stateMachine: { type: String, reflect: true },
    artboard: { type: String, reflect: true },
  };

  constructor() {
    super();

    this.layout = "contain";
    this.autoplay = true;
    this.width = 300;
    this.height = 150;
  }

  private intersectionObserver?: IntersectionObserver;
  private static resizeObserver?: ResizeObserver;

  connectedCallback(): void {
    super.connectedCallback();

    this.canvas.addEventListener("mousemove", this.onMouse);
    this.canvas.addEventListener("mousedown", this.onMouse);
    this.canvas.addEventListener("mouseup", this.onMouse);

    if (!this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver((intersetions) => {
        for (const intersetion of intersetions) {
          this.setPaused(!intersetion.isIntersecting);
        }
      });
    }
    this.intersectionObserver.observe(this);

    // if (!AnimationElement.resizeObserver) {
    //   AnimationElement.resizeObserver = new ResizeObserver((entries) => {
    //     for (const entry of entries) {
    //       console.log(entry.target.offsetWidth);
    //     }
    //   });
    // }
    // AnimationElement.resizeObserver.observe(this.canvas);

    window.addEventListener("beforeunload", this.cleanup);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    this.canvas.removeEventListener("mousemove", this.onMouse);
    this.canvas.removeEventListener("mousedown", this.onMouse);
    this.canvas.removeEventListener("mouseup", this.onMouse);

    this.intersectionObserver?.disconnect();
    // AnimationElement.resizeObserver?.unobserve(this.canvas);

    window.removeEventListener("beforeunload", this.cleanup);

    this.cleanup();

    // also cleanup other forgotten instances (TODO: why do they even exist?)
    for (const instance of AnimationElement.instanceCache.values()) {
      if (!document.body.contains(instance)) {
        instance.cleanup();
      }
    }
  }

  //
  // Puplic interface

  /** url to .riv file */
  public declare src?: string;

  /** fit */
  public declare layout: "cover" | "fill" | "contain";

  /** width in pixel */
  public declare width: number;

  /** height in pixel */
  public declare height: number;

  /** name of state machine */
  public declare statemachine?: string;

  /** artboard name */
  public declare artboard?: string;

  /** wether to autoplay on load */
  public declare autoplay: boolean;

  /**
   * Play the animation
   */
  public play() {
    this.setPlaying(true);
  }

  /**
   * Pause the animation
   */
  public pause() {
    this.setPlaying(false);
  }

  /**
   * Trigger a rive input by name
   */
  public trigger(name: string) {
    const input = this.input(name);
    if (input) input.asTrigger().fire();
  }

  /**
   * Get or set the text of a rive textrun by name
   */
  public text(path: string, text?: string) {
    const pathParts = path.split("/");
    const name = pathParts.pop() || "";
    const namePath = pathParts.join("/");

    const textRun: Rive.TextValueRun | undefined = this.artboardInstance?.textByPath(
      name,
      namePath,
    );

    if (!textRun) {
      throw new Error(`No text run with name found ${name}`);
    }

    if (text) {
      textRun.text = text;
      return;
    }

    return textRun ? textRun.text : undefined;
  }

  /**
   * Retrieve a rive input by name
   */
  public input(name: string) {
    const stateMachine = this.stateMachineInstance;

    if (!stateMachine) return undefined;

    for (let i = 0, l = stateMachine.inputCount(); i < l; i++) {
      const input = stateMachine.input(i);
      if (input.name === name) return input;
    }

    return undefined;
  }

  static instanceCache = new Set<AnimationElement>();
  static riveWasm = riveWasm;
  static wasm?: Promise<Blob>;

  //
  // Internals

  private canvas: HTMLCanvasElement = document.createElement("canvas");

  private loaded = false;
  private playing = false;
  private paused = true;

  public rive: Rive.RiveCanvas | undefined;
  public file: Rive.File | undefined;
  private renderer: Rive.Renderer | undefined;
  public artboardInstance: Rive.Artboard | undefined;
  public stateMachineInstance: Rive.StateMachineInstance | undefined;

  private lastTime?: number;
  private frame?: number;

  private get shouldAnimate() {
    return this.playing && !this.paused;
  }

  private setPaused(paused: boolean) {
    this.paused = paused;

    if (paused === false) {
      if (!this.loaded) {
        if (this.src) this.tryLoad(this.src);
      } else {
        this.renderLoop();
      }
    }
    if (paused === true && this.loaded) {
      this.cleanup();
    }
  }

  private setPlaying(playing: boolean) {
    this.playing = playing;

    if (playing === true) {
      this.renderLoop();
    }
  }

  private format() {
    // force density of 2, just looks better multisampled
    const ratio = Math.max(devicePixelRatio || 2, 2);

    this.canvas.width = this.width * ratio;
    this.canvas.height = this.height * ratio;
  }

  protected firstUpdated(): void {
    this.format();
  }

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    if (_changedProperties.has("src") && this.src) {
      this.tryLoad(this.src);
    }
  }

  private async tryLoad(src: string) {
    if (this.paused) return;

    if (this.loaded) {
      // cleanup and reinit
      this.cleanup();
    }

    const bytes = await (await fetch(src)).arrayBuffer();

    if (!this.rive) {
      if (!AnimationElement.riveWasm) {
        throw new Error(`Rive wasm not found: ${AnimationElement.riveWasm}`);
      }

      if (!AnimationElement.wasm) {
        AnimationElement.wasm = fetch(AnimationElement.riveWasm).then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to load Rive wasm: ${res.statusText}`);
          }
          return new Blob([await res.arrayBuffer()], { type: "application/wasm" });
        });
      }

      try {
        const wasmUrl = URL.createObjectURL(await AnimationElement.wasm);
        this.rive = await Rive.default({
          locateFile: (_) => wasmUrl,
        });
      } catch (err) {
        console.warn(err);
      }

      AnimationElement.instanceCache.add(this);
    }

    if (this.rive) {
      this.file = await this.rive.load(new Uint8Array(bytes));

      if (!this.file) {
        throw new Error("Failed to load Rive file");
      }

      this.renderer = this.rive.makeRenderer(this.canvas);
      this.artboardInstance = this.file.defaultArtboard();
      this.stateMachineInstance = new this.rive.StateMachineInstance(
        this.artboardInstance.stateMachineByName(
          this.statemachine || this.artboardInstance.stateMachineByIndex(0).name,
        ),
        this.artboardInstance,
      );

      this.loaded = true;

      this.setPlaying(this.autoplay);

      this.renderLoop();

      this.dispatchEvent(new CustomEvent("load"));
    }
  }

  private renderLoop = (time?: number) => {
    this.frame = undefined;

    // break out of render loop on these conditions
    if (!this.loaded || !this.shouldAnimate) {
      this.dispatchEvent(new CustomEvent("pause"));
      return;
    }

    // time is undefined when its not called by requestAnimationFrame
    if (!time) {
      this.dispatchEvent(new CustomEvent("play"));
    }

    const rive = this.rive;

    if (!rive) {
      throw new Error("renderLoop before load");
    }

    let elapsedTimeSec = 0;
    if (time && this.lastTime) {
      elapsedTimeSec = (time - this.lastTime) / 1000;
    }
    this.lastTime = time;

    this.draw(elapsedTimeSec);

    this.frame = rive.requestAnimationFrame(this.renderLoop);
  };

  public cleanup = () => {
    if (this.frame) this.rive?.cancelAnimationFrame(this.frame);

    this.loaded = false;

    this.renderer?.delete();
    this.renderer = undefined;
    this.file?.delete();
    this.file = undefined;
    this.artboardInstance?.delete();
    this.artboardInstance = undefined;
    this.stateMachineInstance?.delete();
    this.stateMachineInstance = undefined;

    if (this.rive) {
      this.rive.cleanup();
      this.rive = undefined;
      AnimationElement.instanceCache.delete(this);
    }
  };

  private onMouse = (event: MouseEvent) => {
    if (!this.loaded) {
      return;
    }

    const rive = this.rive;
    const stateMachine = this.stateMachineInstance;
    const artboard = this.artboardInstance;

    if (!rive || !stateMachine || !artboard) {
      return;
    }

    const fit = this.fit();
    const alignment = this.alignment();

    if (!fit || !alignment) {
      return;
    }

    const boundingRect = (event.currentTarget as HTMLElement)?.getBoundingClientRect();

    const canvasX = event.clientX - boundingRect.left;
    const canvasY = event.clientY - boundingRect.top;
    const forwardMatrix = rive.computeAlignment(
      fit,
      alignment,
      {
        minX: 0,
        minY: 0,
        maxX: boundingRect.width,
        maxY: boundingRect.height,
      },
      artboard.bounds,
    );

    const invertedMatrix = new rive.Mat2D();
    forwardMatrix.invert(invertedMatrix);
    const canvasCoordinatesVector = new rive.Vec2D(canvasX, canvasY);
    const transformedVector = rive.mapXY(invertedMatrix, canvasCoordinatesVector);
    const transformedX = transformedVector.x();
    const transformedY = transformedVector.y();

    switch (event.type) {
      // Pointer moving/hovering on the canvas
      case "mousemove": {
        stateMachine.pointerMove(transformedX, transformedY);
        break;
      }
      // Pointer click initiated but not released yet on the canvas
      case "mousedown": {
        stateMachine.pointerDown(transformedX, transformedY);
        break;
      }
      // Pointer click released on the canvas
      case "mouseup": {
        stateMachine.pointerUp(transformedX, transformedY);
        break;
      }
      default:
    }
  };

  private fit() {
    if (!this.rive) {
      return undefined;
    }
    return this.layout === "contain"
      ? this.rive.Fit.contain
      : this.layout === "cover"
        ? this.rive.Fit.cover
        : this.layout === "fill"
          ? this.rive.Fit.fill
          : this.rive.Fit.contain;
  }

  private alignment() {
    if (!this.rive) {
      return undefined;
    }
    return this.rive.Alignment.center;
  }

  private draw(elapsedTimeSec: number) {
    const renderer = this.renderer;
    const stateMachine = this.stateMachineInstance;
    const artboard = this.artboardInstance;

    if (!renderer || !stateMachine || !artboard) {
      return;
    }

    const fit = this.fit();
    const alignment = this.alignment();

    if (!fit || !alignment) {
      return;
    }

    renderer.clear();
    stateMachine.advance(elapsedTimeSec);
    artboard.advance(elapsedTimeSec);
    renderer.save();
    renderer.align(
      fit,
      alignment,
      {
        minX: 0,
        minY: 0,
        maxX: this.canvas.width,
        maxY: this.canvas.height,
      },
      artboard.bounds,
    );
    artboard.draw(renderer);
    renderer.restore();

    const numFiredEvents = stateMachine.reportedEventCount();
    for (let i = 0; i < numFiredEvents; i++) {
      const event = stateMachine.reportedEventAt(i);
      if (event) this.dispatchEvent(new CustomEvent(event.name, { detail: event }));
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "a-animation": AnimationElement;
  }
}

if (!customElements.get("a-animation")) {
  customElements.define("a-animation", AnimationElement);
}
