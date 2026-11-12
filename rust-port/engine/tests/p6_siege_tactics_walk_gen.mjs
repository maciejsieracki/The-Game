// P6 SIEGE-TAKTYKA K1b (#217, runda 1 Operatora): generator wektorow z kodu weba (pin 07d2fbd72, gra/src/battle/battleScene.ts).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_walk_gen.mjs
// Wycieta logika (bez typow TS, bez `this.`, reczne wyciecie jak w p6_siege_tactics_approach_gen.mjs):
//   _siegeMoveRefused 7962-7970 (+ _siegeApproachRestricted 7951-7960 jako warunek bramki),
//   _bfsFirstStep 7973-8003, _siegeWalkTo 8006-8019, galezie odmowy _doMove 8685-8693.
// Efekty sceny (_doMove: occByKey, koszt ruchu, facing, animacja; _schedule: kolejka timerow) NIE sa wycinane:
// w wektorach koszt wejscia `cost(c,r)` i `_schedule` sa jawnymi wejsciami/wyjsciami driver-a `walkRun` (ponizej).
// Wynik -> p6_siege_tactics_walk_vectors/vectors.json.
// OGRANICZENIE (K1b r2, zarzut recenzenta): kopie funkcji ponizej sa wycinane RECZNIE. Straznik SHA-256 haszuje tekst
// fragmentow pinu, a NIE kopie w tym pliku, wiec dryf kopii wzgledem pinu nie zostanie automatycznie wykryty
// (ten sam wzorzec co K0b/K1). Zgodnosc kopii z pinem 07d2fbd72 sprawdzona recznie w K1b r2 (porownanie linia po linii
// _bfsFirstStep i driver _siegeWalkTo + bramka _doMove): zgodne, poza jawnymi wejsciami (isGoal -> goalSet, koszt -> COST).
// Pelne usuniecie ryzyka (wykonanie tekstu pinu zamiast kopii) = osobny temat, poza zakresem K1b.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Straznik zrodla: wyciete fragmenty musza byc BAJT W BAJT tekstem z pinu (git show, bez checkoutu).
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const FRAGMENT_SHA256_WALK = '74ef696158ac76c75d64a8f4912a1f2c404c5a19b1396854f432abb8cec4ce6a';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const pinRange = (a, b) => pinLines.slice(a - 1, b).join('\n');
const fragmentDigestWalk = createHash('sha256')
  .update([pinRange(7951, 7960), pinRange(7962, 7970), pinRange(7972, 8019), pinRange(8685, 8693)].join('\n---\n'))
  .digest('hex');
if (fragmentDigestWalk !== FRAGMENT_SHA256_WALK) {
  throw new Error(`fragmenty pinu K1b nie zgadzaja sie z hashem: ${fragmentDigestWalk}`);
}

// Stale z battleScene.ts: BF_COLS 661, BF_ROWS 662, DIRS4 = DIR_DELTA (326-331, kolejnosc N,E,S,W), STEP_GAP_MS 1011.
const BF_COLS = 68;
const BF_ROWS = 156;
const DIRS4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const STEP_GAP_MS = 70;
const BFS_MAX_VISITED_DEFAULT = 6000; // _bfsFirstStep maxVisited = 6000 (7978)

const cellKey = (c, r) => c + ',' + r;

// --- wycieta z battleScene.ts:7939-7943 ---
function threatSlack(threats, col, row) {
  let m = Infinity;
  for (const t of threats) m = Math.min(m, Math.abs(col - t.q) + Math.abs(row - t.r) - t.range);
  return m;
}

// --- wycieta z battleScene.ts:7951-7960 ---
function approachRestricted(ru, s) {
  if (!(s.wallCol >= 0) || ru.side !== 'atk') return false;
  if (ru.routed || ru.onWallWalkway || ru.isSiegeUnit) return false;
  if (ru.primaryRanged && ru.canShoot && ru.shootingEnabled !== false) return false;
  if (ru.mounted) {
    const tileBreached = s.siegeWallTilesInit > 0 && s.wallTileHpSize < s.siegeWallTilesInit;
    return !(s.gateOpen || tileBreached);
  }
  return !(s.wallEverBreached || s.towerAtWallRowsCount > 0);
}

// --- wycieta z battleScene.ts:7962-7970 (_siegeMoveRefused) ---
function siegeMoveRefused(ru, s, threats, from, to) {
  if (!approachRestricted(ru, s)) return false;
  if (threats.length === 0) return false;
  const toSlack = threatSlack(threats, to.c, to.r);
  if (toSlack > 0) return false;
  return toSlack < threatSlack(threats, from.c, from.r);
}

// --- wycieta z battleScene.ts:7973-8003 (_bfsFirstStep). Wejscia jawne:
//   isGoal = zbior kluczy goalSet; allowTile = null (undefined) albo zbior allowSet; occByKey + _passableForUnit = blocked.
function bfsFirstStep(start, goalSet, blocked, allowSet, prefRow, maxVisited) {
  const startKey = cellKey(start[0], start[1]);
  const first = new Map();
  const seen = new Set([startKey]);
  const frontier = [[start[0], start[1]]];
  for (let head = 0; head < frontier.length && head < maxVisited; head++) {
    const [cc, cr] = frontier[head];
    const dirs = prefRow == null
      ? DIRS4
      : [...DIRS4].sort((a, b) => Math.abs(cr + a[1] - prefRow) - Math.abs(cr + b[1] - prefRow));
    for (const [dc, dr] of dirs) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nr < 0 || nc >= BF_COLS || nr >= BF_ROWS) continue;
      const k = cellKey(nc, nr);
      if (seen.has(k)) continue;
      seen.add(k);
      if (blocked.has(k)) continue;
      if (allowSet && !allowSet.has(k)) continue;
      first.set(k, cc === start[0] && cr === start[1] ? k : first.get(cellKey(cc, cr)) ?? k);
      if (goalSet.has(k)) return first.get(k) ?? null;
      frontier.push([nc, nr]);
    }
  }
  return null;
}

// --- driver _siegeWalkTo (8006-8019) + _doMove odmowa (8689-8693) + _schedule (sekwencja zdarzen).
// Zwraca { events, unit } gdzie events to lista: move | refused | schedule | done.
// Koszt wejscia `cost(c,r)` = tabela COST[(3c+5r) mod 5] (wartosci dyadyczne, dokladne w IEEE).
const COST = [0.5, 1, 1.5, 2, 3];
const costOf = (c, r) => COST[(((3 * c + 5 * r) % 5) + 5) % 5];

function walkDecide(W, unit) {
  if (W.finished || unit.dead || unit.fadingOut || unit.moveLeft <= 0) return null;
  if (W.goalSet.has(cellKey(unit.q, unit.r))) return null;
  const key = bfsFirstStep([unit.q, unit.r], W.goalSet, W.blocked, W.allowSet, W.prefRow, BFS_MAX_VISITED_DEFAULT);
  if (!key) return null;
  return key.split(',').map(Number);
}

function walkRun(W, unit) {
  const events = [];
  for (;;) {
    const mv = walkDecide(W, unit);
    if (mv === null) {
      events.push({ k: 'done' });
      return events;
    }
    const [nc, nr] = mv;
    // _doMove: odmowa bramki (siegeWallCol >= 0 && _siegeMoveRefused) -> moveLeft = 0, done().
    const refused = W.wallCol >= 0 && siegeMoveRefused(W.ru, W.wall, W.threats, { c: unit.q, r: unit.r }, { c: nc, r: nr });
    if (refused) {
      unit.moveLeft = 0;
      events.push({ k: 'refused', col: nc, row: nr });
      events.push({ k: 'done' });
      return events;
    }
    // _doMove: przejscie (ru.q/r, moveLeft -= koszt, min 0).
    unit.q = nc;
    unit.r = nr;
    unit.moveLeft = Math.max(0, unit.moveLeft - costOf(nc, nr));
    events.push({ k: 'move', col: nc, row: nr });
    // kontynuacja po _doMove (8015-8017): finished || dead || isGoal(q,r) || moveLeft <= 0 -> done, inaczej _schedule.
    if (W.finished || unit.dead || W.goalSet.has(cellKey(unit.q, unit.r)) || unit.moveLeft <= 0) {
      events.push({ k: 'done' });
      return events;
    }
    events.push({ k: 'schedule', ms: STEP_GAP_MS });
  }
}

// ---------- losowanie (seed 217, ten sam generator co K0b/K1) ----------
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
const rnd = mulberry32(217);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const coin = (p = 0.5) => rnd() < p;
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)); // [lo, hi]

// ---------- BFS: _bfsFirstStep ----------
const bfsCases = [];
for (let k = 0; k < 500; k++) {
  // start: zwykle w siatce, czasem tuz poza (sprawdza, ze start nie jest walidowany).
  const outside = k % 40 === 0;
  const start = outside
    ? [pick([-1, BF_COLS]), randInt(0, BF_ROWS - 1)]
    : [randInt(0, BF_COLS - 1), randInt(0, BF_ROWS - 1)];
  const nGoal = pick([1, 1, 2, 3, 0]);
  const goal = [];
  for (let i = 0; i < nGoal; i++) goal.push([randInt(0, BF_COLS - 1), randInt(0, BF_ROWS - 1)]);
  // blokady: gestosc losowa w oknie +-30 wokol startu (plik vectors.json pozostaje maly), czasem gesta.
  const density = pick([0, 0.02, 0.05, 0.15]);
  const blocked = [];
  for (let c = Math.max(0, start[0] - 30); c <= Math.min(BF_COLS - 1, start[0] + 30); c++) {
    for (let r = Math.max(0, start[1] - 30); r <= Math.min(BF_ROWS - 1, start[1] + 30); r++) {
      if (rnd() < density) blocked.push([c, r]);
    }
  }
  const allowMode = pick(['none', 'none', 'set']);
  // allowTile jako prostokat [c0,c1,r0,r1] (wejscie jawne, maly plik); null = undefined w webie.
  let allow = null;
  if (allowMode === 'set') {
    const c0 = randInt(0, BF_COLS - 1);
    const r0 = randInt(0, BF_ROWS - 1);
    allow = [c0, randInt(c0, BF_COLS - 1), r0, randInt(r0, BF_ROWS - 1)];
  }
  const prefRow = coin(0.4) ? randInt(0, BF_ROWS - 1) : null;
  const maxVisited = pick([BFS_MAX_VISITED_DEFAULT, BFS_MAX_VISITED_DEFAULT, 5, 50, 400]);
  const blockedSet = new Set(blocked.map(([c, r]) => cellKey(c, r)));
  const goalSet = new Set(goal.map(([c, r]) => cellKey(c, r)));
  const allowSet = allow ? { has: (k) => { const [c, r] = k.split(',').map(Number); return c >= allow[0] && c <= allow[1] && r >= allow[2] && r <= allow[3]; } } : null;
  // Zgodnie z webem: isGoal(start) nie jest sprawdzane przez _bfsFirstStep (start jest w seen).
  const res = bfsFirstStep(start, goalSet, blockedSet, allowSet, prefRow, maxVisited);
  bfsCases.push({
    start: { q: start[0], r: start[1] },
    goal,
    blocked,
    allow,
    prefRow,
    maxVisited,
    expect: res === null ? null : res.split(',').map(Number),
  });
}

// ---------- Driver marszu: _siegeWalkTo ----------
const walkCases = [];
const gateStats = {};
const eventStats = {};
for (let k = 0; k < 700; k++) {
  const q = randInt(0, BF_COLS - 1);
  const r = randInt(0, BF_ROWS - 1);
  const ru = {
    side: coin(0.9) ? 'atk' : 'def',
    routed: coin(0.04),
    onWallWalkway: coin(0.04),
    isSiegeUnit: coin(0.04),
    primaryRanged: coin(0.15),
    canShoot: coin(0.6),
    shootingEnabled: pick([true, false, undefined]),
    mounted: coin(0.35),
  };
  const wallCol = coin(0.85) ? randInt(0, BF_COLS - 1) : -1;
  const wall = {
    wallCol,
    gateOpen: coin(0.2),
    wallEverBreached: coin(0.1),
    siegeWallTilesInit: pick([0, 2, 4]),
    wallTileHpSize: pick([0, 1, 2, 4]),
    towerAtWallRowsCount: pick([0, 0, 1]),
  };
  // cel: zwykle 1-2 kafle w poblizu (dojscie w kilku krokach), czasem daleko (limit BFS / brak sciezki).
  const goal = [];
  const nGoal = pick([1, 1, 2]);
  for (let i = 0; i < nGoal; i++) {
    // 60%: cel w odleglosci 6-12 kolumn (droga przez strefe zagrozen -> odmowy), 25%: blisko, 15%: losowo.
    const mode = pick(['far', 'far', 'far', 'near', 'near', 'any']);
    if (mode === 'far') {
      const dq = pick([-12, -10, -8, -6, 6, 8, 10, 12]);
      goal.push([Math.min(BF_COLS - 1, Math.max(0, q + dq)), randInt(Math.max(0, r - 4), r + 4)]);
    } else if (mode === 'near') {
      goal.push([randInt(Math.max(0, q - 5), q + 5), randInt(Math.max(0, r - 5), r + 5)]);
    } else {
      goal.push([randInt(0, BF_COLS - 1), randInt(0, BF_ROWS - 1)]);
    }
  }
  // zagrozenia: co 6. przypadek brak; polowa wokol celu (wtedy odmowa wejscia w zasieg jest czesta), reszta wokol jednostki.
  const nt = k % 6 === 0 ? 0 : randInt(1, 3);
  const threats = [];
  const aroundGoal = coin(0.5);
  const cq = goal[0][0];
  const cr = goal[0][1];
  for (let i = 0; i < nt; i++) {
    threats.push(aroundGoal
      ? { q: randInt(Math.max(0, cq - 3), cq + 3), r: randInt(Math.max(0, cr - 3), cr + 3), range: pick([1, 2, 3, 4]) }
      : { q: randInt(Math.max(0, q - 6), q + 6), r: randInt(Math.max(0, r - 6), r + 6), range: pick([0, 1, 2, 3, 5]) });
  }
  const density = pick([0, 0.05, 0.2, 0.4]);
  const blocked = [];
  for (let c = Math.max(0, q - 12); c <= Math.min(BF_COLS - 1, q + 12); c++) {
    for (let rr = Math.max(0, r - 12); rr <= Math.min(BF_ROWS - 1, r + 12); rr++) {
      if (rnd() < density && !(c === q && rr === r)) blocked.push([c, rr]);
    }
  }
  // Zajete kafle nie moga byc celem (w grze cel zajety jest pomijany przez passable).
  const blockedSet = new Set(blocked.map(([c, rr]) => cellKey(c, rr)));
  const goalSet = new Set(goal.filter(([c, rr]) => !blockedSet.has(cellKey(c, rr))).map(([c, rr]) => cellKey(c, rr)));
  // allowTile (jak `safe` w _siegeSafeApproach): jawna lista kafli dopuszczonych (slack zagrozen > 0) w oknie +-12.
  // Poza oknem kafel nie jest dopuszczony; Rust dostaje ta sama liste, wiec wynik jest identyczny.
  // allowTile = 'safe' w oknie +-12 wokol jednostki: (c,r) w oknie && threat_slack(c,r) > 0 (jak `safe` w _siegeSafeApproach).
  // Wejscie w JSON: {window:12} albo null; Rust liczy to samo z zagrozen.
  const allow = coin(0.25) ? null : { window: 12 };
  const inWindow = (c, rr) => Math.abs(c - q) <= 12 && Math.abs(rr - r) <= 12;
  const allowSet = allow ? { has: (k) => { const [c, rr] = k.split(',').map(Number); return inWindow(c, rr) && threatSlack(threats, c, rr) > 0; } } : null;
  const W = {
    finished: coin(0.03),
    goalSet,
    blocked: blockedSet,
    allowSet,
    prefRow: coin(0.3) ? randInt(Math.max(0, r - 4), r + 4) : null,
    wallCol: wall.wallCol,
    wall,
    ru,
    threats,
  };
  const unit = {
    q,
    r,
    moveLeft: pick([0, 0.5, 2, 4, 6, 8, 12]),
    dead: coin(0.03),
    fadingOut: coin(0.03),
  };
  const startUnit = { ...unit };
  const events = walkRun(W, unit);
  for (const e of events) {
    const key = e.k;
    eventStats[key] = (eventStats[key] ?? 0) + 1;
  }
  const restr = W.wallCol >= 0 && threats.length > 0 && approachRestricted(ru, wall);
  const gateKey = events.some((e) => e.k === 'refused') ? 'refused' : (restr ? 'restricted-no-refuse' : (W.wallCol >= 0 ? 'passed' : 'no-wall'));
  gateStats[gateKey] = (gateStats[gateKey] ?? 0) + 1;
  walkCases.push({
    unit: startUnit,
    finished: W.finished,
    goal: [...goalSet].map((k) => k.split(',').map(Number)),
    blocked,
    allow,
    prefRow: W.prefRow,
    wallCol: wall.wallCol,
    wall,
    ru,
    threats,
    events,
    finalUnit: { q: unit.q, r: unit.r, moveLeft: unit.moveLeft },
  });
}

// Przypadki odmowy ukierunkowane (K1b r2): 200 przypadkow z zamknietym murem, atakujacym piechota (approachRestricted = true),
// celem za jednostka w kierunku wschodnim i zagrozeniem na linii marszu. Krok wchodzacy w zasieg jest odmawiany,
// wiec wiekszosc przypadkow ma zdarzenie `refused`. Losowanie tylko z rnd po 700 przypadkach ogolnych (kolejnosc nie zmienia sie).
for (let k = 0; k < 200; k++) {
  const q = randInt(0, 20);
  const r = randInt(10, BF_ROWS - 11);
  const ru = { side: 'atk', routed: false, onWallWalkway: false, isSiegeUnit: false, primaryRanged: false, canShoot: false, shootingEnabled: undefined, mounted: false };
  const wall = { wallCol: randInt(q + 4, q + 10), gateOpen: false, wallEverBreached: false, siegeWallTilesInit: 0, wallTileHpSize: 0, towerAtWallRowsCount: 0 };
  const gq = randInt(wall.wallCol + 2, Math.min(BF_COLS - 1, wall.wallCol + 8));
  const goal = [[gq, r]];
  const threats = [{ q: randInt(q + 3, wall.wallCol), r: randInt(Math.max(0, r - 1), r + 1), range: pick([1, 2, 3]) }];
  const blockedSet = new Set();
  const goalSet = new Set(goal.map(([c, rr]) => cellKey(c, rr)));
  const W = { finished: false, goalSet, blocked: blockedSet, allowSet: null, prefRow: null, wallCol: wall.wallCol, wall, ru, threats };
  const unit = { q, r, moveLeft: pick([4, 8, 12]), dead: false, fadingOut: false };
  const startUnit = { ...unit };
  const events = walkRun(W, unit);
  for (const e of events) eventStats[e.k] = (eventStats[e.k] ?? 0) + 1;
  const gateKey = events.some((e) => e.k === 'refused') ? 'refused' : 'restricted-no-refuse';
  gateStats[gateKey] = (gateStats[gateKey] ?? 0) + 1;
  walkCases.push({
    unit: startUnit, finished: false, goal, blocked: [], allow: null, prefRow: null,
    wallCol: wall.wallCol, wall, ru, threats, events,
    finalUnit: { q: unit.q, r: unit.r, moveLeft: unit.moveLeft },
  });
}

// Przypadki brzegowe jawnie: cel = start (zero krokow), finished, moveLeft = 0, brak sciezki (zablokowany), limit BFS.
const explicit = [
  { name: 'goal-is-start', unit: { q: 10, r: 10, moveLeft: 3, dead: false, fadingOut: false }, goal: [[10, 10]], blocked: [] },
  { name: 'finished', unit: { q: 10, r: 10, moveLeft: 3, dead: false, fadingOut: false }, goal: [[12, 10]], blocked: [], finished: true },
  { name: 'no-moveleft', unit: { q: 10, r: 10, moveLeft: 0, dead: false, fadingOut: false }, goal: [[12, 10]], blocked: [] },
  { name: 'fading', unit: { q: 10, r: 10, moveLeft: 3, dead: false, fadingOut: true }, goal: [[12, 10]], blocked: [] },
  { name: 'walled-in', unit: { q: 0, r: 0, moveLeft: 5, dead: false, fadingOut: false }, goal: [[5, 5]], blocked: [[1, 0], [0, 1]] },
  { name: 'bfs-cap', unit: { q: 0, r: 0, moveLeft: 100, dead: false, fadingOut: false }, goal: [[67, 155]], blocked: [] },
];
for (const c of explicit) {
  const blockedSet = new Set(c.blocked.map(([x, y]) => cellKey(x, y)));
  const goalSet = new Set(c.goal.map(([x, y]) => cellKey(x, y)));
  const W = { finished: !!c.finished, goalSet, blocked: blockedSet, allowSet: null, prefRow: null, wallCol: -1, wall: null, ru: null, threats: [] };
  const unit = { ...c.unit };
  const events = walkRun(W, unit);
  walkCases.push({
    name: c.name,
    unit: { ...c.unit },
    finished: !!c.finished,
    goal: c.goal,
    blocked: c.blocked,
    allow: null,
    prefRow: null,
    wallCol: -1,
    wall: null,
    ru: null,
    threats: [],
    events,
    finalUnit: { q: unit.q, r: unit.r, moveLeft: unit.moveLeft },
    special: true,
  });
}

// Przypadki odmowy jawnie: prosta linia przez strefe zagrozenia (krok wchodzi w zasieg -> odmowa; krok od zagrozenia -> dopuszczony).
{
  const ruInf = { side: 'atk', routed: false, onWallWalkway: false, isSiegeUnit: false, primaryRanged: false, canShoot: false, shootingEnabled: undefined, mounted: false };
  const wallClosed = { wallCol: 3, gateOpen: false, wallEverBreached: false, siegeWallTilesInit: 0, wallTileHpSize: 0, towerAtWallRowsCount: 0 };
  const lines = [
    { name: 'refuse-into-zone', unit: { q: 0, r: 5, moveLeft: 10, dead: false, fadingOut: false }, goal: [[10, 5]], threats: [{ q: 7, r: 5, range: 3 }], wall: wallClosed, ru: ruInf },
    { name: 'allowed-away', unit: { q: 12, r: 5, moveLeft: 10, dead: false, fadingOut: false }, goal: [[14, 5]], threats: [{ q: 7, r: 5, range: 3 }], wall: wallClosed, ru: ruInf },
    { name: 'open-gate-passes', unit: { q: 0, r: 5, moveLeft: 10, dead: false, fadingOut: false }, goal: [[10, 5]], threats: [{ q: 7, r: 5, range: 3 }], wall: { ...wallClosed, gateOpen: true }, ru: { ...ruInf, mounted: true } },
    { name: 'no-wall-passes', unit: { q: 0, r: 5, moveLeft: 10, dead: false, fadingOut: false }, goal: [[10, 5]], threats: [{ q: 7, r: 5, range: 3 }], wall: { ...wallClosed, wallCol: -1 }, ru: ruInf },
  ];
  for (const c of lines) {
    const blockedSet = new Set();
    const goalSet = new Set(c.goal.map(([x, y]) => cellKey(x, y)));
    const W = { finished: false, goalSet, blocked: blockedSet, allowSet: null, prefRow: null, wallCol: c.wall.wallCol, wall: c.wall, ru: c.ru, threats: c.threats };
    const unit = { ...c.unit };
    const events = walkRun(W, unit);
    walkCases.push({ name: c.name, unit: { ...c.unit }, finished: false, goal: c.goal, blocked: [], allow: null, prefRow: null, wallCol: c.wall.wallCol, wall: c.wall, ru: c.ru, threats: c.threats, events, finalUnit: { q: unit.q, r: unit.r, moveLeft: unit.moveLeft }, special: true });
  }
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_walk_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75, linie 7951-7960, 7962-7970, 7972-8019, 8685-8693',
  generator: 'rust-port/engine/tests/p6_siege_tactics_walk_gen.mjs (node ' + process.version + ', seed 217)',
  fragmentSha256: fragmentDigestWalk,
  bfsFirstStep: bfsCases,
  siegeWalkTo: walkCases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload) + '\n');
console.log('bfs', bfsCases.length, 'found', bfsCases.filter((c) => c.expect !== null).length);
console.log('walk', walkCases.length, JSON.stringify(gateStats), JSON.stringify(eventStats));
