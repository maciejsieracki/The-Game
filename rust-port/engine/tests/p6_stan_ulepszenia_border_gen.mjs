// R-RUSTPORT-P6-STAN-ULEPSZENIA-Q1 (obrona r3, zarzut 3): generator wektorow WSPOLNEJ GRANICY Z FORTAMI na PlayableState.
// WYKONUJE kod z pinu (nie transkrypcja reki) w node: wyciete funkcje weba (pin 07d2fbd72, tylko odczyt):
//   * game/fort-territory.ts -> fortNodeAsCityNode, fortTerritoryNodes (wezly terytorium fortow, `contestedUseless` pomijany,
//     `order` ustawiany tylko gdy `seq` jest liczba);
//   * map/territory.ts -> axialDistance, cityTerritoryRadius, territoryOwnerAt (rozstrzyganie: miasta > forty, forty po `order`);
//   * game/okolica.ts -> cityRangeForPopulation; game/trade-routes.ts -> isLandPassable, hexesInRadius, ownersHaveSharedLandBorder;
//   * units/setup.ts -> keyOf, hexNeighborCoords, isWaterTerrain, HEX_NEIGHBORS.
// Wejscie gry: buildAllTerritoryNodes (main.ts:5667) = miasta + fortTerritoryNodes(fortNodes).
// Bramka karaWspolnaGranica (main.ts:22876): liczba MIAST > 2 po obu stronach ORAZ ownersHaveSharedLandBorder.
// Oczekiwanie = wynik wykonania weba: `expected` (z fortami) i `expected_without` (te same miasta, bez fortow).
//
// Uzycie (WEB_ROOT = wypakowane `gra/src` i `gra/data` z pinu, poza repo; Node 22):
//   node rust-port/engine/tests/p6_stan_ulepszenia_border_gen.mjs <WEB_ROOT> <PIN_SHA> > rust-port/engine/tests/p6_stan_ulepszenia_border_vectors/shared_border.json
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

const trade = read('game', 'trade-routes.ts');
const terr = read('map', 'territory.ts');
const okol = read('game', 'okolica.ts');
const setup = read('units', 'setup.ts');
const fort = read('game', 'fort-territory.ts');

const FORT_R = pinConst(terr, 'FORT_TERRITORY_RADIUS', 5);
const OUTPOST_R = pinConst(terr, 'OUTPOST_TERRITORY_RADIUS', 3);

// Stale okolicy: miasto-params.json (zasieg_okolicy_baza / zasieg_okolicy_max), jak okolica.ts:37-40.
const miasto = JSON.parse(readFileSync(path.join(WEB_ROOT, 'gra', 'data', 'miasto-params.json'), 'utf8'));
const CITY_RANGE_MIN = miasto.zasieg_okolicy_baza.wartosc;
const CITY_RANGE_CAP = miasto.zasieg_okolicy_max.wartosc;

const hnStart = setup.findIndex(l => l.startsWith('const HEX_NEIGHBORS'));
const HEX_NEIGHBORS = setup.slice(hnStart, hnStart + 8).join('\n');

const code = [
  `const CITY_RANGE_MIN = ${CITY_RANGE_MIN}; const CITY_RANGE_CAP = ${CITY_RANGE_CAP};`,
  `const FORT_TERRITORY_RADIUS = ${FORT_R}; const OUTPOST_TERRITORY_RADIUS = ${OUTPOST_R};`,
  "const TerenBazowy = { Gory: 'gory', PlytkieMorze: 'plytkie_morze', Morze: 'morze' };",
  HEX_NEIGHBORS.replace(/ as const;/, ';'),
  extractFn(okol, 'cityRangeForPopulation'),
  extractFn(setup, 'keyOf'),
  extractFn(setup, 'hexNeighborCoords'),
  extractFn(setup, 'isWaterTerrain'),
  extractFn(terr, 'axialDistance'),
  extractFn(terr, 'cityTerritoryRadius'),
  extractFn(terr, 'territoryOwnerAt'),
  extractFn(fort, 'fortNodeAsCityNode'),
  extractFn(fort, 'fortTerritoryNodes'),
  extractFn(trade, 'isLandPassable'),
  extractFn(trade, 'hexesInRadius'),
  extractFn(trade, 'ownersHaveSharedLandBorder'),
].join('\n');
const extractedSha256 = createHash('sha256').update(code).digest('hex');
const js = stripTypeScriptTypes(code, { mode: 'strip' });
const { ownersHaveSharedLandBorder, fortTerritoryNodes } = new Function(
  js + '\nreturn { ownersHaveSharedLandBorder, fortTerritoryNodes };',
)();

// Deterministyczny LCG.
let seed = 20261113;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// Mapa: 'W' = morze, 'F' = las (przechodni), 'P' = rownina (przechodni).
const TERRAIN = { W: 'morze', F: 'las', P: 'rownina' };

// Zgodnie z buildAllTerritoryNodes: miasta (q,r,pop,level,ownerId) + fortTerritoryNodes(forty w stanie WEBA).
function territoryNodesOf(cities, forts) {
  const cityNodes = cities.map(c => ({ q: c.x, r: c.y, pop: c.pop, level: 1, ownerId: c.owner }));
  const fortNodes = forts.map(f => ({
    q: f.q,
    r: f.r,
    ownerId: f.owner,
    type: f.kind,
    ...(f.contested_useless !== undefined ? { contestedUseless: f.contested_useless } : {}),
    ...(f.built_at_turn !== undefined ? { builtAtTurn: f.built_at_turn } : {}),
    ...(f.seq !== undefined ? { seq: f.seq } : {}),
  }));
  return cityNodes.concat(fortTerritoryNodes(fortNodes));
}

// Bramka karaWspolnaGranica (main.ts:22876) dla pary (1,2): >2 MIAST po obu stronach && granica lądowa.
function gate(cities, forts, hexes) {
  const n = owner => cities.filter(c => c.owner === owner).length;
  if (!(n(1) > 2 && n(2) > 2)) return false;
  return ownersHaveSharedLandBorder(1, 2, territoryNodesOf(cities, forts), { hexes });
}


// Generator jednego przypadku. `contest`: dwa forty roznych wlascicieli (1 i 2) w tej samej luce
// (kolejnosc budowy rozstrzyga sporne heksy); uzywane w grupie ukierunkowanej ponizej.
function makeCase(k, wideMode, contest) {
  const w = wideMode ? ri(28, 34) : ri(16, 24), h = ri(16, 24);
  const waterPct = [0, 0.12, 0.28, 0.45][k % 4];
  const hexes = {};
  const tiles = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = rnd() < waterPct ? 'W' : (rnd() < 0.2 ? 'F' : 'P');
      tiles.push(t);
      hexes[`${x},${y}`] = { terenBazowy: TERRAIN[t] };
    }
  }
  const cities = [];
  const anchors = [];
  for (const owner of [1, 2]) {
    const n = ri(2, 5);
    const bx = wideMode ? (owner === 1 ? 1 : w - 7) : ri(0, w - 8);
    const by = ri(0, h - 8);
    for (let i = 0; i < n; i++) {
      const x = bx + ri(0, 5), y = by + ri(0, 7);
      cities.push({ owner, x, y, pop: [1, 1, 2, 4, 7, 9][ri(0, 5)] });
      anchors.push({ x, y, owner });
    }
  }
  const forts = [];
  const nForts = contest ? 2 : ri(1, 6);
  for (let i = 0; i < nForts; i++) {
    // Kontestacja: fort 1 i fort 2 blisko siebie w luce; zwykle: wlasciciel losowy (3 bez miast).
    const owner = contest ? (i === 0 ? 1 : 2) : [1, 1, 2, 2, 3][ri(0, 4)];
    let q, r;
    if (contest) {
      q = ri(Math.floor(w / 2) - 2, Math.floor(w / 2) + 2);
      r = ri(Math.max(0, Math.floor(h / 2) - 3), Math.min(h - 1, Math.floor(h / 2) + 3));
    } else if (wideMode && rnd() < 0.6) {
      // Luka miedzy skupiskami (tryb B): tu forty stykaja sie z terytorium obu stron.
      q = ri(6, w - 7);
      r = ri(0, h - 1);
    } else if (rnd() < 0.5) {
      const a = anchors[ri(0, anchors.length - 1)];
      q = Math.min(w - 1, Math.max(0, a.x + ri(-6, 6)));
      r = Math.min(h - 1, Math.max(0, a.y + ri(-6, 6)));
    } else {
      q = ri(0, w - 1);
      r = ri(0, h - 1);
    }
    const fortRec = {
      q,
      r,
      owner,
      kind: rnd() < 0.6 ? 'fort' : 'posterunek',
      built_at_turn: ri(1, 60),
    };
    if (!contest) {
      const u = rnd();
      if (u < 0.2) fortRec.contested_useless = true;
      else if (u < 0.27) fortRec.contested_useless = false;
    }
    // Kolejnosc budowy (seq) jest w ~85% fortow; reszta bez seq (pin: typeof seq !== 'number' => brak order).
    if (contest || rnd() < 0.85) fortRec.seq = 100 * k + i + 1;
    forts.push(fortRec);
  }
  const expected = gate(cities, forts, hexes);
  const expectedWithout = gate(cities, [], hexes);
  // Diagnostyka: czy kolejnosc (order) zmienia wynik pary (bez order wynik inny).
  const noOrder = forts.map(f => ({ ...f, seq: undefined, built_at_turn: undefined }));
  const orderDecides = gate(cities, noOrder, hexes) !== expected;
  return {
    orderDecides,
    c: { w, h, tiles: tiles.join(''), cities, forts, expected, expected_without: expectedWithout, order_decides: orderDecides },
  };
}

const cases = [];
let orderMatters = 0;
for (let k = 0; k < 120; k++) {
  // Tryb A (k%3==0): wspolne kwadraty 8x8 (granica zwykle istnieje bez fortow).
  // Tryb B: dwa skupiska na przeciwleglych krawedziach szerokiej mapy; forty w luce decyduja o granicy.
  const { orderDecides, c } = makeCase(k, k % 3 !== 0, false);
  if (orderDecides) orderMatters++;
  cases.push(c);
}
// Grupa ukierunkowana: kontestacja fortow roznych wlascicieli; zachowujemy przypadki, w ktorych kolejnosc
// budowy (order) zmienia wynik pary. Bez tej grupy losowe przypadki nie dotykaja tej galezi.
let orderTargeted = 0;
for (let k = 1000; orderTargeted < 16 && k < 20000; k++) {
  const { orderDecides, c } = makeCase(k, true, true);
  if (orderDecides) {
    orderTargeted++;
    cases.push(c);
  }
}
if (orderTargeted < 16) throw new Error(`grupa kolejnosci: ${orderTargeted}/16`);

const trues = cases.filter(c => c.expected).length;
const withFortChanged = cases.filter(c => c.expected !== c.expected_without).length;
const withFortTrue = cases.filter(c => c.expected && !c.expected_without).length;
process.stderr.write(
  `przypadki=${cases.length} true=${trues} zmiana_przez_forty=${withFortChanged} `
  + `prawda_dzieki_fortom=${withFortTrue} kolejnosc_rozstrzyga_losowe=${orderMatters} kolejnosc_ukierunkowane=${orderTargeted}\n`,
);
if (cases.length < 60) throw new Error('za malo przypadkow');
if (trues < 10 || cases.length - trues < 10) throw new Error(`niezbalansowane: ${trues}/${cases.length} true`);
if (withFortChanged < 10) throw new Error(`za malo przypadkow z wplywem fortu: ${withFortChanged}`);
if (withFortTrue < 3) throw new Error(`za malo par dzieki fortom: ${withFortTrue}`);
process.stdout.write(JSON.stringify({
  pin: PIN,
  source: 'ownersHaveSharedLandBorder trade-routes.ts:264 + territoryOwnerAt territory.ts + fortTerritoryNodes fort-territory.ts; gate main.ts:22876',
  extracted_sha256: extractedSha256,
  cases,
}, null, 1) + '\n');
