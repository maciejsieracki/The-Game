// Generator wektorow P6.M06A9 (partia 1): fillPangeaAnnularSeaCorridors (gen-helpers.ts :4595, export),
// rebalanceLandSeaRatio (:3791, export), rebalanceLandFractionPangea (:3667, export).
// Uruchamiane z ORYGINALNEGO pinu edb8fb56 (bez instrumentacji): wszystkie trzy symbole sa eksportowane.
//
// Uzycie (z katalogu tego pliku):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a9-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>
// WEB_ROOT = wyeksportowany pin edb8fb56 (gra/src, gra/data) rozpakowany POZA repo.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-m06a9-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const gen = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');

const GI = await import(pathToFileURL(`${mapDir}/gen-helpers.ts`).href);
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
const RUST_TO_TB = Object.fromEntries(Object.entries(TB_TO_RUST).map(([tb, n]) => [n, tb]));
const LAND_TBS = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory, TerenBazowy.Pustynia];

const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Hexy w kolejnosci wstawiania (Object.keys = kolejnosc wstawiania; klucze "q,r" nie sa indeksami).
const buildHexes = (order) => {
  const hexes = {};
  for (const [key, tbName] of order) {
    const [q, r] = key.split(',').map(Number);
    hexes[key] = {
      coords: { q, r },
      terenBazowy: RUST_TO_TB[tbName],
      nakladka: Nakladka.Brak,
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return hexes;
};
const hexesToOrder = (hexes) => Object.keys(hexes).map((k) => [k, TB_TO_RUST[hexes[k].terenBazowy]]);
const keyOf = (q, r) => `${q},${r}`;
const permOf = (rnd) => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let j = p.length - 1; j > 0; j--) {
    const k = Math.floor(rnd() * (j + 1));
    [p[j], p[k]] = [p[k], p[j]];
  }
  return p;
};

const cases = [];
let nextId = 0;
const idOf = (fam) => `${fam}-${String(nextId++).padStart(5, '0')}`;

// ---------------------------------------------------------------------------------------------
// RODZINA 1: fillPangeaAnnularSeaCorridors
// ---------------------------------------------------------------------------------------------
const fillCase = (family, w, h, order, maxW) => {
  const hexes = buildHexes(order);
  const converted = GI.fillPangeaAnnularSeaCorridors(hexes, w, h, maxW === null ? undefined : maxW);
  return { id: idOf(family), family, w, h, maxW, order, converted, after: hexesToOrder(hexes) };
};

// (a) losowe mapy: lad/morze/plytkie, rozne gestosci, opcjonalny jawny maxW.
{
  const rnd = mulberry32(0x9e11);
  for (let i = 0; i < 90; i++) {
    const w = 8 + Math.floor(rnd() * 17);
    const h = 8 + Math.floor(rnd() * 17);
    const pLand = 0.35 + rnd() * 0.4;
    const pShallow = 0.3 + rnd() * 0.6;
    const order = [];
    for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
      const land = rnd() < pLand;
      const tb = land
        ? LAND_TBS[Math.floor(rnd() * LAND_TBS.length)]
        : (rnd() < pShallow ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze);
      order.push([keyOf(q, r), TB_TO_RUST[tb]]);
    }
    const maxW = i % 3 === 0 ? null : 2 + Math.floor(rnd() * 8);
    cases.push(fillCase('losowe', w, h, order, maxW));
  }
}

// (b) granica obwarzanka: rdzen (kwadrat 2a+1), pas wody grubosci T, zewnetrzny pierscien lądu
// (grubosc 2) i morze poza nim. T = maxW-1 / maxW / maxW+1 (prog zgodny z warunkiem
// inward<=maxW && outward<=maxW oraz pasmem seaBand > maxW+1).
{
  for (const maxW of [3, 4, 6, 8]) {
    for (const a of [5, 7]) {
      for (const T of [maxW - 1, maxW, maxW + 1]) {
        if (T < 1) continue;
        const S = 2 * (a + T + 3) + 1;
        const order = [];
        for (let r = 0; r < S; r++) for (let q = 0; q < S; q++) {
          const dq = Math.abs(q - (S >> 1));
          const dr = Math.abs(r - (S >> 1));
          const d = Math.max(dq, dr);
          let tb;
          if (d <= a) tb = TerenBazowy.Laka;
          else if (d <= a + T) tb = TerenBazowy.Morze;
          else if (d <= a + T + 2) tb = TerenBazowy.Gory;
          else tb = TerenBazowy.Morze;
          order.push([keyOf(q, r), TB_TO_RUST[tb]]);
        }
        cases.push(fillCase('granica-pas', S, S, order, maxW));
      }
    }
  }
}

// (c) prog lądu: < 40 suchych heksow -> centroid null -> 0 zmian; 39/40/41 suchych.
{
  for (const nLand of [39, 40, 41]) {
    const w = 12, h = 12;
    const order = [];
    let placed = 0;
    for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
      const isLand = placed < nLand && r < 4;
      if (isLand) placed++;
      // pas wody (Morze) przy pelnym obwodzie, zeby pierscien mial kandydatow
      const tb = isLand ? TerenBazowy.Laka : (q === 6 ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze);
      order.push([keyOf(q, r), TB_TO_RUST[tb]]);
    }
    cases.push(fillCase('prog-ladu', w, h, order, 4));
  }
}

// (d) brzeg: puste, jeden heks, niekanoniczny klucz pominiety (poza zakresem: nie generujemy).
cases.push(fillCase('brzeg', 0, 0, [], null));
cases.push(fillCase('brzeg', 1, 1, [['0,0', 'Laka']], null));
cases.push(fillCase('brzeg', 2, 2, [['0,0', 'Morze'], ['1,0', 'Morze'], ['0,1', 'Morze'], ['1,1', 'Morze']], 3));

// ---------------------------------------------------------------------------------------------
// RODZINA 2: rebalanceLandSeaRatio
// ---------------------------------------------------------------------------------------------
const ratioCase = (family, w, h, order, target) => {
  const hexes = buildHexes(order);
  const adjusted = GI.rebalanceLandSeaRatio(hexes, w, h, target);
  return { id: idOf(family), family, w, h, target, order, adjusted, after: hexesToOrder(hexes) };
};
{
  const rnd = mulberry32(0x5a7a);
  for (let i = 0; i < 90; i++) {
    const w = 5 + Math.floor(rnd() * 16);
    const h = 5 + Math.floor(rnd() * 16);
    const pLand = 0.1 + rnd() * 0.8;
    const order = [];
    for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
      const land = rnd() < pLand;
      const tb = land ? LAND_TBS[Math.floor(rnd() * LAND_TBS.length)]
        : (rnd() < 0.4 ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze);
      order.push([keyOf(q, r), TB_TO_RUST[tb]]);
    }
    const target = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95][i % 7] + (rnd() - 0.5) * 0.02;
    cases.push(ratioCase('losowe', w, h, order, target));
  }
}
// granica progu: land = target_land - 1 / target_land / target_land + 1 (target = round(total*clamp)).
{
  const w = 10, h = 10, total = w * h;
  for (const dLand of [-1, 0, 1]) {
    for (const frac of [0.3, 0.5, 0.7]) {
      const tl = Math.round(total * frac) + dLand;
      const order = [];
      let placed = 0;
      for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
        const isLand = placed < tl;
        if (isLand) placed++;
        order.push([keyOf(q, r), TB_TO_RUST[isLand ? TerenBazowy.Laka : TerenBazowy.Morze]]);
      }
      cases.push(ratioCase('prog-udzialu', w, h, order, frac));
    }
  }
}
cases.push(ratioCase('brzeg', 1, 1, [['0,0', 'Morze']], 0.5));
cases.push(ratioCase('brzeg', 0, 0, [], 0.5));

// ---------------------------------------------------------------------------------------------
// RODZINA 3: rebalanceLandFractionPangea (landScores + perm)
// ---------------------------------------------------------------------------------------------
const pangeaCase = (family, w, h, order, scores, perm, target) => {
  const hexes = buildHexes(order);
  const landScores = new Map(scores);
  GI.rebalanceLandFractionPangea(hexes, landScores, target, w, h, Uint8Array.from(perm));
  return { id: idOf(family), family, w, h, target, order, scores, perm, after: hexesToOrder(hexes) };
};
{
  const rnd = mulberry32(0x7ab1);
  for (let i = 0; i < 60; i++) {
    const w = 14 + Math.floor(rnd() * 13);
    const h = 14 + Math.floor(rnd() * 13);
    const order = [];
    const scores = [];
    const cx = w / 2, cy = h / 2;
    for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
      const k = keyOf(q, r);
      const dn = Math.hypot((q - cx) / w, (r - cy) / h);
      const s = Math.max(0, Math.min(1, 1 - dn * 1.6 + (rnd() - 0.5) * 0.5));
      scores.push([k, s]);
      const land = s > 0.35 + rnd() * 0.2;
      const tb = land ? LAND_TBS[Math.floor(rnd() * LAND_TBS.length)]
        : (rnd() < 0.5 ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze);
      order.push([k, TB_TO_RUST[tb]]);
    }
    const target = [0.2, 0.3, 0.4, 0.5, 0.6][i % 5];
    cases.push(pangeaCase('losowe', w, h, order, scores, permOf(rnd), target));
  }
}

const meta = (temat, extra) => ({
  temat,
  zrodlo_web: 'gra/src/map/gen-helpers.ts (pin edb8fb56, bez instrumentacji): fillPangeaAnnularSeaCorridors :4595; rebalanceLandSeaRatio :3791; rebalanceLandFractionPangea :3667',
  generator: 'gen-m06a9-vectors.mjs',
  zrodlo_sha256: sha(gen),
  ...extra,
});
const families = (list) => list.reduce((acc, c) => ({ ...acc, [c.family]: (acc[c.family] ?? 0) + 1 }), {});
const fillCases = cases.filter((c) => c.converted !== undefined);
const ratioCases = cases.filter((c) => c.adjusted !== undefined);
const pangeaCases = cases.filter((c) => c.scores !== undefined);

mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/fill-vectors.json`, JSON.stringify({
  meta: meta('R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1', { rodziny: families(fillCases), symbol: 'fillPangeaAnnularSeaCorridors' }),
  cases: fillCases,
}));
writeFileSync(`${outDir}/ratio-vectors.json`, JSON.stringify({
  meta: meta('R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1', { rodziny: families(ratioCases), symbol: 'rebalanceLandSeaRatio' }),
  cases: ratioCases,
}));
writeFileSync(`${outDir}/pangea-vectors.json`, JSON.stringify({
  meta: meta('R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1', { rodziny: families(pangeaCases), symbol: 'rebalanceLandFractionPangea' }),
  cases: pangeaCases,
}));
console.log('OK', { fill: fillCases.length, ratio: ratioCases.length, pangea: pangeaCases.length });
