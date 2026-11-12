// R-RUSTPORT-P6-STAN-TERYTORIUM-VEC-Q1: generator wektorow skladnika `heksy_terytorium` (computeObjectivePower)
// z fortami/posterunkami na PlayableState. WYKONUJE w node wyciety kod weba z pinu 07d2fbd72 (tylko odczyt):
//   * game/okolica.ts        -> cityRangeForPopulation, hexKeysWithinRadiusRaw (wycieta po nazwie);
//                               wrapper hexKeysWithinRadius odtworzony z pinu (r = isFinite && > 0 ? floor : 0;
//                               cache zwraca te same klucze, wiec wartosc identyczna).
//   * map/territory.ts       -> axialDistance, cityTerritoryRadius (FORT_TERRITORY_RADIUS / OUTPOST_TERRITORY_RADIUS
//                               sprawdzane regexem na pinie);
//   * game/fort-territory.ts -> fortNodeAsCityNode, foundingNodesForOwner;
//   * main.ts (wewnatrz buildPowerSnapshotsForTurn / statsTerritoryNodesForOwner):
//       statsTerritoryNodesForOwner (main.ts:5657), cityNodesForOwner (main.ts:5661), countTerritoryHexesRaw (main.ts:6147).
//     countTerritoryHexes (main.ts:6135) rozni sie od Raw tylko pamiecia podreczna (ta sama wartosc; pusta lista -> 0,
//     co Raw zwraca tez, bo zbior jest pusty).
//   Wejscie gry dla skladnika: statsTerritoryNodesForOwner(ownerId) (main.ts:2768 / 2823).
//   Stan web: `cities` (q, r, population, ownerId) i `fortNodes` (FortNode z fort-territory.ts) jak w grze;
//   `map.hexes` = prostokat WxH (klucze "q,r"), heksy poza prostokatem = brak klucza.
//
// Pomiar na pinie: dla kazdego przypadku i wlasciciela 1..3 zapisujemy:
//   expected               = count(statsTerritoryNodesForOwner(owner)) z fortami stanu;
//   expected_without_forts = to samo bez fortow;
//   expected_no_order      = to samo z fortami BEZ pol builtAtTurn/seq (web: kolejnosc nie wplywa na ten skladnik).
// Kolejnosc (builtAtTurn/seq) rozstrzyga wlasciciela sporego heksa w `territoryOwnerAt` (granica, nie ten skladnik);
// przypadki z remisem builtAtTurn sprawdzaja, ze skladnik jest niezalezny od seq (zmierzone na webie, nie zalozone).
//
// Uzycie (WEB_ROOT = wypakowane `gra/src` i `gra/data` z pinu, poza repo; Node >= 22.6):
//   node rust-port/engine/tests/p6_stan_ulepszenia_territory_gen.mjs <WEB_ROOT> <PIN_SHA> > rust-port/engine/tests/p6_stan_ulepszenia_territory_vectors/vectors.json
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
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

// Stale geometrii z pinu: wartosc sprawdzana regexem na zrodle (zmiana na pinie = blad generatora).
function pinConst(lines, name, expected) {
  const m = lines.join('\n').match(new RegExp(`${name}\\s*=\\s*(\\d+)\\s*;`));
  if (!m || Number(m[1]) !== expected) throw new Error(`pin: ${name} != ${expected}`);
  return expected;
}

const terr = read('map', 'territory.ts');
const okol = read('game', 'okolica.ts');
const fort = read('game', 'fort-territory.ts');
const main = read('main.ts');

const FORT_R = pinConst(terr, 'FORT_TERRITORY_RADIUS', 5);
const OUTPOST_R = pinConst(terr, 'OUTPOST_TERRITORY_RADIUS', 3);

// Stale zasiegu miasta z pinu (miasto-params.json, jak okolica.ts:37-40).
const miasto = JSON.parse(readFileSync(path.join(WEB_ROOT, 'gra', 'data', 'miasto-params.json'), 'utf8'));
const CITY_RANGE_MIN = miasto.zasieg_okolicy_baza.wartosc;
const CITY_RANGE_CAP = miasto.zasieg_okolicy_max.wartosc;

const code = [
  `const CITY_RANGE_MIN = ${CITY_RANGE_MIN}; const CITY_RANGE_CAP = ${CITY_RANGE_CAP};`,
  `const FORT_TERRITORY_RADIUS = ${FORT_R}; const OUTPOST_TERRITORY_RADIUS = ${OUTPOST_R};`,
  extractFn(okol, 'cityRangeForPopulation'),
  extractFn(okol, 'hexKeysWithinRadiusRaw'),
  extractFn(terr, 'axialDistance'),
  extractFn(terr, 'cityTerritoryRadius'),
  extractFn(fort, 'fortNodeAsCityNode'),
  extractFn(fort, 'foundingNodesForOwner'),
  extractFn(main, 'cityNodesForOwner'),
  extractFn(main, 'statsTerritoryNodesForOwner'),
  extractFn(main, 'countTerritoryHexesRaw'),
  // Wrapper z pinu okolica.ts:66 (bez cache, ktory nie zmienia wartosci).
  'function hexKeysWithinRadius(cq, cr, rad, map) {',
  '  const r = Number.isFinite(rad) && rad > 0 ? Math.floor(rad) : 0;',
  '  return hexKeysWithinRadiusRaw(cq, cr, r, map);',
  '}',
  'function countTerritoryHexes(nodes) { return countTerritoryHexesRaw(nodes); }',
].join('\n');
const extractedSha256 = createHash('sha256').update(code).digest('hex');
const js = stripTypeScriptTypes(code, { mode: 'strip' });

// Wykonanie kodu weba dla jednego stanu: `cities`/`fortNodes`/`map` to zmienne z closure, jak w main.ts.
function webCounts(cities, fortNodes, map, owners) {
  const env = new Function(
    'cities',
    'fortNodes',
    'map',
    js + '\nreturn { statsTerritoryNodesForOwner, countTerritoryHexes };',
  )(cities, fortNodes, map);
  const out = {};
  for (const o of owners) out[String(o)] = env.countTerritoryHexes(env.statsTerritoryNodesForOwner(o));
  return out;
}

// Deterministyczny LCG.
let seed = 20261114;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

const OWNERS = [1, 2, 3];
const POPS = [0, 1, 2, 3, 5, 7, 9, 12, 15, 18];

function makeCase(k) {
  const w = ri(10, 20), h = ri(10, 20);
  const waterPct = [0, 0.1, 0.25, 0.4][k % 4];
  const tiles = [];
  const hexes = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = rnd() < waterPct ? 'W' : (rnd() < 0.2 ? 'F' : 'P');
      tiles.push(t);
      hexes[`${x},${y}`] = { terenBazowy: t === 'W' ? 'morze' : t === 'F' ? 'las' : 'rownina' };
    }
  }
  const map = { hexes };

  const cities = [];
  const taken = new Set();
  const nCities = ri(1, 7);
  for (let i = 0; i < nCities; i++) {
    const x = ri(0, w - 1), y = ri(0, h - 1);
    if (taken.has(`${x},${y}`)) continue;
    taken.add(`${x},${y}`);
    cities.push({ owner: OWNERS[ri(0, 2)], x, y, pop: POPS[ri(0, POPS.length - 1)] });
  }

  // Forty/posterunki: ~15% poza prostokatem mapy (web: brak klucza -> nie licza sie do heksow).
  const tie = k >= 160; // ostatnie 80 przypadkow: wymuszony remis builtAtTurn miedzy fortami (rozne seq).
  const nForts = ri(tie ? 2 : 0, 6);
  const tieTurn = ri(1, 40);
  const forts = [];
  for (let i = 0; i < nForts; i++) {
    const offMap = rnd() < 0.15;
    const q = offMap ? ri(-2, w + 1) : ri(0, w - 1);
    const r = offMap ? ri(-2, h + 1) : ri(0, h - 1);
    const f = {
      q,
      r,
      owner: OWNERS[ri(0, 2)],
      kind: rnd() < 0.5 ? 'fort' : 'posterunek',
    };
    const u = rnd();
    if (u < 0.2) f.contested_useless = true;
    else if (u < 0.3) f.contested_useless = false;
    if (tie) {
      f.built_at_turn = tieTurn;
    } else if (rnd() < 0.7) {
      f.built_at_turn = ri(1, 40);
    }
    if (rnd() < 0.8) f.seq = 1000 * k + i + 1;
    forts.push(f);
  }

  // Widok web: FortNode z fort-territory.ts (camelCase; brak pol, ktorych nie ma w stanie).
  const toWeb = list => list.map(f => ({
    q: f.q,
    r: f.r,
    ownerId: f.owner,
    type: f.kind,
    ...(f.contested_useless !== undefined ? { contestedUseless: f.contested_useless } : {}),
    ...(f.built_at_turn !== undefined ? { builtAtTurn: f.built_at_turn } : {}),
    ...(f.seq !== undefined ? { seq: f.seq } : {}),
  }));
  const webCities = cities.map(c => ({ q: c.x, r: c.y, population: c.pop, ownerId: c.owner }));
  const noOrder = forts.map(f => ({ ...f, built_at_turn: undefined, seq: undefined }));

  return {
    tie,
    c: {
      w,
      h,
      tiles: tiles.join(''),
      cities,
      forts,
      tie_built_at_turn: tie,
      expected: webCounts(webCities, toWeb(forts), map, OWNERS),
      expected_without_forts: webCounts(webCities, [], map, OWNERS),
      expected_no_order: webCounts(webCities, toWeb(noOrder), map, OWNERS),
    },
  };
}

const cases = [];
for (let k = 0; k < 240; k++) cases.push(makeCase(k).c);

const checks = cases.length * OWNERS.length;
const changed = cases.filter(c => OWNERS.some(o => c.expected[o] !== c.expected_without_forts[o])).length;
const tieCases = cases.filter(c => c.tie_built_at_turn).length;
const orderFree = cases.every(c => OWNERS.every(o => c.expected[o] === c.expected_no_order[o]));
const withOffMap = cases.filter(c => c.forts.some(f => f.q < 0 || f.r < 0 || f.q >= c.w || f.r >= c.h)).length;
const contestedOwn = cases.filter(c => c.forts.some(f => f.contested_useless === true)).length;
process.stderr.write(
  `przypadki=${cases.length} sprawdzenia=${checks} zmiana_przez_forty=${changed} remis_builtAtTurn=${tieCases} `
  + `forty_poza_mapa=${withOffMap} forty_contested=${contestedOwn} niezaleznosc_od_kolejnosci=${orderFree}\n`,
);
if (cases.length < 200) throw new Error(`za malo przypadkow: ${cases.length}`);
if (tieCases < 40) throw new Error(`za malo przypadkow z remisem builtAtTurn: ${tieCases}`);
if (changed < 30) throw new Error(`za malo przypadkow zmienianych przez forty: ${changed}`);
if (!orderFree) throw new Error('web: skladnik zalezy od kolejnosci - sprawdz zalozenie generatora');

process.stdout.write(JSON.stringify({
  pin: PIN,
  source: 'statsTerritoryNodesForOwner+countTerritoryHexesRaw main.ts:5657/6147; foundingNodesForOwner+fortNodeAsCityNode fort-territory.ts; cityTerritoryRadius+axialDistance map/territory.ts; cityRangeForPopulation+hexKeysWithinRadiusRaw game/okolica.ts',
  extracted_sha256: extractedSha256,
  owners: OWNERS,
  cases,
}, null, 1) + '\n');
