// P6-REPIN-ARMIA-FOLLOW-AUTOMERGE (FALA 569, R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1):
// generator wektorow `followLeaderAutoMergeDecision` i `canJoinStackAt` z URUCHOMIONEGO weba.
//
// Uzycie (Node 22.13+):
//   node p6_repin_armia_follow_gen.mjs <katalog-gra-src-game> <wyjscie.json>
// gdzie <katalog-gra-src-game> to `gra/src/game` z `origin/main`
// (np. `git archive origin/main gra/src | tar -x -C <katalog-POZA-repo>`).
//
// Jedyny patch: moduly `army-stack-limit.ts` i `army-follow-auto-merge.ts` sa sklejane w jeden
// modul (import miedzy nimi zastapiony definicjami z pierwszego pliku), bo import bez rozszerzenia
// `./army-stack-limit` nie laduje sie w Node. Typy TS usuwa `stripTypeScriptTypes` (bez zmian logiki).
//
// Scenariusze: kartezjanski zestaw malych przypadkow (limity 1..5 i 500, 0..3 wchodzacych,
// 0..2 stojacych wlasnych, wodz / brak wodza, flagi followGeneral true/false/undefined,
// isGeneral true/false/undefined, obce jednostki na heksie, wlasne jednostki na innym heksie)
// + deterministyczne losowe (PRNG mulberry32, seed 569) dla szerszego pokrycia.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stripTypeScriptTypes } from 'node:module';
import { pathToFileURL } from 'node:url';

const [srcDir, outPath] = process.argv.slice(2);
if (!srcDir || !outPath) {
  console.error('uzycie: node p6_repin_armia_follow_gen.mjs <katalog-gra-src-game> <wyjscie.json>');
  process.exit(2);
}

const stackSrc = readFileSync(join(srcDir, 'army-stack-limit.ts'), 'utf8');
const followSrc = readFileSync(join(srcDir, 'army-follow-auto-merge.ts'), 'utf8');
const importLine = "import { canJoinStackAt, type StackUnitLike } from './army-stack-limit';";
if (!followSrc.includes(importLine)) {
  console.error('brak oczekiwanego importu z ./army-stack-limit w army-follow-auto-merge.ts');
  process.exit(3);
}
const joined = stackSrc + '\n' + followSrc.replace(importLine, '');
const js = stripTypeScriptTypes(joined, { mode: 'strip' });

const dir = mkdtempSync(join(tmpdir(), 'armia-follow-'));
const modPath = join(dir, 'armia-follow.mjs');
writeFileSync(modPath, js);
const mod = await import(pathToFileURL(modPath).href);
rmSync(dir, { recursive: true, force: true });

const { followLeaderAutoMergeDecision, canJoinStackAt } = mod;
if (typeof followLeaderAutoMergeDecision !== 'function' || typeof canJoinStackAt !== 'function') {
  console.error('brak eksportow followLeaderAutoMergeDecision / canJoinStackAt');
  process.exit(4);
}

// PRNG mulberry32 (deterministyczny).
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FOLLOW_OPTS = [true, false, undefined];
const GENERAL_OPTS = [false, true, undefined];

// Jednostka: [id, ownerId, q, r, followGeneral, isGeneral] (undefined -> null w JSON).
function unitOf(id, ownerId, q, r, follow, general) {
  return { id, ownerId, q, r, followGeneral: follow, isGeneral: general };
}

/**
 * Buduje jeden scenariusz.
 * tq,tr - heks docelowy; existing - wlasne jednostki juz stojace na tq,tr (moga byc generalem);
 * arriving - wchodzace (followGeneral/isGeneral wg spec); foreign - jednostki wlasciciela 1 na tq,tr;
 * elsewhere - jednostki wlasciciela 0 na innym heksie (nie licza sie do limitu na tq,tr).
 */
function build({ tq, tr, limit, existing, arriving, foreign, elsewhere }) {
  const units = [];
  const existingIds = [];
  const arrivingIds = [];
  existing.forEach((spec, i) => {
    const u = unitOf(`E${i}`, 0, tq, tr, spec.follow, spec.general);
    units.push(u);
    existingIds.push(u.id);
  });
  arriving.forEach((spec, i) => {
    // Wchodzaca jednostka jest na swoim heksie poprzedzajacym (nie na tq,tr); w `units` wystepuje
    // zarowno jako "w ruchu", jak i - w czesci scenariuszy - rowniez na tq,tr (dubel id nie wystepuje).
    const onTarget = spec.onTarget === true;
    const u = unitOf(`A${i}`, 0, onTarget ? tq : tq + 1, onTarget ? tr : tr, spec.follow, spec.general);
    units.push(u);
    arrivingIds.push(u.id);
  });
  foreign.forEach((spec, i) => {
    units.push(unitOf(`F${i}`, 1, tq, tr, spec.follow, spec.general));
  });
  elsewhere.forEach((spec, i) => {
    units.push(unitOf(`W${i}`, 0, tq + 7, tr - 3, spec.follow, spec.general));
  });
  return { q: tq, r: tr, limit, units, existingIds, arrivingIds };
}

function evaluate(sc) {
  const byId = new Map(sc.units.map(u => [u.id, u]));
  const arriving = sc.arrivingIds.map(id => byId.get(id));
  const existing = sc.existingIds.map(id => byId.get(id));
  const decision = followLeaderAutoMergeDecision(sc.units, arriving, existing, sc.q, sc.r, sc.limit);
  const canJoin = canJoinStackAt(sc.units, arriving, sc.q, sc.r, sc.limit);
  return { decision, canJoin };
}

function encodeUnit(u) {
  const enc = v => (v === undefined ? null : v);
  return [u.id, u.ownerId, u.q, u.r, enc(u.followGeneral), enc(u.isGeneral)];
}

const scenarios = [];
const seen = new Set();
function push(name, sc) {
  const { decision, canJoin } = evaluate(sc);
  const key = JSON.stringify([sc.q, sc.r, sc.limit, sc.units.map(encodeUnit), sc.arrivingIds, sc.existingIds]);
  if (seen.has(key)) return;
  seen.add(key);
  scenarios.push({
    name,
    q: sc.q,
    r: sc.r,
    limit: sc.limit,
    units: sc.units.map(encodeUnit),
    arriving: sc.arrivingIds,
    existing: sc.existingIds,
    decision,
    canJoin,
  });
}

// 1) Kartezjanski zestaw malych przypadkow.
const LIMITS = [1, 2, 3, 4, 5, 500];
const TARGETS = [[0, 0], [-3, 4]];
const ARR_OPTS = [
  { follow: true, general: false },
  { follow: false, general: false },
  { follow: undefined, general: false },
  { follow: true, general: true },
];
const EXIST_OPTS = [
  { follow: false, general: false },
  { follow: true, general: true },
  { follow: undefined, general: undefined },
];

function combos(n, opts) {
  if (n === 0) return [[]];
  const out = [];
  for (const rest of combos(n - 1, opts)) for (const o of opts) out.push([o, ...rest]);
  return out;
}

let idx = 0;
// 1a) Maly kartezjanski zestaw: 1 wodz/wlasna jednostka na heksie, 1-2 wchodzace.
for (const limit of LIMITS) {
  for (const [tq, tr] of TARGETS) {
    for (let ne = 1; ne <= 1; ne++) {
      for (const existing of combos(ne, EXIST_OPTS)) {
        for (let na = 1; na <= 2; na++) {
          for (const arriving of combos(na, ARR_OPTS)) {
            const variant = idx % 3 === 0;
            const arr = arriving.map((a, i) => ({ ...a, onTarget: variant && i === 0 }));
            push(`kart-L${limit}-E${ne}-A${na}-#${idx}`, build({ tq, tr, limit, existing, arriving: arr, foreign: [], elsewhere: [] }));
            idx++;
          }
        }
      }
    }
  }
}

// 1b) Deterministyczne losowe (PRNG mulberry32, seed 569), z przewaga wodzow i flag podazania.
const rng = mulberry32(569);
const pick = arr => arr[Math.floor(rng() * arr.length)];
const randInt = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const chance = p => rng() < p;
for (let k = 0; k < 2400; k++) {
  const limit = pick([1, 2, 3, 4, 5, 6, 8, 12, 500]);
  const [tq, tr] = pick(TARGETS);
  const ne = randInt(0, 3);
  const existing = Array.from({ length: ne }, () => (chance(0.4) ? EXIST_OPTS[1] : pick(EXIST_OPTS)));
  const na = randInt(1, 4);
  const arriving = Array.from({ length: na }, () =>
    chance(0.7)
      ? { follow: true, general: chance(0.85) ? false : true, onTarget: chance(0.2) }
      : { ...pick(ARR_OPTS), onTarget: chance(0.2) },
  );
  const foreign = Array.from({ length: randInt(0, 2) }, () => pick(EXIST_OPTS));
  const elsewhere = Array.from({ length: randInt(0, 2) }, () => pick(EXIST_OPTS));
  push(`losowy-${k}`, build({ tq, tr, limit, existing, arriving, foreign, elsewhere }));
}

const out = {
  source: 'origin/main gra/src/game/army-follow-auto-merge.ts + army-stack-limit.ts (R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1, FALA 569)',
  generator: 'tests/p6_repin_armia_follow_gen.mjs (Node 22, stripTypeScriptTypes)',
  count: scenarios.length,
  scenarios,
};
writeFileSync(outPath, JSON.stringify(out) + '\n');
const tally = {};
for (const s of scenarios) tally[s.decision] = (tally[s.decision] ?? 0) + 1;
console.log(`scenariuszy: ${scenarios.length}; decyzje: ${JSON.stringify(tally)}`);
