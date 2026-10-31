// P6.8G (R-RUSTPORT-P6-8G-OKOLICA-Q1, runda 3): wektory z URUCHOMIONEGO weba 91dc998a.
// Wzorzec jak gen-repin-b2-vectors.mjs (REPIN-EKONOMIA-B2): prawdziwy kod TS z `git archive`, bez builda `gra/`.
// Funkcje eksportowane z gra/src/game/okolica.ts (+ yieldOfMapHex, isLandWorkableHex, foodPotential...):
//   cityRangeForPopulation, surroundingWorkerCap, tileScore, tileAssignScore, wagiForFocus,
//   hexKeysWithinRadius, okolicaTiles, resolveWorkedTiles (tryb auto), rebalanceWorkersAfterPopulationChange,
//   seedReczneFromAuto (przez rebalans), yieldOfMapHex (plony wstrzykiwane do Rust jako tabela).
// Kodowanie: liczba skonczona -> number; NaN/Infinity/-Infinity -> napis; undefined -> null;
//   Object.entries(reczne) -> tablica par [klucz, wartosc] w kolejnosci wstawiania (jak JS).
// Uruchomienie (Node 22, katalog tego runu):
//   node --experimental-transform-types --no-warnings --import <B2>/repin-b-loader-register.mjs \
//        ./gen-p6-8g-okolica-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <KATALOG_WYJSCIA>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';

const O = await import(src('game/okolica.ts'));
const HX = await import(src('types/hex.ts'));
const TB = HX.TerenBazowy;
const NK = HX.Nakladka;

const enc = (x) => {
  if (x === undefined) return null;
  if (typeof x === 'number' && !Number.isFinite(x)) return String(x);
  return x;
};

// ---- mapy testowe -----------------------------------------------------------------------
const TERRAINS = [TB.Laka, TB.Rownina, TB.Wzgorza, TB.Gory, TB.PlytkieMorze, TB.Morze, TB.Pustynia];
const terrainAt = (q, r) => TERRAINS[(((q * 3 + r * 5) % 7) + 7) % 7];
const disk = (cq, cr, rad) => {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++)
    for (let dr = -rad; dr <= rad; dr++) {
      const d = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
      if (d <= rad) out.push([cq + dq, cr + dr]);
    }
  return out;
};
const HOLES = new Set(['1,0', '-2,1', '3,-1', '0,-4']);
const MAPS = {
  // pelny dysk promienia 4 wokol (0,0)
  full: disk(0, 0, 4),
  // dysk z dziurami + dysk promienia 3 wokol (2,-1) (nachodzace okolice dwoch miast)
  holes: [...disk(0, 0, 4).filter(([q, r]) => !HOLES.has(`${q},${r}`)), ...disk(2, -1, 3)],
};

const buildMap = (cells) => {
  const hexes = {};
  for (const [q, r] of cells) {
    hexes[`${q},${r}`] = {
      coords: { q, r },
      terenBazowy: terrainAt(q, r),
      nakladka: NK.Brak,
      ulepszenie: undefined,
    };
  }
  return { szerokoscQ: 40, wysokoscR: 40, hexes };
};
const MAPOBJ = { full: buildMap(MAPS.full), holes: buildMap(MAPS.holes) };
const MAP_CELLS = { full: MAPS.full.map(([q, r]) => [q, r, terrainAt(q, r)]), holes: MAPS.holes.map(([q, r]) => [q, r, terrainAt(q, r)]) };
// Map.set semantyka: ostatni zapis wygrywa (zgodnie z buildMap); lista unikalnych heksow:
const uniqueCells = (name) => {
  const seen = new Map();
  for (const [q, r, t] of MAP_CELLS[name]) seen.set(`${q},${r}`, [q, r, t]);
  return [...seen.values()];
};
const CELLS = { full: uniqueCells('full'), holes: uniqueCells('holes') };

// ---- sekcja 1: skalary ----------------------------------------------------------------------
const POPS = [-3, -1, -0.5, -0, 0, 0.5, 0.9, 1, 2.7, 4, 4.999, 5, 5.5, 10, 14.9, 15, 15.5, 16, 100, NaN, Infinity, -Infinity];
const cityRange = POPS.map((p) => ({ pop: enc(p), out: enc(O.cityRangeForPopulation(p)) }));
const surroundingCap = POPS.map((p) => ({ pop: enc(p), out: enc(O.surroundingWorkerCap(p)) }));

const YV = [undefined, 0, 2.5, -1, NaN];
const WAGI_VARIANTS = [undefined, {}, { zywnosc: 10, praca: 0, handel: 0 }, { zywnosc: NaN, praca: 2 }];
const POT = [0, 1.5, NaN, -2];
const scoreRows = [];
const assignRows = [];
for (const zz of YV)
  for (const pp of YV)
    for (const hh of YV) {
      const y = { zywnosc: zz, praca: pp, handel: hh };
      WAGI_VARIANTS.forEach((w, wi) => {
        const yEnc = { zywnosc: enc(zz), praca: enc(pp), handel: enc(hh) };
        const wEnc = w === undefined ? null : { zywnosc: enc(w.zywnosc ?? undefined), praca: enc(w.praca ?? undefined), handel: enc(w.handel ?? undefined) };
        scoreRows.push({ y: yEnc, wagi: wEnc, wi, score: enc(O.tileScore(y, w)) });
        for (const pot of POT)
          assignRows.push({ y: yEnc, wagi: wEnc, wi, pot: enc(pot), out: enc(O.tileAssignScore(y, w, pot)) });
      });
    }
const FOCI = ['zrownowazone', 'zywnosc', 'produkcja', 'podatki'];
const wagiFocus = [...FOCI, null].map((f) => ({ focus: f, out: O.wagiForFocus(f ?? undefined) }));

// ---- sekcja 2: geometria okolicy ------------------------------------------------------------
const CENTERS = [[0, 0], [2, -1], [-5, 5]];
const RADII = [0, -2, 0.5, 1, 2, 2.5, 3, 3.99, 4, 5, NaN, Infinity];
const keysRows = [];
const tilesRows = [];
for (const mname of ['full', 'holes'])
  for (const [cq, cr] of CENTERS)
    for (const rad of RADII) {
      keysRows.push({ map: mname, cq, cr, rad: enc(rad), out: O.hexKeysWithinRadius(cq, cr, rad, MAPOBJ[mname]) });
      tilesRows.push({
        map: mname, cq, cr, rad: enc(rad), pred: false,
        out: O.okolicaTiles(cq, cr, rad, MAPOBJ[mname]).map((t) => ({ q: t.q, r: t.r, key: t.key, dist: enc(t.dist) })),
      });
      tilesRows.push({
        map: mname, cq, cr, rad: enc(rad), pred: true,
        out: O.okolicaTiles(cq, cr, rad, MAPOBJ[mname], (q, r) => O.isLandWorkableHex(MAPOBJ[mname], q, r))
          .map((t) => ({ q: t.q, r: t.r, key: t.key, dist: enc(t.dist) })),
      });
    }
// Brzegi N-1/N/N+1 dla miasta o populacji N (N = 5 = zasieg bazowy, N=6 -> zasieg 6):
const EDGE = [];
for (const mname of ['full', 'holes'])
  for (const N of [5, 6]) {
    for (const d of [N - 1, N, N + 1]) {
      EDGE.push({ map: mname, cq: 2, cr: -1, rad: d, out: O.hexKeysWithinRadius(2, -1, d, MAPOBJ[mname]) });
    }
  }

// ---- sekcja 3: porzadek kluczy (localeCompare vs porzadek bajtowy) --------------------------
const LKEYS = [];
for (const q of [-11, -10, -1, 0, 1, 2, 9, 10]) for (const r of [-10, -2, -1, 0, 1, 9, 10]) LKEYS.push(`${q},${r}`);
const locale = [];
for (const a of LKEYS) for (const b of LKEYS) {
  const c = a.localeCompare(b);
  locale.push([a, b, Math.sign(c)]);
}

// ---- sekcja 4: plony (tabela z prawdziwego yieldOfMapHex) ------------------------------------
const yieldTable = {};
for (const mname of ['full', 'holes'])
  for (const [q, r] of MAPS[mname]) {
    const y = O.yieldOfMapHex(MAPOBJ[mname], q, r);
    yieldTable[`${mname}|${q},${r}`] = { zywnosc: enc(y.zywnosc), praca: enc(y.praca), handel: enc(y.handel) };
  }
// wariant NaN: co piaty heks ma zywnosc NaN (wejscie testowe komparatora; nie z weba)
const yieldNanTable = {};
for (const mname of ['full', 'holes'])
  for (const [q, r] of MAPS[mname]) {
    const base = yieldTable[`${mname}|${q},${r}`];
    yieldNanTable[`${mname}|${q},${r}`] = (q + 2 * r) % 5 === 0 ? { ...base, zywnosc: 'NaN' } : base;
  }
const yieldOfFrom = (tbl, mname) => (q, r) => {
  const v = tbl[`${mname}|${q},${r}`];
  if (!v) return {};
  const dec = (x) => (x === null || x === undefined ? undefined : x === 'NaN' ? NaN : x === 'Infinity' ? Infinity : x === '-Infinity' ? -Infinity : x);
  return { zywnosc: dec(v.zywnosc), praca: dec(v.praca), handel: dec(v.handel) };
};

// ---- sekcja 5: automat (resolveWorkedTiles tryb auto) ---------------------------------------
const autoRows = [];
for (const mname of ['full', 'holes'])
  for (const [cq, cr] of [[0, 0], [2, -1]])
    for (const pop of [0, 1, 2, 3, 4.7, 5, 7, 12, -1, NaN])
      for (const focus of FOCI)
        for (const [tname, tbl] of [['web', yieldTable], ['nan', yieldNanTable]]) {
          const city = { q: cq, r: cr, population: pop, okolicaFocus: focus, okolicaTryb: 'auto', ownerId: 1 };
          const out = O.resolveWorkedTiles(city, MAPOBJ[mname], yieldOfFrom(tbl, mname), {});
          autoRows.push({
            map: mname, cq, cr, pop: enc(pop), focus, yields: tname,
            out: out.map((t) => t.key),
          });
        }

// ---- sekcja 6: rebalans trybu recznego ------------------------------------------------------
const ROB_PAIRS = [[0, 1], [1, 2], [3, 2], [4, 1], [3, 0], [2, 2], [5, 5], [1.5, 2.9], [2, -1], [2, NaN], [0, -2]];
const rebalRows = [];
for (const mname of ['full', 'holes'])
  for (const [cq, cr] of [[0, 0], [2, -1]])
    for (const [pb, pa] of ROB_PAIRS)
      for (const focus of ['zywnosc', 'produkcja'])
        for (const init of ['none', 'empty', 'three', 'illegal']) {
          const tiles = O.okolicaTiles(cq, cr, 5, MAPOBJ[mname]).map((t) => t.key);
          let reczne;
          if (init === 'none') reczne = undefined;
          else if (init === 'empty') reczne = {};
          else if (init === 'three') reczne = { [tiles[0]]: 1, [tiles[3]]: 1, [tiles[7]]: 1 };
          else reczne = { [tiles[1]]: 1, '99,99': 1, [tiles[5]]: 1 };
          const city = {
            id: `c${cq}_${cr}`, ownerId: 1, q: cq, r: cr, population: pa, okolicaFocus: focus,
            okolicaTryb: 'reczny', okolicaReczne: reczne === undefined ? undefined : { ...reczne },
          };
          O.rebalanceWorkersAfterPopulationChange(city, MAPOBJ[mname], pb, pa, undefined, undefined);
          rebalRows.push({
            map: mname, cq, cr, focus, popBefore: enc(pb), popAfter: enc(pa), init,
            initReczne: reczne === undefined ? null : Object.entries(reczne),
            yields: 'web',
            out: city.okolicaReczne === undefined ? null : Object.entries(city.okolicaReczne).map(([k, v]) => [k, enc(v)]),
          });
        }
// Tryb auto: rebalans jest no-op.
for (const pb of [1, 3]) {
  const city = { id: 'a', ownerId: 1, q: 0, r: 0, population: 5, okolicaFocus: 'zywnosc', okolicaTryb: 'auto', okolicaReczne: { '1,0': 1 } };
  O.rebalanceWorkersAfterPopulationChange(city, MAPOBJ.full, pb, 5, undefined, undefined);
  rebalRows.push({ map: 'full', cq: 0, cr: 0, focus: 'zywnosc', popBefore: enc(pb), popAfter: 5, init: 'auto', initReczne: [['1,0', 1]], yields: 'web', out: Object.entries(city.okolicaReczne).map(([k, v]) => [k, enc(v)]) });
}

const meta = {
  pin: PIN,
  generator: 'gen-p6-8g-okolica-vectors.mjs',
  counts: {
    cityRange: cityRange.length, surroundingCap: surroundingCap.length, score: scoreRows.length, assignScore: assignRows.length,
    wagiFocus: wagiFocus.length, keys: keysRows.length, tiles: tilesRows.length, edge: EDGE.length, locale: locale.length,
    auto: autoRows.length, rebalance: rebalRows.length,
  },
};
const doc = {
  meta,
  maps: Object.fromEntries(Object.entries(CELLS).map(([k, v]) => [k, v])),
  yieldTable,
  yieldNanTable,
  cityRange,
  surroundingCap,
  score: scoreRows,
  assignScore: assignRows,
  wagiFocus,
  keys: keysRows,
  tiles: tilesRows,
  edge: EDGE,
  locale,
  auto: autoRows,
  rebalance: rebalRows,
};
writeFileSync(join(outDir, 'okolica.json'), JSON.stringify(doc) + '\n');
console.log(JSON.stringify(meta.counts));
