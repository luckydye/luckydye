/**
 * The site logo, drawn entirely in fragment shaders (no assets, no runtime).
 *
 * Two layers share one animation clock and one set of shader functions:
 *
 *  - the logo canvas: two parallelogram outlines with a travelling dash, a
 *    bloom around the dash, and a pointer glow. Colour comes from the canvas'
 *    CSS `color`, so it follows the page theme.
 *  - the light canvas: a low-resolution, full-viewport overlay that casts the
 *    dashes' light onto the page around them, like a cheap global illumination.
 *    It is blended additively over the page, so the background and any text
 *    near a dash brighten with it.
 */

// Logo artboard in logo units (same as the original SVG) plus margin for the bloom.
// Keep in sync with PAD in the shader.
const ART_W = 180;
const ART_H = 360;
const PAD = 26;
const VIEW_W = ART_W + 2 * PAD;
const VIEW_H = ART_H + 2 * PAD;

// The same two outlines and dash motion as in the shader, so the page can know
// where the streaks are (used for the specular highlight on text).
type Point = [number, number];
const OUTLINES: { points: Point[]; speed: number; phase: number }[] = [
  { points: [[66.676, 1.731], [66.676, 268.034], [1, 230.179], [1, 39.586]], speed: 38, phase: 560 },
  { points: [[179, 320.416], [113.794, 358.263], [113.794, 91.502], [179, 129.349]], speed: 46, phase: 120 },
];

function perimeterOf(outline: (typeof OUTLINES)[number]) {
  const { points } = outline;
  return points.reduce((sum, a, i) => {
    const b = points[(i + 1) % points.length];
    return sum + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }, 0);
}

/** Arc length position of a dash head. Mirrors headPos() in the shader. */
function headArc(outline: (typeof OUTLINES)[number], time: number, scroll: number) {
  const total = perimeterOf(outline);
  return (((time * outline.speed + outline.phase + scroll * 0.15) % total) + total) % total;
}

/** Point on an outline at an arc length position (wraps around). */
function pointAt(outline: (typeof OUTLINES)[number], arc: number): Point {
  const { points } = outline;
  const total = perimeterOf(outline);
  arc = ((arc % total) + total) % total;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (arc <= len || i === points.length - 1) {
      const t = Math.min(arc / len, 1);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    arc -= len;
  }
  return points[0];
}

// Light sources along each dash (same fraction of the outline as TAIL in the shader).
const TAIL = 0.16;
const SOURCES_PER_DASH = 8;
// Corners are rounded off with a gaussian window along the path, so the light
// bends gradually around a corner instead of snapping with the geometry.
const CORNER_SIGMA = 20;

/** Smoothed light source positions along a dash, head first. */
function dashSources(outline: (typeof OUTLINES)[number], head: number): Point[] {
  const tail = TAIL * perimeterOf(outline);
  const out: Point[] = [];
  for (let k = 0; k < SOURCES_PER_DASH; k++) {
    const arc = head - (k / SOURCES_PER_DASH) * tail;
    let x = 0;
    let y = 0;
    let weight = 0;
    for (let tap = -4; tap <= 4; tap++) {
      const offset = tap * (CORNER_SIGMA / 2);
      const w = Math.exp(-(offset * offset) / (2 * CORNER_SIGMA * CORNER_SIGMA));
      const [px, py] = pointAt(outline, arc + offset);
      x += px * w;
      y += py * w;
      weight += w;
    }
    out.push([x / weight, y / weight]);
  }
  return out;
}

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

/** Shared by both layers: the outline geometry and everything about the dashes. */
const COMMON = `#version 300 es
precision highp float;

uniform vec2 u_res;      // canvas size in device pixels
uniform float u_time;    // seconds
uniform float u_scroll;  // window scroll position, CSS pixels
uniform vec3 u_color;

out vec4 outColor;

const vec2 SIZE = vec2(${ART_W}.0, ${ART_H}.0);
const float PAD = ${PAD}.0;
const vec2 VIEW = SIZE + 2.0 * PAD;

const float HALF_WIDTH = 0.75;   // half stroke width, logo units
const float TAIL = ${TAIL.toFixed(2)};         // dash length as a fraction of the outline

// The two outlines.
#define OUTLINE_A vec2(66.676, 1.731), vec2(66.676, 268.034), vec2(1.0, 230.179), vec2(1.0, 39.586)
#define OUTLINE_B vec2(179.0, 320.416), vec2(113.794, 358.263), vec2(113.794, 91.502), vec2(179.0, 129.349)

float perimeter(vec2 a, vec2 b, vec2 c, vec2 d) {
  return length(b - a) + length(c - b) + length(d - c) + length(a - d);
}

// Returns (distance to outline, arc length position of the closest point, perimeter).
vec3 poly(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  vec2 P[4] = vec2[4](a, b, c, d);
  float L = perimeter(a, b, c, d);

  float best = 1e9, arc = 0.0, off = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 s = P[i], e = P[(i + 1) % 4];
    vec2 pa = p - s, ba = e - s;
    float len = length(ba);
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float dist = length(pa - ba * h);
    if (dist < best) { best = dist; arc = off + h * len; }
    off += len;
  }
  return vec3(best, arc, L);
}

// Arc length position of a dash's head. Both outlines run clockwise.
float headPos(float L, float speed, float phase) {
  return mod(u_time * speed + phase + u_scroll * 0.15, L);
}

// Brightness of a dash at a given arc position: crisp head, fading tail.
float dash(float arc, float L, float head) {
  float behind = mod(head - arc, L);          // distance behind the head
  float len = TAIL * L;
  return behind < len ? pow(1.0 - behind / len, 1.5) : 0.0;
}

// Bloom profile: a tight core plus progressively wider, fainter halos.
// d is the distance from the dash, in logo units.
float bloom(float d) {
  d = max(d - HALF_WIDTH, 0.0);
  float d2 = d * d;
  return 0.50 * exp(-d2 / (2.0 * 1.5 * 1.5))
       + 0.28 * exp(-d2 / (2.0 * 5.0 * 5.0))
       + 0.14 * exp(-d2 / (2.0 * 12.0 * 12.0));
}

// Light cast onto the page: soft pools that reach far beyond the logo.
float spill(float d) {
  float near = 0.6 / (1.0 + d * d / 1225.0);      // ~35 units
  float far  = 0.4 / (1.0 + d * d / 19600.0);     // ~140 units
  return (near + far) * (1.0 - smoothstep(180.0, 520.0, d));
}

// Light from the lit part of an outline, as a function of the distance to the
// dash itself (not to the whole outline), so it is even along the dash and
// rounds off at its ends and around corners.
float dashField(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d, float head) {
  vec2 P[4] = vec2[4](a, b, c, d);
  float L = perimeter(a, b, c, d);
  float dl = TAIL * L;
  float best = 0.0, off = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 s = P[i], e = P[(i + 1) % 4];
    vec2 ba = e - s;
    float len = length(ba);
    for (int k = 0; k < 2; k++) {            // second copy covers the wrap-around
      float hd = head + float(k) * L;
      float lo = max(off, hd - dl);
      float hi = min(off + len, hd);
      if (hi > lo) {
        vec2 q0 = s + ba * ((lo - off) / len);
        vec2 qa = s + ba * ((hi - off) / len) - q0;
        vec2 pa = p - q0;
        float h = clamp(dot(pa, qa) / dot(qa, qa), 0.0, 1.0);
        float dist = length(pa - qa * h);
        float inten = pow(1.0 - (hd - (lo + h * (hi - lo))) / dl, 1.5);
        best = max(best, inten * bloom(dist));
      }
    }
    off += len;
  }
  return best;
}

float headA() { return headPos(perimeter(OUTLINE_A), 38.0, 560.0); }
float headB() { return headPos(perimeter(OUTLINE_B), 46.0, 120.0); }
`;

const LOGO_FRAG = `${COMMON}
uniform vec2 u_pointer;  // pointer in logo units (far away when idle)
uniform float u_hover;   // 0..1 pointer presence
uniform vec3 u_hot;      // colour of the streaks and their bloom

void main() {
  // Fit the artboard (plus margin) inside the canvas ("contain"), centred.
  float scale = min(u_res.x / VIEW.x, u_res.y / VIEW.y);
  vec2 frag = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 p = (frag - 0.5 * u_res) / scale + 0.5 * SIZE;
  float px = 1.0 / scale;                     // one device pixel in logo units

  vec3 A = poly(p, OUTLINE_A);
  vec3 B = poly(p, OUTLINE_B);

  float covA = 1.0 - smoothstep(HALF_WIDTH - px * 0.5, HALF_WIDTH + px * 0.5, A.x);
  float covB = 1.0 - smoothstep(HALF_WIDTH - px * 0.5, HALF_WIDTH + px * 0.5, B.x);
  float cov = max(covA, covB);

  float hA = headA(), hB = headB();
  float lit = max(covA * dash(A.y, A.z, hA), covB * dash(B.y, B.z, hB));

  float glow = 0.9 * max(
    dashField(p, OUTLINE_A, hA),
    dashField(p, OUTLINE_B, hB)
  );

  // Pointer proximity lights the outline.
  float near = (cov > 0.0) ? 1.0 - smoothstep(0.0, 70.0, distance(p, u_pointer)) : 0.0;
  near *= u_hover;

  // The resting outline (and pointer glow) in the page colour, the streaks in the hot colour.
  float aBase = cov * clamp(0.14 + 0.55 * near, 0.0, 1.0);
  float aHot = clamp(cov * lit + glow, 0.0, 1.0);
  float a = clamp(aBase + aHot, 0.0, 1.0);
  vec3 rgb = min(u_color * aBase + u_hot * aHot, vec3(a));
  outColor = vec4(rgb, a);                    // premultiplied alpha
}`;

const LIGHT_FRAG = `${COMMON}
uniform vec2 u_viewport; // viewport size, CSS pixels
uniform vec2 u_center;   // centre of the logo canvas, CSS pixels
uniform float u_unit;    // CSS pixels per logo unit
uniform float u_gain;    // overall strength of this layer
uniform vec2 u_src[${2 * SOURCES_PER_DASH}]; // smoothed light sources along both dashes, head first (logo units)

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 css = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_res * u_viewport;
  vec2 p = (css - u_center) / u_unit + 0.5 * SIZE;

  // Sum of point lights spread along each dash, brightest at the head.
  float light = 0.0;
  for (int i = 0; i < ${2 * SOURCES_PER_DASH}; i++) {
    float k = float(i % ${SOURCES_PER_DASH}) / ${SOURCES_PER_DASH}.0;
    light += pow(1.0 - k, 1.5) * spill(distance(p, u_src[i]));
  }

  float a = u_gain * 0.2 * 0.3 * light;
  a += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // dither, avoids banding in the gradient
  a = clamp(a, 0.0, 1.0);
  outColor = vec4(u_color * a, a);            // premultiplied alpha
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "shader compile failed");
  }
  return shader;
}

/** A canvas drawing one full-screen fragment shader. */
function createLayer(canvas: HTMLCanvasElement, frag: string, uniformNames: string[]) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) throw new Error("WebGL2 not available");

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "program link failed");
  }
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.clearColor(0, 0, 0, 0);

  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const name of ["u_res", "u_time", "u_scroll", "u_color", ...uniformNames]) {
    u[name] = gl.getUniformLocation(program, name);
  }

  return {
    gl,
    u,
    /** Match the drawing buffer to a size in device pixels. */
    resize(w: number, h: number) {
      w = Math.max(1, Math.round(w));
      h = Math.max(1, Math.round(h));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.u_res, w, h);
    },
    /** Take theme colours from CSS: `color` for the page colour, and `border-top-color` for the hot colour. */
    readColor() {
      const set = (name: string, css: string) => {
        // Computed colours are either "rgb(r g b)" (0-255) or, e.g. for color-mix(),
        // "color(srgb r g b)" (0-1).
        const m = css.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255];
        const k = css.startsWith("color(") ? 1 : 1 / 255;
        gl.uniform3f(u[name], m[0] * k, m[1] * k, m[2] * k);
      };
      const style = getComputedStyle(canvas);
      set("u_color", style.color);
      if (u.u_hot) set("u_hot", style.borderTopColor);
    },
    draw(time: number, scroll: number) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.u_time, time);
      gl.uniform1f(u.u_scroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

export function mountLogo(canvas: HTMLCanvasElement) {
  const logo = createLayer(canvas, LOGO_FRAG, ["u_pointer", "u_hover", "u_hot"]);

  // Full-viewport light overlays, rendered at a quarter of the resolution: the
  // light is smooth, and the browser scales it up with bilinear filtering.
  // Everything is drawn on the GPU and composited with CSS blend modes, so
  // nothing in the page's DOM or styles is touched per frame.
  //  - "logo-light": the light itself, spilling over the page.
  //  - "logo-tint": the same light again with a different blend mode (see
  //    Stage.astro), so text near the light picks up its colour as a glint.
  const lightLayers = [
    { className: "logo-light", gain: 1 },
    { className: "logo-tint", gain: 1.4 },
  ].map(({ className, gain }) => {
    const el = document.createElement("canvas");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    document.body.append(el);
    return { el, gain, layer: createLayer(el, LIGHT_FRAG, ["u_viewport", "u_center", "u_unit", "u_gain", "u_src"]) };
  });

  // Theme colours
  const readColors = () => {
    logo.readColor();
    for (const { layer } of lightLayers) layer.readColor();
  };
  readColors();
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", readColors);

  const resizeLogo = () => {
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    logo.resize(canvas.clientWidth * dpr, canvas.clientHeight * dpr);
  };
  const resizeLight = () => {
    for (const { layer } of lightLayers) layer.resize(window.innerWidth / 4, window.innerHeight / 4);
  };
  const resizeObserver = new ResizeObserver(resizeLogo);
  resizeObserver.observe(canvas);
  resizeLogo();
  resizeLight();
  window.addEventListener("resize", resizeLight);

  // Pointer, in logo units; eased so the glow follows smoothly.
  const target = { x: -1e4, y: -1e4, hover: 0 };
  const pointer = { x: -1e4, y: -1e4, hover: 0 };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const scale = Math.min(r.width / VIEW_W, r.height / VIEW_H);
    target.x = (e.clientX - r.left - r.width / 2) / scale + ART_W / 2;
    target.y = (e.clientY - r.top - r.height / 2) / scale + ART_H / 2;
    target.hover = 1;
  };
  const onLeave = () => {
    target.hover = 0;
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame = 0;
  let visible = true;
  const start = performance.now();

  const draw = (now: number) => {
    frame = 0;
    const time = reduced ? 3.0 : (now - start) / 1000;
    const scroll = window.scrollY;

    if (pointer.hover < 0.01 && target.hover > 0) {
      pointer.x = target.x;
      pointer.y = target.y;
    }
    pointer.x += (target.x - pointer.x) * 0.15;
    pointer.y += (target.y - pointer.y) * 0.15;
    pointer.hover += (target.hover - pointer.hover) * 0.1;

    logo.gl.uniform2f(logo.u.u_pointer, pointer.x, pointer.y);
    logo.gl.uniform1f(logo.u.u_hover, pointer.hover);
    logo.draw(time, scroll);

    // The light layers are positioned relative to wherever the logo is on screen.
    const r = canvas.getBoundingClientRect();
    const center = [r.left + r.width / 2, r.top + r.height / 2];
    const unit = Math.min(r.width / VIEW_W, r.height / VIEW_H);
    const sources = new Float32Array(
      OUTLINES.flatMap((outline) => dashSources(outline, headArc(outline, time, scroll)).flat()),
    );
    for (const { layer, gain } of lightLayers) {
      layer.gl.uniform1f(layer.u.u_gain, gain);
      layer.gl.uniform2f(layer.u.u_viewport, window.innerWidth, window.innerHeight);
      layer.gl.uniform2f(layer.u.u_center, center[0], center[1]);
      layer.gl.uniform1f(layer.u.u_unit, unit);
      layer.gl.uniform2fv(layer.u.u_src, sources);
      layer.draw(time, scroll);
    }

    if (visible && !reduced) frame = requestAnimationFrame(draw);
  };

  // Redraw on scroll when the animation loop isn't running (reduced motion).
  const onScroll = () => {
    if (!frame && visible) frame = requestAnimationFrame(draw);
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Only animate while the logo, or the light it casts, can be on screen.
  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      for (const { el } of lightLayers) el.style.visibility = visible ? "visible" : "hidden";
      if (visible && !frame) frame = requestAnimationFrame(draw);
    },
    { rootMargin: "300px" },
  );
  intersection.observe(canvas);
  frame = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(frame);
    intersection.disconnect();
    resizeObserver.disconnect();
    scheme.removeEventListener("change", readColors);
    window.removeEventListener("resize", resizeLight);
    window.removeEventListener("scroll", onScroll);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerleave", onLeave);
    for (const { el } of lightLayers) el.remove();
  };
}

for (const canvas of document.querySelectorAll<HTMLCanvasElement>("canvas[data-logo]")) {
  try {
    mountLogo(canvas);
  } catch (err) {
    console.warn("logo shader failed", err);
  }
}
