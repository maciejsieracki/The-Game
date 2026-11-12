// R-RUSTPORT-P6-STAN-ULEPSZENIA-Q1: generator wektorow STANU (PlayableState) dla skladnika `ulepszenia`.
// Procedura jak tests/p6_power_improvements_gen.mjs: wyciete funkcje weba wykonane w node z pinu 07d2fbd72.
// Przypadki: prostokatna mapa 16x16 (jak PlayableMap), miasta, forty, warstwy ulepszen, heksy offMap.
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

// --- Przypadki stanu (P6-STAN-ULEPSZENIA): countImprovementsForOwner na prostokatnej mapie 16x16.
// PlayableMap ma kafelek na kazdej pozycji width*height, wiec w tych przypadkach kazdy heks prostokata
// istnieje i w webie, i w stanie (bez dziur). Heksy poza prostokatem (offMap) trafiaja tylko do stanu:
// web ich nie zna (brak wpisu w hexes), wiec ich wklad musi wynosic 0.
// Miasta i forty: wspolrzedne w prostokacie; pop calkowite (u32 w stanie).
const SW = 16;
const SH = 16;
const STATE_POPS = [0, 1, 2, 5, 8, 9, 12, 15, 17, 20];
const STATE_OWNERS = [1, 2];

const stateCases = [];
for (let i = 0; i < 160; i++) {
  const hexes = {};
  const layers = [];
  for (let q = 0; q < SW; q++) {
    for (let r = 0; r < SH; r++) {
      const hex = randomHex();
      hexes[`${q},${r}`] = hex;
      if (Object.keys(hex).length > 0) layers.push({ x: q, y: r, ...hex });
    }
  }
  const offMap = [];
  const nOff = Math.floor(rnd() * 3);
  for (let k = 0; k < nOff; k++) {
    // Pozycje stanu sa u16 (bez ujemnych): heks poza prostokatem = za prawa/dolna krawedzia.
    const beyondX = rnd() < 0.5;
    const q = beyondX ? SW + Math.floor(rnd() * 3) : Math.floor(rnd() * SW);
    const r = beyondX ? Math.floor(rnd() * SH) : SH + Math.floor(rnd() * 3);
    offMap.push({ x: q, y: r, ...randomHex(), ulepszenie: pick(keyPool) });
  }
  const cities = Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => ({
    q: Math.floor(rnd() * SW),
    r: Math.floor(rnd() * SH),
    pop: pick(STATE_POPS),
    owner: pick(STATE_OWNERS),
  }));
  const forts = Array.from({ length: Math.floor(rnd() * 4) }, () => {
    const f = {
      q: Math.floor(rnd() * SW),
      r: Math.floor(rnd() * SH),
      owner: pick(STATE_OWNERS),
      kind: pick(['fort', 'posterunek']),
    };
    if (rnd() < 0.2) f.contested_useless = true;
    return f;
  });
  const owner = pick(STATE_OWNERS);
  stateCases.push({
    owner,
    w: SW,
    h: SH,
    layers,
    off_map: offMap,
    cities,
    forts,
    expect: expectStateOwner(hexes, cities, forts, owner),
  });
}

// Przypadki brzegowe: pusta mapa warstw, brak miast, miasto w rogu z fortem obcego wlasciciela.
const edgeLayers = [{ x: 0, y: 0, ulepszenia: ['tarasy', 'tarasy'] }, { x: 15, y: 15, ulepszenie: 'farma' }];
const edgeHexes = {};
for (let q = 0; q < SW; q++) for (let r = 0; r < SH; r++) edgeHexes[`${q},${r}`] = {};
for (const l of edgeLayers) edgeHexes[`${l.x},${l.y}`] = { ulepszenie: l.ulepszenie, ulepszenia: l.ulepszenia };
const edgeDefs = [
  { owner: 1, cities: [], forts: [], layers: [] },
  { owner: 1, cities: [{ q: 0, r: 0, pop: 5, owner: 1 }], forts: [], layers: edgeLayers },
  { owner: 1, cities: [{ q: 0, r: 0, pop: 5, owner: 1 }], forts: [{ q: 15, r: 15, owner: 2, kind: 'fort' }], layers: edgeLayers },
  { owner: 2, cities: [{ q: 15, r: 15, pop: 20, owner: 2 }], forts: [{ q: 15, r: 15, owner: 2, kind: 'posterunek', contested_useless: true }], layers: edgeLayers },
];
for (const e of edgeDefs) {
  stateCases.push({
    owner: e.owner,
    w: SW,
    h: SH,
    layers: e.layers,
    off_map: [],
    cities: e.cities,
    forts: e.forts,
    expect: expectStateOwner(edgeHexes, e.cities, e.forts, e.owner),
  });
}

function expectStateOwner(hexes, cities, forts, owner) {
  const web = makeWeb({ hexes });
  const cityNodes = cities
    .filter(c => c.owner === owner)
    .map(c => ({ q: c.q, r: c.r, pop: c.pop, level: 1 }));
  const fortNodes = forts.map(f => ({
    q: f.q,
    r: f.r,
    ownerId: f.owner,
    type: f.kind,
    contestedUseless: f.contested_useless === true,
  }));
  const nodes = web.foundingNodesForOwner(owner, cityNodes, fortNodes);
  return nodes.length === 0 ? 0 : web.countImprovementsForNodes(nodes);
}

const out = {
  pin: PIN,
  extracted_sha256: extractedSha256,
  sources_sha256: sourcesSha256,
  total_cases: stateCases.length,
  state: stateCases,
};

process.stdout.write(JSON.stringify(out, null, 1) + '\n');
