/**
 * The site logo, drawn entirely in a fragment shader (no assets, no runtime).
 *
 * Two parallelogram outlines are rendered as signed distances to their edges.
 * A bright dash travels along each outline, and the cursor lights up the
 * lines near it. Colour comes from the canvas' CSS `color`, so it follows the
 * page theme.
 */

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 u_res;      // canvas size in device pixels
uniform float u_time;    // seconds
uniform float u_scroll;  // window scroll position, CSS pixels
uniform vec2 u_pointer;  // pointer in logo units (far away when idle)
uniform float u_hover;   // 0..1 pointer presence
uniform vec3 u_color;

out vec4 outColor;

// Logo artboard, in the same units as the original SVG.
const vec2 SIZE = vec2(180.0, 360.0);
// Empty margin around the artboard so the glow isn't clipped.
const float PAD = 26.0;
const vec2 VIEW = SIZE + 2.0 * PAD;
// Bloom strength.
const float GLOW_STRENGTH = 0.9;
const float HALF_WIDTH = 0.75;   // half stroke width
const float TAIL = 0.16;         // dash length as a fraction of the outline

// Returns (distance to outline, arc length position of the closest point, perimeter).
vec3 poly(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  vec2 P[4] = vec2[4](a, b, c, d);
  float L = 0.0;
  for (int i = 0; i < 4; i++) L += length(P[(i + 1) % 4] - P[i]);

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

// Arc length position of a dash's head.
float headPos(float L, float t, float speed, float phase) {
  return mod(t * speed + phase + u_scroll * 0.15 * sign(speed), L);
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

// Glow around the lit part of an outline: falls off with the distance to the
// dash itself (not to the whole outline), so it is even along the dash and
// rounds off at its ends and around corners.
float dashGlow(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d, float head, float L, float tail) {
  vec2 P[4] = vec2[4](a, b, c, d);
  float dl = tail * L;
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

// Bright dash with a crisp head and a fading tail.
float dash(float arc, float L, float head, float tail) {
  float behind = mod(head - arc, L);          // distance behind the head
  float len = tail * L;
  return behind < len ? pow(1.0 - behind / len, 1.5) : 0.0;
}

void main() {
  // Fit the artboard inside the canvas ("contain"), centred.
  float scale = min(u_res.x / VIEW.x, u_res.y / VIEW.y);
  vec2 frag = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 p = (frag - 0.5 * u_res) / scale + 0.5 * SIZE;
  float px = 1.0 / scale;                     // one device pixel in logo units

  vec3 A = poly(p, vec2(66.676, 1.731), vec2(66.676, 268.034), vec2(1.0, 230.179), vec2(1.0, 39.586));
  vec3 B = poly(p, vec2(179.0, 320.416), vec2(113.794, 358.263), vec2(113.794, 91.502), vec2(179.0, 129.349));

  float width = HALF_WIDTH;
  float covA = 1.0 - smoothstep(width - px * 0.5, width + px * 0.5, A.x);
  float covB = 1.0 - smoothstep(width - px * 0.5, width + px * 0.5, B.x);

  float headA = headPos(A.z, u_time, 38.0, 560.0);
  float headB = headPos(B.z, u_time, 46.0, 120.0);
  float dashA = dash(A.y, A.z, headA, TAIL);
  float dashB = dash(B.y, B.z, headB, TAIL);
  float lit = max(covA * dashA, covB * dashB);

  // Soft glow around the dashes, fading out away from the line.
  float glow = GLOW_STRENGTH * max(
    dashGlow(p, vec2(66.676, 1.731), vec2(66.676, 268.034), vec2(1.0, 230.179), vec2(1.0, 39.586), headA, A.z, TAIL),
    dashGlow(p, vec2(179.0, 320.416), vec2(113.794, 358.263), vec2(113.794, 91.502), vec2(179.0, 129.349), headB, B.z, TAIL)
  );

  // Pointer proximity lights the outline.
  float near = (covA + covB > 0.0) ? 1.0 - smoothstep(0.0, 70.0, distance(p, u_pointer)) : 0.0;
  near *= u_hover;

  float base = 0.14;
  float cov = max(covA, covB);
  float a = clamp(cov * clamp(base + 0.55 * near + lit, 0.0, 1.0) + glow, 0.0, 1.0);
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

export function mountLogo(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return;

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "program link failed");
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "u_res");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uScroll = gl.getUniformLocation(program, "u_scroll");
  const uPointer = gl.getUniformLocation(program, "u_pointer");
  const uHover = gl.getUniformLocation(program, "u_hover");
  const uColor = gl.getUniformLocation(program, "u_color");

  gl.clearColor(0, 0, 0, 0);

  // Theme colour, taken from the CSS `color` of the canvas.
  const readColor = () => {
    const m = getComputedStyle(canvas).color.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255];
    gl.uniform3f(uColor, m[0] / 255, m[1] / 255, m[2] / 255);
  };
  readColor();
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", readColor);

  const resize = () => {
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  // Pointer, in canvas device pixels; eased so the glow follows smoothly.
  let target = { x: -1e4, y: -1e4, hover: 0 };
  let pointer = { x: -1e4, y: -1e4, hover: 0 };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const scale = Math.min(r.width / 232, r.height / 412);
    target.x = (e.clientX - r.left - r.width / 2) / scale + 90;
    target.y = (e.clientY - r.top - r.height / 2) / scale + 180;
    target.hover = 1;
  };
  const onLeave = () => { target.hover = 0; };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame = 0;
  let visible = true;
  const start = performance.now();

  const draw = (now: number) => {
    frame = 0;
    const k = 0.15;
    if (pointer.hover < 0.01 && target.hover > 0) { pointer.x = target.x; pointer.y = target.y; }
    pointer.x += (target.x - pointer.x) * k;
    pointer.y += (target.y - pointer.y) * k;
    pointer.hover += (target.hover - pointer.hover) * 0.1;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uScroll, window.scrollY);
    gl.uniform1f(uTime, reduced ? 3.0 : (now - start) / 1000);
    gl.uniform2f(uPointer, pointer.x, pointer.y);
    gl.uniform1f(uHover, pointer.hover);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (visible && !reduced) frame = requestAnimationFrame(draw);
  };

  // Redraw on scroll when the animation loop isn't running (reduced motion).
  const onScroll = () => { if (!frame && visible) frame = requestAnimationFrame(draw); };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Only animate while on screen.
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame) frame = requestAnimationFrame(draw);
  });
  intersection.observe(canvas);
  frame = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(frame);
    intersection.disconnect();
    resizeObserver.disconnect();
    scheme.removeEventListener("change", readColor);
    window.removeEventListener("scroll", onScroll);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerleave", onLeave);
  };
}

for (const canvas of document.querySelectorAll<HTMLCanvasElement>("canvas[data-logo]")) {
  try {
    mountLogo(canvas);
  } catch (err) {
    console.warn("logo shader failed", err);
  }
}
