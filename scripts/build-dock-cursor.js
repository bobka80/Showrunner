const rL = 1.5;
const cL = { x: 0, y: 0 };
const rS = 0.25;
const cS = { x: -1.5749947416019083, y: 2.7279709141083215 };
const pLargeL = { x: -1.4899987282251306, y: -0.17292712305269062 };
const pLargeR = { x: 0.894758645678983, y: 1.2039131887259134 };
const pSmallL = { x: -1.8233278629726946, y: 2.6991497269328812 };
const pSmallR = { x: -1.4258683006557282, y: 2.9286231122288795 };
const axis = { x: -3.8244210662233642, y: 6.6240915962356075 };
const len = Math.hypot(axis.x, axis.y);
const tip = { x: cS.x + (rS * axis.x) / len, y: cS.y + (rS * axis.y) / len };

function ang(c, p) {
  return Math.atan2(p.y - c.y, p.x - c.x);
}
function polar(c, r, a) {
  return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
}
function mapPt(p, minX, maxY, sc, pad) {
  return {
    x: +(((p.x - minX) * sc + pad).toFixed(2)),
    y: +(((maxY - p.y) * sc + pad).toFixed(2)),
  };
}

const outline = [tip, pSmallR, pLargeR, pLargeL, pSmallL];
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

function arcCmd(r, c, a1, a2, sweep) {
  const p2 = polar(c, r, a2);
  let da = a2 - a1;
  while (da <= 0) da += Math.PI * 2;
  const large = da > Math.PI ? 1 : 0;
  const P2 = m(p2);
  const rs = +(r * sc).toFixed(3);
  return `A ${rs} ${rs} 0 ${large} ${sweep} ${P2.x} ${P2.y}`;
}

const T = m(tip);
const LR = m(pLargeR);
const SL = m(pSmallL);
let d = `M ${T.x} ${T.y} `;
d += `${arcCmd(rS, cS, ang(cS, tip), ang(cS, pSmallR), 1)} `;
d += `L ${LR.x} ${LR.y} `;
d += `${arcCmd(rL, cL, ang(cL, pLargeR), ang(cL, pLargeL), 1)} `;
d += `L ${SL.x} ${SL.y} `;
d += `${arcCmd(rS, cS, ang(cS, pSmallL), ang(cS, tip), 1)} Z`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><path fill="#35383e" stroke="#ffffff" stroke-width="3" stroke-linejoin="miter" d="${d}"/></svg>`;
const uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${T.x} ${T.y}, auto`;

console.log(JSON.stringify({ d, hotspot: T, css: uri, svg }, null, 2));
