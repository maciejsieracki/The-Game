// Generator wektorow DUZYCH MAP dla enforceTargetDryLandFraction (gen-helpers.ts:5079), pin edb8fb56.
// Cel: rozroznic mutacje M11 (klamp gorny 0.85 -> 0.86) i M12 (2 przebiegi wybrzeza w etapie 1 enforce).
// Mapy 40x40 i 60x60 (pojemnosc lądu do ~95%), cele 0.84..0.99 i 0.5, tolerancja 2/3/4 pp, fillBias center/mask.
// URUCHAMIA prawdziwy kod TS weba (zadnej logiki nie przepisujemy).
// Uzycie (z katalogu runu, WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data`):
//   node --experimental-transform-types --no-warnings --import <abs>/m06b2-loader-register.mjs \
//        <abs>/gen-m06b2-enforce-large.mjs <WEB_ROOT> <PLIK_WYJSCIA.json>
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outFile = process.argv[3];
if (!root || !outFile) {
  console.error('uzycie: gen-m06b2-enforce-large.mjs <WEB_ROOT> <PLIK_WYJSCIA.json>');
  process.exit(2);
}
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const keyOf = (q, r) => `${q},${r}`;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

function dumpObj(hexes) {
  return Object.entries(hexes).map(([k, h]) => [
    k,
    h.terenBazowy,
    h.nakladka,
    h.zloze ? 1 : 0,
    h.rzeka.obecna ? 1 : 0,
    [...h.rzeka.krawedzie],
  ]);
}
function buildObj(rows) {
  const o = {};
  for (const [k, terr, nak, z, ro, ed] of rows) {
    const [q, r] = k.split(',').map(Number);
    o[k] = {
      coords: { q, r },
      terenBazowy: terr,
      nakladka: nak,
      rzeka: { obecna: ro === 1, krawedzie: [...ed] },
      ...(z ? { zloze: 'zloze_rudy' } : {}),
    };
  }
  return o;
}
function diffRows(before, after) {
  const afterRows = dumpObj(after);
  if (afterRows.length !== before.length) throw new Error('zmiana liczby heksow');
  const old = new Map(before.map((r) => [r[0], JSON.stringify(r)]));
  const diff = [];
  for (const r of afterRows) {
    if (old.get(r[0]) !== JSON.stringify(r)) diff.push(r);
  }
  return diff;
}

const rnd0 = G.mulberry32(20261130);
const rnd = () => rnd0();

function finishRows(W, H, land, o) {
  const rows = [];
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < H; r++) {
      const k = keyOf(q, r);
      let terr;
      if (land.has(k)) {
        const x = rnd();
        if (x < o.mtn) terr = TB.Gory;
        else if (x < o.mtn * 1.6) terr = TB.Wzgorza;
        else terr = [TB.Laka, TB.Rownina, TB.Pustynia][Math.floor(rnd() * 3)];
      } else {
        terr = rnd() < o.plytkie ? TB.PlytkieMorze : TB.Morze;
      }
      const water = terr === TB.Morze || terr === TB.PlytkieMorze;
      const nak = rnd() < (water ? o.lasWoda : o.lasLad) ? NK.Las : NK.Brak;
      const zloze = rnd() < (water ? o.zlozeWoda : o.zlozeLad) ? 1 : 0;
      let ro = 0;
      let ed = [];
      if (rnd() < o.rzekaP) {
        ro = 1;
        const n = 1 + Math.floor(rnd() * 3);
        const set = new Set();
        while (set.size < n) set.add(Math.floor(rnd() * 6));
        ed = [...set].sort((a, b) => a - b);
      }
      rows.push([k, terr, nak, zloze, ro, ed]);
    }
  }
  return rows;
}

// Blob lądu przez spacer losowy (jak blobRows w gen-m06b2-vectors.mjs), ale z naciskiem na duza pojemnosc.
function blobRows(W, H, landFrac, o) {
  const keys = [];
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) keys.push(keyOf(q, r));
  const land = new Set();
  const target = Math.round(keys.length * landFrac);
  const seeds = Math.max(1, Math.round(keys.length / 40));
  const frontier = [];
  for (let i = 0; i < seeds; i++) {
    const k = keys[Math.floor(rnd() * keys.length)];
    land.add(k);
    frontier.push(k);
  }
  let guard = 0;
  while (land.size < target && frontier.length && guard++ < keys.length * 200) {
    const idx = Math.floor(rnd() * frontier.length);
    const [q, r] = frontier[idx].split(',').map(Number);
    const [dq, dr] = DIRS[Math.floor(rnd() * 6)];
    const nq = q + dq;
    const nr = r + dr;
    if (nq >= 0 && nq < W && nr >= 0 && nr < H) {
      const nk = keyOf(nq, nr);
      if (!land.has(nk)) {
        land.add(nk);
        frontier.push(nk);
      }
    }
    if (rnd() < 0.02) frontier.splice(idx, 1);
  }
  if (land.size < target) throw new Error(`za mala pojemnosc: ${land.size}/${target}`);
  return { W, H, rows: finishRows(W, H, land, o) };
}

const OPT_A = { mtn: 0.2, plytkie: 0.3, lasWoda: 0.12, lasLad: 0.1, zlozeWoda: 0.05, zlozeLad: 0.1, rzekaP: 0.15 };
const OPT_B = { mtn: 0.4, plytkie: 0.5, lasWoda: 0.2, lasLad: 0.15, zlozeWoda: 0.1, zlozeLad: 0.2, rzekaP: 0.3 };
const OPT_C = { mtn: 0.1, plytkie: 0.1, lasWoda: 0.05, lasLad: 0.05, zlozeWoda: 0.02, zlozeLad: 0.05, rzekaP: 0.05 };
const OPTS = [OPT_A, OPT_B, OPT_C];

// Mapy: (W, H, udzial lądu, opcje). Indeks w pliku = indeks tutaj.
const MAP_SPECS = [
  [60, 60, 0.95, 0],
  [60, 60, 0.9, 1],
  [60, 60, 0.92, 2],
  [60, 60, 0.88, 0],
  [40, 40, 0.9, 1],
  [40, 40, 0.93, 2],
  [40, 40, 0.86, 0],
  [60, 60, 0.97, 1],
];
const maps = MAP_SPECS.map(([W, H, frac, oi]) => {
  const m = blobRows(W, H, frac, OPTS[oi]);
  const scores = m.rows.map(() => Math.round(rnd() * 1000) / 1000);
  return { W, H, rows: m.rows, scores };
});

// Cele: 0.85 / 0.86 (klamp gorny: 0.85 vs 0.86 roznia sie o 1 pp lądu), 0.9 (powyzej klampu), 0.99 (klamp).
// Rozmiar pliku ograniczony (limit 6 MB): pelna siatka tol x bias dla 0.85/0.86/0.9, sam tol 3 center dla 0.99.
const COMBOS = [];
for (const target of [0.85, 0.86, 0.9]) {
  for (const tol of [2, 3, 4]) for (const bias of ['center', 'mask']) COMBOS.push([target, tol, bias]);
}
COMBOS.push([0.99, 3, 'center'], [0.99, 2, 'center']);
const cases = [];
maps.forEach((mp, mi) => {
  const { W, H } = mp;
  const scoreMap = () => new Map(mp.rows.map((row, i) => [row[0], mp.scores[i]]));
  const before = mp.rows;
  for (const [target, tol, bias] of COMBOS) {
    const hexes = buildObj(before);
    const ret = G.enforceTargetDryLandFraction(hexes, scoreMap(), target, W, H, undefined, tol, bias);
    cases.push({
      id: `enf-large-${mi}-t${target}-tol${tol}-${bias}`,
      mi, W, H, target, tol, bias,
      out: { ret, diff: diffRows(before, hexes) },
    });
  }
});

const payload = {
  meta: {
    pin_web: 'edb8fb56',
    temat: 'R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1',
    plik: 'web-enforce-large.json',
    generator: 'gen-m06b2-enforce-large.mjs',
    uwaga: 'mapy 40x40 i 60x60, pojemnosc lądu do 97%; rozrozniaja klamp 0.85/0.86 i 1/2 przebiegi wybrzeza',
  },
  cases: { enforceLarge: cases },
  maps,
};
const text = JSON.stringify(payload);
writeFileSync(outFile, text);
const counts = {};
for (const c of cases) counts[c.out.ret > 0 ? 'ret>0' : 'ret=0'] = (counts[c.out.ret > 0 ? 'ret>0' : 'ret=0'] ?? 0) + 1;
console.log(JSON.stringify({ file: outFile, bytes: text.length, cases: cases.length, maps: maps.length, counts }));
