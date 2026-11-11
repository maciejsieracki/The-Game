// R-RUSTPORT-P6-BRAKE-INPUTS-Q1 (r2): generator wektorow WYKONUJE kod z pinu (nie transkrypcja reki).
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, tylko odczyt, poza repo):
//   * gra/src/game/power-objective.ts  -> computeObjectivePower, loadPowerCoefficients, loadBattlePowerModel,
//                                         loadMilitaryComponentKeys (modul ladowany w CJS, importy resolwowane);
//   * gra/src/game/diplomacy-peace-lock.ts, forced-war-common.ts, war-rules-multiwar.ts, diplomacy-tick-war-brake.ts,
//     diplomacy-pn-engine.ts, human-owners.ts -> prawdziwe funkcje pomocnicze (ladowane z pinu);
//   * gra/src/main.ts: wycinki funkcji po nazwie (od deklaracji do domykajacego nawiasu o tym samym wcieciu):
//     isPeaceLockedBetween, getDiploPairMeta, empireEpochForOwner, isHuman, ME, isMe, diploCrisisWarGateBlocked,
//     diploOwnerEligibleForBrake, allPowerOwnerIds, getDiplomaticContacts. Typy zdejmowane przez
//     node:module.stripTypeScriptTypes, wykonanie w `with` na Proxy. Identyfikator spoza `vars` rzuca blad
//     (brak cichych atrap). Wejscia, ktorych wycinek nie liczy (isBarbarian, countActiveWarsForOwnerExcludingBarbarians,
//     diplomaticallyDiscoveredOwnersSet, cities, aiStartHexes), sa podawane jawnie jako fakty wektora.
//
// Uzycie (WEB_ROOT = wynik `git archive <pin> gra/src gra/data | tar -x -C <katalog>`, poza repo; Node 22):
//   node rust-port/engine/tests/p6_brake_inputs_gen.mjs <WEB_ROOT> <PIN_SHA> > rust-port/engine/tests/p6_brake_inputs_vectors/vectors.json
// TS_JS (opcjonalnie) = sciezka do typescript.js (domyslnie /opt/node22/lib/node_modules/typescript/lib/typescript.js).

import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire, stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT, PIN] = process.argv.slice(2);
if (!WEB_ROOT || !PIN) throw new Error('uzycie: gen.mjs <WEB_ROOT> <PIN_SHA>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const req = createRequire(import.meta.url);
const ts = req(process.env.TS_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js');

// ---------------------------------------------------------------------------
// 1. Ladowanie modulow weba (TS -> CJS, importy wzgledne, JSON).
// ---------------------------------------------------------------------------
const modCache = new Map();
function resolveSpec(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, `${base}.ts`, path.join(base, 'index.ts')]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  throw new Error(`brak modulu ${spec} (z ${from})`);
}
function loadModule(file) {
  if (modCache.has(file)) return modCache.get(file).exports;
  const out = ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  modCache.set(file, mod);
  const r = spec => {
    if (!spec.startsWith('.')) throw new Error(`nieobslugiwany import '${spec}' w ${file}`);
    if (spec.endsWith('.json')) return JSON.parse(readFileSync(path.resolve(path.dirname(file), spec), 'utf8'));
    return loadModule(resolveSpec(file, spec));
  };
  new Function('require', 'module', 'exports', out)(r, mod, mod.exports);
  return mod.exports;
}
const P = rel => path.join(SRC, rel);
const powerObj = loadModule(P('game/power-objective.ts'));
const peaceLock = loadModule(P('game/diplomacy-peace-lock.ts'));
const forcedCommon = loadModule(P('game/forced-war-common.ts'));
const warRules = loadModule(P('game/war-rules-multiwar.ts'));
const tickBrake = loadModule(P('game/diplomacy-tick-war-brake.ts'));
const pnEngine = loadModule(P('game/diplomacy-pn-engine.ts'));
const humanOwners = loadModule(P('game/human-owners.ts'));

// ---------------------------------------------------------------------------
// 2. Wycinki main.ts (stripTypeScriptTypes + `with` na Proxy, bez cichych atrap).
// ---------------------------------------------------------------------------
function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}
const mainLines = readFileSync(P('main.ts'), 'utf8').split('\n');
const MAIN_FNS = [
  'ME', 'isMe', 'isHuman', 'empireEpochForOwner', 'getDiploPairMeta',
  'isPeaceLockedBetween', 'diploCrisisWarGateBlocked', 'diploOwnerEligibleForBrake',
  'allPowerOwnerIds', 'getDiplomaticContacts',
];
const GLOBALS = new Set(['Math', 'Number', 'Object', 'Array', 'JSON', 'Map', 'Set', 'String', 'Boolean',
  'console', 'undefined', 'NaN', 'Infinity', 'Error', 'Symbol']);
const vars = {};
const mainScope = new Proxy({}, {
  has: (_t, k) => typeof k === 'string' && !GLOBALS.has(k),
  get: (_t, k) => {
    if (k === Symbol.unscopables) return undefined;
    if (k in vars) return vars[k];
    throw new Error(`nieznany identyfikator we wycinku main.ts: ${String(k)}`);
  },
});
const mainCode = MAIN_FNS.map(n => stripTypeScriptTypes(extractFn(mainLines, n))).join('\n');
const M = new Function('S', `with (S) {\n${mainCode}\nreturn { ${MAIN_FNS.join(', ')} };\n}`)(mainScope);

// Stan zmienny (mutowany per przypadek): wszystko, co wycinki czytaja z zakresu main.ts.
const state = {
  humanIds: [0],
  me: 0,
  turn: 0,
  eras: new Map(),              // ownerId -> era (AI: ownerEraByOwner; gracz: playerStateByHuman)
  pairMeta: new Map(),          // klucz "a_b" -> { peaceUntilTurn }
  forcedLocks: new Map(),       // klucz "a_b" -> { ownerId, era }
  barbarians: new Set(),
  cityCopy: new Set(),
  eliminated: new Set(),
  warCounts: new Map(),
  multiwar: true,
  cities: [],
  aiStartHexes: [],
  discovered: [],
};
function syncVars() {
  vars.humanSeats = { humanOwnerIds: state.humanIds, activeHumanOwnerId: state.me };
  vars.HUMAN_OWNER_PRIMARY = 0;
  vars.playerStateByHuman = new Map(state.humanIds.map(id => [id, { era: state.eras.get(id) ?? 1 }]));
  vars.ownerEraByOwner = new Map([...state.eras].filter(([id]) => !state.humanIds.includes(id)));
  vars.gameStartEra = () => 1;
  vars.forcedEraPeaceUntilNextEraByPairKey = state.forcedLocks;
  vars.diplomacyPairMeta = state.pairMeta;
  vars.freshDiploPairMeta = pnEngine.freshDiploPairMeta;
  vars.diploPairKey = pnEngine.diploPairKey;
  vars.isHumanOwner = humanOwners.isHumanOwner;
  vars.isPeaceTreatyLocked = peaceLock.isPeaceTreatyLocked;
  vars.isForcedEraPeaceLocked = forcedCommon.isForcedEraPeaceLocked;
  vars.isAiAiEligibleOwner = tickBrake.isAiAiEligibleOwner;
  vars.evaluateInterCivWarGate = warRules.evaluateInterCivWarGate;
  vars.isWarRulesMultiwarEnabled = () => state.multiwar;
  vars.countActiveWarsForOwnerExcludingBarbarians = id => state.warCounts.get(id) ?? 0;
  vars.isBarbarian = id => state.barbarians.has(id);
  vars.typCityCopyOwners = state.cityCopy;
  vars.eliminatedOwners = state.eliminated;
  vars.cities = state.cities;
  vars.aiStartHexes = state.aiStartHexes;
  vars.diplomaticallyDiscoveredOwnersSet = () => new Set(state.discovered);
  vars.turn = state.turn;
  vars.ME = () => state.me;
}
syncVars();

// Konfiguracja domyslna (realny stan modulu, nie wejscie wektora).
const realMultiwarFlag = warRules.isWarRulesMultiwarEnabled();

// ---------------------------------------------------------------------------
// 3. Wektory.
// ---------------------------------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261111);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const optNum = (v, lo, hi, p) => (rnd() < p ? null : (typeof v === 'number' ? v : ri(lo, hi)));

const out = {
  pin: PIN,
  generator: 'rust-port/engine/tests/p6_brake_inputs_gen.mjs',
  realMultiwarFlag,
  coeffs: powerObj.loadPowerCoefficients(),
  battleModel: powerObj.loadBattlePowerModel(),
  military: [...powerObj.loadMilitaryComponentKeys()].sort(),
  objective: [],
  peace: [],
  gate: [],
  eligibility: [],
  contacts: [],
  players: [],
};

// 3a. computeObjectivePower (pin: power-objective.ts) - domyslne wspolczynniki z JSON weba.
const objInputKeys = ['jednostki', 'bitwyPktSum', 'sumaLudkow', 'rekrutEkw', 'miasta', 'heksyTerytorium',
  'budynki', 'techZbadane', 'ulepszeniaTerenu', 'kulturaImperium', 'miastaJednoscReligii', 'zdobyczePower'];
const objCases = [];
objCases.push({ ownerId: 0, epoka: 1, jednostki: 0, wygraneBitwy: 0, sumaLudkow: 0, rekrutEkw: 0, miasta: 0,
  heksyTerytorium: 0, budynki: 0, techZbadane: 0, ulepszeniaTerenu: 0 });
for (let i = 0; i < 60; i++) {
  const c = {
    ownerId: ri(0, 9),
    epoka: ri(1, 10),
    jednostki: ri(0, 400) / (rnd() < 0.3 ? 4 : 1),
    wygraneBitwy: 0,
    bitwyPktSum: optNum(null, 0, 900, 0.2),
    sumaLudkow: ri(0, 300),
    rekrutEkw: ri(0, 80) / (rnd() < 0.25 ? 3 : 1),
    miasta: ri(0, 25),
    heksyTerytorium: ri(0, 600),
    budynki: ri(0, 200),
    techZbadane: ri(0, 80),
    ulepszeniaTerenu: ri(0, 150),
    kulturaImperium: optNum(null, 0, 5000, 0.2),
    miastaJednoscReligii: optNum(null, 0, 25, 0.2),
    zdobyczePower: optNum(null, 0, 3000, 0.3),
  };
  if (rnd() < 0.1) c.jednostki = -ri(1, 50); // ujemne: web clamp do 0
  objCases.push(c);
}
for (const c of objCases) {
  const input = {};
  for (const k of ['ownerId', 'epoka', 'jednostki', 'wygraneBitwy', 'sumaLudkow', 'rekrutEkw', 'miasta',
    'heksyTerytorium', 'budynki', 'techZbadane', 'ulepszeniaTerenu']) input[k] = c[k];
  for (const k of objInputKeys) if (c[k] !== undefined && c[k] !== null) input[k] = c[k];
  const r = powerObj.computeObjectivePower(input);
  out.objective.push({
    input,
    power: r.power,
    powerBase: r.powerBase,
    components: r.components.map(x => ({ key: x.key, rawCount: x.rawCount, coefficient: x.coefficient,
      points: x.points, military: x.military })),
  });
}

// 3b. isPeaceLockedBetween (main.ts) - karencja traktatu + blokada wojny epoki.
const peaceCases = [];
for (let i = 0; i < 80; i++) {
  const humanIds = rnd() < 0.8 ? [0] : [0, 3];
  const ids = [0, 1, 2, 3, 4];
  const eras = new Map(ids.map(id => [id, ri(1, 10)]));
  const forced = [];
  const pairs = [[0, 1], [1, 2], [2, 3], [0, 4], [3, 4]];
  for (const [a, b] of pairs) {
    if (rnd() < 0.5) forced.push({ a, b, ownerId: pick([a, b]), era: ri(1, 10) });
  }
  const meta = [];
  for (const [a, b] of pairs) {
    if (rnd() < 0.6) meta.push({ a, b, peaceUntilTurn: rnd() < 0.15 ? null : ri(0, 120) });
  }
  const turn = ri(0, 130);
  const a = pick(ids), b = pick(ids.filter(x => x !== a));
  peaceCases.push({ a, b, turn, humanIds, eras: [...eras], forced, meta });
}
for (const c of peaceCases) {
  state.humanIds = c.humanIds;
  state.me = 0;
  state.turn = c.turn;
  state.eras = new Map(c.eras);
  state.forcedLocks = new Map();
  state.pairMeta = new Map();
  for (const f of c.forced) state.forcedLocks.set(pnEngine.diploPairKey(f.a, f.b), { ownerId: f.ownerId, era: f.era });
  for (const m of c.meta) {
    state.pairMeta.set(pnEngine.diploPairKey(m.a, m.b), { ...pnEngine.freshDiploPairMeta(),
      ...(m.peaceUntilTurn === null ? {} : { peaceUntilTurn: m.peaceUntilTurn }) });
  }
  syncVars();
  // Wektor odzwierciedla stan Map po pierwszym wywolaniu getDiploPairMeta (web tworzy wpisy lazily).
  const locked = M.isPeaceLockedBetween(c.a, c.b);
  out.peace.push({
    a: c.a, b: c.b, turn: c.turn, humanIds: c.humanIds,
    eras: c.eras, forced: c.forced,
    meta: c.meta.map(m => ({ a: m.a, b: m.b, peaceUntilTurn: m.peaceUntilTurn })),
    locked,
  });
}
// Wpisy z getDiploPairMeta: nie wplywaja na wynik (fresh meta => brak peaceUntilTurn).

// 3c. diploCrisisWarGateBlocked (main.ts) + evaluateInterCivWarGate (real).
for (let i = 0; i < 120; i++) {
  const humanIds = rnd() < 0.7 ? [0] : [0, 2];
  const eras = [0, 1, 2, 3].map(id => [id, ri(1, 10)]);
  const wars = [0, 1, 2, 3].map(id => [id, ri(0, 4)]);
  const declarer = ri(0, 3);
  let victim = ri(0, 3);
  if (victim === declarer) victim = (declarer + 1) % 4;
  const multiwar = rnd() < 0.9;
  const turn = ri(0, 90);
  state.humanIds = humanIds;
  state.me = 0;
  state.turn = turn;
  state.eras = new Map(eras);
  state.warCounts = new Map(wars);
  state.multiwar = multiwar;
  syncVars();
  const blocked = M.diploCrisisWarGateBlocked(declarer, victim);
  out.gate.push({
    declarer, victim, turn, multiwar, humanIds, eras, wars,
    isHumanVictim: humanIds.includes(victim),
    blocked,
  });
}
// 3d. diploOwnerEligibleForBrake + allPowerOwnerIds (main.ts) + isAiAiEligibleOwner (real).
for (let i = 0; i < 60; i++) {
  const me = 0;
  const cityOwners = [];
  const nCities = ri(0, 12);
  for (let k = 0; k < nCities; k++) cityOwners.push(pick([0, 1, 2, 3, 4, 5]));
  const starts = [];
  for (let k = 0; k < ri(0, 4); k++) starts.push(pick([1, 2, 3, 6, 7]));
  const barbarians = [...new Set([5].filter(() => rnd() < 0.5))];
  const cityCopy = [...new Set([6].filter(() => rnd() < 0.3))];
  const eliminated = [...new Set([4].filter(() => rnd() < 0.3))];
  state.me = me;
  state.humanIds = [0];
  state.barbarians = new Set(barbarians);
  state.cityCopy = new Set(cityCopy);
  state.eliminated = new Set(eliminated);
  state.cities = cityOwners.map((ownerId, idx) => ({ id: idx, ownerId }));
  state.aiStartHexes = starts.map(ownerId => ({ ownerId }));
  syncVars();
  const ids = M.allPowerOwnerIds();
  const eligible = ids.map(id => ({ id, eligible: M.diploOwnerEligibleForBrake(id), isMe: M.isMe(id) }));
  out.eligibility.push({
    me, cities: cityOwners, aiStartHexes: starts, barbarians, cityCopy, eliminated,
    allPowerOwnerIds: ids,
    rows: eligible,
  });
}
// 3e. getDiplomaticContacts (main.ts) -> wejscie contacts_for (Rust sortuje; porownanie jako zbior).
for (let i = 0; i < 20; i++) {
  const discovered = [...new Set(Array.from({ length: ri(0, 8) }, () => ri(0, 9)))];
  // Losowa kolejnosc wstawiania (jak Set w webie).
  for (let k = discovered.length - 1; k > 0; k--) {
    const j = ri(0, k);
    [discovered[k], discovered[j]] = [discovered[j], discovered[k]];
  }
  state.discovered = discovered;
  syncVars();
  out.contacts.push({ discovered, result: Array.from(M.getDiplomaticContacts()) });
}
// 3f. Rozdzial gracza: isHuman (web: humanSeats) vs isMe (web: ME()) - jedno zrodlo dla Rust.
for (let i = 0; i < 20; i++) {
  const humanIds = rnd() < 0.7 ? [0] : [0, 3];
  const me = pick(humanIds);
  const ownerIds = [0, 1, 2, 3, 4, 5];
  state.humanIds = humanIds;
  state.me = me;
  syncVars();
  out.players.push({
    humanIds, me, ownerIds,
    isHuman: ownerIds.map(id => M.isHuman(id)),
    isMe: ownerIds.map(id => M.isMe(id)),
  });
}

// 3g. Warianty computeObjectivePower (P6-BRAKE-VECTORS-Q1): FlatCount, nadpisane wspolczynniki,
// militaryKeys (w tym 'zdobycze' - pin: zawsze niewojskowe), polowki dla Math.round.
// Osobny generator (ziarno 20261112), aby sekcje 3a-3f pozostaly bajt-identyczne.
{
  const rv = mulberry32(20261112);
  const rvi = (lo, hi) => lo + Math.floor(rv() * (hi - lo + 1));
  const rvp = arr => arr[Math.floor(rv() * arr.length)];
  const COMPONENT_KEYS = ['armia', 'bitwy', 'ludki', 'rekruci', 'miasta', 'terytorium', 'infra', 'tech',
    'ulepszenia', 'kultura', 'religia', 'zdobycze'];
  const defaults = powerObj.loadPowerCoefficients();
  const COEFF_KEYS = Object.keys(defaults).sort();
  const variants = [];
  for (let i = 0; i < 120; i++) {
    const battle = i % 2 === 0 ? 'flat_count' : 'enemy_m_sum';
    const coeff = { ...defaults };
    if (rv() < 0.6) {
      for (const k of COEFF_KEYS) {
        if (rv() < 0.5) coeff[k] = rvp([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.7, 10, 25, 50]);
      }
    }
    const militaryKeys = COMPONENT_KEYS.filter(() => rv() < 0.4).sort();
    if (i < 6) militaryKeys.splice(0, militaryKeys.length, ...COMPONENT_KEYS); // wszystkie wojskowe
    if (i === 7) militaryKeys.length = 0; // brak skladnikow wojskowych
    const half = rv() < 0.5;
    const input = {
      ownerId: rvi(0, 9),
      epoka: rvi(1, 10),
      jednostki: half ? rvi(-3, 40) : rvi(0, 400) / 4,
      wygraneBitwy: rvi(0, 12),
      sumaLudkow: rvi(0, 300),
      rekrutEkw: half ? rvi(0, 20) : rvi(0, 80) / 4,
      miasta: rvi(0, 25),
      heksyTerytorium: rvi(0, 600),
      budynki: rvi(0, 200),
      techZbadane: rvi(0, 80),
      ulepszeniaTerenu: rvi(0, 150),
    };
    if (rv() < 0.7) input.bitwyPktSum = rvi(0, 900) / (rv() < 0.5 ? 2 : 1);
    if (rv() < 0.7) input.kulturaImperium = rvi(0, 5000);
    if (rv() < 0.7) input.miastaJednoscReligii = rvi(0, 25);
    if (rv() < 0.7) input.zdobyczePower = rvi(0, 3000) / (rv() < 0.5 ? 2 : 1);
    if (i === 1) input.zdobyczePower = 7; // zdobycze + militaryKeys zawierajacy 'zdobycze'
    const r = powerObj.computeObjectivePower(input, coeff, battle, new Set(militaryKeys));
    variants.push({
      battle, coeff, militaryKeys, input,
      power: r.power,
      powerBase: r.powerBase,
      components: r.components.map(x => ({ key: x.key, rawCount: x.rawCount, coefficient: x.coefficient,
        points: x.points, military: x.military })),
    });
  }
  out.objectiveVariants = variants;
}

process.stdout.write(JSON.stringify(out, null, 1) + '\n');
