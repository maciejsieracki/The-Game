// P6-WIRE-WAR-POP (W8 r6 klocek 2): generator wektorow wspolnej granicy z WEBA (pin 07d2fbd72).
// WYKONUJE kod z pinu (nie transkrypcja reki): ownersHaveSharedLandBorder (game/trade-routes.ts:264) wraz z
// hexesInRadius/isLandPassable, territoryOwnerAt/cityTerritoryRadius/axialDistance (map/territory.ts),
// cityRangeForPopulation (game/okolica.ts:46), hexNeighborCoords/keyOf/isWaterTerrain (units/setup.ts).
// Wejscia (miasta z populacja, teren) sa danymi wektora; oczekiwanie = wynik wykonania weba.
// Uzycie (WEB_ROOT = wypakowane `gra/src` i `gra/data` z pinu, poza repo; Node 22):
//   node rust-port/engine/tests/p6_wire_war_pop_vectors/p6_wire_war_pop_gen.mjs <WEB_ROOT> <PIN_SHA> > rust-port/engine/tests/p6_wire_war_pop_vectors/shared_border.json
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT, PIN] = process.argv.slice(2);
if (!WEB_ROOT || !PIN) throw new Error('uzycie: gen.mjs <WEB_ROOT> <PIN_SHA>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const read = (...p) => readFileSync(path.join(SRC, ...p), 'utf8').split('\n');

function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const hits = lines.map((l, i) => (re.test(l) ? i : -1)).filter(i => i >= 0);
  if (hits.length !== 1) throw new Error(`funkcja ${name}: ${hits.length} deklaracji`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

const trade = read('game', 'trade-routes.ts');
const terr = read('map', 'territory.ts');
const okol = read('game', 'okolica.ts');
const setup = read('units', 'setup.ts');

// Stale okolicy: miasto-params.json (zasieg_okolicy_baza / zasieg_okolicy_max), jak okolica.ts:37-40.
const miasto = JSON.parse(readFileSync(path.join(WEB_ROOT, 'gra', 'data', 'miasto-params.json'), 'utf8'));
const CITY_RANGE_MIN = miasto.zasieg_okolicy_baza.wartosc;
const CITY_RANGE_CAP = miasto.zasieg_okolicy_max.wartosc;

const hnStart = setup.findIndex(l => l.startsWith('const HEX_NEIGHBORS'));
const HEX_NEIGHBORS = setup.slice(hnStart, hnStart + 8).join('\n');

const code = [
  `const CITY_RANGE_MIN = ${CITY_RANGE_MIN}; const CITY_RANGE_CAP = ${CITY_RANGE_CAP};`,
  'const FORT_TERRITORY_RADIUS = 5; const OUTPOST_TERRITORY_RADIUS = 3;',
  "const TerenBazowy = { Gory: 'gory', PlytkieMorze: 'plytkie_morze', Morze: 'morze' };",
  HEX_NEIGHBORS.replace(/ as const;/, ';'),
  extractFn(okol, 'cityRangeForPopulation'),
  extractFn(setup, 'keyOf'),
  extractFn(setup, 'hexNeighborCoords'),
  extractFn(setup, 'isWaterTerrain'),
  extractFn(terr, 'axialDistance'),
  extractFn(terr, 'cityTerritoryRadius'),
  extractFn(terr, 'territoryOwnerAt'),
  extractFn(trade, 'isLandPassable'),
  extractFn(trade, 'hexesInRadius'),
  extractFn(trade, 'ownersHaveSharedLandBorder'),
].join('\n');
const js = stripTypeScriptTypes(code, { mode: 'strip' });
const { ownersHaveSharedLandBorder } = new Function(js + '\nreturn { ownersHaveSharedLandBorder };')();

// Deterministyczny LCG.
let seed = 20261112;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

const cases = [];
for (let k = 0; k < 60; k++) {
  const w = ri(30, 44), h = ri(30, 44);
  const waterPct = [0, 0.1, 0.3, 0.55][k % 4];
  const hexes = {};
  const tiles = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const water = rnd() < waterPct;
      tiles.push(water ? 'W' : (rnd() < 0.15 ? 'H' : 'P'));
      hexes[`${x},${y}`] = { terenBazowy: water ? 'morze' : 'rownina' };
    }
  }
  const cities = [];
  for (const owner of [1, 2]) {
    // Kazdy wlasciciel w osobnym kwadracie 8x8 (rozne polozenia => zarowno granice, jak i odleglosci).
    const bx = ri(0, w - 8), by = ri(0, h - 8);
    const n = ri(3, 4);
    for (let i = 0; i < n; i++) {
      cities.push({ owner, x: bx + ri(0, 7), y: by + ri(0, 7), pop: [1, 1, 2, 4, 7, 9][ri(0, 5)] });
    }
  }
  const nodes = cities.map(c => ({ q: c.x, r: c.y, pop: c.pop, level: 1, ownerId: c.owner }));
  const expected = ownersHaveSharedLandBorder(1, 2, nodes, { hexes });
  const expectedRev = ownersHaveSharedLandBorder(2, 1, nodes, { hexes });
  cases.push({ w, h, tiles: tiles.join(''), cities, expected, expectedRev });
}
const trues = cases.filter(c => c.expected).length;
if (trues < 8 || trues > 52) throw new Error(`niezbalansowane wektory: ${trues}/60 true`);
process.stdout.write(JSON.stringify({ pin: PIN, source: 'ownersHaveSharedLandBorder trade-routes.ts:264', cases }, null, 1) + '\n');
