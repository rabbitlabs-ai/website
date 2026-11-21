// Shared demo for the site directions: a line-drawn rabbit head, two keys, and the in-betweens between them,
// spaced slow-in/slow-out with the ears dragging a beat behind the head. It is an illustration of the job,
// not output from the Rabbit Labs model. Exposes window.Rabbit = { drawings, frames, render, player }.
(function () {
  "use strict";
  const D2R = Math.PI / 180;
  const f = (v) => v.toFixed(1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);

  // Key poses: alert (A) and drooped (B). e1/e2 are the ears: a = root angle, b = bend toward the tip.
  const KEY_A = { x: 0, y: 0, tilt: -4, sq: 1, e1a: -100, e1b: 10, e2a: -76, e2b: -8, eye: 1 };
  const KEY_B = { x: 8, y: 20, tilt: 10, sq: 0.93, e1a: -150, e1b: -36, e2a: -36, e2b: 40, eye: 0.3 };
  const EARS = ["e1a", "e1b", "e2a", "e2b"];

  function between(A, B, u) {
    const th = ease(u), te = ease(clamp((u - 0.18) / 0.82));
    const o = {};
    for (const k in A) o[k] = lerp(A[k], B[k], EARS.includes(k) ? te : th);
    return o;
  }

  // Catmull-Rom through the points, as cubic Beziers.
  function smooth(pts, closed) {
    const n = pts.length;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
        `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return closed ? d + "Z" : d;
  }

  function ear(rx, ry, a, b) {
    const N = 14, L = 118, W = 34, left = [], right = [], spine = [];
    let x = rx, y = ry;
    for (let i = 0; i <= N; i++) {
      const s = i / N, ang = (a + b * Math.pow(s, 1.6)) * D2R;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const w = W * 0.5 * Math.sqrt(1 - s) * (0.8 + 0.35 * Math.sin(Math.PI * s));
      spine.push([x, y]);
      left.push([x - dy * w, y + dx * w]);
      right.push([x + dy * w, y - dx * w]);
      x += (dx * L) / N;
      y += (dy * L) / N;
    }
    return { outline: smooth(left.concat(right.reverse().slice(1)), false), inner: smooth(spine.slice(2, 11), false) };
  }

  function render(p) {
    const rx = 66 * (2 - p.sq), ry = 56 * p.sq;
    const head = [];
    for (let i = 0; i < 18; i++) {
      const t = (i / 18) * Math.PI * 2, r = 1 + 0.05 * Math.sin(2 * t + 0.6);
      head.push([Math.cos(t) * rx * r, Math.sin(t) * ry * r]);
    }
    const top = (x) => -ry * Math.sqrt(1 - (x / rx) ** 2) + 4;
    const e1 = ear(-26, top(-26), p.e1a, p.e1b), e2 = ear(16, top(16), p.e2a, p.e2b);
    return `<g transform="translate(${f(p.x)} ${f(p.y + 40)}) rotate(${f(p.tilt)})">` +
      `<path class="rl" d="${e1.outline}"/><path class="rl rt" d="${e1.inner}"/>` +
      `<path class="rl" d="${e2.outline}"/><path class="rl rt" d="${e2.inner}"/>` +
      `<path class="rl rh" d="${smooth(head, true)}"/>` +
      `<ellipse class="rf" cx="24" cy="-10" rx="5.5" ry="${f(Math.max(1.2, 7 * p.eye))}"/>` +
      `<circle class="rf" cx="64" cy="2" r="3.6"/>` +
      `<path class="rl rt" d="M63 6q-1 8-10 10M72 6 106-3M72 11 106 15"/></g>`;
  }

  // The shot: key A, 5 in-betweens, key B, 5 in-betweens, back to A. Keys held 8 frames, in-betweens on twos.
  const drawings = [];
  const add = (p, key) => drawings.push({ n: drawings.length + 1, key, hold: key ? 8 : 2, p });
  add(KEY_A, true);
  for (let i = 1; i <= 5; i++) add(between(KEY_A, KEY_B, i / 6), false);
  add(KEY_B, true);
  for (let i = 1; i <= 5; i++) add(between(KEY_B, KEY_A, i / 6), false);
  const frames = [];
  drawings.forEach((d, i) => { for (let k = 0; k < d.hold; k++) frames.push(i); });

  // Plays the frames at 24 fps (or 5x slower) and calls onFrame(frameIndex, drawingIndex, drawing).
  function player(onFrame) {
    let fr = 0, timer = null, slow = 1;
    const emit = () => onFrame(fr, frames[fr], drawings[frames[fr]]);
    const loop = () => { fr = (fr + 1) % frames.length; emit(); timer = setTimeout(loop, (1000 / 24) * slow); };
    const api = {
      play() { if (!timer) timer = setTimeout(loop, (1000 / 24) * slow); },
      pause() { clearTimeout(timer); timer = null; },
      toggle() { timer ? api.pause() : api.play(); return !!timer; },
      get playing() { return !!timer; },
      seek(k) { fr = k; emit(); },
      setSlow(s) { slow = s ? 5 : 1; },
    };
    emit();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) api.play();
    return api;
  }

  window.Rabbit = { drawings, frames, render, player, VIEWBOX: "-165 -150 330 285" };
})();
