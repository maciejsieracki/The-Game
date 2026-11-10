// P6.5A (jednostki - zycie, czesc A) - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/game/armyMerge.ts, unit-cost-tempo.ts, unit-replace-context.ts
// Zaleznosci uruchamiane BEZ stubow: units/setup.ts (keyOf), game/auto-battle-power.ts
// (sumRosterFieldM), game/unit-power.ts, game/unit-building-bonuses.ts (armorPathBadgeLevel,
// softPathBadgeLevel), game/veteran.ts (veteranLevel, veteranStarCount).
// Wejscia deterministyczne (LCG); wyniki = to, co zwrocil prawdziwy kod weba.
// Zegar `Date.now()` (freshStackGroupId) jest WEJSCIEM: podmieniany na stala przed wywolaniem.
// Kodowanie liczb: NaN/+-Infinity/-0 -> {"$n": ...}; niecalkowite -> {"$f": "<String(x)>"}.
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./p65a-loader-register.mjs \
//     ./gen-p65a-vectors.mjs <WEB_ROOT> <OUT_DIR>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outDirArg] = process.argv;
if (!webRootArg || !outDirArg) {
  console.error('usage: <WEB_ROOT> <OUT_DIR>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const outDir = presolve(outDirArg);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

const origLog = console.log;
const origWarn = console.warn;
console.log = () => {};
console.warn = () => {};

const army = await import(src('game/armyMerge.ts'));
const costTempo = await import(src('game/unit-cost-tempo.ts'));
const replCtx = await import(src('game/unit-replace-context.ts'));
const abp = await import(src('game/auto-battle-power.ts'));
const ubb = await import(src('game/unit-building-bonuses.ts'));
const vet = await import(src('game/veteran.ts'));

// ---------------------------------------------------------------------------
// kodowanie JSON
// ---------------------------------------------------------------------------
function enc(v) {
  if (v === undefined) return undefined;
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { $n: 'NaN' };
    if (v === Infinity) return { $n: 'Infinity' };
    if (v === -Infinity) return { $n: '-Infinity' };
    if (Object.is(v, -0)) return { $n: '-0' };
    return v;
  }
  if (v instanceof Set) return [...v].map(enc);
  if (v instanceof Map) return [...v.entries()].map(([k, x]) => [enc(k), enc(x)]);
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : enc(x)));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      const e = enc(x);
      if (e !== undefined) o[k] = e;
    }
    return o;
  }
  return v;
}

let seedState = 0x65a1b2c3;
function rnd() {
  seedState = (Math.imul(seedState, 1664525) + 1013904223) >>> 0;
  return seedState / 4294967296;
}
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;
const clone = (u) => structuredClone(u);

// ---------------------------------------------------------------------------
// jednostki
// ---------------------------------------------------------------------------
const TYPES = ['Wojownik', 'Łucznik', 'Zwiadowca', 'Osadnik', 'Włócznik', 'Katapulta', 'Hoplita', 'Jazda'];
// id: kolejnosc leksykograficzna (u1 < u10 < u2), nie-ASCII i znaki spoza BMP (kolejnosc UTF-16 != UTF-8)
const ID_POOL = ['u1', 'u10', 'u2', 'a', 'b', 'Ą1', 'z', '～', '😀', 'u', ''];
const RUCHES = [1, 2, 3, 4, 5, 6, 2.5, 0.5, 1.25];
const RUCH_LEFTS = [0, 0, 1, 2, 3, 4, 0.5, 1.25, 2.5, 5, 6, -0];
const SPECIAL = [NaN, Infinity, -Infinity];
const HPS = [undefined, undefined, undefined, 0, 5, 10, 12.5, 20, 35.5, 100, -4, 1e9, NaN, Infinity, -Infinity];
const SNAPSHOTS = [undefined, undefined, undefined, 0, 1, 2, 3.5, 6];
const GROUPS = [undefined, undefined, undefined, '', 'sgA', 'sgB', 'sgA'];

function mkUnit(i, o = {}) {
  const u = {
    id: o.id ?? `u${i}`,
    ownerId: o.ownerId ?? pick([0, 0, 0, 1, 2]),
    typeId: o.typeId ?? pick(TYPES),
    category: 'piechota',
    q: o.q ?? rint(-1, 1),
    r: o.r ?? rint(-1, 1),
    ruch: o.ruch ?? (chance(0.03) ? pick(SPECIAL) : pick(RUCHES)),
    ruchLeft: o.ruchLeft ?? (chance(0.04) ? pick(SPECIAL) : pick(RUCH_LEFTS)),
  };
  const opt = (key, value) => {
    if (value !== undefined) u[key] = value;
  };
  opt('inGarnizon', o.inGarnizon !== undefined ? o.inGarnizon : pick([undefined, undefined, true, false, true]));
  opt('fortifyRuchSnapshot', o.fortifyRuchSnapshot !== undefined ? o.fortifyRuchSnapshot : pick(SNAPSHOTS));
  opt('hp', o.hp !== undefined ? o.hp : pick(HPS));
  opt('oblegaCityId', o.oblegaCityId !== undefined ? o.oblegaCityId : pick([undefined, undefined, undefined, '', 'c1', 'c2']));
  opt('sentry', o.sentry !== undefined ? o.sentry : pick([undefined, undefined, true, false]));
  opt('autoExplore', o.autoExplore !== undefined ? o.autoExplore : pick([undefined, undefined, true, false]));
  opt('ufortyfikowanyWPolu', o.ufortyfikowanyWPolu !== undefined ? o.ufortyfikowanyWPolu : pick([undefined, undefined, true, false, true]));
  opt('stackGroupId', o.stackGroupId !== undefined ? o.stackGroupId : pick(GROUPS));
  // pola czytane tylko przez zaleznosci spoza zakresu (odznaki, weteran) - patrz `dep`
  opt('pancerzBonusProc', pick([undefined, undefined, 0, 5, 15, 16, 30, 31, 45, 60, NaN, -3, 'x']));
  opt('parametryBonusProc', pick([undefined, undefined, 0, 7, 16, 17, 33, 34, 50, 80, NaN, -3]));
  opt('battlesSurvived', pick([undefined, undefined, 0, 1, 2, 3, 7, 2.7, NaN, -1]));
  return u;
}

function mkUnits(n, o = {}) {
  const list = [];
  for (let i = 0; i < n; i++) list.push(mkUnit(i, typeof o === 'function' ? o(i) : o));
  return list;
}

function mkUnitsPoolIds(n) {
  const list = mkUnits(n);
  for (const u of list) if (chance(0.5)) u.id = pick(ID_POOL);
  return list;
}

const subset = (list, p = 0.5) => list.filter(() => chance(p));
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const idxs = (units, subsetList) => subsetList.map((x) => units.indexOf(x));
const hexQ = () => rint(-2, 2);
// zapytanie o heks / wlasciciela / grupe celowane w istniejaca jednostke (czesto trafia w stos)
function targetQuery(units) {
  if (units.length && chance(0.8)) {
    const t = pick(units);
    return { q: t.q, r: t.r, ownerId: t.ownerId, groupId: pick([undefined, undefined, army.stackGroupIdOf(t), army.stackGroupIdOf(t), 'sgA', '']) };
  }
  return { q: rint(-1, 1), r: rint(-1, 1), ownerId: pick([0, 1, 2]), groupId: pick([undefined, 'sgA', 'sgB', '']) };
}
// zablokowane heksy: losowe, a czasem caly otaczajacy pierscien (brak wolnego miejsca)
function blockedAround(q, r) {
  const out = randBlocked();
  if (chance(0.25)) {
    for (const [dq, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) out.push([q + dq, r + dr]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// definicje mocy (UnitPowerInput) - wejscia, wynik liczy PRAWDZIWE sumRosterFieldM
// ---------------------------------------------------------------------------
const DEFS = {
  piechota: { meleeAttack: 5, meleeDefence: 4, weaponDamage: 3, armor: 2, health: 30, 'Rola (linia)': 'Wręcz' },
  lucznik: { meleeAttack: 2, meleeDefence: 2, missileAttack: 8, health: 20, 'Rola (linia)': 'Dystans' },
  jazda: { meleeAttack: 7, meleeDefence: 3, chargeBonus: 12, health: 40, armor: 1, 'Rola (linia)': 'Flanka' },
  obleznicza: { meleeAttack: 1, wallAttack: 30, health: 15, 'Rola (linia)': 'Oblężnicza' },
  zero: {},
  slaby: { meleeAttack: 0.04, health: 1 },
  ulamki: { meleeAttack: 3.33, meleeDefence: 2.17, weaponDamage: 1.11, armor: 0.7, health: 17, chargeBonus: 5, missileAttack: 3 },
};
const DEF_KEYS = Object.keys(DEFS);

function mkDep(unit) {
  return {
    maxHp: chance(0.06) ? pick([0, -5, NaN, Infinity]) : pick([10, 20, 35.5, 40, 100, 12.5]),
    defKey: pick(DEF_KEYS),
    attack: chance(0.05) ? NaN : pick([0, 1, 2, 3, 3, 5, 5, 7.5]),
    armor: ubb.armorPathBadgeLevel(unit),
    soft: ubb.softPathBadgeLevel(unit),
    vet: vet.veteranLevel(unit),
    stars: vet.veteranStarCount(unit),
  };
}
const depsFor = (units, dep, trace) => ({
  maxHpOf: (u) => dep[units.indexOf(u)].maxHp,
  defOf: (u) => {
    const key = dep[units.indexOf(u)].defKey;
    if (trace) trace.push([u.typeId, key]);
    return DEFS[key];
  },
});
const attackOfFor = (units, dep) => (u) => dep[units.indexOf(u)].attack;

function blockedPassable(blocked) {
  const set = new Set(blocked.map(([q, r]) => `${q},${r}`));
  return (q, r) => !set.has(`${q},${r}`);
}
const randBlocked = () => {
  const out = [];
  for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) if (chance(0.18)) out.push([q, r]);
  return out;
};

const V = {
  stack: {
    stackGroupIdOf: [], sameStackGroup: [], freshSequence: [], visibleStackOnHex: [], coLocatedForMergePrompt: [],
    adjacentVisibleArmyHexes: [], activeUnitStack: [], garrisonUnitsOnHex: [], enterGarnizon: [], exitGarnizon: [],
    enterFieldFortify: [], exitFieldFortify: [], allDefendersFortifiedInGarnizon: [], wakeStackForMoveOrder: [],
    stackRenderKey: [], countLawGarrisonOnCityHex: [], unitsOnCityHexForLaw: [], stackKey: [], fortifyChain: [],
  },
  display: {
    pickStackRepresentative: [], computeStackDisplay: [], unitAtRepresentative: [], stackHpPool: [],
    stackFieldPowerM: [], stackBadges: [], stackVitals: [],
  },
  ruch: {
    findAdjacentEmptyHexes: [], findSplitDestHexes: [], assignBounceHexesForUnits: [], findBounceHexFromOrigin: [],
    computeSeparateReturn: [], resolveSeparateReturnHex: [], stackHudMergeSplitActions: [], stackRuchLeft: [],
    planningStackRuchLeft: [], planningUnitRuchLeft: [], stackRuchMax: [], syncStackRuchLeft: [],
    deductStackRuchLeft: [], unitWithStackRuch: [], unitWithPlanningStackRuch: [],
  },
  cost: { constants: {}, applyUnitCostPace: [], buildReplaceAvailabilityCtx: [] },
};

// ===========================================================================
// stack.json
// ===========================================================================
{
  const S = V.stack;
  for (let k = 0; k < 90; k++) {
    const u = mkUnit(k, { id: pick(ID_POOL) });
    S.stackGroupIdOf.push({ unit: enc(u), out: army.stackGroupIdOf(u) });
    S.stackRenderKey.push({ unit: enc(u), out: army.stackRenderKey(u) });
    const w = mkUnit(k + 1000, { q: u.q, r: u.r, ownerId: u.ownerId, stackGroupId: chance(0.4) ? u.stackGroupId : undefined, inGarnizon: chance(0.5) ? u.inGarnizon : undefined });
    S.sameStackGroup.push({ a: enc(u), b: enc(w), out: army.sameStackGroup(u, w) });
    S.stackKey.push({ q: rint(-50, 50), r: rint(-50, 50) });
    const sk = S.stackKey[S.stackKey.length - 1];
    sk.out = army.stackKey(sk.q, sk.r);
  }
  // wartosci szczegolne: -0 i duze liczby w kluczu
  for (const [q, r] of [[0, 0], [-0, 0], [123456, -98765], [1, -1]]) {
    S.stackKey.push({ q, r, out: army.stackKey(q, r) });
  }

  // sekwencja freshStackGroupId / assignSharedStackGroupId (licznik modulu zachowuje stan)
  {
    const realNow = Date.now;
    const ops = [];
    const NOWS = [0, 1, 35, 36, 1700000000000, 1785000123456, 46655, 46656, 1];
    for (let i = 0; i < 40; i++) {
      const now = pick(NOWS);
      Date.now = () => now;
      if (chance(0.5)) {
        const owner = pick([0, 1, 2, 17, 100]);
        ops.push({ op: 'fresh', owner, now, out: army.freshStackGroupId(owner) });
      } else {
        const n = pick([0, 1, 2, 3, 5]);
        const list = mkUnits(n, { stackGroupId: pick([undefined, 'old']) });
        const before = clone(list);
        army.assignSharedStackGroupId(list);
        ops.push({ op: 'assign', now, units: enc(before), after: enc(list) });
      }
    }
    // dlugi ciag, by licznik przekroczyl 36 (cyfra dwuznakowa)
    for (let i = 0; i < 80; i++) {
      Date.now = () => 1785000000000 + i;
      const owner = i % 3;
      ops.push({ op: 'fresh', owner, now: 1785000000000 + i, out: army.freshStackGroupId(owner) });
    }
    Date.now = realNow;
    S.freshSequence.push({ ops });
  }

  const queryCases = (name, fn, extra) => {
    for (let k = 0; k < 100; k++) {
      const n = pick([0, 1, 3, 6, 10, 14]);
      const units = mkUnits(n);
      const { q, r, ownerId, groupId } = targetQuery(units);
      const out = fn(units, q, r, ownerId, groupId);
      S[name].push({ units: enc(units), q, r, ownerId, groupId, out: idxs(units, out) });
    }
    void extra;
  };
  queryCases('visibleStackOnHex', army.visibleStackOnHex);
  queryCases('coLocatedForMergePrompt', army.coLocatedForMergePrompt);
  queryCases('garrisonUnitsOnHex', army.garrisonUnitsOnHex);

  for (let k = 0; k < 100; k++) {
    const units = mkUnits(pick([0, 2, 6, 10]));
    const q = rint(-1, 1);
    const r = rint(-1, 1);
    const ownerId = pick([0, 1, 2]);
    const out = army.adjacentVisibleArmyHexes(units, q, r, ownerId);
    S.adjacentVisibleArmyHexes.push({ units: enc(units), q, r, ownerId, out: out.map((h) => ({ q: h.q, r: h.r, stack: idxs(units, h.stack) })) });
  }
  for (let k = 0; k < 100; k++) {
    const units = mkUnits(pick([1, 3, 6, 10]));
    const active = units[rint(0, units.length - 1)];
    const out = army.activeUnitStack(units, active);
    S.activeUnitStack.push({ units: enc(units), active: units.indexOf(active), out: idxs(units, out) });
  }
  for (const [name, fn, ret] of [
    ['enterGarnizon', army.enterGarnizon, false],
    ['exitGarnizon', army.exitGarnizon, true],
    ['enterFieldFortify', army.enterFieldFortify, false],
    ['exitFieldFortify', army.exitFieldFortify, true],
  ]) {
    for (let k = 0; k < 90; k++) {
      const u = mkUnit(k);
      const before = clone(u);
      const res = fn(u);
      S[name].push(ret ? { unit: enc(before), out: res, after: enc(u) } : { unit: enc(before), after: enc(u) });
    }
  }
  // lancuch wejsc/wyjsc na tej samej jednostce (w tym obie fortyfikacje naraz)
  for (let k = 0; k < 120; k++) {
    const u = mkUnit(k);
    const before = clone(u);
    const steps = [];
    const ops = { enterGarnizon: army.enterGarnizon, exitGarnizon: army.exitGarnizon, enterFieldFortify: army.enterFieldFortify, exitFieldFortify: army.exitFieldFortify };
    for (let i = 0; i < 6; i++) {
      const op = pick(Object.keys(ops));
      const res = ops[op](u);
      steps.push({ op, ret: res === undefined ? null : res, after: enc(u) });
    }
    S.fortifyChain.push({ unit: enc(before), steps });
  }
  for (let k = 0; k < 90; k++) {
    const defenders = mkUnits(pick([0, 1, 2, 4]), () => ({ inGarnizon: pick([true, true, false, undefined]) }));
    S.allDefendersFortifiedInGarnizon.push({ units: enc(defenders), out: army.allDefendersFortifiedInGarnizon(defenders) });
  }
  for (let k = 0; k < 90; k++) {
    const units = mkUnits(pick([0, 1, 3, 5]));
    const before = clone(units);
    const res = army.wakeStackForMoveOrder(units);
    S.wakeStackForMoveOrder.push({ units: enc(before), out: res, after: enc(units) });
  }
  for (let k = 0; k < 100; k++) {
    const units = mkUnits(pick([0, 3, 6, 10]));
    const { q, r, ownerId } = targetQuery(units);
    S.countLawGarrisonOnCityHex.push({ units: enc(units), q, r, ownerId, out: army.countLawGarrisonOnCityHex(units, q, r, ownerId) });
    S.unitsOnCityHexForLaw.push({ units: enc(units), q, r, ownerId, out: idxs(units, army.unitsOnCityHexForLaw(units, q, r, ownerId)) });
  }
}

// ===========================================================================
// display.json
// ===========================================================================
{
  const D = V.display;
  for (let k = 0; k < 110; k++) {
    const units = mkUnitsPoolIds(pick([1, 2, 3, 5, 8]));
    const dep = units.map(mkDep);
    const out = army.pickStackRepresentative(units, attackOfFor(units, dep));
    D.pickStackRepresentative.push({ units: enc(units), attacks: enc(dep.map((d) => d.attack)), out: units.indexOf(out) });
  }
  // pusty stos: web rzuca TypeError (reduce bez wartosci poczatkowej)
  {
    let threw = false;
    try {
      army.pickStackRepresentative([], () => 0);
    } catch {
      threw = true;
    }
    D.pickStackRepresentative.push({ units: [], attacks: [], threw });
  }
  // remisy ataku rozstrzygane po id (kolejnosc UTF-16, nie UTF-8)
  for (const ids of [['～', '😀'], ['😀', '～'], ['u10', 'u2'], ['u2', 'u10'], ['a', 'b', 'a'], ['', 'a'], ['Ą1', 'z', 'u1']]) {
    const units = ids.map((id, i) => mkUnit(i, { id, q: 0, r: 0 }));
    const out = army.pickStackRepresentative(units, () => 4);
    D.pickStackRepresentative.push({ units: enc(units), attacks: units.map(() => 4), out: units.indexOf(out) });
  }

  for (let k = 0; k < 130; k++) {
    const withDeps = chance(0.55);
    const units = withDeps ? mkUnits(pick([0, 1, 4, 7, 10])) : mkUnitsPoolIds(pick([0, 1, 4, 7, 10]));
    if (withDeps) {
      // wspolne klucze stosu, by powstawaly stosy >1
      for (const u of units) if (chance(0.5)) {
        u.q = 0;
        u.r = 0;
      }
    }
    const dep = units.map(mkDep);
    const trace = [];
    const base = depsFor(units, dep, trace);
    const vd = withDeps ? { ...base } : undefined;
    const info = army.computeStackDisplay(units, attackOfFor(units, dep), vd);
    // roster kazdego stosu (kolejnosc jak w Map weba) i wynik PRAWDZIWEGO sumRosterFieldM
    const groups = new Map();
    for (const u of units) {
      const key = army.stackRenderKey(u);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(u);
    }
    const rosterTable = withDeps
      ? [...groups.values()].map((g) => {
        const entries = g.map((u) => [u.typeId, dep[units.indexOf(u)].defKey]);
        return [entries, enc(abp.sumRosterFieldM(g.map((u) => ({ typeId: u.typeId, def: DEFS[dep[units.indexOf(u)].defKey] }))))];
      })
      : null;
    D.computeStackDisplay.push({
      units: enc(units), dep: enc(dep), withDeps, rosterTable, trace: enc(trace),
      out: {
        visibleIds: [...info.visibleIds],
        badge: [...info.badgeByRepId.entries()],
        vitals: info.vitalsByRepId ? [...info.vitalsByRepId.entries()].map(([id, v]) => [id, enc(v)]) : null,
        keys: Object.keys(info),
      },
    });
  }
  for (let k = 0; k < 110; k++) {
    const units = mkUnitsPoolIds(pick([0, 1, 3, 6]));
    const dep = units.map(mkDep);
    const { q, r } = targetQuery(units);
    const out = army.unitAtRepresentative(q, r, units, attackOfFor(units, dep));
    D.unitAtRepresentative.push({ units: enc(units), attacks: enc(dep.map((d) => d.attack)), q, r, out: out ? units.indexOf(out) : null });
  }

  for (let k = 0; k < 110; k++) {
    const units = mkUnits(pick([0, 1, 3, 6]));
    const dep = units.map(mkDep);
    const stackU = subset(units, 0.7);
    const out = army.stackHpPool(stackU, depsFor(units, dep).maxHpOf);
    D.stackHpPool.push({ units: enc(units), dep: enc(dep), stack: idxs(units, stackU), out: enc(out) });
  }
  for (let k = 0; k < 110; k++) {
    const units = mkUnits(pick([0, 1, 3, 6]));
    const dep = units.map(mkDep);
    const stackU = subset(units, 0.7);
    const trace = [];
    const d = depsFor(units, dep, trace);
    const out = army.stackFieldPowerM(stackU, d.defOf);
    const roster = trace.map(([typeId, key]) => ({ typeId, def: DEFS[key] }));
    D.stackFieldPowerM.push({
      units: enc(units), dep: enc(dep), stack: idxs(units, stackU), out: enc(out), roster: enc(trace),
      rosterSum: stackU.length === 0 ? 0 : enc(abp.sumRosterFieldM(roster)),
    });
  }
  for (let k = 0; k < 110; k++) {
    const units = mkUnits(pick([0, 1, 3, 6]));
    const dep = units.map(mkDep);
    const stackU = subset(units, 0.7);
    D.stackBadges.push({
      units: enc(units), dep: enc(dep), stack: idxs(units, stackU),
      armor: army.stackArmorBadgeLevel(stackU), soft: army.stackSoftBadgeLevel(stackU),
      vet: army.stackVeteranLevel(stackU), stars: army.stackVeteranStarCount(stackU),
    });
  }
  for (let k = 0; k < 110; k++) {
    const units = mkUnits(pick([0, 1, 3, 6]));
    const dep = units.map(mkDep);
    const stackU = subset(units, 0.7);
    const trace = [];
    const out = army.stackVitals(stackU, depsFor(units, dep, trace));
    D.stackVitals.push({ units: enc(units), dep: enc(dep), stack: idxs(units, stackU), out: enc(out), roster: enc(trace), rosterSum: stackU.length === 0 ? 0 : enc(abp.sumRosterFieldM(trace.map(([typeId, key]) => ({ typeId, def: DEFS[key] })))) });
  }
}

// ===========================================================================
// ruch.json
// ===========================================================================
{
  const R = V.ruch;
  for (let k = 0; k < 110; k++) {
    const units = mkUnits(pick([0, 2, 5, 9]));
    const blocked = randBlocked();
    const q = hexQ();
    const r = hexQ();
    const out = army.findAdjacentEmptyHexes(units, q, r, blockedPassable(blocked));
    R.findAdjacentEmptyHexes.push({ units: enc(units), blocked, q, r, out: out.map((h) => [h.q, h.r]) });
    const allowSame = pick([undefined, false, true]);
    const split = army.findSplitDestHexes(units, q, r, blockedPassable(blocked), allowSame);
    R.findSplitDestHexes.push({ units: enc(units), blocked, q, r, allowSame: allowSame ?? null, out: enc(split) });
  }
  for (let k = 0; k < 130; k++) {
    const units = mkUnits(pick([0, 3, 6, 10]));
    const preferQ = hexQ();
    const preferR = hexQ();
    const blocked = blockedAround(preferQ, preferR);
    const usePass = chance(0.6);
    const ids = chance(0.1) ? [] : Array.from({ length: pick([1, 2, 3, 5, 8]) }, () => (chance(0.85) && units.length ? pick(units).id : pick(ID_POOL)));
    const out = army.assignBounceHexesForUnits(units, preferQ, preferR, ids, usePass ? blockedPassable(blocked) : undefined);
    R.assignBounceHexesForUnits.push({ units: enc(units), blocked: usePass ? blocked : null, preferQ, preferR, ids, out: [...out.entries()].map(([id, h]) => [id, [h.q, h.r]]) });
  }
  for (let k = 0; k < 130; k++) {
    const units = mkUnits(pick([0, 3, 6, 10]));
    const fromQ = hexQ();
    const fromR = hexQ();
    const blocked = blockedAround(fromQ, fromR);
    const usePass = chance(0.6);
    const except = units.length && chance(0.8) ? pick(units).id : 'brak';
    const out = army.findBounceHexFromOrigin(units, fromQ, fromR, except, usePass ? blockedPassable(blocked) : undefined);
    R.findBounceHexFromOrigin.push({ units: enc(units), blocked: usePass ? blocked : null, fromQ, fromR, except, out: out ? [out.q, out.r] : null });
  }
  const DEDUCTED = [0, 1, 2, 2.5, 5, -1, -0.5, NaN, Infinity, -Infinity, 0.3, 100];
  for (let k = 0; k < 110; k++) {
    const units = mkUnitsPoolIds(pick([0, 1, 3, 6]));
    const deducted = pick(DEDUCTED);
    const out = army.computeSeparateReturn(units, deducted);
    R.computeSeparateReturn.push({ units: enc(units), deducted: enc(deducted), out: [...out.entries()].map(([id, v]) => [id, enc(v)]) });
  }
  for (let k = 0; k < 130; k++) {
    const units = mkUnits(pick([0, 3, 6, 10]));
    const fromQ = hexQ();
    const fromR = hexQ();
    const blocked = blockedAround(fromQ, fromR);
    const usePass = chance(0.6);
    const ownerId = pick([0, 1, 2]);
    const out = army.resolveSeparateReturnHex(units, fromQ, fromR, ownerId, usePass ? blockedPassable(blocked) : undefined);
    R.resolveSeparateReturnHex.push({ units: enc(units), blocked: usePass ? blocked : null, fromQ, fromR, ownerId, out: out ? [out.q, out.r] : null });
  }
  for (let len = 0; len <= 6; len++) {
    for (const canMerge of [false, true]) {
      for (const dest of [0, 1, 2, 8]) {
        R.stackHudMergeSplitActions.push({ len, canMerge, dest, out: army.stackHudMergeSplitActions(len, canMerge, dest) });
      }
    }
  }
  const fns = {
    stackRuchLeft: army.stackRuchLeft,
    planningStackRuchLeft: army.planningStackRuchLeft,
    stackRuchMax: army.stackRuchMax,
  };
  for (const [name, fn] of Object.entries(fns)) {
    for (let k = 0; k < 110; k++) {
      const units = mkUnits(pick([0, 1, 3, 6]));
      const stackU = subset(units, 0.7);
      R[name].push({ units: enc(units), stack: idxs(units, stackU), out: enc(fn(stackU)) });
    }
  }
  for (let k = 0; k < 110; k++) {
    const u = mkUnit(k);
    R.planningUnitRuchLeft.push({ unit: enc(u), out: enc(army.planningUnitRuchLeft(u)) });
  }
  const SYNC = [undefined, undefined, 0, 1, 2.5, -1, NaN, Infinity, -0];
  for (let k = 0; k < 110; k++) {
    const units = mkUnits(pick([0, 1, 3, 6]));
    const before = clone(units);
    const stackU = subset(units, 0.7);
    const v = pick(SYNC);
    army.syncStackRuchLeft(stackU, v);
    R.syncStackRuchLeft.push({ units: enc(before), stack: idxs(units, stackU), ruchLeft: enc(v) ?? null, after: enc(units) });
  }
  const COSTS = [0, 1, 2, 2.5, 5, -1, NaN, Infinity, 0.3, 100];
  for (let k = 0; k < 110; k++) {
    const units = mkUnits(pick([0, 1, 3, 6]));
    const before = clone(units);
    const stackU = subset(units, 0.7);
    const cost = pick(COSTS);
    army.deductStackRuchLeft(stackU, cost);
    R.deductStackRuchLeft.push({ units: enc(before), stack: idxs(units, stackU), cost: enc(cost), after: enc(units) });
  }
  for (const [name, fn] of [['unitWithStackRuch', army.unitWithStackRuch], ['unitWithPlanningStackRuch', army.unitWithPlanningStackRuch]]) {
    for (let k = 0; k < 110; k++) {
      const units = mkUnits(pick([1, 2, 4, 7]));
      const unit = units[rint(0, units.length - 1)];
      const stackU = chance(0.8) ? subset(units, 0.7) : [unit];
      const out = fn(unit, stackU);
      R[name].push({ units: enc(units), unit: units.indexOf(unit), stack: idxs(units, stackU), out: enc(out), same: out === unit });
    }
  }
}

// ===========================================================================
// cost.json
// ===========================================================================
{
  const C = V.cost;
  C.constants = {
    KOSZT_JEDNOSTEK_PACE: enc(costTempo.KOSZT_JEDNOSTEK_PACE),
    keys: Object.keys(costTempo.KOSZT_JEDNOSTEK_PACE),
    // dolna granica kosztu: wynik dla bazowego 0 i mnoznika 1 (Math.max(1, ...))
    minKoszt: costTempo.applyUnitCostPace(0, 'niski'),
  };
  const BASES = [0, 1, 2, 3, 5, 10, 12, 25, 99, 150, 2.5, 0.5, 1.5, 4.5, 0.49999999999999994, 3.3, 7.7, 0.1, 1e-9, 1e15, -0.5, -1, -3, -2.5, NaN, Infinity, -Infinity];
  const PACES = ['niski', 'normalny', 'wysoki', 0, 1, 0.5, 1.5, 2, 3.3, 4, -1, -0.5, NaN, Infinity, 1e-9, 'brak', 'toString', '__proto__', 'constructor', ''];
  for (const base of BASES) {
    for (const pace of PACES) {
      const out = costTempo.applyUnitCostPace(base, pace);
      C.applyUnitCostPace.push({ base: enc(base), pace: enc(pace), out: enc(out) });
    }
  }
  // wartosci z kreatora: bazowe koszty calkowite x trzy tempa
  for (let base = 0; base <= 400; base += 7) {
    for (const pace of ['niski', 'normalny', 'wysoki']) {
      C.applyUnitCostPace.push({ base, pace, out: costTempo.applyUnitCostPace(base, pace) });
    }
  }

  const REST_SETS = [
    {},
    { epoch: 3, builtBuildingIds: ['Koszary', 'Kuźnia'], buildingLevel: 2 },
    { civBonusy: [{ typ: 'rekrutacja', cel: 'Impi', wartosc: -10 }], civUnitNacja: 'Zulusi', ownerId: 0, difficulty: 'trudna' },
    { placedImprovements: { entries: [['1,2', 'kopalnia'], ['3,4', ['droga', 'farma']]] }, hasKopalniaNaZlozuZelaza: true, cityHasCoastOrRiver: false },
    { kosztJednostekPace: 'wysoki', buildingCostPace: 'niski', empireActiveResourceLabels: ['Brąz'], empireBuiltIds: [] },
  ];
  const STOCKS = [{}, { brąz: 3 }, { brąz: 0, żelazo: 5 }, { drewno: 12, kamień: 7, brąz: 1, żelazo: 0 }];
  for (const rest of REST_SETS) {
    for (const stock of STOCKS) {
      const params = { ...rest, empireResourceStock: stock };
      const out = replCtx.buildReplaceAvailabilityCtx(params);
      C.buildReplaceAvailabilityCtx.push({
        rest: enc(rest), stock: enc(stock), out: enc(out),
        keys: Object.keys(out), newObject: out !== params, sameStockRef: out.empireResourceStock === params.empireResourceStock,
      });
    }
  }
}

// ===========================================================================
// display (dedykowane): dwa ROZNE stosy o tym samym id reprezentanta - `Set.add` nie dubluje,
// `Map.set` NADPISUJE wartosc (plakietka i vitals ostatniego stosu), pozycja klucza zostaje pierwsza.
// Dopisane NA KONCU generatora, by nie zmienic strumienia losowego wczesniejszych wektorow.
// ===========================================================================
{
  const D = V.display;
  const combos = [[2, 3], [3, 2], [1, 3], [3, 1], [2, 2], [1, 1], [4, 2], [2, 1], [1, 2]];
  for (const withDeps of [false, true]) {
    for (const [na, nb] of combos) {
      const units = [];
      const mk = (i, id, q) => mkUnit(i, { id, q, r: 0, ownerId: 0, inGarnizon: false, stackGroupId: '', oblegaCityId: '' });
      for (let i = 0; i < na; i++) units.push(mk(i, i === 0 ? 'dup' : `a${i}`, 0));
      for (let i = 0; i < nb; i++) units.push(mk(100 + i, i === 0 ? 'dup' : `b${i}`, 1));
      const dep = units.map(mkDep);
      units.forEach((u, i) => { dep[i].attack = u.id === 'dup' ? 9 : 1; });
      const trace = [];
      const vd = withDeps ? { ...depsFor(units, dep, trace) } : undefined;
      const info = army.computeStackDisplay(units, attackOfFor(units, dep), vd);
      const groups = new Map();
      for (const u of units) {
        const key = army.stackRenderKey(u);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(u);
      }
      const rosterTable = withDeps
        ? [...groups.values()].map((g) => [g.map((u) => [u.typeId, dep[units.indexOf(u)].defKey]), enc(abp.sumRosterFieldM(g.map((u) => ({ typeId: u.typeId, def: DEFS[dep[units.indexOf(u)].defKey] }))))])
        : null;
      D.computeStackDisplay.push({
        units: enc(units), dep: enc(dep), withDeps, rosterTable, trace: enc(trace),
        out: {
          visibleIds: [...info.visibleIds],
          badge: [...info.badgeByRepId.entries()],
          vitals: info.vitalsByRepId ? [...info.vitalsByRepId.entries()].map(([id, v]) => [id, enc(v)]) : null,
          keys: Object.keys(info),
        },
      });
    }
  }
}

// ===========================================================================
// zapis
// ===========================================================================
function floatSafe(v) {
  if (typeof v === 'number') return Number.isFinite(v) && !Number.isInteger(v) ? { $f: String(v) } : v;
  if (Array.isArray(v)) return v.map(floatSafe);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = floatSafe(x);
    return o;
  }
  return v;
}
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(floatSafe(obj)));
const meta = { pin: 'edb8fb56', generator: 'gen-p65a-vectors.mjs', note: 'wektory z URUCHOMIONEGO weba; liczby specjalne {"$n"}; undefined = brak klucza' };
write('stack.json', { meta, cases: V.stack });
V.display.defs = DEFS;
write('display.json', { meta, cases: V.display });
write('ruch.json', { meta, cases: V.ruch });
write('cost.json', { meta, cases: V.cost });

console.log = origLog;
const count = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]));
console.log(JSON.stringify({ stack: count(V.stack), display: count(V.display), ruch: count(V.ruch), cost: count(V.cost) }, null, 1));
console.warn = origWarn;
