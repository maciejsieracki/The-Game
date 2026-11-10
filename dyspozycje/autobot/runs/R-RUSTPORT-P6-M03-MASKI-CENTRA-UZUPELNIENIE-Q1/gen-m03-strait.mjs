// Wektory P6.M03 r2 (zarzut 3, mutant M15): `landMaskKontynenty` w cieśninie, gdzie
// `dist2 - distC` jest równe progowi 0.018 CO DO BITU (oraz o 1 ulp mniej / więcej).
// Konstrukcja: heks (q,r) leży w tym samym wierszu co oba centra (centra mają `nr == r/(h-1)`),
// więc `Math.hypot(x, 0) = |x|` (dokładnie) i odległości to różnice współrzędnych `nq`.
// Wynik URUCHAMIA kod TS weba (pin edb8fb56), jak gen-m03-web.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
const mapDir = `${root}/gra/src/map`;
const ghSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
writeFileSync(`${mapDir}/__m03_gen_helpers_strait.ts`, ghSrc);
const G = await import(pathToFileURL(`${mapDir}/__m03_gen_helpers_strait.ts`).href);
const T = (x) => (Object.is(x, -0) ? '-0' : String(x));

const THRESH = 0.018; // literal TS gen-helpers.ts:~480 (`dist2 - distC < 0.018`)
const next = (x, n) => {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, x);
  dv.setBigUint64(0, dv.getBigUint64(0) + BigInt(n));
  return dv.getFloat64(0);
};

const SEED = 42;
const NOISE = 0.13;
const perm = G.buildPermTable(G.mulberry32(SEED));
const res = { zrodlo: 'uruchomiony kod TS weba (gen-m03-strait.mjs), pin edb8fb56', seed: SEED, noise_scale: T(NOISE), threshold: T(THRESH), cases: [] };

// cel różnicy: dokładnie próg ("rowne"), 1 ulp mniej ("ciesnina", wynik 0), 1 ulp więcej ("morze", wynik > 0)
const targets = [['rowne', THRESH], ['ulp_mniej', next(THRESH, -1)], ['ulp_wiecej', next(THRESH, 1)]];
let rngState = 12345;
const rnd = () => { rngState = (rngState * 1664525 + 1013904223) >>> 0; return rngState / 4294967296; };

for (const [kind, target] of targets) {
  let found = 0;
  for (let attempt = 0; attempt < 2_000_000 && found < 6; attempt++) {
    // Heks blisko lewej krawedzi dlugiej mapy: nq ~ 0.01-0.06, wiec ulp(nq) <= 2^-58 i roznica
    // 0.018 (ulp 2^-58) jest osiagalna co do bitu. Heks jest poza strefa brzegu (q >= 30).
    const w = 1500 + Math.floor(rnd() * 1500);
    const h = 60 + Math.floor(rnd() * 60);
    const q = 30 + Math.floor(rnd() * 61);
    const r = 20 + Math.floor(rnd() * (h - 40));
    const nq = q / (w - 1);
    const nr = r / (h - 1);
    const a = nq - (0.001 + rnd() * 0.03); // lewe centrum (blizsze)
    const d1 = Math.hypot(nq - a, 0);
    const b = nq + (d1 + target); // prawe centrum, kandydat
    const d2 = Math.hypot(nq - b, 0);
    if (d2 - d1 !== target) continue;
    const cs = [
      { nq: a, nr, radius: 0.3 },
      { nq: b, nr, radius: 0.3 },
    ];
    const v = G.landMaskKontynenty(q, r, w, h, cs, perm, NOISE);
    if (kind === 'ulp_mniej') { if (v !== 0) continue; }
    else if (!(v > 0)) continue; // wynik "rowne"/"ulp_wiecej" ma byc niezerowy, by '<=' bylo rozroznialne
    res.cases.push({
      kind, q, r, w, h, centers: cs.map((c) => [T(c.nq), T(c.nr), T(c.radius)]),
      dist_c: T(d1), dist2: T(d2), diff: T(d2 - d1), value: T(v),
    });
    found++;
  }
  console.log(kind, found);
}
writeFileSync(out, JSON.stringify(res));
console.log('OK', res.cases.length);
