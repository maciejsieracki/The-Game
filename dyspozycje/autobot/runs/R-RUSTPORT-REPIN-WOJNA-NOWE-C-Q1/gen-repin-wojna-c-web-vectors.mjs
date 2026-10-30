// Generator wektorow REPIN-WOJNA-NOWE-C (r1) z URUCHOMIONEGO kodu weba (pin 91dc998a):
//   gra/src/game/ai-move-range.ts, gra/src/game/diplomacy-tick-war-brake.ts
//   (+ zaleznosci: gra/src/units/setup.ts (keyOf, terrainMoveCost), gra/src/types/hex.ts (TerenBazowy),
//    gra/data/diplomacy-tick-params.json).
//
// Kod TS NIE jest zmieniany. Uruchamiany przez loader `hooks.mjs` (importy bez rozszerzenia, transpilacja
// .ts przez `typescript`, atrybut JSON importu). Loader lezy poza repo (katalog scratch).
//
// Uruchomienie (WEB_ROOT = katalog z gra/ po `git archive 91dc998a gra/src gra/data`, poza repo):
//   node --import <SCRATCH>/register.mjs ./gen-repin-wojna-c-web-vectors.mjs <WEB_ROOT> <OUT_DIR>
//
// Wartosci specjalne (Infinity, -Infinity, NaN, -0) zapisywane jako tekst (String(x)); reszta liczb JSON.
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, outDir] = process.argv.slice(2);
if (!webRoot || !outDir) throw new Error('uzycie: <WEB_ROOT> <OUT_DIR>');
mkdirSync(outDir, { recursive: true });

const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';
const SOURCES = [
  'gra/src/game/ai-move-range.ts',
  'gra/src/game/diplomacy-tick-war-brake.ts',
  'gra/src/units/setup.ts',
  'gra/src/types/hex.ts',
  'gra/data/diplomacy-tick-params.json',
];
const sha = (f) => createHash('sha256').update(readFileSync(join(webRoot, f))).digest('hex');
const meta = {
  pin: PIN,
  generator: 'gen-repin-wojna-c-web-vectors.mjs (r1)',
  node: process.version,
  sourceSha256: Object.fromEntries(SOURCES.map((f) => [f, sha(f)])),
};

const t = (x) => (x === null || x === undefined ? null : Object.is(x, -0) ? '-0' : String(x));
const tn = (x) => (typeof x === 'number' && !Number.isFinite(x) ? String(x) : x); // liczby JSON, wartosci specjalne jako tekst

// Deterministyczny PRNG generatora (xorshift32) - NIE jest czescia testowanego kodu.
let rs = 0x2545f491;
const rnd = () => {
  rs ^= rs << 13; rs >>>= 0;
  rs ^= rs >>> 17;
  rs ^= rs << 5; rs >>>= 0;
  return rs / 4294967296;
};
const rndInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

const url = (f) => pathToFileURL(join(webRoot, f)).href;
const range = await import(url('gra/src/game/ai-move-range.ts'));
const war = await import(url('gra/src/game/diplomacy-tick-war-brake.ts'));
const setup = await import(url('gra/src/units/setup.ts'));
const hexMod = await import(url('gra/src/types/hex.ts'));
const params = JSON.parse(readFileSync(join(webRoot, 'gra/data/diplomacy-tick-params.json'), 'utf8'));
const { TerenBazowy } = hexMod;
const { keyOf, terrainMoveCost } = setup;
const TERRAINS = Object.values(TerenBazowy);

// ======================= 1. ai-move-range.ts =======================
const COST_POOL = [0, 0.5, 1, 1.5, 2, 2.5, 3, 5, 10, Infinity, NaN, -1];
const BUDGET_POOL = [-1, 0, 0.5, 1, 1.5, 2, 3, 4.5, 7, 10, NaN, Infinity];

// Tabela kosztow: klucz = keyOf(q,r), wartosc = koszt zwracany przez costFn (pole `cost`).
const randCostMap = (cells) => {
  const hexes = {};
  for (const [q, r] of cells) {
    if (rnd() < 0.15) continue; // brak heksu w mapie
    hexes[keyOf(q, r)] = { id: keyOf(q, r), cost: pick(COST_POOL) };
  }
  return hexes;
};
const randPath = () => {
  const n = rndInt(0, 7);
  const seen = new Set();
  const path = [];
  for (let k = 0; k < n; k++) {
    const q = rndInt(-3, 3);
    const r = rndInt(-3, 3);
    if (rnd() < 0.2 && seen.has(keyOf(q, r))) continue;
    seen.add(keyOf(q, r));
    path.push({ q, r });
  }
  return path;
};

const costFnCustom = (hex) => hex.cost;

const truncateCases = [];
for (let i = 0; i < 900; i++) {
  const path = randPath();
  const hexes = randCostMap(path.map((h) => [h.q, h.r]));
  const budget = pick(BUDGET_POOL);
  const map = { hexes };
  const out = range.truncatePathWithinBudget(path, budget, map, costFnCustom);
  truncateCases.push({
    path,
    budget: t(budget),
    costs: Object.values(hexes).map((h) => [h.id, t(h.cost)]),
    out,
  });
}

// Domyslny costFn = terrainMoveCost na prawdziwych typach terenu.
const defaultCostCases = [];
for (let i = 0; i < 500; i++) {
  const path = randPath();
  const hexes = {};
  for (const h of path) {
    if (rnd() < 0.1) continue;
    hexes[keyOf(h.q, h.r)] = { terenBazowy: pick(TERRAINS) };
  }
  const budget = pick(BUDGET_POOL);
  const out = range.truncatePathWithinBudget(path, budget, { hexes });
  const costs = Object.entries(hexes).map(([k, h]) => [k, t(terrainMoveCost(h))]);
  defaultCostCases.push({ path, budget: t(budget), costs, out });
}

const farthestCases = [];
for (let i = 0; i < 900; i++) {
  const path = randPath();
  const hexes = randCostMap(path.map((h) => [h.q, h.r]));
  const budget = pick(BUDGET_POOL);
  const hasBlocked = rnd() < 0.7;
  const blockedKeys = hasBlocked
    ? path.filter(() => rnd() < 0.35).map((h) => keyOf(h.q, h.r))
    : null;
  const blockedSet = blockedKeys === null ? undefined : new Set(blockedKeys);
  const out = range.farthestStepWithinBudget(path, budget, { hexes }, costFnCustom, blockedSet);
  farthestCases.push({
    path,
    budget: t(budget),
    costs: Object.values(hexes).map((h) => [h.id, t(h.cost)]),
    blocked: blockedKeys,
    out: out ?? null,
  });
}

// Domyslny costFn, bez blokad (argument pominiety = undefined).
const farthestDefaultCases = [];
for (let i = 0; i < 300; i++) {
  const path = randPath();
  const hexes = {};
  for (const h of path) {
    if (rnd() < 0.1) continue;
    hexes[keyOf(h.q, h.r)] = { terenBazowy: pick(TERRAINS) };
  }
  const budget = pick(BUDGET_POOL);
  const out = range.farthestStepWithinBudget(path, budget, { hexes });
  const costs = Object.entries(hexes).map(([k, h]) => [k, t(terrainMoveCost(h))]);
  farthestDefaultCases.push({ path, budget: t(budget), costs, out: out ?? null });
}

const occupancyCases = [];
for (let i = 0; i < 400; i++) {
  const n = rndInt(0, 8);
  const units = Array.from({ length: n }, () => ({ q: rndInt(-2, 2), r: rndInt(-2, 2) }));
  const occ = range.buildHexOccupancy(units, keyOf);
  occupancyCases.push({
    units,
    out: [...occ.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  });
}

const claimCases = [];
for (let i = 0; i < 700; i++) {
  const cells = [];
  for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) cells.push(keyOf(q, r));
  const occMap = new Map();
  const occN = rndInt(0, 7);
  for (let k = 0; k < occN; k++) occMap.set(pick(cells), rndInt(0, 3));
  const initial = [...occMap.entries()];
  const moves = [];
  const nm = rndInt(1, 5);
  for (let k = 0; k < nm; k++) {
    const from = rnd() < 0.8 ? pick(cells) : keyOf(rndInt(-2, 2), rndInt(-2, 2));
    const to = rnd() < 0.1 ? from : pick(cells);
    moves.push([from, to]);
  }
  const results = moves.map(([f, to]) => range.claimHexForMove(occMap, f, to));
  claimCases.push({
    initial,
    moves,
    results,
    occEnd: [...occMap.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  });
}

const rangeVectors = {
  ...meta,
  truncateCases,
  defaultCostCases,
  farthestCases,
  farthestDefaultCases,
  occupancyCases,
  claimCases,
};

// ======================= 2. diplomacy-tick-war-brake.ts =======================
const flagCases = [];
for (const ov of [null, true, false]) {
  war.setDiploTickWarBrakeOverride(ov);
  flagCases.push({ override: ov, enabled: war.isDiploTickWarBrakeEnabled() });
}
war.setDiploTickWarBrakeOverride(null);

// Parametry: z pliku danych + losowe warianty (w tym brzegowe: N=0, ostrzezenie=0, luki w tabeli).
const P6_POOL = [
  { ...params.p6 },
  { kryzysProgZaufania: 0, kryzysTurDoWojny: 3, kryzysOstrzezenieTurPrzed: 0 },
  { kryzysProgZaufania: -5, kryzysTurDoWojny: 1, kryzysOstrzezenieTurPrzed: 1 },
  { kryzysProgZaufania: 10, kryzysTurDoWojny: 5, kryzysOstrzezenieTurPrzed: 5 },
  { kryzysProgZaufania: 0, kryzysTurDoWojny: 2, kryzysOstrzezenieTurPrzed: 7 },
];
const ZAUFANIE_POOL = [-10, -1, 0, 0.5, 1, 9, 10, 10.5, 60, 61, NaN, Infinity, -Infinity];
const PREV_POOL = [-3, -1, 0, 0.5, 1, 2, 3, 4, 5, 6, 9, 1e9, NaN, Infinity, -Infinity];

const advanceCases = [];
for (let i = 0; i < 900; i++) {
  const p = pick(P6_POOL);
  const prev = pick(PREV_POOL);
  const z = pick(ZAUFANIE_POOL);
  advanceCases.push({
    prev: t(prev),
    zaufanie: t(z),
    p6: p,
    out: war.advanceCrisisCounter(prev, z, p),
  });
}

const stepCases = [];
for (let i = 0; i < 500; i++) {
  const p = pick(P6_POOL);
  const prev = pick(PREV_POOL);
  const z = pick(ZAUFANIE_POOL);
  const atWar = rnd() < 0.4;
  stepCases.push({
    prev: t(prev),
    zaufanie: t(z),
    atWar,
    p6: p,
    out: war.crisisStepForPair(prev, z, atWar, p),
  });
}

const pairCases = [];
for (let i = 0; i < 200; i++) {
  const a = rndInt(-2, 9);
  const b = rnd() < 0.15 ? a : rndInt(-2, 9);
  pairCases.push({ a, b, out: war.crisisPairKey(a, b) });
}

// Dla P7 tabela kluczy: tylko calkowite epoki (klucze JSON), jak w gra/data/diplomacy-tick-params.json.
const P7_TABLES = [
  { ...params.p7.wymianaKrokPktPerEpoka },
  { '0': 50, '2': 80, '4': 320 },
  { '1': 100, '3': 0, '5': 500 },
  { '-1': 30, '1': 60 },
  { '2': -5, '3': 40 },
  { '3': 10 },
];
const P7_MULT = [2, 1, 0.5, 3];
const p7Base = () => ({ ...params.p7 });
const p7Pool = () => {
  const base = p7Base();
  if (rnd() < 0.5) return base;
  return {
    wymianaKrokPktPerEpoka: { ...pick(P7_TABLES) },
    wymianaMnoznikNaEpoke: pick(P7_MULT),
    wymianaZaufanieNaKrok: pick([0, 0.5, 1, 2]),
    wymianaMaxPerTura: pick([0, 1, 5, 100]),
    wymianaSufitZaufania: pick([0, 30, 60, 100]),
    wymianaMinTurDostaw: pick([0, 1, 2, 3]),
  };
};

const EPOKA_POOL = [-2, -1, 0, 0.5, 1, 1.9, 2, 2.5, 3, 4, 5, 6, 8, 10, NaN, Infinity, -Infinity];
const krokCases = [];
for (let i = 0; i < 700; i++) {
  const p = p7Pool();
  const epoka = pick(EPOKA_POOL);
  krokCases.push({ epoka: t(epoka), p7: p, out: t(war.krokPktWymiany(epoka, p)) });
}

const NADWYZKA_POOL = [-5, 0, 0.5, 50, 99.9, 100, 150, 199.9, 200, 399, 400, 800, 1600, NaN, Infinity, 1e7];
const KOLEJNE_POOL = [-1, 0, 1, 2, 3, 4, NaN, Infinity];
const tradeCases = [];
for (let i = 0; i < 1000; i++) {
  const p = p7Pool();
  const input = {
    nadwyzkaPn: pick(NADWYZKA_POOL),
    epoka: pick(EPOKA_POOL),
    zaufanie: pick(ZAUFANIE_POOL),
    kolejneTuryDostaw: pick(KOLEJNE_POOL),
  };
  const out = war.tradeTrustBonusPerTura(input, p);
  tradeCases.push({
    input: Object.fromEntries(Object.entries(input).map(([k, v]) => [k, t(v)])),
    p7: p,
    out: t(out),
  });
}

const CRISIS_QUEUE_COUNTERS = [0, 1, 2, 3, 3, 5, 5, 9];
const queueCases = [];
for (let i = 0; i < 500; i++) {
  const n = rndInt(0, 7);
  const entries = Array.from({ length: n }, () => {
    let a = rndInt(1, 4);
    let b = rndInt(1, 4);
    if (rnd() < 0.2) b = a;
    return { ownerA: a, ownerB: b, counter: pick(CRISIS_QUEUE_COUNTERS) };
  });
  const sorted = war.sortCrisisQueue(entries);
  queueCases.push({ entries, out: sorted.map((e) => [e.ownerA, e.ownerB, e.counter]) });
}

const crisisRawPool = () => {
  const pool = [1, 2, 0, -1, 2.7, 0.5, 9007199254740991, '3', null, true, 'x', [1], { a: 1 }];
  return pick(pool);
};
const parseCases = [];
for (let i = 0; i < 500; i++) {
  let raw;
  const shape = rnd();
  if (shape < 0.05) raw = pick([null, undefined, 'str', 7, [1, 2], true]);
  else {
    raw = {};
    const keys = ['1-2', '0-3', 'a', 'b-c', '4-5', '2-9'];
    for (const k of shuffle(keys).slice(0, rndInt(0, keys.length))) raw[k] = rnd() < 0.7 ? pick([0, 1, 2, 3, 2.7, 9, -2, 0.9]) : crisisRawPool();
  }
  const out = war.parseCrisisCounters(raw);
  parseCases.push({ raw: raw === undefined ? null : raw, out });
}

const declarerCases = [];
for (let i = 0; i < 400; i++) {
  const a = { ownerId: rndInt(1, 5), power: pick([0, 1, 2.5, 3, 3, 10, NaN]) };
  const b = { ownerId: rndInt(1, 5), power: pick([0, 1, 2.5, 3, 3, 10, NaN]) };
  const out = war.pickWarDeclarer(a, b);
  declarerCases.push({ a: { ownerId: a.ownerId, power: t(a.power) }, b: { ownerId: b.ownerId, power: t(b.power) }, out });
}

const dobraCases = [];
for (const r of [-2, -1, 0, 0.5, 1, 2, 3, 5.9, 1e9, NaN, Infinity, -Infinity]) {
  dobraCases.push({ remaining: t(r), out: war.dobraWolaTurnStep(r) });
}

const ELIG_CITY = [0, 1, 2, NaN];
const eligCases = [];
for (let i = 0; i < 300; i++) {
  const o = {
    isPlayer: rnd() < 0.2,
    isBarbarian: rnd() < 0.2,
    isCityCopy: rnd() < 0.2,
    eliminated: rnd() < 0.2,
    cityCount: pick(ELIG_CITY),
  };
  eligCases.push({ owner: { ...o, cityCount: t(o.cityCount) }, out: war.isAiAiEligibleOwner(o) });
}

const pairsCases = [];
for (let i = 0; i < 200; i++) {
  const owners = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, rndInt(0, 6));
  pairsCases.push({ owners, out: war.aiAiPairs(owners) });
}

const warVectors = {
  ...meta,
  defaultFlag: war.DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT,
  flagCases,
  advanceCases,
  stepCases,
  pairCases,
  krokCases,
  tradeCases,
  queueCases,
  parseCases,
  declarerCases,
  dobraCases,
  eligCases,
  pairsCases,
};

const dump = (name, obj) => {
  const text = JSON.stringify(obj, null, 1);
  writeFileSync(join(outDir, name), text + '\n');
  console.log(name, text.length, 'bytes');
};
dump('ai-move-range.json', rangeVectors);
dump('diplomacy-tick-war-brake.json', warVectors);
