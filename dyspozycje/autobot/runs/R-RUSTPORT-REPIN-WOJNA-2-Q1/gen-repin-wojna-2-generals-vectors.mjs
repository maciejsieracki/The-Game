// Generator wektorow REPIN-WOJNA-2 (U3 generals.ts, U4 generalQuickFollow.ts) z URUCHOMIONEGO kodu weba (pin dc8a3adc).
// Zrodla: gra/src/game/generals.ts oraz gra/src/game/generalQuickFollow.ts. Logika importowana BEZ ZMIAN.
// Jedyna modyfikacja: w KOPII w katalogu roboczym dopisane rozszerzenie '.ts' do importow wzglednych
// (node --experimental-strip-types nie rozwiazuje importow bez rozszerzenia). `import type` znika przy strip-types.
// Liczby zapisane jako tekst: String(x), '-0' dla minus zera; undefined -> 'undef' (tam gdzie wazne), null -> null.
//
// Uruchomienie: node --experimental-strip-types ./gen-repin-wojna-2-generals-vectors.mjs <WEB_ROOT> <WORK_DIR> <OUT_DIR>
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, workDir, outDir] = process.argv.slice(2);
if (!webRoot || !workDir || !outDir) throw new Error('uzycie: <WEB_ROOT> <WORK_DIR> <OUT_DIR>');

const SRC_DIR = join(webRoot, 'gra/src/game');
mkdirSync(workDir, { recursive: true });
const gensrc = readFileSync(join(SRC_DIR, 'generals.ts'), 'utf8');
const quicksrc = readFileSync(join(SRC_DIR, 'generalQuickFollow.ts'), 'utf8');
writeFileSync(join(workDir, 'generals.ts'), gensrc);
writeFileSync(join(workDir, 'planned-march.ts'), 'export type PlannedMarchDest = { destQ: number; destR: number; attackUnitId?: string; generalTargetId?: string };\n');
writeFileSync(
  join(workDir, 'generalQuickFollow.ts'),
  quicksrc.replace(/from '\.\/generals'/g, "from './generals.ts'").replace(/from '\.\/planned-march'/g, "from './planned-march.ts'"),
);
const G = await import(pathToFileURL(join(workDir, 'generals.ts')).href);
const Q = await import(pathToFileURL(join(workDir, 'generalQuickFollow.ts')).href);

// ---- kodowanie ----
const n = (x) => (x === undefined ? 'undef' : x === null ? 'null' : Object.is(x, -0) ? '-0' : String(x));
const sOrNull = (x) => (x === undefined || x === null ? null : x);
// deterministyczny generator pseudolosowy (LCG)
let seed = 20261030;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const NUM_POOL = [0, -0, 1, 2, 3, 4, -1, 0.5, 1.5, 2.7, 3.99, NaN, Infinity, -Infinity, 1e300];

// ---- generals.ts: limit / sloty / rekrutacja ----
const limit = [];
for (const era of [...NUM_POOL, 5, 6, 8, 10, 1e-300]) limit.push({ era: n(era), out: n(G.generalLimitForEra(era)) });

const slots = [];
for (let i = 0; i < 60; i++) {
  const count = { alive: pick(NUM_POOL), queued: pick(NUM_POOL) };
  slots.push({ alive: n(count.alive), queued: n(count.queued), out: n(G.generalSlotsUsed(count)) });
}
const canRecruit = [];
for (let i = 0; i < 120; i++) {
  const era = pick(NUM_POOL);
  const count = { alive: pick(NUM_POOL), queued: pick(NUM_POOL) };
  canRecruit.push({ era: n(era), alive: n(count.alive), queued: n(count.queued), out: G.canRecruitGeneral(era, count) });
}
const stone = [
  { hasWheel: false, out: G.stoneGeneralUnitId(false) },
  { hasWheel: true, out: G.stoneGeneralUnitId(true) },
];

const ITEM_POOL = ['Wojownik', 'Rydwan (woły)', '', 'Kapłan'];
const CITY_POOL = ['c1', 'c2', ''];
const purchase = [];
for (let i = 0; i < 600; i++) {
  // Kazdy przypadek jest poprawny we wszystkim poza JEDNYM wybranym defektem (albo brak defektu),
  // zeby kazda galaz walidacji byla dotknieta z pozostalymi warunkami spelnionymi.
  const defect = pick(['none', 'none', 'qty', 'city', 'itemEmpty', 'itemOther', 'costOther', 'costNaN', 'recruit', 'recruitNaN']);
  const requestedItemId = pick(ITEM_POOL); // moze byc '' (wtedy pusta oferta tez spelnia rowność)
  const requestedCost = pick([10, 0, 20]);
  const req = {
    cityId: defect === 'city' ? 'c2' : 'c1',
    capitalCityId: 'c1',
    era: pick([1, 2, 3, 0.5, 4, 2.9]),
    requestedQuantity: defect === 'qty' ? pick([2, 0, NaN]) : 1,
    requestedItemId,
    requestedCost: defect === 'costNaN' ? NaN : requestedCost,
    offeredItemId: defect === 'itemEmpty' ? '' : defect === 'itemOther' ? pick(['Kapłan', 'Wojownik'].filter((x) => x !== requestedItemId)) : requestedItemId,
    offeredCost: defect === 'costOther' ? pick([0, 20, 99]) : defect === 'costNaN' ? NaN : requestedCost,
    alive: defect === 'recruit' ? 2 : defect === 'recruitNaN' ? NaN : pick([0, 1]),
    queued: pick([0, 1]),
  };
  if (defect === 'none' && rnd() < 0.3) req.offeredItemId = null;
  if (defect === 'none' && rnd() < 0.1) req.era = NaN;
  const purchaseResult = rnd() < 0.5;
  let called = false;
  const out = G.attemptGeneralPurchase(req, () => {
    called = true;
    return purchaseResult;
  });
  purchase.push({
    request: {
      cityId: req.cityId,
      capitalCityId: req.capitalCityId,
      era: n(req.era),
      requestedQuantity: n(req.requestedQuantity),
      requestedItemId: req.requestedItemId,
      requestedCost: n(req.requestedCost),
      offeredItemId: sOrNull(req.offeredItemId),
      offeredCost: req.offeredCost === null ? null : n(req.offeredCost),
      alive: n(req.alive),
      queued: n(req.queued),
    },
    purchaseReturns: purchaseResult,
    out,
    called,
  });
}

// ---- jednostki / rosters ----
const ROSTER_IDS = ['g1', 'g2', 'g10', 'G3', 'a', 'Zed', 'k_1', 'u7', 'b', 'B'];
const ROSTER_OWNERS = [0, 0, 0, 1];
function makeUnit(id, owner, q, r, opts = {}) {
  const u = { id, ownerId: owner, q, r };
  for (const k of Object.keys(opts)) if (opts[k] !== undefined) u[k] = opts[k];
  return u;
}
function randomUnit(id, forceGeneral) {
  const flags = {};
  if (forceGeneral || rnd() < 0.35) flags.isGeneral = true;
  if (rnd() < 0.1) flags.dead = true;
  if (rnd() < 0.08) flags.removed = true;
  if (rnd() < 0.08) flags.routed = true;
  if (rnd() < 0.2) flags.hp = pick([0, -1, 1, 5, NaN, undefined]);
  if (rnd() < 0.1) flags.inGarnizon = true;
  if (rnd() < 0.08) flags.oblegaCityId = pick(['c1', '']);
  if (rnd() < 0.5) flags.followGeneral = pick([true, true, false]);
  return makeUnit(id, pick(ROSTER_OWNERS), randInt(-2, 4), randInt(-2, 4), flags);
}
// JSON jednostki: pola opcjonalne pomijane gdy undefined; liczby jako tekst
function encUnit(u) {
  const o = { id: u.id, ownerId: n(u.ownerId), q: n(u.q), r: n(u.r) };
  for (const k of ['isGeneral', 'dead', 'removed', 'routed', 'inGarnizon', 'followGeneral']) {
    if (u[k] !== undefined) o[k] = u[k];
  }
  if (u.hp !== undefined) o.hp = n(u.hp);
  if (u.oblegaCityId !== undefined) o.oblegaCityId = u.oblegaCityId;
  return o;
}
const encRosterFor = (roster) => roster.map(encUnit);
function pickIds(count) {
  const pool = [...ROSTER_IDS];
  const out = [];
  for (let i = 0; i < count && pool.length; i++) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
}
function encDest(d) {
  const o = { destQ: n(d.destQ), destR: n(d.destR) };
  if (d.generalTargetId !== undefined) o.generalTargetId = d.generalTargetId;
  if (d.attackUnitId !== undefined) o.attackUnitId = d.attackUnitId;
  return o;
}

// ---- generals.ts: follow / nearest / batch ----
const nearest = [];
for (let i = 0; i < 260; i++) {
  const roster = pickIds(randInt(1, 6)).map((id) => randomUnit(id, rnd() < 0.5));
  const unit = randomUnit('self', false);
  // NaN we wspolrzednych jednostki: wszystkie odleglosci NaN -> sortowanie tylko po id (ssp. zachowanie).
  if (rnd() < 0.15) unit.q = NaN;
  const rost = [...roster];
  if (rnd() < 0.5) rost.push(makeUnit('self', unit.ownerId, unit.q, unit.r, {}));
  const near = G.nearestLivingGeneral(unit, rost);
  nearest.push({ unit: encUnit(unit), roster: encRosterFor(rost), out: near ? near.id : null });
}
const followDest = [];
for (let i = 0; i < 160; i++) {
  const unit = randomUnit('u', false);
  const general = rnd() < 0.2 ? undefined : randomUnit('g', rnd() < 0.6);
  if (general && rnd() < 0.5) general.ownerId = unit.ownerId;
  const d = G.generalFollowDestination(unit, general);
  followDest.push({
    unit: encUnit(unit),
    general: general ? encUnit(general) : null,
    out: d ? { q: n(d.point.q), r: n(d.point.r), generalTargetId: d.generalTargetId } : null,
  });
}
const batch = [];
for (let i = 0; i < 80; i++) {
  const ids = pickIds(randInt(0, 5));
  const table = {};
  for (const id of ids) table[id] = rnd() < 0.5;
  const enq = [];
  const marching = G.planDeferredGeneralMarchBatch(
    ids,
    (id) => table[id],
    (list) => enq.push([...list]),
  );
  batch.push({ unitIds: ids, planResult: table, marching, enqueued: enq });
}

// ---- generalQuickFollow.ts ----
const labels = [];
for (const title of ['Wódz', 'Generał']) {
  for (const active of [false, true]) {
    labels.push({ title, active, genitive: Q.commanderTitleGenitive(title), label: Q.generalQuickFollowActionLabel(title, active) });
  }
}
labels.push({ title: 'Wódz', active: false, genitive: 'wodza', label: Q.generalQuickFollowActionLabel('Wódz') });

const planEnabled = [];
for (let i = 0; i < 260; i++) {
  const roster = pickIds(randInt(1, 6)).map((id) => randomUnit(id, rnd() < 0.4));
  if (rnd() < 0.15) roster[0].q = NaN;
  const hasMarch = {};
  for (const u of roster) if (rnd() < 0.2) hasMarch[u.id] = true;
  const planTable = {};
  for (const u of roster) planTable[u.id] = rnd() < 0.7;
  const calls = [];
  const planned = Q.planEnabledGeneralFollowMarches(
    roster,
    (id) => hasMarch[id] === true,
    (unit, point, targetId) => {
      calls.push([unit.id, n(point.q), n(point.r), targetId]);
      return planTable[unit.id] === true;
    },
  );
  planEnabled.push({ roster: encRosterFor(roster), hasMarch: Object.keys(hasMarch), planResult: planTable, planned, calls });
}

const issue = [];
for (let i = 0; i < 260; i++) {
  const roster = pickIds(randInt(1, 6)).map((id) => randomUnit(id, rnd() < 0.5));
  const unit = roster[0];
  // 75%: jednostka kwalifikuje sie do podazania (nie generał, nie w garnizonie, bez oblegi)
  if (rnd() < 0.75) {
    delete unit.isGeneral;
    delete unit.inGarnizon;
    delete unit.oblegaCityId;
  }
  if (rnd() < 0.1) unit.q = NaN;
  // 30%: zywy generał tego samego wlasciciela na heksie jednostki (dystans 0 -> 'unavailable')
  if (rnd() < 0.3) {
    roster.push(makeUnit('gz', unit.ownerId, unit.q, unit.r, { isGeneral: true }));
  }
  const title = pick(['Wódz', 'Generał']);
  const planResult = rnd() < 0.6;
  const movementLeft = pick([0, 1, 2, -1, NaN, 3]);
  const calls = [];
  const notes = [];
  const enq = [];
  let refreshes = 0;
  const result = Q.issueGeneralQuickFollow(unit, roster, title, {
    planMarch: (u, point, targetId) => {
      calls.push([u.id, n(point.q), n(point.r), targetId]);
      return planResult;
    },
    movementLeft: () => movementLeft,
    enqueue: (list) => enq.push([...list]),
    notify: (message, durationMs) => notes.push([message, n(durationMs)]),
    refresh: () => {
      refreshes += 1;
    },
  });
  issue.push({
    unit: encUnit(unit),
    roster: encRosterFor(roster),
    title,
    planResult,
    movementLeft: n(movementLeft),
    out: result,
    calls,
    notes,
    enqueued: enq,
    refreshes,
  });
}

// planTrackedGeneralFollowMarch: planner stub zapisujacy kolejnosc wywolan
const tracked = [];
for (let i = 0; i < 220; i++) {
  const unit = randomUnit(pick(['u1', 'u2', 'u3']), false);
  unit.ownerId = pick([0, 0, 1]);
  const point = { q: randInt(-2, 4), r: randInt(-2, 4) };
  const generalTargetId = pick([undefined, '', 'g1', 'g2']);
  const markAsPlayerIssued = rnd() < 0.7;
  const canOccupyResult = rnd() < 0.8;
  const reachable = rnd() < 0.8;
  const fullPathLen = pick([0, 1, 3]);
  const perTurn = pick([1, 2, 0, NaN]);
  const occupied = rnd() < 0.5 ? ['1,1', '0,0'] : [];
  const initial = [];
  for (const id of ['u1', 'u2', 'z9']) {
    if (rnd() < 0.3) {
      const d = { destQ: randInt(-2, 4), destR: randInt(-2, 4) };
      if (rnd() < 0.5) d.generalTargetId = pick(['g1', 'g2']);
      if (rnd() < 0.3) d.attackUnitId = 'e1';
      initial.push([id, d]);
    }
  }
  const log = [];
  const marches = new Map(initial);
  const planner = {
    playerOwnerId: 0,
    canOccupy: () => canOccupyResult,
    movementContext: (u) => ({ mover: u, occupied: new Set(occupied), perTurn }),
    pathPlan: () => ({ reachable, fullPath: new Array(fullPathLen).fill(0) }),
    clearAutoExplore: (u) => log.push(['clear', u.id]),
    markPlayerMoved: (id) => log.push(['mark', id]),
    marches,
    syncAttackTarget: (id, dest) => log.push(['sync', id, n(dest.destQ), n(dest.destR), dest.generalTargetId ?? null]),
  };
  const out = Q.planTrackedGeneralFollowMarch(unit, point, generalTargetId, planner, markAsPlayerIssued);
  tracked.push({
    unit: encUnit(unit),
    point: { q: n(point.q), r: n(point.r) },
    generalTargetId: sOrNull(generalTargetId),
    markAsPlayerIssued,
    canOccupy: canOccupyResult,
    reachable,
    fullPathLen,
    perTurn: n(perTurn),
    occupied,
    initial: initial.map(([id, d]) => [id, encDest(d)]),
    out,
    log,
    marches: [...marches].map(([id, d]) => [id, encDest(d)]),
  });
}

// syncTrackedGeneralFollowMarches
const sync = [];
for (let i = 0; i < 260; i++) {
  const ids = pickIds(randInt(1, 6));
  const units = ids.map((id) => randomUnit(id, rnd() < 0.5));
  const initial = [];
  for (const id of [...ids, 'zz']) {
    if (rnd() < 0.55) {
      const d = { destQ: randInt(-2, 4), destR: randInt(-2, 4) };
      if (rnd() < 0.8) d.generalTargetId = pick([...ids, '', 'nope']);
      if (rnd() < 0.2) d.attackUnitId = 'e1';
      initial.push([id, d]);
    }
  }
  const marches = new Map(initial);
  const cleared = [];
  Q.syncTrackedGeneralFollowMarches(units, marches, (id) => cleared.push(id));
  sync.push({
    units: encRosterFor(units),
    initial: initial.map(([id, d]) => [id, encDest(d)]),
    cleared,
    marches: [...marches].map(([id, d]) => [id, encDest(d)]),
  });
}

const meta = {
  pin: 'dc8a3adc989bc82aab2cde6bb747c883f949fc1a',
  generator: 'gen-repin-wojna-2-generals-vectors.mjs (U3/U4 r2)',
  node: process.version,
  sourceSha256: {
    'gra/src/game/generals.ts': createHash('sha256').update(gensrc).digest('hex'),
    'gra/src/game/generalQuickFollow.ts': createHash('sha256').update(quicksrc).digest('hex'),
  },
};
writeFileSync(join(outDir, 'generals.json'), JSON.stringify({ ...meta, limit, slots, canRecruit, stone, purchase, nearest, followDest, batch }, null, 1) + '\n');
writeFileSync(join(outDir, 'general-quick-follow.json'), JSON.stringify({ ...meta, labels, planEnabled, issue, tracked, sync }, null, 1) + '\n');
console.log(
  JSON.stringify({
    limit: limit.length, slots: slots.length, canRecruit: canRecruit.length,
    purchase: purchase.length, purchaseCalled: purchase.filter((p) => p.called).length,
    nearest: nearest.length, followDest: followDest.length, batch: batch.length,
    labels: labels.length, planEnabled: planEnabled.length, issue: issue.length,
    tracked: tracked.length, sync: sync.length,
  }),
);
