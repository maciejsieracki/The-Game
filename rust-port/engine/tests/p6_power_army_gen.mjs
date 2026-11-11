// R-RUSTPORT-P6-POWER-ARMIA-TERYTORIUM-Q1: generator wektorow WYKONUJE kod z pinu (nie transkrypcja reki).
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, tylko odczyt, poza repo):
//   * gra/src/game/unit-power.ts  -> isSiegeUnit, rangedDamageMultFor, num, round1, loadUnitPowerCoeffs,
//                                    fieldPower, armyFieldPower (wyciete po nazwie, wykonane);
//                                    DEFAULT_COEFF, RANGED_DAMAGE_MULT (wyciete linie); import combat-params
//                                    zastapiony JSON-em z gra/data/combat-params.json;
//   * gra/src/main.ts             -> sumArmyMForOwner (armia), cityNodesForOwner, statsTerritoryNodesForOwner,
//                                    countTerritoryHexes, countTerritoryHexesRaw (terytorium) - wyciete, wykonane;
//                                    stan domkniecia (units, cities, fortNodes, map, loadPowerOpcje, unitDefFor)
//                                    jest atrapa z jawnie ustawianych zmiennych (wejscia wektorow);
//   * gra/src/game/okolica.ts     -> cityRangeForPopulation, hexKeysWithinRadius, hexKeysWithinRadiusRaw;
//                                    geomCacheKey = -1 (wymusza sciezke surowa, bez pamieci podrecznej);
//   * gra/src/map/territory.ts    -> cityTerritoryRadius, FORT/OUTPOST_TERRITORY_RADIUS;
//   * gra/src/game/fort-territory.ts -> fortNodeAsCityNode, foundingNodesForOwner;
//   * gra/data/combat-params.json, gra/data/miasto-params.json.
// Wejscia wektorow sa generowane deterministycznie (LCG z ustalonym ziarnem); oczekiwania = wynik wykonania weba.
//
// Uzycie (WEB_ROOT = wynik `git archive <pin> gra/src gra/data | tar -x -C <katalog>`, poza repo; Node 22):
//   node rust-port/engine/tests/p6_power_army_gen.mjs <WEB_ROOT> <PIN_SHA> > rust-port/engine/tests/p6_power_army_vectors/vectors.json

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT, PIN] = process.argv.slice(2);
if (!WEB_ROOT || !PIN) throw new Error('uzycie: gen.mjs <WEB_ROOT> <PIN_SHA>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const read = p => readFileSync(p, 'utf8');
const lines = p => read(p).split('\n');

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(ls, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const start = ls.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = ls[start].match(/^\s*/)[0];
  let end = start + 1;
  while (ls[end] !== indent + '}') end++;
  return ls.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}
// Pojedyncza linia deklaracji (const ...;) po wzorcu.
function extractLine(ls, re) {
  const l = ls.find(x => re.test(x));
  if (l === undefined) throw new Error(`brak linii ${re}`);
  return l.replace(/^export /, '');
}
// Deklaracja wieloliniowa (const X = {...};) zaczynajaca sie od wzorca, konczaca na '};' o tym samym wcieciu.
function extractStmt(ls, re) {
  const start = ls.findIndex(x => re.test(x));
  if (start < 0) throw new Error(`brak deklaracji ${re}`);
  if (ls[start].trimEnd().endsWith(';')) return ls[start].replace(/^export /, '');
  const indent = ls[start].match(/^\s*/)[0];
  let end = start + 1;
  while (ls[end] !== indent + '};') end++;
  return ls.slice(start, end + 1).join('\n').replace(/^export /, '');
}

const unitPower = lines(path.join(SRC, 'game', 'unit-power.ts'));
const mainTs = lines(path.join(SRC, 'main.ts'));
const okolica = lines(path.join(SRC, 'game', 'okolica.ts'));
const territoryTs = lines(path.join(SRC, 'map', 'territory.ts'));
const fortTs = lines(path.join(SRC, 'game', 'fort-territory.ts'));
const combatParamsJson = read(path.join(WEB_ROOT, 'gra', 'data', 'combat-params.json'));
const miastoParamsJson = read(path.join(WEB_ROOT, 'gra', 'data', 'miasto-params.json'));

const UNIT_POWER_FNS = ['isSiegeUnit', 'rangedDamageMultFor', 'num', 'round1', 'loadUnitPowerCoeffs', 'fieldPower', 'armyFieldPower'];
const OKOLICA_FNS = ['cityRangeForPopulation', 'hexKeysWithinRadius', 'hexKeysWithinRadiusRaw'];
const TERRITORY_FNS = ['cityTerritoryRadius'];
const FORT_FNS = ['fortNodeAsCityNode', 'foundingNodesForOwner'];
const MAIN_FNS = ['sumArmyMForOwner', 'cityNodesForOwner', 'statsTerritoryNodesForOwner', 'countTerritoryHexes', 'countTerritoryHexesRaw'];

const parts = [
  // Dane JSON zastepujace importy (import ... from '*.json').
  `const combatParams = ${combatParamsJson};`,
  `const miastoParams = ${miastoParamsJson};`,
  extractStmt(unitPower, /^const DEFAULT_COEFF\b/),
  extractStmt(unitPower, /^const RANGED_DAMAGE_MULT\b/),
  ...UNIT_POWER_FNS.map(n => extractFn(unitPower, n)),
  extractLine(okolica, /^export const CITY_RANGE_MIN\b/),
  extractLine(okolica, /^export const CITY_RANGE_CAP\b/),
  ...OKOLICA_FNS.map(n => extractFn(okolica, n)),
  extractLine(territoryTs, /^export const FORT_TERRITORY_RADIUS\b/),
  extractLine(territoryTs, /^export const OUTPOST_TERRITORY_RADIUS\b/),
  ...TERRITORY_FNS.map(n => extractFn(territoryTs, n)),
  ...FORT_FNS.map(n => extractFn(fortTs, n)),
  ...MAIN_FNS.map(n => extractFn(mainTs, n)),
];
const names = [...UNIT_POWER_FNS, ...OKOLICA_FNS, ...TERRITORY_FNS, ...FORT_FNS, ...MAIN_FNS];
const code = stripTypeScriptTypes(
  `function __mkWeb() {\n${parts.join('\n')}\n` +
  // Atrapy domkniecia (stan wejsciowy, ustawiany przez generator per przypadek).
  `let __countSettlers = true;\n` +
  `const loadPowerOpcje = () => ({ liczyOsadnikWArmii: __countSettlers });\n` +
  `let units = [];\n` +
  `const unitDefFor = u => u.def;\n` +
  `let cities = [];\n` +
  `let fortNodes = [];\n` +
  `let map = { hexes: {} };\n` +
  `const geomCacheKey = () => -1;\n` +
  `let territoryHexCountMemo = new Map();\n` +
  `let territoryHexCountMemoHexes = null;\n` +
  `const setState = (o) => {\n` +
  `  if (o.units !== undefined) units = o.units;\n` +
  `  if (o.countSettlers !== undefined) __countSettlers = o.countSettlers;\n` +
  `  if (o.cities !== undefined) cities = o.cities;\n` +
  `  if (o.fortNodes !== undefined) fortNodes = o.fortNodes;\n` +
  `  if (o.hexKeys !== undefined) map = { hexes: Object.fromEntries(o.hexKeys.map(k => [k, { k }])) };\n` +
  `  territoryHexCountMemo = new Map(); territoryHexCountMemoHexes = null;\n` +
  `};\n` +
  `return { setState, ${names.join(', ')} };\n}`,
  { mode: 'strip' },
);
const web = new Function(`${code}\nreturn __mkWeb();`)();

// Deterministyczny generator (LCG) - wejscia wektorow.
let seed = 0x5eed2027;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const NUM_FIELDS = ['meleeAttack', 'meleeDefence', 'weaponDamage', 'piercing', 'armor', 'chargeBonus', 'health', 'missileAttack'];
const ROLE = ['Oblężnicza', 'Piesza', 'Konna', 'Dystansowa', 'oblężnicza'];
const TYP = ['Slinger', 'Distance', 'Mount', 'Oszczepnik', ' Slinger ', 'Distance '];
const JEDNOSTKA = ['Procarz', 'Łucznik konny', 'Łucznik pieszy', 'Oszczepnik', 'łucznik', 'Miecznik', 'Machina'];

// Definicja jednostki (klucze jak w units.json / UnitPowerInput). Pola moga brakowac (web num() -> 0).
function randomDef() {
  const d = {};
  for (const f of NUM_FIELDS) {
    if (rnd() < 0.15) continue; // brak pola
    d[f] = pick([0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22.5, 30, -2]);
  }
  if (rnd() < 0.9) d['Rola (linia)'] = pick(ROLE);
  if (rnd() < 0.8) d.Typ = pick(TYP);
  if (rnd() < 0.8) d.Jednostka = pick(JEDNOSTKA);
  // cache fieldPower: brak / wartosc z fieldPower() / wartosc niezgodna (test galezi cache).
  const roll = rnd();
  if (roll < 0.3) {
    // brak cache
  } else if (roll < 0.7) {
    d.fieldPower = web.fieldPower(d).total;
  } else {
    d.fieldPower = pick([4, 17.5, 0, 99.25, NaN, Infinity, -Infinity]);
  }
  return d;
}

// ---- armia: sumArmyMForOwner (main.ts) + armyFieldPower (unit-power.ts) ----
const armiaCases = [];
for (let i = 0; i < 60; i++) {
  const n = between(0, 9);
  const units = Array.from({ length: n }, () => ({
    ownerId: pick([0, 1, 2]),
    category: pick(['wojsko', 'wojsko', 'osadnik']),
    def: randomDef(),
  }));
  const countSettlers = rnd() < 0.5;
  const owner = pick([0, 1, 2]);
  web.setState({ units, countSettlers });
  armiaCases.push({
    units: units.map(u => ({ ownerId: u.ownerId, category: u.category, def: u.def })),
    countSettlers,
    owner,
    expect: web.sumArmyMForOwner(owner),
  });
}

// ---- armyFieldPower pojedynczo ----
const armyFieldCases = [];
for (let i = 0; i < 80; i++) {
  const def = randomDef();
  armyFieldCases.push({ def, expect: web.armyFieldPower(def) });
}

// ---- armyFieldPower na REALNYCH rekordach units.json z pinu (bez losowania; rekord surowy jak w pliku) ----
const realUnits = JSON.parse(read(path.join(WEB_ROOT, 'gra', 'data', 'units.json')));
const armyFieldRealCases = realUnits.map(rec => ({ rec, expect: web.armyFieldPower(rec) }));

// ---- terytorium: countTerritoryHexes(statsTerritoryNodesForOwner(owner)) ----
const terrCases = [];
for (let i = 0; i < 50; i++) {
  const hexKeys = [];
  for (let q = -9; q <= 9; q++) {
    for (let r = -9; r <= 9; r++) {
      if (rnd() < 0.8) hexKeys.push(`${q},${r}`);
    }
  }
  const nCities = between(0, 6);
  const cityList = Array.from({ length: nCities }, () => ({
    q: between(-8, 8),
    r: between(-8, 8),
    population: pick([0, 1, 2, 3, 5, 7, 9, 12, 15, 20.5, -1, NaN, Infinity]),
    ownerId: pick([0, 1, 2]),
  }));
  const nForts = between(0, 4);
  const fortList = Array.from({ length: nForts }, () => ({
    q: between(-8, 8),
    r: between(-8, 8),
    ownerId: pick([0, 1, 2]),
    type: pick(['fort', 'posterunek']),
    contestedUseless: rnd() < 0.3,
  }));
  web.setState({ hexKeys, cities: cityList, fortNodes: fortList });
  const owner = pick([0, 1, 2]);
  terrCases.push({
    hexKeys,
    cities: cityList,
    forts: fortList,
    owner,
    expect: web.countTerritoryHexes(web.statsTerritoryNodesForOwner(owner)),
  });
}

const out = {
  _pin: PIN,
  _zrodla:
    'gra/src/game/unit-power.ts (armyFieldPower, fieldPower, isSiegeUnit, rangedDamageMultFor), ' +
    'gra/src/main.ts (sumArmyMForOwner, statsTerritoryNodesForOwner, countTerritoryHexes), ' +
    'gra/src/game/okolica.ts (hexKeysWithinRadius), gra/src/map/territory.ts (cityTerritoryRadius), ' +
    'gra/src/game/fort-territory.ts (foundingNodesForOwner)',
  armyField: armyFieldCases,
  armyFieldReal: armyFieldRealCases,
  armia: armiaCases,
  terytorium: terrCases,
};
// Niefinityczne liczby (NaN, +-Infinity) nie maja zapisu JSON: kodowane jako napisy, ktore testy Rust parsuja.
const nonFinite = (_k, v) => {
  if (typeof v !== 'number' || Number.isFinite(v)) return v;
  return Number.isNaN(v) ? 'NaN' : v > 0 ? 'Infinity' : '-Infinity';
};
process.stdout.write(JSON.stringify(out, nonFinite, 1) + '\n');
