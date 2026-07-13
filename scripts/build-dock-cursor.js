/**
 * Dock pointer — DXF tangent points, short exterior bulb arc, tip via lines.
 * Rollback: station-desktop/assets/lg-webos-pointer-v563-milestone.svg (GAS v563)
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
function onCircle(c, r, p) {
  return polar(c, r, ang(c, p));
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
/** Short arc only — exterior = midpoint farther from opposite circle center. */
function pickShortExteriorArc(c, r, from, to, awayFrom) {
  const a1 = ang(c, from);
  const a2 = ang(c, to);
  let best = null;
  for (let sweep = 0; sweep <= 1; sweep++) {
    const mid = arcMidpoint(c, r, a1, a2, 0, sweep);
    const d = dist(mid, awayFrom);
    if (!best || d > best.d) best = { large: 0, sweep, d };
  }
  return best;
}
function fmt(n) {
  return (+n).toFixed(3);
}

const eLargeR = onCircle(cL, rL, pLargeR);
const eLargeL = onCircle(cL, rL, pLargeL);
const eSmallR = onCircle(cS, rS, pSmallR);
const eSmallL = onCircle(cS, rS, pSmallL);

const outline = [eSmallR, eLargeR, eLargeL, eSmallL, tip];
let minX = Infinity;
let maxY = -Infinity;
outline.forEach((p) => {
  minX = Math.min(minX, p.x);
  maxY = Math.max(maxY, p.y);
});
const maxX = Math.max(...outline.map((p) => p.x));
const minY = Math.min(...outline.map((p) => p.y));

const strokePad = STROKE_W / 2 + 5;
const pad = strokePad;
const size = VB - pad * 2;
const sc = size / Math.max(maxX - minX, maxY - minY);
const mapPt = (p) => ({
  x: (p.x - minX) * sc + pad,
  y: (maxY - p.y) * sc + pad,
});

const cLsvg = mapPt(cL);
const cSsvg = mapPt(cS);
const rLsvg = rL * sc;
const P_SR = mapPt(eSmallR);
const P_LR = mapPt(eLargeR);
const P_LL = mapPt(eLargeL);
const P_SL = mapPt(eSmallL);
const T = mapPt(tip);

const largePick = pickShortExteriorArc(cLsvg, rLsvg, P_LR, P_LL, cSsvg);
const largeArc = `A ${fmt(rLsvg)} ${fmt(rLsvg)} 0 0 ${largePick.sweep} ${fmt(P_LL.x)} ${fmt(P_LL.y)}`;

const d = [
  `M ${fmt(P_SR.x)} ${fmt(P_SR.y)}`,
  `L ${fmt(P_LR.x)} ${fmt(P_LR.y)}`,
  largeArc,
  `L ${fmt(P_SL.x)} ${fmt(P_SL.y)}`,
  `L ${fmt(T.x)} ${fmt(T.y)}`,
  `L ${fmt(P_SR.x)} ${fmt(P_SR.y)}`,
  'Z',
].join(' ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}"><path fill="${FILL}" stroke="${STROKE}" stroke-width="${STROKE_W}" stroke-linejoin="miter" stroke-linecap="butt" d="${d}"/></svg>`;
const hotspot = { x: +T.x.toFixed(3), y: +T.y.toFixed(3) };
console.log(JSON.stringify({
  d,
  hotspot,
  largePick,
  css: `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${Math.round(hotspot.x)} ${Math.round(hotspot.y)}, auto`,
  svg,
}, null, 2));
