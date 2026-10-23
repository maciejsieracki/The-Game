// Wektory P6.M03: granice progow ukladu Pangei (t == prog_male / prog_srednie dokladnie) oraz
// remisy kolejnosci: URUCHAMIA kod TS weba (pin edb8fb56), jak gen-m03-web.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
const mapDir = `${root}/gra/src/map`;
const ghSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
writeFileSync(`${mapDir}/__m03_gen_helpers_full.ts`, ghSrc + '\nexport { pangeaLandT, normToIsotropic, secondNearestContinentDist, pangeaBlobScore };\n');
const G = await import(pathToFileURL(`${mapDir}/__m03_gen_helpers_full.ts`).href);
const T = (x) => (Object.is(x, -0) ? '-0' : String(x));

const res = { zrodlo: 'uruchomiony kod TS weba (gen-m03-edges.mjs), pin edb8fb56', layout: [], t_equal: {} };
const next = (x, n) => {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, x);
  dv.setBigUint64(0, dv.getBigUint64(0) + BigInt(n));
  return dv.getFloat64(0);
};
for (const [name, thr] of [['male', 0.28], ['srednie', 0.55], ['zero', 0], ['jeden', 1]]) {
  const base = 0.15 + 0.7 * thr;
  const hits = [];
  for (let k = -40; k <= 40; k++) {
    const lf = next(base, k);
    const t = G.pangeaLandT(lf);
    if (t === thr) hits.push(lf);
    for (const [w, h] of [[36, 28], [120, 80], [500, 400]]) {
      const L = G.pangeaLandLayoutParams(lf, w, h);
      res.layout.push({
        w, h, lf: T(lf), t: T(t),
        values: [L.nBlobs, L.blobRadiusMin, L.blobRadiusMax, L.ringRMin, L.ringRMax, L.clusterRadius, L.threshold, L.mergeSum, L.mergeMax, L.globalWarp, L.valley, L.fillMinScore].map(T),
      });
    }
  }
  res.t_equal[name] = hits.map(T);
}
res.edge_rect = [];
for (const [w, h] of [[2500, 40], [40, 2500], [5000, 5000], [2002, 2002], [2001, 2001], [2000, 2000], [2003, 7]]) {
  const qs = [-1, 0, 1, 2, 3, 5, 10, Math.floor(w / 2), w - 6, w - 4, w - 3, w - 2, w - 1, w];
  const rs = [-1, 0, 1, 2, 3, 5, Math.floor(h / 2), h - 4, h - 3, h - 2, h - 1, h];
  const rows = [];
  for (const r of rs) for (const q of qs) rows.push([q, r, T(G.mapEdgeRectFade(q, r, w, h)), T(G.landMaskBorderFade(q, r, w, h))]);
  res.edge_rect.push({ w, h, rows });
}
writeFileSync(out, JSON.stringify(res));
console.log('OK', res.layout.length, JSON.stringify(Object.fromEntries(Object.entries(res.t_equal).map(([k, v]) => [k, v.length]))));
