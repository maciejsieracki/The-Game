'use strict';
/**
 * citizen-auto-assign-farm-river-test.cjs -- R-WEB-TERRAIN-IMPROVE-FARM-MISSING-ON-HEX-Q1 (DODATEK 1, c)
 * Run z gra/:  node tools/citizen-auto-assign-farm-river-test.cjs   (PROBE=1 -> szczegoly)
 *
 * Scenariusz: Laka przy rzece z Farma (wolna) vs. zwykle Laki bez ulepszen. Auto-przydzial obywateli
 * (resolveWorkedTiles / assignWorkedTiles, prawdziwy kod) MUSI wybrac heks z Farma dla kazdego profilu,
 * w ktorym Farma daje wyzszy wynik (zywnosc / zrownowazone). Brak regresji: heks bez Farmy nie wypiera Farmy.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = process.env.CAF_SRC_DIR || path.join(GRA, 'src');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'caf-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { resolveWorkedTiles, yieldOfMapHex, rebalanceWorkersAfterPopulationChange } from ${JSON.stringify(SRC + '/game/okolica')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error',
  nodePaths: [path.join(GRA, 'node_modules')],
});
const { resolveWorkedTiles, yieldOfMapHex, workedHexCoordsForCity } = require(bundle);
fs.rmSync(tmp, { recursive: true, force: true });

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) { passed++; console.log('PASS:', m); } else { failed++; console.error('FAIL:', m); } };
const K = (q, r) => `${q},${r}`;

function mkHex(q, r, over = {}) {
  return {
    coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak',
    wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    ...over,
  };
}
const CQ = 110, CR = 34;
function mkMap(over) {
  const hexes = {};
  for (let q = 100; q <= 125; q++) for (let r = 25; r <= 45; r++) hexes[K(q, r)] = mkHex(q, r);
  for (const [k, v] of Object.entries(over)) hexes[k] = { ...hexes[k], ...v };
  return { szerokoscQ: 140, wysokoscR: 60, hexes, seed: 1, riverPaths: [] };
}
const FARM_KEY = K(113, 34); // Laka + rzeka + Farma (wolna), dystans 3 od miasta
const OCC_KEY = K(111, 34);  // Laka bez ulepszen, bliżej miasta (dist 1) -- "zajety" w dawnym przydziale
const RIVER = { rzeka: { obecna: true, krawedzie: [] } };
const map = mkMap({
  [FARM_KEY]: { ...RIVER, ulepszenia: ['farma'] },
  [K(113, 35)]: { ...RIVER },
  [K(112, 34)]: { ...RIVER },
});
const TN = [{ q: CQ, r: CR, pop: 3, level: 1, ownerId: 0 }];

const yFarm = yieldOfMapHex(map, 113, 34, 1);
const yPlain = yieldOfMapHex(map, 111, 34, 1);
if (process.env.PROBE) console.log('yield farm', yFarm, 'plain', yPlain);
ok((yFarm.zywnosc ?? 0) > (yPlain.zywnosc ?? 0), `heks z Farma ma wyzsza zywnosc (${yFarm.zywnosc}) niz goly (${yPlain.zywnosc})`);

for (const focus of ['zywnosc', 'zrownowazone', 'produkcja', 'podatki']) {
  const city = { q: CQ, r: CR, population: 3, ownerId: 0, okolicaFocus: focus, okolicaTryb: 'auto', okolicaReczne: {} };
  const tiles = resolveWorkedTiles(city, map, (q, r) => yieldOfMapHex(map, q, r, 1), { territoryNodes: TN, ownerId: 0 });
  const keys = tiles.map(t => t.key);
  if (process.env.PROBE) console.log(focus, keys.join(' '));
  if (focus === 'zywnosc' || focus === 'zrownowazone') {
    ok(keys.includes(FARM_KEY), `auto/${focus}: heks Laka+rzeka+Farma (wolny) dostaje obywatela mimo dystansu 3`);
  } else {
    // profile Praca/Podatek: Farma daje glownie zywnosc -- brak przymusu; sprawdzamy tylko, ze wynik jest deterministyczny i pelny
    ok(keys.length === 3, `auto/${focus}: przydzielono 3 pola`);
  }
}

// Farma zbudowana PO przydziale: kolejne wywolanie auto MUSI ja uwzglednic (brak cache starego przydzialu)
{
  const before = mkMap({});
  const city = { q: CQ, r: CR, population: 3, ownerId: 0, okolicaFocus: 'zywnosc', okolicaTryb: 'auto', okolicaReczne: {} };
  const t0 = resolveWorkedTiles(city, before, (q, r) => yieldOfMapHex(before, q, r, 1), { territoryNodes: TN, ownerId: 0 }).map(t => t.key);
  ok(!t0.includes(FARM_KEY), 'przed budowa Farmy heks 113,34 nie jest wybrany');
  const t1 = resolveWorkedTiles(city, map, (q, r) => yieldOfMapHex(map, q, r, 1), { territoryNodes: TN, ownerId: 0 }).map(t => t.key);
  ok(t1.includes(FARM_KEY), 'po budowie Farmy ten sam auto-przydzial przenosi obywatela na Farme');
}

// SILNIK TURY (workedHexCoordsForCity, ten sam zbior co ekonomia i UI): Farma nad rzeka tez wybrana, dla kazdej epoki
for (const era of [1, 2, 3]) {
  const city = { q: CQ, r: CR, population: 3, ownerId: 0, okolicaFocus: 'zrownowazone', okolicaTryb: 'auto', okolicaReczne: {} };
  const keys = workedHexCoordsForCity(city, map, TN, undefined, era).map(h => K(h.q, h.r));
  if (process.env.PROBE) console.log('engine era', era, keys.join(' '));
  ok(keys.includes(FARM_KEY), `silnik tury (era ${era}): Farma nad rzeka wybrana przez auto-przydzial`);
}

// Tryb reczny: obywatele zostaja gdzie postawil gracz (to jedyna sciezka "nie przenosi")
{
  const city = { q: CQ, r: CR, population: 3, ownerId: 0, okolicaFocus: 'zywnosc', okolicaTryb: 'reczny', okolicaReczne: { [OCC_KEY]: 1, [K(111, 35)]: 1, [K(112, 35)]: 1 } };
  const keys = resolveWorkedTiles(city, map, (q, r) => yieldOfMapHex(map, q, r, 1), { territoryNodes: TN, ownerId: 0 }).map(t => t.key);
  ok(!keys.includes(FARM_KEY), 'tryb reczny: obywatele NIE sa przenoszeni na nowa Farme (zamierzone -- gracz steruje)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
