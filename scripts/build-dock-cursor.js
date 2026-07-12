/**
 * Dock pointer: bulb arc + tangent lines through tip (DXF-accurate).
 */
const rL = 1.5;
const cL = { x: 0, y: 0 };
const rS = 0.25;
const cS = { x: -1.5749947416019083, y: 2.7279709141083215 };

const pLargeL = { x: -1.4899987282251306, y: -0.17292712305269062 };
const pLargeR = { x: 0.894758645678983, y: 1.2039131887259134 };
const pSmallL = { x: -1.8233278629726946, y: 2.6991497269328812 };
const pSmallR = { x: -1.4258683006557282, y: 2.9286231122288795 };

const axisLen = Math.hypot(-3.8244210662233642, 6.6240915962356075);
const tip = {
  x: cS.x + (rS * -3.8244210662233642) / axisLen,
  y: cS.y + (rS * 6.6240915962356075) / axisLen,
};

const FILL = '#7f1d1d';
const STROKE = '#a1a1aa';
const STROKE_W = 3.25;
const VB = 48;

function ang(c, p) {
  return Math.atan2(p.y - c.y, p.x - c.x);
}
function polar(c, r, a) {
  return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
}
function mapPt(p, minX, maxY, sc, pad) {
  return {
    x: (p.x - minX) * sc + pad,
    y: (maxY - p.y) * sc + pad,
  };
}
function arcMidpoint(c, r, a1, a2, large, sweep) {
  let da = a2 - a1;
  if (sweep === 0 && da > 0) da -= Math.PI * 2;
  if (sweep === 1 && da < 0) da += Math.PI * 2;
  if (large) da = da > 0 ? da - Math.PI * 2 : da + Math.PI * 2;
  return polar(c, r, a1 + da / 2);
}
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function pickExteriorArc(c, r, from, to, awayFrom) {
  const a1 = ang(c, from);
  const a2 = ang(c, to);
  let best = null;
  for (let large = 0; large <= 1; large++) {
    for (let sweep = 0; sweep <= 1; sweep++) {
      const mid = arcMidpoint(c, r, a1, a2, large, sweep);
      const d = dist(mid, awayFrom);
      if (!best || d > best.d) best = { large, sweep, d };
    }
  }
  return best;
}

const outline = [pSmallR, pLargeR, pLargeL, pSmallL, tip];
let minX = Infinity;
let maxY = -Infinity;
outline.forEach((p) => {
  minX = Math.min(minX, p.x);
  maxY = Math.max(maxY, p.y);
});
const maxX = Math.max(...outline.map((p) => p.x));
const minY = Math.min(...outline.map((p) => p.y));

const strokePad = STROKE_W / 2 + 2;
const pad = strokePad;
const size = VB - pad * 2;
const sc = size / Math.max(maxX - minX, maxY - minY);
const m = (p) => mapPt(p, minX, maxY, sc, pad);

const cLsvg = m(cL);
const cSsvg = m(cS);
const rLsvg = rL * sc;
const P_SR = m(pSmallR);
const P_LR = m(pLargeR);
const P_LL = m(pLargeL);
const P_SL = m(pSmallL);
const T = m(tip);

const largePick = pickExteriorArc(cLsvg, rLsvg, P_LR, P_LL, cSsvg);
const largeArc = `A ${+rLsvg.toFixed(4)} ${+rLsvg.toFixed(4)} 0 ${largePick.large} ${largePick.sweep} ${P_LL.x.toFixed(3)} ${P_LL.y.toFixed(3)}`;

const d = [
  `M ${P_SR.x.toFixed(3)} ${P_SR.y.toFixed(3)}`,
  `L ${P_LR.x.toFixed(3)} ${P_LR.y.toFixed(3)}`,
  largeArc,
  `L ${P_SL.x.toFixed(3)} ${P_SL.y.toFixed(3)}`,
  `L ${T.x.toFixed(3)} ${T.y.toFixed(3)}`,
  `L ${P_SR.x.toFixed(3)} ${P_SR.y.toFixed(3)}`,
  'Z',
].join(' ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}"><path fill="${FILL}" stroke="${STROKE}" stroke-width="${STROKE_W}" stroke-linejoin="miter" stroke-linecap="butt" d="${d}"/></svg>`;
const hotspot = { x: +T.x.toFixed(3), y: +T.y.toFixed(3) };
console.log(JSON.stringify({
  d,
  hotspot,
  css: `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${Math.round(hotspot.x)} ${Math.round(hotspot.y)}, auto`,
  svg,
}, null, 2));
