/**
 * Dock pointer: outer bulb arc (max bulge) + tip arc (through tip point).
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

const FILL = '#991b1b';
const STROKE = '#ffffff';
const STROKE_W = 4.25;

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
function bulgeFromChord(from, to, p) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const t = Math.max(0, Math.min(1, ((p.x - from.x) * dx + (p.y - from.y) * dy) / (dx * dx + dy * dy || 1)));
  const qx = from.x + t * dx;
  const qy = from.y + t * dy;
  return Math.hypot(p.x - qx, p.y - qy);
}
function pointOnArc(c, pt, from, to, large, sweep) {
  const a = ang(c, pt);
  const a1 = ang(c, from);
  const a2 = ang(c, to);
  let da = a2 - a1;
  if (sweep === 0 && da > 0) da -= Math.PI * 2;
  if (sweep === 1 && da < 0) da += Math.PI * 2;
  if (large) da = da > 0 ? da - Math.PI * 2 : da + Math.PI * 2;
  let dap = a - a1;
  if (sweep === 0 && dap > 0) dap -= Math.PI * 2;
  if (sweep === 1 && dap < 0) dap += Math.PI * 2;
  if (large) dap = dap > 0 ? dap - Math.PI * 2 : dap + Math.PI * 2;
  return sweep ? dap >= 0 && dap <= da : dap <= 0 && dap >= da;
}
function pickArc(c, r, from, to, through) {
  const a1 = ang(c, from);
  const a2 = ang(c, to);
  let best = null;
  for (let large = 0; large <= 1; large++) {
    for (let sweep = 0; sweep <= 1; sweep++) {
      const contains = through ? pointOnArc(c, through, from, to, large, sweep) : false;
      const mid = arcMidpoint(c, r, a1, a2, large, sweep);
      const bulge = bulgeFromChord(from, to, mid);
      if (through) {
        if (!contains) continue;
        if (!best || bulge < best.bulge) best = { large, sweep, bulge };
        continue;
      }
      if (!best || bulge > best.bulge) best = { large, sweep, bulge };
    }
  }
  return best;
}
function arcCmd(c, r, from, to, minX, maxY, sc, pad, through) {
  const pick = pickArc(c, r, from, to, through);
  const end = mapPt(to, minX, maxY, sc, pad);
  const rs = +(r * sc).toFixed(4);
  return `A ${rs} ${rs} 0 ${pick.large} ${pick.sweep} ${end.x} ${end.y}`;
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

const VB = 48;
const pad = 3;
const size = VB - pad * 2;
const sc = size / Math.max(maxX - minX, maxY - minY);
const m = (p) => mapPt(p, minX, maxY, sc, pad);

const P_SR = m(pSmallR);
const P_LR = m(pLargeR);
const P_SL = m(pSmallL);
const T = m(tip);

const d = [
  `M ${P_SR.x} ${P_SR.y}`,
  `L ${P_LR.x} ${P_LR.y}`,
  arcCmd(cL, rL, pLargeR, pLargeL, minX, maxY, sc, pad, null),
  `L ${P_SL.x} ${P_SL.y}`,
  arcCmd(cS, rS, pSmallL, pSmallR, minX, maxY, sc, pad, tip),
  'Z',
].join(' ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}"><path fill="${FILL}" stroke="${STROKE}" stroke-width="${STROKE_W}" stroke-linejoin="miter" stroke-linecap="butt" d="${d}"/></svg>`;
console.log(JSON.stringify({ d, hotspot: T, css: `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${Math.round(T.x)} ${Math.round(T.y)}, auto`, svg }, null, 2));
