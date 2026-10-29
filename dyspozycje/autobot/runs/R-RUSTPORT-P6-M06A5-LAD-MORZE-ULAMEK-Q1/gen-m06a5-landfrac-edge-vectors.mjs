// Generator wektorow brzegowych P6.M06A5 partia 1 (runda 2, domkniecie luk Z-1..Z-4 Evaluatora).
// Uruchamia PRAWDZIWY kod TS weba (pin edb8fb56) - oczekiwane wyniki pochodza wylacznie z weba.
// Kategorie (nowy plik, stary landfrac-vectors.json NIETKNIETY):
//   apply_nan          - applyLandFractionByScore z target = NaN (web: brak zmian)              [Z-1]
//   rebalance_nan      - rebalanceLandFractionWithMargins z target = NaN                      [Z-1]
//   apply_tie          - pary score 0.0/0.0399/0.04/0.0401 (granica tolerancja_score 0.04)    [Z-2, Z-4]
//   apply_missing      - landScores bez czesci kluczy (web `?? 0`)                            [Z-3]
//   sort_missing       - sortLandKeysForErosion z brakujacymi score (web `?? 0`)              [Z-3]
//   apply_clamp        - t dobrane tak, ze round(t*0.15)!=round(t*0.1499/0.1501) i analog 0.85  [Z-4]
//   sort_tol_centrum   - pary o tym samym brzegu i |ca-cb| w (0.015,0.0151] i (0.0149,0.015]  [Z-4]
//
// Uzycie (z katalogu tego pliku; loader obok):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a5-landfrac-edge-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a5-landfrac-edge-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const originalSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');

const instrSrc = originalSrc.replace(
  '\nfunction sortLandKeysForErosion(',
  '\nexport function sortLandKeysForErosion(',
);
if (instrSrc === originalSrc) throw new Error('instrumentacja sortLandKeysForErosion nie zadzialala');
writeFileSync(`${mapDir}/gen-helpers.m06a5-edge-instr.ts`, instrSrc);

const G = await import(pathToFileURL(`${mapDir}/gen-helpers.ts`).href);
const GI = await import(pathToFileURL(`${mapDir}/gen-helpers.m06a5-edge-instr.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy, Nakladka } = H;

const TB_TO_RUST = {
  [TerenBazowy.Laka]: 'Laka',
  [TerenBazowy.Rownina]: 'Rownina',
  [TerenBazowy.Wzgorza]: 'Wzgorza',
  [TerenBazowy.Gory]: 'Gory',
  [TerenBazowy.PlytkieMorze]: 'PlytkieMorze',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Polarny]: 'Polarny',
};
const RUST_TO_TB = {
  Laka: TerenBazowy.Laka,
  Rownina: TerenBazowy.Rownina,
  Wzgorza: TerenBazowy.Wzgorza,
  Gory: TerenBazowy.Gory,
  PlytkieMorze: TerenBazowy.PlytkieMorze,
  Morze: TerenBazowy.Morze,
  Pustynia: TerenBazowy.Pustynia,
  Polarny: TerenBazowy.Polarny,
};
const TERRAIN_WEIGHTS = [
  ['Morze', 46], ['PlytkieMorze', 10], ['Laka', 14], ['Rownina', 8],
  ['Wzgorza', 7], ['Gory', 5], ['Pustynia', 6], ['Polarny', 4],
];
const TERRAIN_TOTAL = TERRAIN_WEIGHTS.reduce((s, [, w]) => s + w, 0);

const rng = G.mulberry32(20261101);
const rnd = () => rng();
const rint = (n) => Math.floor(rnd() * n);

function mkHex(tbRust) {
  return { terenBazowy: RUST_TO_TB[tbRust], nakladka: Nakladka.Brak, rzeka: { obecna: false, krawedzie: [] } };
}
function pickTerrain() {
  let x = rnd() * TERRAIN_TOTAL;
  for (const [name, w] of TERRAIN_WEIGHTS) {
    if (x < w) return name;
    x -= w;
  }
  return 'Morze';
}
function randomMap(w, h) {
  const hexes = {};
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) hexes[`${q},${r}`] = mkHex(pickTerrain());
  }
  return hexes;
}
function dumpMap(hexes) {
  return Object.entries(hexes).map(([k, hx]) => [k, TB_TO_RUST[hx.terenBazowy]]);
}
const dumpTerrains = dumpMap;
function mapToScoreMap(pairs) {
  const m = new Map();
  for (const [k, v] of pairs) m.set(k, v);
  return m;
}
function randomScores(hexes, dropRate = 0) {
  const scores = [];
  for (const k of Object.keys(hexes)) {
    if (dropRate > 0 && rnd() < dropRate) continue;
    scores.push([k, rnd() < 0.08 ? 0.11 : Math.round(rnd() * 100) / 100]);
  }
  return scores;
}
// Zbior wartosci bliskich progu tolerancji: pary (0.0, d) daja roznice f64 == d dokladnie.
const TIE_VALUES = [0.0, 0.0399, 0.04, 0.0401, 0.11, 0.15, 0.5];

const cases = {
  apply_nan: [],
  rebalance_nan: [],
  apply_tie: [],
  apply_missing: [],
  sort_missing: [],
  apply_clamp: [],
  sort_tol_centrum: [],
};

// --- Z-1: NaN ----------------------------------------------------------------------------------
for (let i = 0; i < 8; i++) {
  const w = 3 + rint(8);
  const h = 3 + rint(8);
  const hexes = randomMap(w, h);
  const scores = randomScores(hexes);
  const dims = i % 2 === 0 ? [w, h] : null;
  const fill = i % 4 < 2 ? 'center' : 'mask';
  const beforeMap = dumpMap(hexes);
  const ws = JSON.parse(JSON.stringify(hexes));
  const adjusted = G.applyLandFractionByScore(
    ws, mapToScoreMap(scores), NaN, dims ? dims[0] : undefined, dims ? dims[1] : undefined, fill, 0.11,
  );
  cases.apply_nan.push({
    id: `apn_${i}`, target: 'NaN', dims, fill, min: 0.11, map: beforeMap, scores,
    expect: { adjusted, terrains: dumpTerrains(ws) },
  });
}
for (let i = 0; i < 8; i++) {
  const w = 4 + rint(9);
  const h = 4 + rint(9);
  const hexes = randomMap(w, h);
  const scores = randomScores(hexes);
  const beforeMap = dumpMap(hexes);
  const ws = JSON.parse(JSON.stringify(hexes));
  G.rebalanceLandFractionWithMargins(ws, mapToScoreMap(scores), NaN, w, h);
  cases.rebalance_nan.push({
    id: `rbn_${i}`, target: 'NaN', w, h, map: beforeMap, scores,
    expect: { terrains: dumpTerrains(ws) },
  });
}

// --- Z-2 / Z-4: granica tolerancja_score (0.04) -------------------------------------------------
// Mala mapa, dims null (granica nieaktywna -> remis = kolejnosc wstawiania). Wartosci score z
// TIE_VALUES: pary (0.0, 0.04) daja |sb-sa| == 0.04 dokladnie w f64 (tol-score-ge przy `>=`).
for (let i = 0; i < 60; i++) {
  const n = 3 + rint(6);
  const hexes = {};
  for (let q = 0; q < n; q++) hexes[`${q},0`] = mkHex(rnd() < 0.5 ? 'Morze' : pickTerrain());
  // czesc Morze, zeby sciezka wzrostu lądu zawsze miala kandydatow
  for (const k of Object.keys(hexes)) if (rnd() < 0.5) hexes[k] = mkHex('Morze');
  const scores = Object.keys(hexes).map((k) => [k, TIE_VALUES[rint(TIE_VALUES.length)]]);
  // jawny przypadek N: pierwszy klucz 0.0, drugi 0.04 (wstawiony pozniej)
  if (i < 12) {
    scores.splice(0, scores.length, ...Object.keys(hexes).map((k, j) => [k, j === 1 ? 0.04 : 0.0]));
  }
  const dims = i % 3 === 0 ? [n, 1] : null;
  const fill = i % 2 === 0 ? 'center' : 'mask';
  const target = [0.25, 0.4, 0.5, 0.6, 0.75][rint(5)];
  const beforeMap = dumpMap(hexes);
  const ws = JSON.parse(JSON.stringify(hexes));
  const adjusted = G.applyLandFractionByScore(
    ws, mapToScoreMap(scores), target, dims ? dims[0] : undefined, dims ? dims[1] : undefined, fill, 0.11,
  );
  cases.apply_tie.push({
    id: `apt_${i}`, target, dims, fill, min: 0.11, map: beforeMap, scores,
    expect: { adjusted, terrains: dumpTerrains(ws) },
  });
}

// --- Z-2 (r2b): jawne przypadki granicy 0.04 bez RNG (nie zmieniaja kolejnosci RNG kolejnych kategorii).
// Dwa kandydaci Morze (jedyne kandydaty wzrostu, dims null, fill center), wzrost o dokladnie 1 hex.
// Galaz score: |sb-sa| > tol -> sortuj po score; inaczej remis -> kolejnosc wstawiania (stabilna).
// Zatem wynik rozstrzyga, czy roznica rowna 0.04 (lub 0.0399/0.0401) trafia do galezi score.
const explicitTie = [
  // [id, score(0,0), score(1,0), oczekiwany ruch]
  ['apt_x_eq_first_lower', 0.0, 0.04],   // diff == 0.04 dokladnie; wstawka: nizszy pierwszy -> web remis -> 0,0
  ['apt_x_eq_first_higher', 0.04, 0.0],  // diff == 0.04; wyzszy pierwszy
  ['apt_x_0399', 0.0, 0.0399],           // diff 0.0399 < tol -> remis -> 0,0
  ['apt_x_0401', 0.0, 0.0401],           // diff 0.0401 > tol -> score -> 1,0
];
explicitTie.forEach(([id, s0, s1]) => {
  const hexes = {
    '0,0': mkHex('Morze'),
    '1,0': mkHex('Morze'),
    '2,0': mkHex('Laka'),
    '3,0': mkHex('Laka'),
  };
  const scores = [['0,0', s0], ['1,0', s1], ['2,0', 0.5], ['3,0', 0.5]];
  const target = 0.75;
  const beforeMap = dumpMap(hexes);
  const ws = JSON.parse(JSON.stringify(hexes));
  const adjusted = G.applyLandFractionByScore(ws, mapToScoreMap(scores), target, undefined, undefined, 'center', 0.11);
  cases.apply_tie.push({
    id, target, dims: null, fill: 'center', min: 0.11, map: beforeMap, scores,
    expect: { adjusted, terrains: dumpTerrains(ws) },
  });
});

// --- Z-3: brakujacy klucz w landScores (web `?? 0`) ----------------------------------------------
for (let i = 0; i < 40; i++) {
  const w = 3 + rint(8);
  const h = 3 + rint(8);
  const hexes = randomMap(w, h);
  const scores = randomScores(hexes, 0.4);
  const target = 0.15 + rnd() * 0.7;
  const dims = i % 2 === 0 ? [w, h] : null;
  const fill = i % 4 < 2 ? 'center' : 'mask';
  const beforeMap = dumpMap(hexes);
  const ws = JSON.parse(JSON.stringify(hexes));
  const adjusted = G.applyLandFractionByScore(
    ws, mapToScoreMap(scores), target, dims ? dims[0] : undefined, dims ? dims[1] : undefined, fill, 0.11,
  );
  cases.apply_missing.push({
    id: `apm_${i}`, target, dims, fill, min: 0.11, map: beforeMap, scores,
    expect: { adjusted, terrains: dumpTerrains(ws) },
  });
}
for (let i = 0; i < 30; i++) {
  const w = 2 + rint(8);
  const h = 2 + rint(8);
  const hexes = randomMap(w, h);
  const scores = randomScores(hexes, 0.4);
  const keysAll = Object.keys(hexes);
  const keys = keysAll.filter(() => rnd() < 0.8).sort(() => rnd() - 0.5);
  const sorted = GI.sortLandKeysForErosion(keys, hexes, mapToScoreMap(scores), w, h);
  cases.sort_missing.push({
    id: `som_${i}`, w, h, dims: [w, h], map: dumpMap(hexes), scores, keys,
    expect: sorted,
  });
}

// --- Z-4: progi clamp (0.15/0.85) i ich N-1/N+1 --------------------------------------------------
// Dla t wybieramy mape z dokladnie L = round(t*0.15) lub round(t*0.85) hexami Laka (reszta Morze),
// wtedy web nie zmienia nic, a mutant z progiem 0.1501/0.1499/0.8501/0.8499 zmienia liczbe lądu.
const jsRound = (x) => Math.floor(x + 0.5);
function searchT(a, b) {
  const found = [];
  for (let t = 4; t <= 2000 && found.length < 4; t++) {
    if (jsRound(t * a) !== jsRound(t * b)) found.push(t);
  }
  return found;
}
function clampMap(t, L) {
  const hexes = {};
  for (let q = 0; q < t; q++) hexes[`${q},0`] = mkHex(q < L ? 'Laka' : 'Morze');
  return hexes;
}
const clampSpecs = [
  { side: 'min', base: 0.15, alts: [0.1499, 0.1501], inputs: [0.1, 0.1499, 0.15, 0.1501, 0.2] },
  { side: 'max', base: 0.85, alts: [0.8499, 0.8501], inputs: [0.9, 0.8499, 0.85, 0.8501, 0.8] },
];
for (const spec of clampSpecs) {
  for (const alt of spec.alts) {
    for (const t of searchT(spec.base, alt).slice(0, 3)) {
      const L = jsRound(t * spec.base);
      for (const input of spec.inputs) {
        const hexes = clampMap(t, L);
        const scores = randomScores(hexes);
        const beforeMap = dumpMap(hexes);
        const ws = JSON.parse(JSON.stringify(hexes));
        const adjusted = G.applyLandFractionByScore(ws, mapToScoreMap(scores), input, undefined, undefined, 'center', 0.11);
        cases.apply_clamp.push({
          id: `apc_${spec.side}_${alt}_${t}_${input}`, target: input, dims: null, fill: 'center', min: 0.11,
          total: t, map: beforeMap, scores,
          expect: { adjusted, terrains: dumpTerrains(ws) },
        });
      }
    }
  }
}

// --- Z-4: okno tol-centrum (0.015 / 0.0149 / 0.0151) ---------------------------------------------
// Pary o tym samym brzegu (ba==bb) i |ca-cb| w (0.015,0.0151] lub (0.0149,0.015]; reszta mapy Laka,
// A = Gory (ranga erozji 5) > B = Laka (ranga 1), wiec galaz remisu (rank) rozstrzyga inaczej niz
// galaz odleglosci centrum.
const centerNorm = (q, r, w, h) => {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  return Math.sqrt(dx * dx + dy * dy);
};
const borderD = (q, r, w, h) => Math.min(q, r, w - 1 - q, h - 1 - r);
const windows = [
  { id: 'hi', pred: (d) => d > 0.015 && d <= 0.0151, need: 3 },
  { id: 'lo', pred: (d) => d > 0.0149 && d <= 0.015, need: 3 },
];
for (const win of windows) {
  let got = 0;
  search: for (let s = 3; s <= 40; s++) {
    for (let w = 3; w <= s; w++) {
      const h = s;
      const pts = [];
      for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) pts.push([q, r, borderD(q, r, w, h), centerNorm(q, r, w, h)]);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const [qa, ra, ba, ca] = pts[i];
          const [qb, rb, bb, cb] = pts[j];
          if (ba !== bb) continue;
          const d = Math.abs(ca - cb);
          if (!win.pred(d)) continue;
          // A = dalszy od srodka (ca > cb), B = blizszy
          const [A, B] = ca > cb ? [[qa, ra], [qb, rb]] : [[qb, rb], [qa, ra]];
          const hexes = {};
          for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) hexes[`${q},${r}`] = mkHex('Laka');
          hexes[`${A[0]},${A[1]}`] = mkHex('Gory');
          const keysIn = rnd() < 0.5 ? [`${A[0]},${A[1]}`, `${B[0]},${B[1]}`] : [`${B[0]},${B[1]}`, `${A[0]},${A[1]}`];
          const expect = GI.sortLandKeysForErosion(keysIn, hexes, new Map(), w, h);
          cases.sort_tol_centrum.push({
            id: `stc_${win.id}_${got}`, w, h, dims: [w, h], map: dumpMap(hexes), scores: [], keys: keysIn,
            diff: d, expect,
          });
          got++;
          if (got >= win.need * 2) break search;
        }
      }
    }
  }
  if (got === 0) throw new Error(`brak par dla okna ${win.id}`);
}

const counts = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length]));
const payload = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1',
    plik: 'landfrac-edge-vectors.json (runda 2, domkniecie Z-1..Z-4)',
    gen_helpers_pin: 'edb8fb56',
    gen_helpers_sha256: sha(originalSrc),
    seed: 20261101,
    uwaga: 'NaN zapisany jako string "NaN". Oczekiwania z uruchomionego weba.',
  },
  counts,
  cases,
};
writeFileSync(out, JSON.stringify(payload));
console.log(JSON.stringify({ out, counts }));
