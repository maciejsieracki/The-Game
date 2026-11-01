// Generator wektorow REPIN-WOJNA-3 (hook marszu generala: generalQuickFollow <-> planned-march <-> zapis).
// PIN weba: 4bbef081d. Kod weba URUCHAMIANY BEZ ZMIAN (node --experimental-strip-types):
//   gra/src/game/generals.ts, generalQuickFollow.ts (jedyna zmiana: `from './generals'` -> `'./generals.ts'`,
//   bo strip-types wymaga rozszerzenia), planned-march.ts linie 13-31 + 425-490 (wyciete dosłownie, jak w
//   R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-r3-planned-march.mjs; reszta pliku importuje caly lancuch gry).
// Zero buildu w gra/: zrodla pochodza z `git archive 4bbef081d` do katalogu poza repo.
//
// Uruchomienie: node --experimental-strip-types gen-repin-wojna-3-hook-vectors.mjs <PIN_ROOT> <WORK_DIR> <OUT_FILE>
//
// Scenariusz (jak `syncGeneralMarchTargets`, main.ts:28237-28250 @ 4bbef081d + zapis main.ts:33399/33458-33459 +
// odczyt main.ts:42052): roster -> syncTracked -> planEnabled (planMarch = REALNE planTrackedGeneralFollowMarch ze
// stubem plannera) -> plannedMarchesToSave -> JSON.stringify/parse -> plannedMarchesFromSave.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [pinRoot, workDir, outFile] = process.argv.slice(2);
if (!pinRoot || !workDir || !outFile) throw new Error('uzycie: <PIN_ROOT> <WORK_DIR> <OUT_FILE>');

const game = join(pinRoot, 'gra/src/game');
const pmSrc = readFileSync(join(game, 'planned-march.ts'), 'utf8').split('\n');
const lineRange = (a, b) => pmSrc.slice(a - 1, b).join('\n');
const fnBlock = lineRange(425, 490);
if (!fnBlock.includes('export function validateAutoMarchFromSave')) throw new Error('zla linia validateAutoMarchFromSave');
if (!fnBlock.includes('export function plannedMarchesToSave')) throw new Error('zla linia plannedMarchesToSave');
mkdirSync(workDir, { recursive: true });
writeFileSync(
  join(workDir, 'pm-save.ts'),
  ['type RuntimeUnit = { id: string; ownerId: number; q: number; r: number };', lineRange(13, 31), fnBlock, ''].join('\n'),
);
const PM = await import(pathToFileURL(join(workDir, 'pm-save.ts')).href);
const GQ = await import(pathToFileURL(join(game, 'generalQuickFollow.ts')).href);

// Kontrola pinu: wyrazenia glue z main.ts (jesli podano main.ts w PIN_ROOT) - opcjonalne.
let mainChecks = null;
try {
  const main = readFileSync(join(pinRoot, 'gra/src/main.ts'), 'utf8');
  const must = [
    'syncTrackedGeneralFollowMarches(units, plannedMarches, unitId => marchAttackTargets.delete(unitId));',
    'if (plannedMarches.get(u.id)?.generalTargetId) clearPlannedMarch(u.id, true);',
    'plannedMarches.get(newUnitId)?.generalTargetId != null',
    'if (unit && planningStackRuchLeft(playerStackAt(unit)) > 0 && !marchExecQueue.includes(unitId)) {',
    'marchExecQueue.push(unitId);',
    'const marchSave = plannedMarchesToSave(plannedMarches);',
    'const loadedMarches = plannedMarchesFromSave(saved.autoMarch, saved.plannedMarches, units, 0);',
  ];
  mainChecks = must.map((s) => [s, main.includes(s)]);
  for (const [s, ok] of mainChecks) if (!ok) throw new Error('brak wyrazenia w main.ts: ' + s);
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}

let seed = 20261101;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
// Liczby jako tekst (zachowanie -0/NaN), jak w wektorach wojna-2.
const s = (x) => String(x);

const N = 700;
const cases = [];
const stats = {
  cases: N, marchesBefore: 0, syncDeleted: 0, syncMoved: 0, newlyPlanned: 0, withGeneral: 0,
  savedEntries: 0, loadedEntries: 0, loadedWithGeneral: 0, loadedStaleKept: 0, orderNonAlpha: 0,
  followOffClear: 0, preplannedNotNull: 0,
};

for (let c = 0; c < N; c++) {
  const nGen = randInt(1, 2);
  const nFol = randInt(1, 4);
  const units = [];
  for (let i = 0; i < nGen; i++) {
    const u = { id: `g${i}`, ownerId: rnd() < 0.9 ? 0 : 1, q: randInt(0, 4), r: randInt(0, 4), isGeneral: true };
    if (rnd() < 0.12) u.dead = true;
    if (rnd() < 0.08) u.routed = true;
    if (rnd() < 0.08) u.removed = true;
    if (rnd() < 0.15) u.hp = pick([0, -1, 5]);
    units.push(u);
  }
  // zywe identyfikatory celowo NIE w kolejnosci alfabetycznej wstawiania (test kolejnosci kluczy obiektu)
  const folIds = ['z9', 'a1', 'm5', 'b2', 'k3'].slice(0, nFol);
  for (const id of folIds) {
    const u = { id, ownerId: rnd() < 0.9 ? 0 : 1, q: randInt(0, 4), r: randInt(0, 4), followGeneral: rnd() < 0.7 };
    if (rnd() < 0.1) u.inGarnizon = true;
    if (rnd() < 0.08) u.oblegaCityId = 'city1';
    if (rnd() < 0.05) u.isGeneral = false;
    units.push(u);
  }
  // marsze poczatkowe (kolejnosc wstawiania losowa)
  const initial = [];
  const ids = units.map((u) => u.id);
  const order = [...ids].sort(() => rnd() - 0.5);
  for (const id of order) {
    if (rnd() < 0.55) continue;
    const dest = { destQ: randInt(0, 4), destR: randInt(0, 4) };
    if (rnd() < 0.3) dest.attackUnitId = pick(['x1', '', 'z9']);
    if (rnd() < 0.6) dest.generalTargetId = pick(['g0', 'g1', 'ghost', 'a1', '']);
    initial.push([id, dest]);
  }
  const blocked = new Set();
  if (rnd() < 0.15) blocked.add(pick(ids));
  const reachableAll = rnd() < 0.9;
  stats.marchesBefore += initial.length;

  const marches = new Map(initial.map(([k, v]) => [k, { ...v }]));
  const cleared = [];
  GQ.syncTrackedGeneralFollowMarches(units, marches, (id) => cleared.push(id));
  const afterSync = [...marches].map(([k, v]) => [k, v]);
  const log = [];
  const planner = {
    playerOwnerId: 0,
    canOccupy: (u) => !blocked.has(u.id),
    movementContext: (u) => ({ mover: u, occupied: new Set(), perTurn: 3 }),
    pathPlan: () => ({ reachable: reachableAll, fullPath: reachableAll ? [{ q: 0, r: 0 }] : [] }),
    clearAutoExplore: (u) => log.push(['clear', u.id]),
    markPlayerMoved: (id) => log.push(['mark', id]),
    marches,
    syncAttackTarget: (id) => log.push(['sync', id]),
  };
  const newly = GQ.planEnabledGeneralFollowMarches(
    units,
    (id) => marches.has(id),
    (u, point, targetId) => GQ.planTrackedGeneralFollowMarch(u, point, targetId, planner, false),
  );
  const afterPlan = [...marches].map(([k, v]) => [k, v]);
  // main.ts:28241-28246 (glue, 1:1): jednostka nowo zaplanowana -> kolejka wykonania, gdy ma ruch i nie jest w kolejce.
  // planningStackRuchLeft(playerStackAt(unit)) modelowane regula (q+r) parzyste => 2, inaczej 0 (wejscie wektora).
  const ruchLeft = (u) => ((u.q + u.r) % 2 === 0 ? 2 : 0);
  const execQueue = ids.filter(() => rnd() < 0.15);
  const execQueueBefore = [...execQueue];
  for (const unitId of newly) {
    const unit = units.find((candidate) => candidate.id === unitId);
    if (unit && ruchLeft(unit) > 0 && !execQueue.includes(unitId)) {
      execQueue.push(unitId);
    }
  }

  const saveOut = PM.plannedMarchesToSave(marches);
  const saveJson = JSON.stringify({ autoMarch: saveOut.autoMarch, plannedMarches: saveOut.plannedMarches });
  const parsed = JSON.parse(saveJson);
  const loaded = PM.plannedMarchesFromSave(parsed.autoMarch, parsed.plannedMarches, units, 0);
  const loadedArr = [...loaded].map(([k, v]) => [k, v]);

  // kolejnosc kluczy po JSON.parse (web: kolejnosc wstawiania dla nie-indeksowych kluczy)
  const keysAfterParse = parsed.plannedMarches ? Object.keys(parsed.plannedMarches) : [];
  if (keysAfterParse.join() !== [...keysAfterParse].sort().join()) stats.orderNonAlpha++;

  // glue main.ts:23497 (wylaczenie "Idz do wodza") i :13393 (autoMarchingToGeneral dla preplanned)
  const follow = units.filter((u) => u.id !== 'g0' && u.id !== 'g1');
  const followOff = follow.map((u) => [u.id, !!marches.get(u.id)?.generalTargetId]);
  const preplanned = follow.map((u) => [u.id, marches.get(u.id)?.generalTargetId != null]);
  stats.followOffClear += followOff.filter((x) => x[1]).length;
  stats.preplannedNotNull += preplanned.filter((x) => x[1]).length;

  stats.syncDeleted += cleared.length;
  stats.newlyPlanned += newly.length;
  stats.withGeneral += afterPlan.filter(([, v]) => v.generalTargetId).length;
  stats.savedEntries += saveOut.plannedMarches ? Object.keys(saveOut.plannedMarches).length : 0;
  stats.loadedEntries += loadedArr.length;
  stats.loadedWithGeneral += loadedArr.filter(([, v]) => v.generalTargetId).length;
  stats.syncMoved += afterSync.filter(([k, v]) => {
    const i = initial.find((e) => e[0] === k);
    return i && (i[1].destQ !== v.destQ || i[1].destR !== v.destR);
  }).length;
  stats.loadedStaleKept += loadedArr.filter(([k, v]) => {
    const u = units.find((x) => x.id === k);
    return u && u.q === v.destQ && u.r === v.destR && v.generalTargetId;
  }).length;

  cases.push({
    units: units.map((u) => ({ ...u, ownerId: s(u.ownerId), q: s(u.q), r: s(u.r), ...(u.hp !== undefined ? { hp: s(u.hp) } : {}) })),
    initial,
    blocked: [...blocked],
    reachable: reachableAll,
    cleared,
    afterSync,
    newly,
    execQueueBefore,
    execQueue,
    afterPlan,
    log,
    saveJson,
    loaded: loadedArr,
    followOff,
    preplanned,
  });
}

writeFileSync(outFile, JSON.stringify({ pin: '4bbef081d', stats, mainChecks, cases }));
process.stdout.write(JSON.stringify(stats) + '\n');
