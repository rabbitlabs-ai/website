// The demo shot shown on the site: real keys and real Rabbit Labs in-betweens, one entry per drawing.
// Until a shot is exported from the engine this stays null and the page shows a labelled placeholder.
//
// Format, once exported:
// window.SHOT = {
//   viewBox: "0 0 960 540",             // shared by every drawing
//   fps: 24,
//   source: "graphinbet v4 · held-out CC0 character",   // printed under the demo
//   drawings: [
//     { n: 1, key: true,  hold: 2, svg: "<path d='…'/>…" },   // inner SVG markup, line art only
//     { n: 3, key: false, hold: 2, svg: "…" },                // key: false = drafted by the model
//     …
//   ],
// };
// Stroke colours in the markup are overridden by the page (keys graphite, in-betweens blue).
window.SHOT = null;
