// R-RUSTPORT-P6-POWER-ULEPSZENIA-Q1: generator wektorow skladnika `ulepszenia` (computeObjectivePower).
// WYKONUJE kod z pinu (nie transkrypcja reki): wyciete funkcje weba uruchamiane w node.
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, tylko odczyt, poza repo):
//   * gra/src/main.ts -> countImprovementsForNodes (main.ts:2654-2668, wycieta po nazwie, wykonana).
//     countImprovementsForOwner (main.ts:2643-2653) = `nodes.length === 0 ? 0 : countImprovementsForNodes(nodes)`
//     (galaz cache hudPureScope nie zmienia wartosci; w generatorze nieaktywna).
//   * gra/src/main.ts -> statsTerritoryNodesForOwner (main.ts:5657) = foundingNodesForOwner(owner,
//     cityNodesForOwner(owner), fortNodes); cityNodesForOwner (main.ts:5661) = {q, r, pop, level: 1}.
//   * gra/src/game/terrain-improvements.ts -> normalizeImprovementKey (:117), improvementKeysForHex (:358),
//     LEGACY_KEY_ALIASES (:32); IMPROVEMENTS = gra/data/terrain-improvements.json (wycieta po nazwie).
//   * gra/src/map/territory.ts -> cityTerritoryRadius (:89); FORT_TERRITORY_RADIUS = 5 i
//     OUTPOST_TERRITORY_RADIUS = 3 (sprawdzane regexem na pinie).
//   * gra/src/game/fort-territory.ts -> fortNodeAsCityNode (:124), foundingNodesForOwner (:199).
//   * gra/src/game/okolica.ts -> cityRangeForPopulation (:46), hexKeysWithinRadiusRaw (:79, wycieta).
//     CITY_RANGE_MIN/CAP = gra/data/miasto-params.json (zasieg_okolicy_baza/max; fallback 5/15 jak w pinie).
//     hexKeysWithinRadius (okolica.ts:66) bez cache = `r = isFinite && > 0 ? floor : 0` + hexKeysWithinRadiusRaw
//     (cache zwraca te same klucze, wiec wartosc identyczna).
// Wejscia (mapa, miasta, forty, ulepszenia) sa generowane deterministycznie (LCG, ziarno ustalone).
//
// Uzycie (WEB_ROOT = wynik `git archive <pin> gra/src gra/data | tar -x -C <katalog>`, poza repo; Node 22):
//   node rust-port/engine/tests/p6_power_improvements_gen.mjs <WEB_ROOT> <PIN_SHA> > rust-port/engine/tests/p6_power_improvements_vectors/vectors.json

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT, PIN] = process.argv.slice(2);
if (!WEB_ROOT || !PIN) throw new Error('uzycie: gen.mjs <WEB_ROOT> <PIN_SHA>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const DATA = path.join(WEB_ROOT, 'gra', 'data');

const sourcesSha256 = {};
const readWeb = (rel, base = SRC) => {
  const txt = readFileSync(path.join(base, rel), 'utf8');
  sourcesSha256[rel] = createHash('sha256').update(txt).digest('hex');
  return txt;
};

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const hits = lines.map((l, idx) => (re.test(l) ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`funkcja ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

// Stala obiektowa: od `const NAME ... = {` do linii `};` o tym samym wcieciu.
function extractConstObject(lines, name) {
  const re = new RegExp(`^\\s*(export )?const ${name}\\b`);
  const hits = lines.map((l, idx) => (re.test(l) ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`const ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '};') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

// Pin-wartosci stalych geometrii (zmiana na pinie = blad generatora).
function pinConst(text, name, expected) {
  const m = text.match(new RegExp(`${name}\\s*=\\s*(\\d+)\\s*;`));
  if (!m || Number(m[1]) !== expected) throw new Error(`pin: ${name} != ${expected}`);
  return expected;
}

const tiTxt = readWeb(path.join('game', 'terrain-improvements.ts'));
const terrTxt = readWeb(path.join('map', 'territory.ts'));
const fortTxt = readWeb(path.join('game', 'fort-territory.ts'));
const okTxt = readWeb(path.join('game', 'okolica.ts'));
const mainTxt = readWeb('main.ts');
const improvementsJsonTxt = readWeb(path.join('..', 'data', 'terrain-improvements.json'));
const miastoTxt = readWeb(path.join('..', 'data', 'miasto-params.json'));

const FORT_R = pinConst(terrTxt, 'FORT_TERRITORY_RADIUS', 5);
const OUTPOST_R = pinConst(terrTxt, 'OUTPOST_TERRITORY_RADIUS', 3);
const miasto = JSON.parse(miastoTxt);
const CITY_RANGE_MIN = miasto.zasieg_okolicy_baza?.wartosc ?? 5;
const CITY_RANGE_CAP = miasto.zasieg_okolicy_max?.wartosc ?? 15;
const IMPROVEMENTS = JSON.parse(improvementsJsonTxt);

const tiLines = tiTxt.split('\n');
const terrLines = terrTxt.split('\n');
const fortLines = fortTxt.split('\n');
const okLines = okTxt.split('\n');
const mainLines = mainTxt.split('\n');

const aliasBlock = extractConstObject(tiLines, 'LEGACY_KEY_ALIASES');
const webFnParts = [
  extractFn(tiLines, 'normalizeImprovementKey'),
  extractFn(tiLines, 'improvementKeysForHex'),
  extractFn(okLines, 'cityRangeForPopulation'),
  extractFn(terrLines, 'cityTerritoryRadius'),
  extractFn(fortLines, 'fortNodeAsCityNode'),
  extractFn(fortLines, 'foundingNodesForOwner'),
  extractFn(okLines, 'hexKeysWithinRadiusRaw'),
  extractFn(mainLines, 'countImprovementsForNodes'),
];
const extractedText = [aliasBlock, ...webFnParts].join('\n');
const extractedSha256 = createHash('sha256').update(extractedText).digest('hex');

// Fabryka: wolne zmienne weba podane jawnie (stale, IMPROVEMENTS, `map` z main.ts, cache okolicy pominiety).
const factoryTs = `
function __factory(CITY_RANGE_MIN, CITY_RANGE_CAP, IMPROVEMENTS, map) {
  const FORT_TERRITORY_RADIUS = ${FORT_R};
  const OUTPOST_TERRITORY_RADIUS = ${OUTPOST_R};
  ${aliasBlock}
  function hexKeysWithinRadius(cq: number, cr: number, rad: number, m: unknown): string[] {
    const r = Number.isFinite(rad) && rad > 0 ? Math.floor(rad) : 0;
    return hexKeysWithinRadiusRaw(cq, cr, r, m);
  }
  ${webFnParts.join('\n')}
  return { normalizeImprovementKey, improvementKeysForHex, countImprovementsForNodes, foundingNodesForOwner };
}
`;
const factoryJs = stripTypeScriptTypes(factoryTs, { mode: 'strip' });
const factory = new Function(`${factoryJs}\nreturn __factory;`)();
const makeWeb = map => factory(CITY_RANGE_MIN, CITY_RANGE_CAP, IMPROVEMENTS, map);

// Deterministyczny generator (LCG) - wejscia wektorow.
let seed = 0x0bad5eed;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pick = arr => arr[Math.floor(rnd() * arr.length)];

const aliasKeys = Object.keys(new Function(`${stripTypeScriptTypes(aliasBlock, { mode: 'strip' })}\nreturn LEGACY_KEY_ALIASES;`)());
const keyPool = Object.keys(IMPROVEMENTS).filter(k => !k.startsWith('_'));
const junk = ['xyz_nieznane', 'brak', '', 'constructor', 'toString', 'hasOwnProperty'];
const layerPool = [...keyPool, ...aliasKeys, ...junk];
const singlePool = [null, '', 'brak', ...keyPool, ...aliasKeys, 'xyz_nieznane'];

function randomHex() {
  const hex = {};
  const m = rnd();
  if (m < 0.25) {
    const v = pick(singlePool);
    hex.ulepszenie = v;
  } else if (m < 0.55) {
    const k = Math.floor(rnd() * 4);
    hex.ulepszenia = Array.from({ length: k }, () => pick(layerPool));
  } else if (m < 0.75) {
    hex.ulepszenia = rnd() < 0.5 ? null : [];
    hex.ulepszenie = pick(singlePool);
  }
  // pozostaly 25%: heks bez pol ulepszen
  return hex;
}

// --- Przypadki 1: improvementKeysForHex (web wykonany) ---
const hexCases = [];
const webEmpty = makeWeb({ hexes: {} });
for (let i = 0; i < 160; i++) {
  const hex = randomHex();
  hexCases.push({ hex, expect: webEmpty.improvementKeysForHex(hex) });
}
const edge = [
  {},
  { ulepszenie: 'brak' },
  { ulepszenia: null, ulepszenie: null },
  { ulepszenia: [], ulepszenie: 'brak' },
  { ulepszenia: ['xyz_nieznane'] },
  { ulepszenia: ['constructor', 'constructor'] },
  { ulepszenie: 'toString' },
];
for (const hex of edge) hexCases.push({ hex, expect: webEmpty.improvementKeysForHex(hex) });

// --- Przypadki 2: countImprovementsForOwner (foundingNodesForOwner + countImprovementsForNodes, web wykonany) ---
const OWNERS = [0, 1];
const FORT_TYPES = ['fort', 'posterunek'];
const POPS = [0, 1, 2, 5, 8, 9, 12, 15, 17, 20, 3.7];

function randomMap() {
  const hexes = {};
  for (let q = -9; q <= 9; q++) {
    for (let r = -9; r <= 9; r++) {
      if (rnd() < 0.12) continue; // dziury w mapie
      hexes[`${q},${r}`] = randomHex();
    }
  }
  return { hexes };
}

const randomCoord = () => Math.floor(rnd() * 15) - 7;

function expectOwner(map, cities, forts, owner) {
  const web = makeWeb(map);
  const cityNodes = cities
    .filter(c => c.ownerId === owner)
    .map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
  const nodes = web.foundingNodesForOwner(owner, cityNodes, forts);
  return nodes.length === 0 ? 0 : web.countImprovementsForNodes(nodes);
}

const ownerCases = [];
for (let i = 0; i < 80; i++) {
  const map = randomMap();
  const cities = Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => ({
    q: randomCoord(),
    r: randomCoord(),
    population: pick(POPS),
    ownerId: pick(OWNERS),
  }));
  const forts = Array.from({ length: Math.floor(rnd() * 4) }, () => {
    const f = { q: randomCoord(), r: randomCoord(), ownerId: pick(OWNERS), type: pick(FORT_TYPES) };
    if (rnd() < 0.2) f.contestedUseless = true;
    return f;
  });
  const owner = pick(OWNERS);
  ownerCases.push({
    owner,
    cities,
    forts,
    hexes: map.hexes,
    expect: expectOwner(map, cities, forts, owner),
  });
}

const out = {
  pin: PIN,
  extracted_sha256: extractedSha256,
  sources_sha256: sourcesSha256,
  total_cases: hexCases.length + ownerCases.length,
  hex: hexCases,
  owner: ownerCases,
};

process.stdout.write(JSON.stringify(out, null, 1) + '\n');
