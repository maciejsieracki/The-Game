// Pomiar granic (obrona r3, zarzut Evaluatora 5): trafienia szumu `coast` dokladnie na progu
// (`coast === 0.68` / `coast === 0.32`) oraz w sasiedztwie 1 ulp (N-1 / N+1) dla ocen uzytych przez
// wektory applyJaggedCoastNoise: te same rozmiary map, perm (seed 20261031..33), przebiegi 0..4
// i brzegi co w gen-m06a4-jagged-vectors.mjs. Zrodlo wartosci: prawdziwy kod TS weba (pin edb8fb56).
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//           ./probe-m06a4-jagged-boundary-r3.mjs <WEB_ROOT>
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const NS = 0.28;
const f64 = new Float64Array(1);
const u64 = new BigUint64Array(f64.buffer);
const nextUp = (x) => { f64[0] = x; u64[0] = u64[0] + (x >= 0 ? 1n : -1n); return f64[0]; };
const nextDown = (x) => { f64[0] = x; u64[0] = u64[0] + (x >= 0 ? -1n : 1n); return f64[0]; };
const T = { erode: 0.68, fill: 0.32 };
const near = { erode: [nextDown(T.erode), T.erode, nextUp(T.erode)], fill: [nextDown(T.fill), T.fill, nextUp(T.fill)] };
const out = { evaluated: 0, exact_erode: 0, exact_fill: 0, ulp_erode_minus: 0, ulp_erode_plus: 0, ulp_fill_minus: 0, ulp_fill_plus: 0, per_size: {} };
const seeds = [20261031, 20261032, 20261033];
const sizes = [[9, 9], [12, 14], [16, 25], [20, 30], [7, 5], [6, 6], [12, 12], [8, 1]];
for (const [W, H] of sizes) {
  const key = `${W}x${H}`;
  const per = { evaluated: 0, exact: 0, ulp: 0 };
  for (const seed of seeds) {
    const perm = G.buildPermTable(G.mulberry32(seed));
    for (let pass = 0; pass < 5; pass++) {
      for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) {
        if (G.isInMapBorder(q, r, W, H)) continue;
        const coarse = G.fbm(perm, q * NS + pass * 17, r * NS + pass * 31, 4);
        const fine = G.fbm(perm, q * NS * 2.1 + 200, r * NS * 2.1 + 200, 3) * 0.35;
        const coast = coarse + fine;
        out.evaluated++; per.evaluated++;
        if (coast === T.erode) { out.exact_erode++; per.exact++; }
        if (coast === T.fill) { out.exact_fill++; per.exact++; }
        if (coast === near.erode[0]) out.ulp_erode_minus++;
        if (coast === near.erode[2]) out.ulp_erode_plus++;
        if (coast === near.fill[0]) out.ulp_fill_minus++;
        if (coast === near.fill[2]) out.ulp_fill_plus++;
        if (coast === near.erode[0] || coast === near.erode[2] || coast === near.fill[0] || coast === near.fill[2]) per.ulp++;
      }
    }
  }
  out.per_size[key] = per;
}
console.log(JSON.stringify({ thresholds: T, near_values: near, ...out }, null, 1));
