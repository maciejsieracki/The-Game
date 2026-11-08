// P6-FORCED-WAR-MODULES-Q1 (G2): generator wektorow cases.json z URUCHOMIONEGO weba (forced-war-common
// pairing/serialize/restore, forced-war-bronze.ts, forced-war-iron.ts, war-rules-multiwar.ts).
//
// Uzycie (Node 22, pliki webowe z `git archive origin/main gra/src gra/data` rozpakowane poza repo):
//   node --experimental-strip-types gen_cases_g2.mjs <DIR>/gra/src <sciezka>/cases.json            # weryfikacja (exit 1 przy roznicy)
//   node --experimental-strip-types gen_cases_g2.mjs <DIR>/gra/src <sciezka>/cases.json --write    # zapis wektorow
//
// Wejscia sa generowane deterministycznie (PRNG o stalym ziarnie) + przypadki reczne; `out` liczony
// WYLACZNIE przez prawdziwe funkcje weba. Patche (tylko w kopiach w katalogu tymczasowym, logika bez zmian):
//  - importy wzgledne `from './x';` dostaja rozszerzenie `.ts` (wymog strip-types),
//  - import JSON w war-rules-multiwar.ts zastapiony literalem z data/war-rules-params.json (strip-types nie laduje JSON).
// Odleglosc heksowa = dokladna kopia `hexDistance` z gra/src/units/setup.ts (wyciagnieta regexem).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , srcDir, casesPath, mode] = process.argv;
if (!srcDir || !casesPath) {
  console.error('uzycie: node gen_cases_g2.mjs <gra/src> <cases.json> [--write]');
  process.exit(2);
}
const write = mode === '--write';

// --- 1. Kopie modulow webowych w katalogu tymczasowym ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p6fw-g2-'));
const gameTmp = path.join(tmp, 'game');
fs.mkdirSync(gameTmp, { recursive: true });
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
const patchRelImports = s => s.replace(/from '\.\/([\w-]+)';/g, "from './$1.ts';");
for (const f of ['forced-war-common.ts', 'forced-war-bronze.ts', 'forced-war-iron.ts', 'war-rules-multiwar.ts']) {
  let src = fs.readFileSync(path.join(srcDir, 'game', f), 'utf8');
  if (f === 'war-rules-multiwar.ts') {
    const jsonPath = path.join(srcDir, '..', 'data', 'war-rules-params.json');
    const imp = "import warRulesParamsRaw from '../../data/war-rules-params.json';";
    if (!src.includes(imp)) throw new Error('import JSON w war-rules-multiwar.ts nie znaleziony (zmieniony zrodlo weba?)');
    src = src.replace(imp, `const warRulesParamsRaw = ${fs.readFileSync(jsonPath, 'utf8')};`);
  }
  fs.writeFileSync(path.join(gameTmp, f), patchRelImports(src));
}
const setupSrc = fs.readFileSync(path.join(srcDir, 'units', 'setup.ts'), 'utf8');
const hdMatch = setupSrc.match(/export function hexDistance\([\s\S]*?\n\}\n/);
if (!hdMatch) throw new Error('nie znaleziono hexDistance w units/setup.ts');
fs.writeFileSync(path.join(tmp, 'hex.ts'), hdMatch[0]);

const common = await import(pathToFileURL(path.join(gameTmp, 'forced-war-common.ts')).href);
const bronze = await import(pathToFileURL(path.join(gameTmp, 'forced-war-bronze.ts')).href);
const iron = await import(pathToFileURL(path.join(gameTmp, 'forced-war-iron.ts')).href);
const hex = await import(pathToFileURL(path.join(tmp, 'hex.ts')).href);
const webHexDistance = hex.hexDistance;

// --- 2. PRNG (deterministyczny) ---
let seed = 20261108;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const rndInt = n => Math.floor(rnd() * n);
const ERAS = ['bronze', 'stone', 'iron'];
const pkey = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;

// --- 3. Wywolania prawdziwych funkcji weba ---
const toRest = v => (v === null || v === undefined ? undefined : v);
const toSubj = s => {
  const o = { ownerId: s.ownerId, q: s.q, r: s.r };
  if (s.era !== null && s.era !== undefined) o.era = s.era;
  return o;
};
const toCands = arr => arr.map(c => ({ ownerId: c.ownerId, q: c.q, r: c.r }));
const refOf = v => (v === null || v === undefined ? undefined : { q: v.q, r: v.r });

function callPairing(i) {
  const subjects = i.subjects.map(toSubj);
  const pairs = i.pairs.map(p => ({ attackerId: p.attackerId, targetId: p.targetId, era: p.era }));
  const blocked = new Set(i.blocked.map(([a, b]) => pkey(a, b)));
  const rel = i.relations === null ? null : new Map(i.relations.map(([a, b, s]) => [pkey(a, b), s]));
  const exh = i.exhausted === null ? null : new Set(i.exhausted);
  const pf = i.playerFirst;
  const opts = {
    isPairBlocked: (a, b) => blocked.has(pkey(a, b)),
    pairRelationScore: rel === null ? undefined : (a, b) => (rel.get(pkey(a, b)) ?? 0),
    isEraWarExhausted: exh === null ? undefined : (oid => exh.has(oid)),
    hexDistanceFn: webHexDistance,
    totalActiveForcedWarsByOwner: oid => common.countActiveForcedWarsForOwner(oid, pairs),
    playerFirst: pf === null ? undefined : {
      playerOwnerId: pf.playerOwnerId,
      isPlayerPairGateOpen: (oid => new Set(pf.gateOpen).has(oid)),
      candidates: pf.candidates === null ? undefined : pf.candidates.map(toSubj),
    },
  };
  const res = common.assignForcedWarPairings(subjects, pairs, opts);
  return {
    assignments: res.assignments.map(a => ({ ownerId: a.ownerId, era: a.era, targetId: a.targetId })),
    unresolvedOwnerIds: res.unresolvedOwnerIds,
    playerFirstPartnerId: res.playerFirstPartnerId === undefined ? null : res.playerFirstPartnerId,
  };
}

function callStateRoundtrip(mod, restoreName, serializeName, i) {
  let saved;
  if (i.saved !== null) {
    saved = {};
    for (const k of ['pendingOwners', 'cycleOwners', 'restUntilByOwner', 'activeByPairKey']) {
      if (i.saved[k] !== undefined) saved[k] = i.saved[k];
    }
  }
  const restored = mod[restoreName](saved);
  const out = mod[serializeName](restored.pendingOwners, restored.cycleOwners, restored.restUntilByOwner, restored.activeByPairKey);
  return JSON.parse(JSON.stringify(out));
}

function callWeb(c) {
  const i = c.in;
  switch (c.fn) {
    case 'assignForcedWarPairings':
      return callPairing(i);
    case 'commonStateRoundtrip':
      return callStateRoundtrip(common, 'restoreForcedWarState', 'serializeForcedWarState', i);
    case 'bronzeStateRoundtrip':
      return callStateRoundtrip(bronze, 'restoreBronzeForcedWarState', 'serializeBronzeForcedWarState', i);
    case 'ironStateRoundtrip':
      return callStateRoundtrip(iron, 'restoreIronForcedWarState', 'serializeIronForcedWarState', i);
    case 'isEligibleForBronzeForcedWar':
      return bronze.isEligibleForBronzeForcedWar(i);
    case 'pickBronzeForcedWarTargetId':
      return bronze.pickBronzeForcedWarTargetId(toCands(i.candidates), refOf(i.ref), webHexDistance, { blockedOwnerIds: new Set(i.blocked) });
    case 'isRestingFromBronzeForcedWar':
      return bronze.isRestingFromBronzeForcedWar(i.cur, toRest(i.rest));
    case 'isEligibleForIronForcedWar':
      return iron.isEligibleForIronForcedWar(i);
    case 'pickIronForcedWarTargetId':
      return iron.pickIronForcedWarTargetId(toCands(i.candidates), refOf(i.ref), webHexDistance, { blockedOwnerIds: new Set(i.blocked) });
    case 'isRestingFromIronForcedWar':
      return iron.isRestingFromIronForcedWar(i.cur, toRest(i.rest));
    case 'isIronEraEntry':
      return iron.isIronEraEntry(i.prev, i.next);
    case 'constant': {
      const all = { ...common, ...bronze, ...iron };
      if (!(i.name in all)) throw new Error(`nieznana stala ${i.name}`);
      return all[i.name];
    }
    default:
      throw new Error(`nieznana funkcja w wektorach: ${c.fn}`);
  }
}

// --- 4. Generatory wejsc ---
const cases = [];
const add = (fn, input) => cases.push({ fn, in: input, out: null });

const subj = (id, era) => ({ ownerId: id, q: rndInt(9) - 4, r: rndInt(9) - 4, era });

// 4a. Pairing: przypadki reczne (w tym przyklad kontrolny Evaluatora {1..4}, blok 1-4,2-3,3-4).
const NOP = { relations: null, exhausted: null, playerFirst: null };
const manual = [
  { subjects: [], pairs: [], blocked: [], ...NOP },
  { subjects: [subj(1, 'bronze')], pairs: [], blocked: [], ...NOP },
  { subjects: [{ ownerId: 1, q: 0, r: 0, era: 'stone' }, { ownerId: 2, q: 1, r: 0, era: 'bronze' }], pairs: [], blocked: [], ...NOP },
  { subjects: [{ ownerId: 1, q: 0, r: 0, era: 'bronze' }, { ownerId: 2, q: 1, r: 0, era: 'bronze' }, { ownerId: 3, q: 2, r: 0, era: 'bronze' }, { ownerId: 4, q: 3, r: 0, era: 'bronze' }], pairs: [], blocked: [[1, 4], [2, 3], [3, 4]], ...NOP },
  { subjects: [{ ownerId: 0, q: 0, r: 0, era: null }, { ownerId: 1, q: 1, r: 1, era: 'bronze' }, { ownerId: 2, q: 5, r: 0, era: 'iron' }], pairs: [], blocked: [], relations: null, exhausted: null, playerFirst: { playerOwnerId: 0, gateOpen: [1, 2], candidates: null } },
  { subjects: [{ ownerId: 0, q: 0, r: 0, era: null }, { ownerId: 1, q: 1, r: 1, era: 'bronze' }, { ownerId: 2, q: 5, r: 0, era: 'iron' }], pairs: [], blocked: [], relations: null, exhausted: null, playerFirst: { playerOwnerId: 0, gateOpen: [], candidates: null } },
  { subjects: [{ ownerId: 0, q: 0, r: 0, era: null }, { ownerId: 1, q: 1, r: 1, era: 'bronze' }, { ownerId: 2, q: 5, r: 0, era: 'iron' }], pairs: [], blocked: [[0, 1]], relations: [[0, 1, 100]], exhausted: null, playerFirst: { playerOwnerId: 0, gateOpen: [1, 2], candidates: null } },
  { subjects: [{ ownerId: 1, q: 0, r: 0, era: 'bronze' }, { ownerId: 2, q: 1, r: 0, era: 'bronze' }, { ownerId: 3, q: 2, r: 0, era: 'stone' }], pairs: [{ attackerId: 5, targetId: 6, era: 'iron' }], blocked: [], ...NOP },
  { subjects: [{ ownerId: 1, q: 0, r: 0, era: 'bronze' }, { ownerId: 2, q: 1, r: 0, era: 'bronze' }, { ownerId: 3, q: 2, r: 0, era: 'stone' }], pairs: [{ attackerId: 5, targetId: 6, era: 'iron' }], blocked: [[3, 5], [3, 6]], ...NOP },
  { subjects: [{ ownerId: 1, q: 0, r: 0, era: 'bronze' }, { ownerId: 2, q: 1, r: 0, era: 'bronze' }, { ownerId: 3, q: 2, r: 0, era: 'stone' }], pairs: [{ attackerId: 5, targetId: 6, era: 'iron' }], blocked: [], relations: null, exhausted: [5], playerFirst: null },
  { subjects: [{ ownerId: 1, q: 0, r: 0, era: 'bronze' }, { ownerId: 2, q: 1, r: 0, era: 'bronze' }, { ownerId: 3, q: 2, r: 0, era: 'stone' }], pairs: [{ attackerId: 5, targetId: 6, era: 'iron' }], blocked: [[1, 3]], ...NOP },
  { subjects: [{ ownerId: 0, q: 0, r: 0, era: null }, { ownerId: 1, q: 2, r: 0, era: 'bronze' }], pairs: [], blocked: [], ...NOP },
  { subjects: [{ ownerId: 1, q: 0, r: 0, era: 'iron' }, { ownerId: 2, q: 0, r: 0, era: 'iron' }], pairs: [{ attackerId: 3, targetId: 3, era: 'iron' }], blocked: [], ...NOP },
];
for (const m of manual) add('assignForcedWarPairings', m);

// 4b. Pairing: losowe (deterministyczne) + dwa przypadki > 24 (galaz zachlanna).
function randomPairing(nAi, withPlayer) {
  const subjects = [];
  if (withPlayer) subjects.push({ ownerId: 0, q: rndInt(9) - 4, r: rndInt(9) - 4, era: null });
  for (let k = 1; k <= nAi; k++) subjects.push(subj(k, ERAS[rndInt(3)]));
  const pairs = [];
  const nPairs = rndInt(4);
  for (let k = 0; k < nPairs; k++) {
    const a = 1 + rndInt(nAi + 3);
    const t = 1 + rndInt(nAi + 3);
    if (a !== t) pairs.push({ attackerId: a, targetId: t, era: ERAS[rndInt(3)] });
  }
  const ids = [...new Set([...subjects.map(s => s.ownerId), ...pairs.flatMap(p => [p.attackerId, p.targetId])])].sort((x, y) => x - y);
  const blocked = [];
  for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) if (rnd() < 0.3) blocked.push([ids[x], ids[y]]);
  const relations = rnd() < 0.5 ? null : ids.flatMap((x, xi) => ids.slice(xi + 1).filter(() => rnd() < 0.4).map(y => [x, y, rndInt(201)]));
  const exhausted = rnd() < 0.5 ? null : ids.filter(() => rnd() < 0.15);
  let playerFirst = null;
  if (rnd() < 0.5) {
    playerFirst = {
      playerOwnerId: 0,
      gateOpen: ids.filter(() => rnd() < 0.6),
      candidates: rnd() < 0.5 ? null : Array.from({ length: nAi + 2 }, (_, k) => subj(k + 1, ERAS[rndInt(3)])),
    };
  }
  return { subjects, pairs, blocked, relations, exhausted, playerFirst };
}
for (let k = 0; k < 70; k++) add('assignForcedWarPairings', randomPairing(rndInt(9), rnd() < 0.35));
for (let k = 0; k < 2; k++) {
  const big = Array.from({ length: 26 }, (_, j) => subj(j + 1, 'bronze'));
  add('assignForcedWarPairings', { subjects: big, pairs: [{ attackerId: 30, targetId: 31, era: 'iron' }], blocked: [[1, 2], [3, 4]], relations: null, exhausted: null, playerFirst: null });
}

// 4c. Stan zapisu (roundtrip restore -> serialize): brak `saved`, brak pol, duplikaty, brak startTurn.
function randomSaved() {
  if (rnd() < 0.1) return null;
  const o = {};
  if (rnd() < 0.8) o.pendingOwners = Array.from({ length: rndInt(5) }, () => rndInt(8));
  if (rnd() < 0.8) o.cycleOwners = Array.from({ length: rndInt(5) }, () => rndInt(8));
  if (rnd() < 0.8) o.restUntilByOwner = Array.from({ length: rndInt(4) }, () => [rndInt(8), rndInt(60)]);
  if (rnd() < 0.8) o.activeByPairKey = Array.from({ length: rndInt(4) }, () => {
    const a = rndInt(8);
    const t = rndInt(8);
    const v = { attackerId: a, targetId: t, capturedByAttacker: rndInt(3), capturedByDefender: rndInt(3) };
    if (rnd() < 0.6) v.startTurn = rndInt(80);
    return [pkey(a, t), v];
  });
  return o;
}
for (const fn of ['commonStateRoundtrip', 'bronzeStateRoundtrip', 'ironStateRoundtrip']) {
  add(fn, { saved: null });
  add(fn, { saved: {} });
  for (let k = 0; k < 12; k++) add(fn, { saved: randomSaved() });
}

// 4d. Bronze / Iron: kwalifikacja (progi N-1/N/N+1 wokol 20 tur od wejscia w epoke).
const ELIG_TURNS = [[0, 0], [25, 5], [25, 6], [26, 6], [30, 10], [40, 20], [40, 21], [40, 19], [-1, -2]];
for (const fn of ['isEligibleForBronzeForcedWar', 'isEligibleForIronForcedWar']) {
  for (const main of [true, false]) for (const war of [true, false]) {
    add(fn, { isMainAiCiv: main, isAlreadyAtWarAnyRole: war });
    for (const [cur, enter] of ELIG_TURNS) add(fn, { isMainAiCiv: main, isAlreadyAtWarAnyRole: war, currentTurn: cur, eraEnterTurn: enter });
  }
}

// 4e. Wybor celu (Bronze / Iron) i odpoczynek.
function randomTargetInput() {
  const n = rndInt(7);
  const candidates = Array.from({ length: n }, (_, k) => ({ ownerId: k + 1, q: rndInt(11) - 5, r: rndInt(11) - 5 }));
  const ref = rnd() < 0.15 ? null : { q: rndInt(11) - 5, r: rndInt(11) - 5 };
  const blocked = candidates.filter(() => rnd() < 0.3).map(c => c.ownerId);
  return { candidates, ref, blocked };
}
for (let k = 0; k < 25; k++) add('pickBronzeForcedWarTargetId', randomTargetInput());
for (let k = 0; k < 25; k++) add('pickIronForcedWarTargetId', randomTargetInput());
for (const fn of ['isRestingFromBronzeForcedWar', 'isRestingFromIronForcedWar']) {
  for (const [cur, rest] of [[10, null], [10, 10], [10, 11], [10, 9], [0, 0], [5, 20]]) add(fn, { cur, rest });
}
for (let p = 0; p <= 4; p++) for (let nx = 0; nx <= 4; nx++) add('isIronEraEntry', { prev: p, next: nx });

// 4f. Stale.
const CONSTS = [
  'FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD',
  'WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE', 'WOJNA_WYMUSZONA_ODPOCZYNEK_TUR',
  'WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR', 'WOJNA_WYMUSZONA_START_TURY_OD_EPOKI',
  'WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR',
  'EPOKA_ZELAZO_NUMER', 'WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE',
  'WOJNA_ZELAZO_WYMUSZONA_MAX_CZAS_TRWANIA_TUR', 'WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR',
  'WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR', 'WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI',
];
for (const name of CONSTS) add('constant', { name });

// --- 5. Przeliczenie przez web; tryb weryfikacji porownuje z plikiem ---
const existing = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, 'utf8')) : null;
let diffs = 0;
for (let idx = 0; idx < cases.length; idx++) {
  const c = cases[idx];
  const got = callWeb(c);
  c.out = JSON.parse(JSON.stringify(got === undefined ? null : got));
  if (existing && !write) {
    const e = existing[idx];
    if (!e || JSON.stringify(e.out) !== JSON.stringify(c.out) || JSON.stringify(e.in) !== JSON.stringify(c.in)) {
      diffs++;
      if (diffs <= 20) console.error('ROZNICA', idx, c.fn);
    }
  }
}
if (write) fs.writeFileSync(casesPath, JSON.stringify(cases, null, 1) + '\n');
console.log(`web-wektory G2: ${cases.length} przypadkow; roznic=${diffs}${write ? ' (zapisano)' : ' (tryb weryfikacji)'}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(diffs === 0 ? 0 : 1);
