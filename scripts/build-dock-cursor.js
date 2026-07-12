/**
 * Build dock cursor SVG from Sketch1.dxf contour (arcs + tangent lines only).
 */
const rL = 1.5;
const cL = { x: 0, y: 0 };
const rS = 0.25;
const cS = { x: -1.5749947416019083, y: 2.7279709141083215 };

// Solid tangent lines from DXF (endpoints lie on the circles).
const pLargeL = { x: -1.4899987282251306, y: -0.17292712305269062 };
const pLargeR = { x: 0.894758645678983, y: 1.2039131887259134 };
const pSmallL = { x: -1.8233278629726946, y: 2.6991497269328812 };
const pSmallR = { x: -1.4258683006557282, y: 2.9286231122288795 };

const axis = { x: -3.8244210662233642, y: 6.6240915962356075 };
const axisLen = Math.hypot(axis.x, axis.y);
const tip = {
  x: cS.x + (rS * axis.x) / axisLen,
  y: cS.y + (rS * axis.y) / axisLen,
};
const bulbBottom = { x: cL.x, y: cL.y - rL };

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
  const am = a1 + da / 2;
  return polar(c, r, am);
}
function distPointToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  const q = { x: a.x + t * dx, y: a.y + t * dy };
  return dist(p, q);
}
function pickArc(c, r, from, to, through) {
  const a1 = ang(c, from);
  const a2 = ang(c, to);
  let best = null;
  for (const large of [0, 1]) {
    for (const sweep of [0, 1]) {
      const mid = arcMidpoint(c, r, a1, a2, large, sweep);
      const score = dist(mid, through);
      if (!best || score < best.score) best = { large, sweep, score };
    }
  }
  return best;
}
function arcCmd(c, r, from, to, through, minX, maxY, sc, pad) {
  const pick = pickArc(c, r, from, to, through);
  const P2 = mapPt(to, minX, maxY, sc, pad);
  const rs = +(r * sc).toFixed(4);
  return {
    cmd: `A ${rs} ${rs} 0 ${pick.large} ${pick.sweep} ${P2.x} ${P2.y}`,
    pick,
  };
}

// Verify DXF tangency
[
  [cL, rL, pLargeL],
  [cL, rL, pLargeR],
  [cS, rS, pSmallL],
  [cS, rS, pSmallR],
].forEach(([c, r, p]) => {
  const d = dist(c, p);
  if (Math.abs(d - r) > 0.002) console.warn('off circle', d, r);
});

const outline = [pSmallR, pLargeR, pLargeL, pSmallL, tip, bulbBottom];
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

const pad = 4;
const size = 44 - pad * 2;
const sc = size / Math.max(maxX - minX, maxY - minY);
const m = (p) => mapPt(p, minX, maxY, sc, pad);

const P_SR = m(pSmallR);
const P_LR = m(pLargeR);
const P_LL = m(pLargeL);
const P_SL = m(pSmallL);
const T = m(tip);

const largeArc = arcCmd(cL, rL, pLargeR, pLargeL, bulbBottom, minX, maxY, sc, pad);
const smallArc = arcCmd(cS, rS, pSmallL, pSmallR, tip, minX, maxY, sc, pad);

const d = [
  `M ${P_SR.x} ${P_SR.y}`,
  `L ${P_LR.x} ${P_LR.y}`,
  largeArc.cmd,
  `L ${P_SL.x} ${P_SL.y}`,
  smallArc.cmd,
  'Z',
].join(' ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><path fill="#35383e" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" d="${d}"/></svg>`;
const uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${T.x} ${T.y}, auto`;

console.log(JSON.stringify({ d, hotspot: T, largeArc: largeArc.pick, smallArc: smallArc.pick, css: uri, svg }, null, 2));
