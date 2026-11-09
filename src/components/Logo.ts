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
uniform vec2 u_src[${2 * SOURCES_PER_DASH}]; // smoothed light sources along both dashes, head first (logo units)

out vec4 outColor;

const vec2 SIZE = vec2(${ART_W}.0, ${ART_H}.0);
const float PAD = ${PAD}.0;
const vec2 VIEW = SIZE + 2.0 * PAD;

const float HALF_WIDTH = 2.0;    // half width of the ridge, logo units
const float TAIL = ${TAIL.toFixed(2)};         // dash length as a fraction of the outline

// The two outlines.
#define OUTLINE_A vec2(66.676, 1.731), vec2(66.676, 268.034), vec2(1.0, 230.179), vec2(1.0, 39.586)
#define OUTLINE_B vec2(179.0, 320.416), vec2(113.794, 358.263), vec2(113.794, 91.502), vec2(179.0, 129.349)

float perimeter(vec2 a, vec2 b, vec2 c, vec2 d) {
  return length(b - a) + length(c - b) + length(d - c) + length(a - d);
}

// Returns (distance to outline, arc length position of the closest point, perimeter).
vec3 poly(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d, out vec2 dir) {
  vec2 P[4] = vec2[4](a, b, c, d);
  float L = perimeter(a, b, c, d);

  float best = 1e9, arc = 0.0, off = 0.0;
  dir = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    vec2 s = P[i], e = P[(i + 1) % 4];
    vec2 pa = p - s, ba = e - s;
    float len = length(ba);
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float dist = length(pa - ba * h);
    if (dist < best) { best = dist; arc = off + h * len; dir = pa - ba * h; }
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

/**
 * The hero, in one pass: the bloom, the metal outlines and the copy, composited
 * back to front. The text is in front of everything else, so the lights are
 * really behind it: where a streak is near, its bloom shows round the letters.
 *
 * The canvas covers the logo and the copy together. For every pixel the shader
 * works out where it is in CSS pixels, from there where it is on the logo
 * artboard (to light and draw the outlines) and where it is in the glyph
 * texture (the real text stays in the DOM, this is a second drawing of it).
 *
 * Every layer outputs valid premultiplied alpha, and they are composited with
 * "over", so there is no dependence on blend modes or on how a browser treats
 * colour with less alpha than its value.
 */
const HERO_FRAG = `${COMMON}
uniform vec2 u_origin;      // top left of this canvas, CSS pixels
uniform vec2 u_size;        // size of this canvas, CSS pixels
uniform vec2 u_center;      // centre of the logo slot, CSS pixels
uniform float u_unit;       // CSS pixels per logo unit
uniform vec2 u_pointer;     // pointer in logo units (far away when idle)
uniform float u_hover;      // 0..1 pointer presence
uniform vec3 u_hot;         // colour of the streaks, their bloom and the specular highlights
uniform vec3 u_lo;          // metal in shadow
uniform vec3 u_hi;          // metal in reflected light
uniform sampler2D u_mask;   // the glyphs, premultiplied
uniform vec2 u_textOrigin;  // top left of the glyph texture, CSS pixels
uniform vec2 u_textSize;    // size of the glyph texture, CSS pixels

// Height of the lights above the surface, logo units.
const float LIGHT_Z = 16.0;
const float SHININESS = 60.0;
// Opacity of the outline where no light reaches it.
const float REST_VISIBILITY = 0.17;
// Beyond this distance from an outline the bloom is below 1/255.
const float GLOW_REACH = 48.0;
// How far (CSS pixels) a streak lights the copy: about half the way to it.
const float TEXT_RANGE = 170.0;

// Blinn-Phong from a point light; returns (diffuse, specular).
vec2 pointLight(vec3 pos, vec3 N, vec2 light, float height) {
  vec3 Ld = vec3(light - pos.xy, height);
  float d2 = dot(Ld, Ld);
  vec3 L = Ld * inversesqrt(d2);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));          // the viewer looks straight down
  float q = 1.0 + d2 / (95.0 * 95.0);
  // Steep falloff, cut off completely further out: only the part of a ridge near a
  // light catches it. (On a straight ridge a more distant light would otherwise
  // paint a long bright stripe along the whole edge.)
  float att = (1.0 / (q * q)) * (1.0 - smoothstep(150.0, 320.0, sqrt(d2)));
  return att * vec2(max(dot(N, L), 0.0), pow(max(dot(N, H), 0.0), SHININESS));
}

// "over" for premultiplied colour.
vec4 over(vec4 top, vec4 bottom) { return top + bottom * (1.0 - top.a); }

void main() {
  vec2 css = u_origin + vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_res * u_size;
  vec2 p = (css - u_center) / u_unit + 0.5 * SIZE;     // logo artboard coordinates
  float px = (u_size.x / u_res.x) / u_unit;            // one device pixel in logo units

  vec4 acc = vec4(0.0);

  // ---- Behind everything: the bloom, then the metal outlines -------------------------
  if (p.x > -60.0 && p.x < SIZE.x + 60.0 && p.y > -60.0 && p.y < SIZE.y + 60.0) {
    vec2 dirA, dirB;
    vec3 A = poly(p, OUTLINE_A, dirA);
    vec3 B = poly(p, OUTLINE_B, dirB);
    float hA = headA(), hB = headB();

    // Light only brightens: on a light page a coloured halo would just be a
    // darker smudge, so the bloom is for dark pages (the spill overlay still
    // lifts a light page).
    float lum = dot(u_hot, vec3(0.299, 0.587, 0.114));
    float onDark = smoothstep(0.7, 0.9, lum);
    float glow = 0.0;
    if (onDark > 0.0) {
      glow = 0.9 * onDark * max(
        A.x < GLOW_REACH ? dashField(p, OUTLINE_A, hA) : 0.0,
        B.x < GLOW_REACH ? dashField(p, OUTLINE_B, hB) : 0.0
      );
    }
    acc = vec4(u_hot * glow, glow);

    bool useA = A.x < B.x;
    float dist = useA ? A.x : B.x;
    vec2 dir = useA ? dirA : dirB;
    float cov = 1.0 - smoothstep(HALF_WIDTH - px, HALF_WIDTH, dist);
    float lit = useA ? dash(A.y, A.z, hA) : dash(B.y, B.z, hB);

    if (cov > 0.0) {
      // The outline is a rounded ridge: a half cylinder, so its normal tilts
      // away from the centre line towards the edges (a "U" in cross-section).
      float t = clamp(dist / HALF_WIDTH, 0.0, 1.0);
      vec2 side = dist > 1e-4 ? dir / dist : vec2(0.0);
      vec3 N = normalize(vec3(side * t, sqrt(max(1.0 - t * t, 0.0))));

      // Studio reflection: a soft key from the top left, a fainter kicker from
      // the bottom right, so the two sides of each ridge read differently.
      vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
      float key = smoothstep(-0.1, 0.9, dot(R.xy, normalize(vec2(-0.6, -0.8))) * 1.3);
      float kicker = smoothstep(0.55, 1.0, dot(R.xy, normalize(vec2(0.7, 0.7))));
      float env = 0.03 + 0.15 * key + 0.06 * kicker;

      // The travelling streaks and the pointer are point lights over the surface.
      vec2 ds = vec2(0.0);
      for (int i = 0; i < ${2 * SOURCES_PER_DASH}; i++) {
        float k = float(i % ${SOURCES_PER_DASH}) / ${SOURCES_PER_DASH}.0;
        ds += pow(1.0 - k, 1.5) * pointLight(vec3(p, 0.0), N, u_src[i], LIGHT_Z);
      }
      ds += 1.5 * u_hover * pointLight(vec3(p, 0.0), N, u_pointer, LIGHT_Z);

      float shade = clamp(env + 0.60 * ds.x, 0.0, 1.0);
      vec3 metal = mix(u_lo, u_hi, shade);
      vec3 specular = mix(vec3(1.0), u_hot, 0.45) * ds.y * 20.0;

      // The dash itself is emissive: that is where the light sits.
      vec3 ridge = clamp(mix(metal + specular, u_hot, lit * 0.9), 0.0, 1.0);

      // At rest the metal is only faintly there; the lights bring it out.
      float reveal = clamp(REST_VISIBILITY + 0.8 * ds.y + 0.12 * ds.x + lit, 0.0, 1.0);
      float a = cov * reveal;
      acc = over(vec4(ridge * a, a), acc);
    }
  }

  // ---- In front of everything: the copy ----------------------------------------------
  vec2 tuv = (css - u_textOrigin) / u_textSize;
  if (tuv.x >= 0.0 && tuv.x <= 1.0 && tuv.y >= 0.0 && tuv.y <= 1.0) {
    vec4 m = texture(u_mask, tuv);
    if (m.a >= 0.004) {
      vec2 texel = 1.0 / vec2(textureSize(u_mask, 0));

      // The edges of the letters are a small bevel: which way is out, and how close to
      // the edge this pixel is, come from the slope of the glyph's alpha (so the bevel
      // is about one pixel wide and crisp).
      vec2 o = texel * 1.1;
      vec2 g = vec2(texture(u_mask, tuv + vec2(o.x, 0.0)).a - texture(u_mask, tuv - vec2(o.x, 0.0)).a,
                    texture(u_mask, tuv + vec2(0.0, o.y)).a - texture(u_mask, tuv - vec2(0.0, o.y)).a);
      float edge = smoothstep(0.18, 0.55, length(g)) * m.a;
      vec2 outward = -g / max(length(g), 1e-4);          // direction pointing out of the letter

      // Every light point is its own light: an edge catches a streak only if it faces it,
      // and only while the streak is near. As a streak travels the glint therefore slides
      // along, and round, the edges: it moves with the light instead of just fading.
      float spec = 0.0;
      float prox = 0.0;
      for (int i = 0; i < ${2 * SOURCES_PER_DASH}; i++) {
        float k = float(i % ${SOURCES_PER_DASH}) / ${SOURCES_PER_DASH}.0;
        vec2 d = (u_src[i] - p) * u_unit;                // towards the light, in CSS pixels
        float len = length(d) + 1e-3;
        float q = 1.0 + (len * len) / (TEXT_RANGE * TEXT_RANGE);
        float w = pow(1.0 - k, 1.5) / (q * q);
        prox += w;
        // The streaks are far to the side of the copy, so as they travel the true angle to
        // them barely changes. Squash the sideways distance so that the direction swings
        // widely with their height: the glint sweeps over the edges as they pass.
        vec2 aim = normalize(vec2(d.x * 0.3, d.y) + 1e-3);
        float facing = dot(outward, aim);                // 1 when the edge faces this light
        spec += w * pow(max(facing, 0.0), 9.0);          // a narrow cone: the angle matters
      }
      prox *= 0.28;
      spec *= 1.2;

      // The face of the letters is a constant, readable brightness: the light does not
      // wash over it. Nothing lights the front, so edges never go darker than the face.
      vec3 base = m.rgb / max(m.a, 0.001);
      vec3 specColor = mix(vec3(1.0), u_hot, 0.35);
      vec3 face = base * 0.85;

      // No resting glint: where no streak is near, the edges are plain.
      float glint = clamp(spec * edge * 6.0, 0.0, 1.0);
      face = mix(face, specColor * 1.6, glint);
      face = clamp(face, 0.0, 1.0);

      acc = over(vec4(face * m.a, m.a), acc);
    }
  }

  outColor = acc;
}`;

const LIGHT_FRAG = `${COMMON}
uniform vec2 u_viewport; // viewport size, CSS pixels
uniform vec2 u_center;   // centre of the logo canvas, CSS pixels
uniform float u_unit;    // CSS pixels per logo unit
uniform float u_gain;    // overall strength of this layer
uniform float u_reach;   // how far the light reaches, relative to the default
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 css = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_res * u_viewport;
  vec2 p = (css - u_center) / u_unit + 0.5 * SIZE;

  // Sum of point lights spread along each dash, brightest at the head.
  float light = 0.0;
  for (int i = 0; i < ${2 * SOURCES_PER_DASH}; i++) {
    float k = float(i % ${SOURCES_PER_DASH}) / ${SOURCES_PER_DASH}.0;
    light += pow(1.0 - k, 1.5) * spill(distance(p, u_src[i]) / u_reach);
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
    powerPreference: "low-power",
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
    /** Take theme colours from CSS (see Stage.astro). */
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
      // Extra colours are smuggled through otherwise unused border colours,
      // because the browser resolves those (var(), color-mix()) to plain rgb.
      if (u.u_hot) set("u_hot", style.borderTopColor);
      if (u.u_lo) set("u_lo", style.borderBottomColor);
      if (u.u_hi) set("u_hi", style.borderLeftColor);
    },
    draw(time: number, scroll: number) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.u_time, time);
      gl.uniform1f(u.u_scroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

/**
 * The text of `host` as a texture in the hero's GL context. The text itself stays
 * in the DOM (SEO, selection, find in page, screen readers): once this has drawn,
 * its fill is made transparent (html[data-glyphs], see Stage.astro) and the hero
 * canvas, which lets all input through, shows the same words in the same places.
 */
function createGlyphs(
  gl: WebGL2RenderingContext,
  maskLocation: WebGLUniformLocation | null,
  host: HTMLElement,
  getResolution: () => number,
) {
  // Room around the text for light that falls just outside the letters.
  const MARGIN = 16;

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // An empty texture until the first drawing: an incomplete one reads as opaque black.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.uniform1i(maskLocation, 0);

  const mask = document.createElement("canvas");
  const mctx = mask.getContext("2d");
  if (!mctx) throw new Error("2d canvas not available");

  let ready = false;

  /** The area the texture covers, in CSS pixels. */
  const region = () => {
    const r = host.getBoundingClientRect();
    return { left: r.left - MARGIN, top: r.top - MARGIN, width: r.width + 2 * MARGIN, height: r.height + 2 * MARGIN };
  };

  /** Draw every word of the host's text where the browser laid it out. */
  const rasterizeNow = () => {
    const box = region();
    if (!box.width || !box.height || !mask.width) return;

    mctx.setTransform(mask.width / box.width, 0, 0, mask.height / box.height, 0, 0);
    mctx.clearRect(0, 0, box.width, box.height);
    mctx.textBaseline = "alphabetic";

    const range = document.createRange();
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      const el = node.parentElement;
      if (!el || !text.trim()) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      mctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      mctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
      mctx.fillStyle = style.color;

      // Word by word, so that wrapping is whatever the browser decided.
      for (const word of text.matchAll(/\S+/g)) {
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        const rect = range.getClientRects()[0];
        if (!rect) continue;
        const ascent = mctx.measureText(word[0]).fontBoundingBoxAscent;
        mctx.fillText(word[0], rect.left - box.left, rect.top - box.top + ascent);
      }
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);

    if (!ready) {
      ready = true;
      document.documentElement.dataset.glyphs = ""; // now the DOM text can step aside
    }
  };
  const rasterize = () => {
    try {
      rasterizeNow();
    } catch (err) {
      console.warn("rasterizing the text failed", err);
    }
  };

  const resize = () => {
    const dpr = Math.max(Math.min(window.devicePixelRatio || 1, 2) * getResolution(), 1);
    const box = region();
    mask.width = Math.max(1, Math.round(box.width * dpr));
    mask.height = Math.max(1, Math.round(box.height * dpr));
    rasterize();
  };

  // Rasterise again whenever the text might look different.
  let pending = 0;
  const schedule = () => {
    if (!pending) {
      pending = requestAnimationFrame(() => {
        pending = 0;
        rasterize();
      });
    }
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  document.fonts.ready.then(resize);
  document.fonts.addEventListener("loadingdone", schedule);
  const events = ["mouseover", "mouseout", "focusin", "focusout"];
  for (const type of events) host.addEventListener(type, schedule);

  resize();

  return {
    region,
    resize,
    refresh: schedule,
    get ready() {
      return ready;
    },
    dispose() {
      cancelAnimationFrame(pending);
      resizeObserver.disconnect();
      document.fonts.removeEventListener("loadingdone", schedule);
      for (const type of events) host.removeEventListener(type, schedule);
      delete document.documentElement.dataset.glyphs;
    },
  };
}

/**
 * `slot` is an empty canvas that only reserves the logo's place in the layout
 * (and receives the pointer). Everything is drawn by two canvases:
 *  - "logo-hero": over the whole hero (logo and copy), one shader (HERO_FRAG).
 *  - "logo-light": over the whole viewport, the light spilling onto the page,
 *    at a quarter of the resolution (it is smooth) and added to the page with
 *    a CSS blend mode.
 * Nothing in the page's DOM or styles is touched per frame.
 */
export function mountLogo(slot: HTMLCanvasElement) {
  const container = slot.closest<HTMLElement>(".container") ?? slot.parentElement ?? document.body;
  container.classList.add("has-hero");

  const heroCanvas = document.createElement("canvas");
  heroCanvas.className = "logo-hero";
  heroCanvas.setAttribute("aria-hidden", "true");
  container.append(heroCanvas);
  const hero = createLayer(heroCanvas, HERO_FRAG, [
    "u_origin", "u_size", "u_center", "u_unit", "u_pointer", "u_hover",
    "u_hot", "u_lo", "u_hi", "u_src", "u_mask", "u_textOrigin", "u_textSize",
  ]);

  const lightLayers = [{ className: "logo-light", gain: 1, reach: 1 }].map(({ className, gain, reach }) => {
    const el = document.createElement("canvas");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    document.body.append(el);
    return { el, gain, reach, layer: createLayer(el, LIGHT_FRAG, ["u_viewport", "u_center", "u_unit", "u_gain", "u_reach", "u_src"]) };
  });

  // Quality steps, used if the device can't keep up (see the draw loop).
  const RESOLUTION = [1, 0.75, 0.6];
  let quality = 0;

  // The hero copy. Without WebGL the plain DOM text stays as it is.
  let glyphs: ReturnType<typeof createGlyphs> | null = null;
  const textHost = container.querySelector<HTMLElement>("[data-glyphs-host]");
  if (textHost) {
    try {
      glyphs = createGlyphs(hero.gl, hero.u.u_mask, textHost, () => RESOLUTION[quality]);
    } catch (err) {
      console.warn("text drawing failed", err);
    }
  }

  // Theme colours
  const readColors = () => {
    hero.readColor();
    for (const { layer } of lightLayers) layer.readColor();
    glyphs?.refresh();
  };
  readColors();
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", readColors);

  const resizeHero = () => {
    // 2x supersampling is plenty; high density phone screens don't need more.
    const dpr = Math.max(Math.min(window.devicePixelRatio || 1, 2) * RESOLUTION[quality], 1);
    hero.resize(heroCanvas.clientWidth * dpr, heroCanvas.clientHeight * dpr);
  };
  const resizeLight = () => {
    for (const { layer } of lightLayers) layer.resize(window.innerWidth / 4, window.innerHeight / 4);
  };
  const resizeObserver = new ResizeObserver(resizeHero);
  resizeObserver.observe(heroCanvas);
  resizeHero();
  resizeLight();
  window.addEventListener("resize", resizeLight);

  // Pointer, in logo units; eased so the glow follows smoothly.
  const target = { x: -1e4, y: -1e4, hover: 0 };
  const pointer = { x: -1e4, y: -1e4, hover: 0 };
  const onMove = (e: PointerEvent) => {
    const r = slot.getBoundingClientRect();
    const scale = Math.min(r.width / VIEW_W, r.height / VIEW_H);
    target.x = (e.clientX - r.left - r.width / 2) / scale + ART_W / 2;
    target.y = (e.clientY - r.top - r.height / 2) / scale + ART_H / 2;
    target.hover = 1;
  };
  const onLeave = () => {
    target.hover = 0;
  };
  slot.addEventListener("pointermove", onMove);
  slot.addEventListener("pointerleave", onLeave);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The motion is slow, so touch devices don't need more than 30 frames a second.
  const frameInterval = matchMedia("(pointer: coarse), (max-width: 700px)").matches ? 1000 / 30 : 0;
  let lastDraw = 0;
  let slowFrames = 0;
  let frame = 0;
  let visible = true;
  const start = performance.now();

  const draw = (now: number) => {
    frame = 0;

    if (frameInterval && lastDraw && now - lastDraw < frameInterval - 2) {
      if (visible && !reduced) frame = requestAnimationFrame(draw);
      return;
    }

    // Step quality down if frames keep taking much longer than they should.
    if (lastDraw && !reduced) {
      const dt = now - lastDraw;
      const expected = Math.max(frameInterval, 1000 / 60);
      slowFrames = dt > expected * 1.6 && dt < 500 ? slowFrames + 1 : Math.max(slowFrames - 1, 0);
      if (slowFrames > 45 && quality < RESOLUTION.length - 1) {
        quality++;
        slowFrames = 0;
        resizeHero();
        glyphs?.resize();
      }
    }
    lastDraw = now;

    const time = reduced ? 3.0 : (now - start) / 1000;
    const scroll = window.scrollY;

    if (pointer.hover < 0.01 && target.hover > 0) {
      pointer.x = target.x;
      pointer.y = target.y;
    }
    pointer.x += (target.x - pointer.x) * 0.15;
    pointer.y += (target.y - pointer.y) * 0.15;
    pointer.hover += (target.hover - pointer.hover) * 0.1;

    const sources = new Float32Array(
      OUTLINES.flatMap((outline) => dashSources(outline, headArc(outline, time, scroll)).flat()),
    );

    // Everything is placed relative to wherever the logo slot is on screen.
    const r = slot.getBoundingClientRect();
    const center = [r.left + r.width / 2, r.top + r.height / 2];
    const unit = Math.min(r.width / VIEW_W, r.height / VIEW_H);

    const h = heroCanvas.getBoundingClientRect();
    const { gl, u } = hero;
    gl.uniform2f(u.u_origin, h.left, h.top);
    gl.uniform2f(u.u_size, h.width, h.height);
    gl.uniform2f(u.u_center, center[0], center[1]);
    gl.uniform1f(u.u_unit, unit);
    gl.uniform2fv(u.u_src, sources);
    gl.uniform2f(u.u_pointer, pointer.x, pointer.y);
    gl.uniform1f(u.u_hover, pointer.hover);
    const text = glyphs?.region();
    gl.uniform2f(u.u_textOrigin, text ? text.left : 0, text ? text.top : 0);
    gl.uniform2f(u.u_textSize, text ? text.width : 1, text ? text.height : 1);
    hero.draw(time, scroll);

    for (const { layer, gain, reach } of lightLayers) {
      layer.gl.uniform1f(layer.u.u_gain, gain);
      layer.gl.uniform1f(layer.u.u_reach, reach);
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

  // Only animate while the hero, or the light it casts, can be on screen.
  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      for (const { el } of lightLayers) el.style.visibility = visible ? "visible" : "hidden";
      if (visible && !frame) frame = requestAnimationFrame(draw);
    },
    { rootMargin: "300px" },
  );
  intersection.observe(container);
  frame = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(frame);
    intersection.disconnect();
    resizeObserver.disconnect();
    scheme.removeEventListener("change", readColors);
    window.removeEventListener("resize", resizeLight);
    window.removeEventListener("scroll", onScroll);
    slot.removeEventListener("pointermove", onMove);
    slot.removeEventListener("pointerleave", onLeave);
    for (const { el } of lightLayers) el.remove();
    heroCanvas.remove();
    container.classList.remove("has-hero");
    glyphs?.dispose();
  };
}

for (const canvas of document.querySelectorAll<HTMLCanvasElement>("canvas[data-logo]")) {
  try {
    mountLogo(canvas);
  } catch (err) {
    console.warn("logo shader failed", err);
  }
}
