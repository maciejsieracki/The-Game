// P4-1D-Q1 (R-RUSTPORT-P4-1D-Q1-STACK-REPIN) - wektory z URUCHOMIONEGO weba, pin 07d2fbd72, dla
// czesci wyswietlania stosu:
//   gra/src/game/stack-leader.ts (pickStackLeader, isNonCombatStackMember),
//   gra/src/units/setup.ts (isCivilianUnit, CIVILIAN_CATEGORIES, CIVILIAN_TYPE_IDS),
//   gra/src/game/armyMerge.ts (pickStackRepresentative, computeStackDisplay, unitAtRepresentative,
//   stackVitals z polem hasCommander).
// Zaleznosci uruchamiane BEZ stubow (graf importow z pinu: auto-battle-power.ts, unit-power.ts,
// unit-building-bonuses.ts, veteran.ts, data/combat-params.json).
//
// Dwie czesci wyniku (`vectors.json`):
//   1. `repin`: WSZYSTKIE wejscia starych wektorow `display.json` (pin edb8fb56) dla
//      pickStackRepresentative / computeStackDisplay / unitAtRepresentative / stackVitals
//      przeliczone na @07; `repinChanged` = indeksy przypadkow, w ktorych wynik @07 rozni sie od
//      zapisanego w `display.json` (bez pola `hasCommander`, ktorego edb8fb56 nie mial).
//   2. `cases`: nowe przypadki @07 (kategorie cywilne, isGeneral, remisy UTF-16, garnizon+pole,
//      jawny stackGroupId na dwoch heksach) + przypadki losowe; kazdy z `tags`.
// Strazniki SHA-256 wycietych fragmentow pinu (EXPECTED ponizej): zmiana kodu pinu = przerwanie.
//
// Uzycie (WEB_ROOT = `git archive 07d2fbd72 gra/src gra/data | tar -x -C WEB_ROOT`):
//   node --experimental-transform-types --no-warnings ./gen.mjs <WEB_ROOT> <OUT_JSON>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join, resolve as presolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Loader ESM (hooks): dopisuje .ts / /index.ts do importow bez rozszerzenia, .json = modul.
const HOOKS = `
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, next) {
  try { return await next(specifier, context); } catch (e) {
    for (const suf of ['.ts', '/index.ts']) {
      try { return await next(specifier + suf, context); } catch { /* kolejny */ }
    }
    throw e;
  }
}
export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    const src = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: 'export default ' + src + ';', shortCircuit: true };
  }
  return next(url, context);
}
`;
register('data:text/javascript,' + encodeURIComponent(HOOKS));

const [, , webRootArg, outArg] = process.argv;
if (!webRootArg || !outArg) {
  console.error('usage: <WEB_ROOT> <OUT_JSON>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const here = dirname(fileURLToPath(import.meta.url));
const srcPath = (p) => join(webRoot, 'gra/src', p);
const src = (p) => pathToFileURL(srcPath(p)).href;

// ---------------------------------------------------------------------------
// Strazniki SHA-256 fragmentow pinu (od linii startowej do pierwszej linii `}` / `};` w kolumnie 0)
// ---------------------------------------------------------------------------
const EXPECTED = {
  'game/stack-leader.ts::isNonCombatStackMember': '65db849e5b7a0f82a4665353d3a4b4823c922f7b06126a533c8782d3c2a49342',
  'game/stack-leader.ts::pickStackLeader': '98a0b5858d650d0b7252cad9e89d6145c694fbe424770ceea6a96030f59d4594',
  'units/setup.ts::CIVILIAN_CATEGORIES': '48c79c6bd4247c13541055ebf57a9de9c76254b51ab4772c6fd06a91adf85f9c',
  'units/setup.ts::CIVILIAN_TYPE_IDS': '5ede15ac769c337548b5e458d88451c679a9954b88f15e83f85685e86905e733',
  'units/setup.ts::isCivilianUnit': '558bbf13324eb0bff39ef673784b59f592e404c1947bb4c4ba1d2366ab52a18d',
  'game/armyMerge.ts::stackGroupIdOf': 'e164d0a29fb79f7b2834d9c8847ccfff3f92a3b1ae1c010c3518b2d2cfa162f8',
  'game/armyMerge.ts::pickStackRepresentative': 'c8ff894cc800147a0d1ddfbeef4bc1707548be274ab24607a3a004b6b7d247c3',
  'game/armyMerge.ts::stackRenderKey': '191c052428c55653f914fc8bd0260a6225d48f00261c1f730d5cc09646255f50',
  'game/armyMerge.ts::computeStackDisplay': '3b2e1b4ed1800d521b8a3b99df1c56b7f306de754391160a3a74e3439800fbd1',
  'game/armyMerge.ts::unitAtRepresentative': 'df5d4870140ce274579cb86a730c2bbea89776aef507a40fccf9cc9d7750ad9c',
  'game/armyMerge.ts::StackVitals': 'ca361c5a416f2b7b1a1001cfce13fc6d4331f34fc3c08cc7c3b39fddcd9603a1',
  'game/armyMerge.ts::stackVitals': 'd704e7f3c1087b30db04fad8f578b80b0db6dfa6fc1311b59dcc931e53119afd',
};
const START = {
  isNonCombatStackMember: /^export function isNonCombatStackMember\b/,
  pickStackLeader: /^export function pickStackLeader\b/,
  CIVILIAN_CATEGORIES: /^export const CIVILIAN_CATEGORIES\b/,
  CIVILIAN_TYPE_IDS: /^export const CIVILIAN_TYPE_IDS\b/,
  isCivilianUnit: /^export function isCivilianUnit\b/,
  stackGroupIdOf: /^export function stackGroupIdOf\b/,
  pickStackRepresentative: /^export function pickStackRepresentative\b/,
  stackRenderKey: /^export function stackRenderKey\b/,
  computeStackDisplay: /^export function computeStackDisplay\b/,
  unitAtRepresentative: /^export function unitAtRepresentative\b/,
  StackVitals: /^export interface StackVitals \{/,
  stackVitals: /^export function stackVitals\b/,
};
function fragment(file, name) {
  const lines = readFileSync(srcPath(file), 'utf8').split('\n');
  const at = lines.findIndex((l) => START[name].test(l));
  if (at < 0) throw new Error(`brak fragmentu ${file}::${name}`);
  // jednolinijkowa stala konczy sie na tej samej linii
  if (/;\s*$/.test(lines[at]) && !lines[at].includes('{')) return { from: at + 1, to: at + 1, text: lines[at] };
  let end = at;
  while (end < lines.length && !/^\};?\s*$/.test(lines[end])) end += 1;
  return { from: at + 1, to: end + 1, text: lines.slice(at, end + 1).join('\n') };
}
const guards = {};
const guardFail = [];
for (const key of Object.keys(EXPECTED)) {
  const [file, name] = key.split('::');
  const f = fragment(file, name);
  const sha = createHash('sha256').update(f.text, 'utf8').digest('hex');
  guards[key] = { lines: `${f.from}-${f.to}`, sha256: sha };
  if (EXPECTED[key] !== sha) guardFail.push(`${key} ${f.from}-${f.to} sha256=${sha} (oczekiwano ${EXPECTED[key]})`);
}
if (guardFail.length) {
  console.error('STRAZNIK SHA-256: fragmenty pinu niezgodne:\n' + guardFail.join('\n'));
  process.exit(3);
}

const origLog = console.log;
const origWarn = console.warn;
console.log = () => {};
console.warn = () => {};

const army = await import(src('game/armyMerge.ts'));
const leader = await import(src('game/stack-leader.ts'));
const setup = await import(src('units/setup.ts'));
const abp = await import(src('game/auto-battle-power.ts'));
const ubb = await import(src('game/unit-building-bonuses.ts'));
const vet = await import(src('game/veteran.ts'));

// ---------------------------------------------------------------------------
// kodowanie JSON (jak gen-p65a-vectors.mjs: {"$n"} dla NaN/Inf/-0, {"$f"} dla niecalkowitych)
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
// odwrotnosc enc+floatSafe (wejscia starych wektorow)
function dec(v) {
  if (Array.isArray(v)) return v.map(dec);
  if (v && typeof v === 'object') {
    if (typeof v.$n === 'string' && Object.keys(v).length === 1) {
      return { NaN: NaN, Infinity: Infinity, '-Infinity': -Infinity, '-0': -0 }[v.$n];
    }
    if (typeof v.$f === 'string' && Object.keys(v).length === 1) return Number(v.$f);
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = dec(x);
    return o;
  }
  return v;
}
const canon = (v) => JSON.stringify(floatSafe(enc(v)));

// ---------------------------------------------------------------------------
// wspolne: zaleznosci stosu
// ---------------------------------------------------------------------------
const OLD = JSON.parse(readFileSync(join(here, 'display.json'), 'utf8'));
const DEFS = dec(OLD.cases.defs);
const DEF_KEYS = Object.keys(DEFS);

const depsFor = (units, dep, trace) => ({
  maxHpOf: (u) => dep[units.indexOf(u)].maxHp,
  defOf: (u) => {
    const key = dep[units.indexOf(u)].defKey;
    if (trace) trace.push([u.typeId, key]);
    return DEFS[key];
  },
});
const attackOfFor = (units, attacks) => (u) => attacks[units.indexOf(u)];
// wartosci zaleznosci importowanych przez stackVitals @07 - liczone PRAWDZIWYMI funkcjami pinu
const depFns = (u) => ({
  armor: ubb.armorPathBadgeLevel(u),
  soft: ubb.softPathBadgeLevel(u),
  vet: vet.veteranLevel(u),
  stars: vet.veteranStarCount(u),
});
function rosterTableFor(units, dep) {
  const groups = new Map();
  for (const u of units) {
    const key = army.stackRenderKey(u);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }
  return [...groups.values()].map((g) => [
    g.map((u) => [u.typeId, dep[units.indexOf(u)].defKey]),
    enc(abp.sumRosterFieldM(g.map((u) => ({ typeId: u.typeId, def: DEFS[dep[units.indexOf(u)].defKey] })))),
  ]);
}

function runPick(units, attacks) {
  if (units.length === 0) {
    let threw = false;
    try {
      army.pickStackRepresentative([], () => 0);
    } catch {
      threw = true;
    }
    return { units: [], attacks: [], threw };
  }
  const out = army.pickStackRepresentative(units, attackOfFor(units, attacks));
  return { units: enc(units), attacks: enc(attacks), out: units.indexOf(out) };
}
function runDisplay(units, dep, withDeps) {
  const trace = [];
  const vd = withDeps ? { ...depsFor(units, dep, trace) } : undefined;
  const info = army.computeStackDisplay(units, attackOfFor(units, dep.map((d) => d.attack)), vd);
  return {
    units: enc(units), dep: enc(dep), withDeps, rosterTable: withDeps ? rosterTableFor(units, dep) : null, trace: enc(trace),
    out: {
      visibleIds: [...info.visibleIds],
      badge: [...info.badgeByRepId.entries()],
      vitals: info.vitalsByRepId ? [...info.vitalsByRepId.entries()].map(([id, v]) => [id, enc(v)]) : null,
      keys: Object.keys(info),
    },
  };
}
function runAt(units, attacks, q, r) {
  const out = army.unitAtRepresentative(q, r, units, attackOfFor(units, attacks));
  return { units: enc(units), attacks: enc(attacks), q, r, out: out ? units.indexOf(out) : null };
}
function runVitals(units, dep, stackU) {
  const trace = [];
  const out = army.stackVitals(stackU, depsFor(units, dep, trace));
  return {
    units: enc(units), dep: enc(dep), stack: stackU.map((x) => units.indexOf(x)), out: enc(out), roster: enc(trace),
    rosterSum: stackU.length === 0 ? 0 : enc(abp.sumRosterFieldM(trace.map(([typeId, key]) => ({ typeId, def: DEFS[key] })))),
  };
}

// usuwa `hasCommander` (pole @07) z wyniku do porownania ze starym wektorem edb8fb56
function stripCommander(out) {
  const o = structuredClone(out);
  if (o && typeof o === 'object' && 'hasCommander' in o) delete o.hasCommander;
  if (o && Array.isArray(o.vitals)) for (const pair of o.vitals) delete pair[1].hasCommander;
  return o;
}

// ===========================================================================
// 1. repin: wejscia starych wektorow display.json przeliczone na @07
// ===========================================================================
const repin = { pickStackRepresentative: [], computeStackDisplay: [], unitAtRepresentative: [], stackVitals: [] };
const repinChanged = { pickStackRepresentative: [], computeStackDisplay: [], unitAtRepresentative: [], stackVitals: [] };
const withDep07 = (units, oldDep) => oldDep.map((d, i) => ({ ...d, ...depFns(units[i]) }));

OLD.cases.pickStackRepresentative.forEach((c, i) => {
  const units = dec(c.units);
  const got = runPick(units, dec(c.attacks));
  repin.pickStackRepresentative.push(got);
  if (canon(got.out ?? null) !== JSON.stringify(c.out ?? null) || (got.threw ?? null) !== (c.threw ?? null)) {
    repinChanged.pickStackRepresentative.push(i);
  }
});
OLD.cases.computeStackDisplay.forEach((c, i) => {
  const units = dec(c.units);
  const dep = withDep07(units, dec(c.dep));
  const got = runDisplay(units, dep, c.withDeps);
  repin.computeStackDisplay.push(got);
  if (JSON.stringify(floatSafe(stripCommander(got.out))) !== JSON.stringify(c.out)) repinChanged.computeStackDisplay.push(i);
});
OLD.cases.unitAtRepresentative.forEach((c, i) => {
  const units = dec(c.units);
  const got = runAt(units, dec(c.attacks), c.q, c.r);
  repin.unitAtRepresentative.push(got);
  if (JSON.stringify(got.out) !== JSON.stringify(c.out)) repinChanged.unitAtRepresentative.push(i);
});
OLD.cases.stackVitals.forEach((c, i) => {
  const units = dec(c.units);
  const dep = withDep07(units, dec(c.dep));
  const got = runVitals(units, dep, c.stack.map((k) => units[k]));
  repin.stackVitals.push(got);
  if (JSON.stringify(floatSafe(stripCommander(got.out))) !== JSON.stringify(c.out)) repinChanged.stackVitals.push(i);
});

// ===========================================================================
// 2. nowe przypadki @07
// ===========================================================================
let seedState = 0x41d1a7e5;
function rnd() {
  seedState = (Math.imul(seedState, 1664525) + 1013904223) >>> 0;
  return seedState / 4294967296;
}
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

const TYPES = ['Wojownik', 'Łucznik', 'Zwiadowca', 'Osadnik', 'Robotnik', 'Włócznik', 'Katapulta', 'Jazda'];
const CATEGORIES = ['piechota', 'piechota', 'domyslny', 'lucznik', 'zwiadowca', 'osadnik', 'robotnik', ''];
const ID_POOL = ['u1', 'u10', 'u2', 'a', 'b', 'Ą1', 'z', '～', '😀', 'u', ''];
const GENERAL = [undefined, undefined, undefined, true, false];

function mkUnit(i, o = {}) {
  const u = {
    id: o.id ?? `u${i}`,
    ownerId: o.ownerId ?? pick([0, 0, 1]),
    typeId: o.typeId ?? pick(TYPES),
    category: o.category ?? pick(CATEGORIES),
    q: o.q ?? rint(-1, 1),
    r: o.r ?? rint(-1, 1),
    ruch: o.ruch ?? pick([1, 2, 3, 2.5]),
    ruchLeft: o.ruchLeft ?? pick([0, 1, 2, 0.5, 3]),
  };
  const opt = (key, value) => {
    if (value !== undefined) u[key] = value;
  };
  opt('inGarnizon', 'inGarnizon' in o ? o.inGarnizon : pick([undefined, undefined, true, false]));
  opt('hp', 'hp' in o ? o.hp : pick([undefined, undefined, 5, 12.5, 30]));
  opt('stackGroupId', 'stackGroupId' in o ? o.stackGroupId : pick([undefined, undefined, undefined, '', 'sgA']));
  opt('isGeneral', 'isGeneral' in o ? o.isGeneral : pick(GENERAL));
  opt('pancerzBonusProc', pick([undefined, 0, 16, 31, 45]));
  opt('parametryBonusProc', pick([undefined, 0, 17, 34, 50]));
  opt('battlesSurvived', pick([undefined, 0, 1, 2, 3, 7]));
  return u;
}
function mkDep(u) {
  return {
    maxHp: pick([10, 20, 35.5, 40]),
    defKey: pick(DEF_KEYS),
    attack: chance(0.04) ? NaN : pick([0, 1, 2, 3, 3, 5, 5, 7.5, 9]),
    ...depFns(u),
  };
}
const civ = (u) => setup.isCivilianUnit(u);
// znaczniki przypadku liczone z wejsc (zrodlo: PRAWDZIWE isCivilianUnit pinu)
function stackTags(units, attacks) {
  const tags = [];
  if (units.length === 0) return tags;
  const civs = units.filter(civ);
  const combat = units.filter((u) => !civ(u));
  if (civs.length === units.length) tags.push('civ-only');
  if (civs.length > 0 && combat.length > 0) {
    tags.push('civ-mixed');
    const maxCombat = Math.max(...combat.map((u) => attacks[units.indexOf(u)]));
    if (civs.some((u) => attacks[units.indexOf(u)] > maxCombat)) tags.push('civ-higher-attack');
  }
  if (civs.some((u) => u.category === '' || u.category === 'domyslny' || u.category === 'piechota')) tags.push('civ-by-type');
  if (civs.some((u) => !setup.CIVILIAN_TYPE_IDS.has(u.typeId))) tags.push('civ-by-category');
  return tags;
}
function generalTags(stack) {
  const tags = [];
  if (stack.some((u) => u.isGeneral === true)) tags.push('commander-true');
  if (stack.some((u) => u.isGeneral === false)) tags.push('commander-false');
  if (stack.some((u) => u.isGeneral === undefined)) tags.push('commander-undefined');
  return tags;
}

const cases = { pickStackRepresentative: [], computeStackDisplay: [], unitAtRepresentative: [], stackVitals: [] };
const push = (name, value, tags) => cases[name].push({ ...value, tags });

// --- dedykowane: reprezentant
{
  const at = (list) => list.map((spec, i) => mkUnit(i, { q: 0, r: 0, ownerId: 0, inGarnizon: undefined, stackGroupId: undefined, ...spec }));
  const specs = [
    // stos sam cywilny: regula na calym stosie (max atak)
    [[{ id: 'c1', typeId: 'Zwiadowca', category: 'zwiadowca' }, { id: 'c2', typeId: 'Osadnik', category: 'osadnik' }], [3, 1], 'civ-only'],
    [[{ id: 'c2', typeId: 'Robotnik', category: 'robotnik' }, { id: 'c1', typeId: 'Zwiadowca', category: 'zwiadowca' }], [2, 2], 'civ-only-tie'],
    // cywil z wyzszym atakiem niz bojowy: reprezentant = bojowy
    [[{ id: 'a', typeId: 'Zwiadowca', category: 'zwiadowca' }, { id: 'b', typeId: 'Wojownik', category: 'piechota' }], [9, 2], 'civ-higher'],
    [[{ id: 'b', typeId: 'Wojownik', category: 'piechota' }, { id: 'a', typeId: 'Zwiadowca', category: 'zwiadowca' }], [2, 9], 'civ-higher'],
    // cywil tylko po kategorii (typeId bojowy) i tylko po typeId (kategoria domyslna)
    [[{ id: 'a', typeId: 'Wojownik', category: 'robotnik' }, { id: 'b', typeId: 'Jazda', category: 'piechota' }], [9, 1], 'civ-by-category'],
    [[{ id: 'a', typeId: 'Osadnik', category: 'domyslny' }, { id: 'b', typeId: 'Jazda', category: 'piechota' }], [9, 1], 'civ-by-type'],
    // remis ataku w puli bojowej: mniejsze id w UTF-16 (cywil ma najmniejsze id, ale nie wchodzi)
    [[{ id: '😀', typeId: 'Jazda', category: 'piechota' }, { id: '～', typeId: 'Wojownik', category: 'piechota' }, { id: '', typeId: 'Zwiadowca', category: 'zwiadowca' }], [4, 4, 4], 'tie-utf16'],
    [[{ id: '～', typeId: 'Jazda', category: 'piechota' }, { id: '😀', typeId: 'Wojownik', category: 'piechota' }], [4, 4], 'tie-utf16'],
    [[{ id: 'u10', typeId: 'Jazda', category: 'piechota' }, { id: 'u2', typeId: 'Wojownik', category: 'piechota' }, { id: 'u1', typeId: 'Osadnik', category: 'osadnik' }], [4, 4, 4], 'tie-utf16'],
    // NaN ataku w puli bojowej, cywil z atakiem
    [[{ id: 'a', typeId: 'Zwiadowca', category: 'zwiadowca' }, { id: 'b', typeId: 'Wojownik', category: 'piechota' }, { id: 'c', typeId: 'Jazda', category: 'piechota' }], [9, NaN, 3], 'nan'],
  ];
  for (const [spec, attacks, tag] of specs) {
    const units = at(spec);
    push('pickStackRepresentative', runPick(units, attacks), [tag, ...stackTags(units, attacks)]);
  }
  push('pickStackRepresentative', runPick([], []), ['empty']);
}

// --- dedykowane: computeStackDisplay / unitAtRepresentative / stackVitals
{
  const scen = [];
  // garnizon i pole na tym samym heksie (cywil w polu z wyzszym atakiem, wodz w garnizonie)
  scen.push(['garrison-field', [
    { id: 'g1', typeId: 'Wojownik', category: 'piechota', q: 0, r: 0, inGarnizon: true, isGeneral: true },
    { id: 'g2', typeId: 'Zwiadowca', category: 'zwiadowca', q: 0, r: 0, inGarnizon: true },
    { id: 'f1', typeId: 'Osadnik', category: 'osadnik', q: 0, r: 0, inGarnizon: false },
    { id: 'f2', typeId: 'Jazda', category: 'piechota', q: 0, r: 0, inGarnizon: false, isGeneral: false },
  ], [9, 9, 9, 1]]);
  // jawny stackGroupId na dwoch heksach: dwa zetony
  scen.push(['group-two-hexes', [
    { id: 's1', typeId: 'Wojownik', category: 'piechota', q: 0, r: 0, stackGroupId: 'sgX', isGeneral: true },
    { id: 's2', typeId: 'Zwiadowca', category: 'zwiadowca', q: 1, r: 0, stackGroupId: 'sgX' },
    { id: 's3', typeId: 'Jazda', category: 'piechota', q: 0, r: 0, stackGroupId: 'sgX' },
    { id: 's4', typeId: 'Robotnik', category: 'robotnik', q: 1, r: 0, stackGroupId: 'sgX' },
  ], [1, 9, 2, 3]]);
  // stos sam cywilny + stos z cywilem silniejszym od bojowego
  scen.push(['civ-only', [
    { id: 'c1', typeId: 'Zwiadowca', category: 'zwiadowca', q: 0, r: 0 },
    { id: 'c2', typeId: 'Osadnik', category: 'osadnik', q: 0, r: 0 },
  ], [1, 2]]);
  scen.push(['civ-higher', [
    { id: 'z', typeId: 'Zwiadowca', category: 'zwiadowca', q: 0, r: 0 },
    { id: 'w', typeId: 'Wojownik', category: 'piechota', q: 0, r: 0 },
    { id: 'o', typeId: 'Osadnik', category: 'domyslny', q: 0, r: 0 },
  ], [9, 1, 8]]);
  // hasCommander: true / false / undefined
  for (const [tag, g] of [['commander-true', true], ['commander-false', false], ['commander-undefined', undefined]]) {
    scen.push([tag, [
      { id: 'k1', typeId: 'Wojownik', category: 'piechota', q: 0, r: 0, isGeneral: g },
      { id: 'k2', typeId: 'Jazda', category: 'piechota', q: 0, r: 0, isGeneral: undefined },
    ], [2, 3]]);
  }
  for (const [tag, specs, attacks] of scen) {
    const units = specs.map((spec, i) => mkUnit(i, { ownerId: 0, inGarnizon: undefined, stackGroupId: undefined, isGeneral: undefined, ...spec }));
    const dep = units.map(mkDep);
    attacks.forEach((a, i) => { dep[i].attack = a; });
    for (const withDeps of [false, true]) {
      push('computeStackDisplay', runDisplay(units, dep, withDeps), [tag, ...stackTags(units, attacks), ...generalTags(units)]);
    }
    const t = units[0];
    push('unitAtRepresentative', runAt(units, attacks, t.q, t.r), [tag, ...stackTags(units, attacks)]);
    push('stackVitals', runVitals(units, dep, units), [tag, ...generalTags(units)]);
    const field = units.filter((u) => u.inGarnizon !== true && u.q === t.q && u.r === t.r);
    push('stackVitals', runVitals(units, dep, field), [tag, ...generalTags(field)]);
  }
}

// --- losowe
for (let k = 0; k < 120; k++) {
  const units = [];
  const n = pick([1, 2, 3, 5, 8]);
  for (let i = 0; i < n; i++) units.push(mkUnit(i, { q: 0, r: 0, inGarnizon: undefined, stackGroupId: undefined }));
  for (const u of units) if (chance(0.4)) u.id = pick(ID_POOL);
  const attacks = units.map(() => (chance(0.04) ? NaN : pick([0, 1, 3, 3, 5, 7.5, 9])));
  push('pickStackRepresentative', runPick(units, attacks), ['random', ...stackTags(units, attacks)]);
}
for (let k = 0; k < 120; k++) {
  const withDeps = chance(0.6);
  const units = [];
  const n = pick([0, 1, 4, 7, 10]);
  for (let i = 0; i < n; i++) units.push(mkUnit(i));
  for (const u of units) if (chance(0.5)) { u.q = 0; u.r = 0; }
  if (!withDeps) for (const u of units) if (chance(0.3)) u.id = pick(ID_POOL);
  const dep = units.map(mkDep);
  push('computeStackDisplay', runDisplay(units, dep, withDeps), ['random', ...stackTags(units, dep.map((d) => d.attack)), ...generalTags(units)]);
}
for (let k = 0; k < 120; k++) {
  const units = [];
  const n = pick([0, 1, 3, 6]);
  for (let i = 0; i < n; i++) units.push(mkUnit(i));
  for (const u of units) if (chance(0.3)) u.id = pick(ID_POOL);
  const attacks = units.map(() => pick([0, 1, 3, 5, 9]));
  const t = units.length && chance(0.85) ? pick(units) : { q: rint(-1, 1), r: rint(-1, 1) };
  push('unitAtRepresentative', runAt(units, attacks, t.q, t.r), ['random', ...stackTags(units, attacks)]);
}
for (let k = 0; k < 120; k++) {
  const units = [];
  const n = pick([0, 1, 3, 6]);
  for (let i = 0; i < n; i++) units.push(mkUnit(i));
  const dep = units.map(mkDep);
  const stackU = units.filter(() => chance(0.7));
  push('stackVitals', runVitals(units, dep, stackU), ['random', ...generalTags(stackU)]);
}

// --- probe isCivilianUnit (tablica cywilna pinu)
const civilian = {
  categories: [...setup.CIVILIAN_CATEGORIES],
  typeIds: [...setup.CIVILIAN_TYPE_IDS],
  probes: [],
};
for (const category of [...CATEGORIES, 'Zwiadowca', 'jazda', 'osadnicy']) {
  for (const typeId of [...TYPES, 'zwiadowca', 'Osadnik ', '']) {
    civilian.probes.push({ category, typeId, out: setup.isCivilianUnit({ category, typeId }), leaderNonCombat: leader.isNonCombatStackMember({ category, typeId }) });
  }
}

const meta = {
  pin: '07d2fbd72',
  generator: 'gen.mjs',
  oldVectors: 'display.json (pin edb8fb56)',
  note: 'wektory z URUCHOMIONEGO weba @07; liczby specjalne {"$n"}, niecalkowite {"$f"}; undefined = brak klucza',
  guards,
};
writeFileSync(presolve(outArg), JSON.stringify(floatSafe({ meta, repinChanged, repin, cases, civilian, defs: DEFS })));

console.log = origLog;
console.warn = origWarn;
const count = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.length]));
const tagCount = {};
for (const list of Object.values(cases)) for (const c of list) for (const t of c.tags) tagCount[t] = (tagCount[t] ?? 0) + 1;
console.log(JSON.stringify({ repin: count(repin), repinChanged: count(repinChanged), cases: count(cases), tags: tagCount, guards }, null, 1));
