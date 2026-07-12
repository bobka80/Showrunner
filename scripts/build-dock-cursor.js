/**
 * LG-style dock pointer — outer contour only (exterior circle arcs + tangent lines).
 */
const rL = 1.5;
const cL = { x: 0, y: 0 };
const rS = 0.25;
const cS = { x: -1.5749947416019083, y: 2.7279709141083215 };

const pLargeL = { x: -1.4899987282251306, y: -0.17292712305269062 };
const pLargeR = { x: 0.894758645678983, y: 1.2039131887259134 };
const pSmallL = { x: -1.8233278629726946, y: 2.6991497269328812 };
const pSmallR = { x: -1.4258683006557282, y: 2.9286231122288795 };

const interiorRef = { x: -0.75, y: 1.15 };

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function ang(c, p) {
  return Math.atan2(p.y - c.y, p.x - c.x);
}
function polar(c, r, a) {
  return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
}
function mapPt(p, minX, maxY, sc, pad) {
  return {
    x: +(((p.x - minX) * sc + pad).toFixed(3)),
    y: +(((maxY - p.y) * sc + pad).toFixed(3)),
  };
}
function arcMidpoint(c, r, a1, a2, large, sweep) {
  let da = a2 - a1;
  if (sweep === 0 && da > 0) da -= Math.PI * 2;
  if (sweep === 1 && da < 0) da += Math.PI * 2;
  if (large) da = da > 0 ? da - Math.PI * 2 : da + Math.PI * 2;
  return polar(c, r, a1 + da / 2);
}
function pickExteriorArc(c, r, from, to, awayFrom) {
  const a1 = ang(c, from);
  const a2 = ang(c, to);
  let best = null;
  for (let large = 0; large <= 1; large++) {
    for (let sweep = 0; sweep <= 1; sweep++) {
      const mid = arcMidpoint(c, r, a1, a2, large, sweep);
      const score = dist(mid, awayFrom);
      if (!best || score > best.score) best = { large, sweep, score, mid };
    }
  }
  return best;
}
function arcCmd(c, r, from, to, awayFrom, minX, maxY, sc, pad) {
  const pick = pickExteriorArc(c, r, from, to, awayFrom);
  const end = mapPt(to, minX, maxY, sc, pad);
  const rs = +(r * sc).toFixed(4);
  return `A ${rs} ${rs} 0 ${pick.large} ${pick.sweep} ${end.x} ${end.y}`;
}

const outline = [pSmallR, pLargeR, pLargeL, pSmallL];
let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;
outline.forEach((p) => {
  minX = Math.min(minX, p.x);
  minY = Math.min(minY, p.y);
  maxX = Math.max(maxX, p.x);
  maxY = Math.max(maxY, p.y);
});

const VB = 48;
const pad = 3;
const size = VB - pad * 2;
const sc = size / Math.max(maxX - minX, maxY - minY);
const m = (p) => mapPt(p, minX, maxY, sc, pad);

const P_SR = m(pSmallR);
const P_LR = m(pLargeR);
const P_SL = m(pSmallL);
const T = m({
  x: cS.x + (rS * -3.8244210662233642) / 7.648842132446731,
  y: cS.y + (rS * 6.6240915962356075) / 7.648842132446731,
});

const d = [
  `M ${P_SR.x} ${P_SR.y}`,
  `L ${P_LR.x} ${P_LR.y}`,
  arcCmd(cL, rL, pLargeR, pLargeL, interiorRef, minX, maxY, sc, pad),
  `L ${P_SL.x} ${P_SL.y}`,
  arcCmd(cS, rS, pSmallL, pSmallR, interiorRef, minX, maxY, sc, pad),
  'Z',
].join(' ');

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}">`,
  `<path fill="#35383e" stroke="#ffffff" stroke-width="2.25" stroke-linejoin="miter" stroke-linecap="butt" d="${d}"/>`,
  '</svg>',
].join('');
const uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${T.x} ${T.y}, auto`;

console.log(JSON.stringify({ d, hotspot: T, css: uri, svg }, null, 2));
