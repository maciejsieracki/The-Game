// P6 SIEGE-TAKTYKA K0b: generator wektorow z kodu weba (pin 07d2fbd72, gra/src/battle/battleScene.ts).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_approach_gen.mjs
// Wycieta logika (bez typow TS, bez `this.`, reczne wyciecie jak w p6_siege_tactics_gen.mjs):
//   _siegeShooterThreats 7924-7937, _threatSlack 7939-7943, _siegeApproachRestricted 7951-7960.
// Wejscia stanu sceny i pomocnicze (canShoot, isSiegeUnit, _applyTerrainRange) sa podawane jawnie w wektorach.
// K1 (runda 1): _siegeMoveRefused 7962-7970 i czesc decyzyjna _siegeSafeApproach 8107-8136 (sekcje moveRefused, safeApproachGoal).
// Wynik -> p6_siege_tactics_approach_vectors/vectors.json.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Straznik zrodla: wyciete fragmenty musza byc BAJT W BAJT tekstem z pinu (git show, bez checkoutu).
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const FRAGMENT_SHA256 = '1d9de41ab077a9942061a0710b3378900b3e9cc7fd761cf28993341d8ce64fb4';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const pinRange = (a, b) => pinLines.slice(a - 1, b).join('\n');
const fragmentDigest = createHash('sha256')
  .update([pinRange(7924, 7937), pinRange(7939, 7943), pinRange(7951, 7960)].join('\n---\n'))
  .digest('hex');
if (fragmentDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu 7924-7937/7939-7943/7951-7960 nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
// K1 (runda 1): _siegeMoveRefused 7962-7970 oraz czesc decyzyjna _siegeSafeApproach 8107-8136.
const FRAGMENT_SHA256_K1 = 'c6bc8a53868c784773c9a3a127002b0ca9d1ea1083e1982872217b6a9bcfab94';
const fragmentDigestK1 = createHash('sha256')
  .update([pinRange(7962, 7970), pinRange(8107, 8136)].join('\n---\n'))
  .digest('hex');
if (fragmentDigestK1 !== FRAGMENT_SHA256_K1) {
  throw new Error(`fragmenty pinu K1 7962-7970/8107-8136 nie zgadzaja sie z hashem: ${fragmentDigestK1}`);
}

// --- wycieta z battleScene.ts:7939-7943 ---
function threatSlack(threats, col, row) {
  let m = Infinity;
  for (const t of threats) m = Math.min(m, Math.abs(col - t.q) + Math.abs(row - t.r) - t.range);
  return m;
}

// --- wycieta z battleScene.ts:7951-7960; zwraca galez (a..e) i wynik ---
function approachRestricted(ru, s) {
  if (!(s.wallCol >= 0) || ru.side !== 'atk') return { branch: 'a', restricted: false };
  if (ru.routed || ru.onWallWalkway || ru.isSiegeUnit) return { branch: 'b', restricted: false };
  if (ru.primaryRanged && ru.canShoot && ru.shootingEnabled !== false) return { branch: 'c', restricted: false };
  if (ru.mounted) {
    const tileBreached = s.siegeWallTilesInit > 0 && s.wallTileHpSize < s.siegeWallTilesInit;
    return { branch: 'd', restricted: !(s.gateOpen || tileBreached) };
  }
  return { branch: 'e', restricted: !(s.wallEverBreached || s.towerAtWallRowsCount > 0) };
}

// --- wycieta z battleScene.ts:7924-7937; _applyTerrainRange zastapiony jawnym polem terrainAfter ---
function shooterThreats(defenders, towers, siegeWallCol, towerRange) {
  const out = [];
  for (const d of defenders) {
    if (d.dead || d.fadingOut || d.removed || d.routed) continue;
    if (!d.canShoot || d.rangeBase <= 0) continue;
    d.range = d.terrainAfter; // this._applyTerrainRange(d) -- wejscie jawne
    if (d.range >= 1) out.push({ q: d.q, r: d.r, range: d.range });
  }
  for (const t of towers) {
    if (t.destroyed) continue;
    out.push({ q: siegeWallCol, r: t.row, range: towerRange });
  }
  return out;
}

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
const COORDS = [-3, -1, 0, 1, 2, 4, 7, 12];
const RANGES = [-2, -0.5, 0, 0.5, 1, 2, 3, 5, 9];

// Slack: przypadki brzegowe + losowe (0..4 zagrozen).
const slackCases = [];
slackCases.push({ threats: [], col: 0, row: 0, expect: threatSlack([], 0, 0) });
slackCases.push({ threats: [], col: 5, row: -2, expect: threatSlack([], 5, -2) });
for (let k = 0; k < 300; k++) {
  const n = Math.floor(rnd() * 5);
  const threats = [];
  for (let i = 0; i < n; i++) threats.push({ q: pick(COORDS), r: pick(COORDS), range: pick(RANGES) });
  const col = pick(COORDS);
  const row = pick(COORDS);
  slackCases.push({ threats, col, row, expect: threatSlack(threats, col, row) });
}

// Zagrozenia strzelcow i wiezyczek: losowi obroncy + wiezyczki.
const shooterCases = [];
for (let k = 0; k < 250; k++) {
  const nd = Math.floor(rnd() * 6);
  const defenders = [];
  for (let i = 0; i < nd; i++) {
    defenders.push({
      q: pick(COORDS),
      r: pick(COORDS),
      dead: coin(0.15),
      fadingOut: coin(0.1),
      removed: coin(0.1),
      routed: coin(0.15),
      canShoot: coin(0.6),
      rangeBase: pick([-1, 0, 0.5, 1, 2, 3]),
      terrainAfter: pick([-1, 0, 0.5, 1, 1.5, 2, 3, 4]),
    });
  }
  const nt = Math.floor(rnd() * 4);
  const towers = [];
  for (let i = 0; i < nt; i++) towers.push({ destroyed: coin(0.3), row: pick(COORDS) });
  const siegeWallCol = pick([0, 3, 7]);
  const towerRange = pick([1, 2, 4]);
  const copy = defenders.map((d) => ({ ...d }));
  const expect = shooterThreats(copy, towers, siegeWallCol, towerRange);
  shooterCases.push({ defenders, towers, siegeWallCol, towerRange, expect });
}

// Podejscie: losowe przypadki z podpisem galezi (a..e).
const approachCases = [];
for (let k = 0; k < 2000; k++) {
  const ru = {
    side: coin(0.8) ? 'atk' : 'def',
    routed: coin(0.15),
    onWallWalkway: coin(0.15),
    isSiegeUnit: coin(0.15),
    primaryRanged: coin(0.3),
    canShoot: coin(0.6),
    shootingEnabled: pick([true, false, undefined]),
    mounted: coin(0.35),
  };
  const siegeWallTilesInit = pick([0, 2, 4]);
  const s = {
    wallCol: pick([-1, 0, 3]),
    gateOpen: coin(0.3),
    wallEverBreached: coin(0.3),
    siegeWallTilesInit,
    wallTileHpSize: pick([0, 1, 2, 4]),
    towerAtWallRowsCount: pick([0, 0, 1, 2]),
  };
  const r = approachRestricted(ru, s);
  approachCases.push({ ru, wall: s, branch: r.branch, expect: r.restricted });
}

// --- K1: wycieta z battleScene.ts:7962-7970 (_siegeMoveRefused); bez this; threats = wynik _siegeShooterThreats (jawny). ---
// Zwraca { gate, refused }: gate = galaz decydujaca (unrestricted | no-threats | safe-to | refused | allowed).
function siegeMoveRefused(ru, s, threats, from, to) {
  if (!approachRestricted(ru, s).restricted) return { gate: 'unrestricted', refused: false };
  if (threats.length === 0) return { gate: 'no-threats', refused: false };
  const toSlack = threatSlack(threats, to.c, to.r);
  if (toSlack > 0) return { gate: 'safe-to', refused: false };
  const refused = toSlack < threatSlack(threats, from.c, from.r);
  return { gate: refused ? 'refused' : 'allowed', refused };
}

// --- K1: wycieta z battleScene.ts:8107-8136, czesc decyzyjna (wybor kafla celu BFS). ---
// occByKey + _passableForUnit -> zbior `blocked` (klucze "c,r"); BF_COLS/BF_ROWS/DIRS4 z battleScene.ts:661-662, 326-331.
const BF_COLS = 68;
const BF_ROWS = 156;
const DIRS4_K1 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function safeApproachGoal(sq, sr, tc, tr, threats, blocked) {
  const safe = (c, r) => threatSlack(threats, c, r) > 0;
  const seen = new Set([sq + ',' + sr]);
  const frontier = [[sq, sr]];
  let best = null;
  let bestD = safe(sq, sr) ? Math.abs(sq - tc) + Math.abs(sr - tr) : Infinity;
  for (let head = 0; head < frontier.length && head < 6000; head++) {
    const [cc, cr] = frontier[head];
    for (const [dc, dr] of DIRS4_K1) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nr < 0 || nc >= BF_COLS || nr >= BF_ROWS) continue;
      const k = nc + ',' + nr;
      if (seen.has(k)) continue;
      seen.add(k);
      if (blocked.has(k) || !safe(nc, nr)) continue;
      const d = Math.abs(nc - tc) + Math.abs(nr - tr);
      if (d < bestD) { bestD = d; best = k; }
      frontier.push([nc, nr]);
    }
  }
  return { goal: best, startSafe: safe(sq, sr), capHit: frontier.length > 6000 };
}

const NUM_SPECIAL = [NaN, Infinity, -Infinity];
const COORDS_K1 = [-3, -1, 0, 1, 2, 4, 7, 12, 30, 67, 68, 155, 156];
const pickK1 = (arr) => arr[Math.floor(rnd() * arr.length)];

// Ruch: losowe przypadki z pelnym zestawem galezi + przypadki NaN/Infinity.
const moveCases = [];
for (let k = 0; k < 1200; k++) {
  // Wiekszosc przypadkow ma ograniczone podejscie (atk, mur, brak wyjatkow galezi (b)/(c)), by pokryc galezie gate.
  const ru = {
    side: coin(0.93) ? 'atk' : 'def',
    routed: coin(0.04),
    onWallWalkway: coin(0.04),
    isSiegeUnit: coin(0.04),
    primaryRanged: coin(0.15),
    canShoot: coin(0.6),
    shootingEnabled: pick([true, false, undefined]),
    mounted: coin(0.35),
  };
  const s = {
    wallCol: coin(0.9) ? 3 : -1,
    gateOpen: coin(0.2),
    wallEverBreached: coin(0.1),
    siegeWallTilesInit: pick([0, 2, 4]),
    wallTileHpSize: pick([0, 1, 2, 4]),
    towerAtWallRowsCount: pick([0, 0, 1]),
  };
  const nt = k % 8 === 0 ? 0 : 1 + Math.floor(rnd() * 3); // co 8. przypadek: brak zagrozen
  const threats = [];
  for (let i = 0; i < nt; i++) threats.push({ q: pick(COORDS), r: pick(COORDS), range: pick(RANGES) });
  const from = { c: pick(COORDS), r: pick(COORDS) };
  const to = { c: pick(COORDS), r: pick(COORDS) };
  const res = siegeMoveRefused(ru, s, threats, from, to);
  moveCases.push({ ru, wall: s, threats, from, to, gate: res.gate, expect: res.refused });
}
// NaN / Infinity jako wejscia liczbowe (kodowane napisami "NaN", "Infinity", "-Infinity").
for (let k = 0; k < 120; k++) {
  const ru = { side: 'atk', routed: false, onWallWalkway: false, isSiegeUnit: false, primaryRanged: false,
    canShoot: false, shootingEnabled: undefined, mounted: coin(0.5) };
  const s = { wallCol: 3, gateOpen: false, wallEverBreached: false, siegeWallTilesInit: 2,
    wallTileHpSize: 1, towerAtWallRowsCount: 0 };
  const threats = [];
  const nt = 1 + Math.floor(rnd() * 3);
  for (let i = 0; i < nt; i++) {
    const special = coin(0.4);
    threats.push({ q: special && coin(0.3) ? pick(NUM_SPECIAL) : pick(COORDS),
      r: pick(COORDS), range: special ? pick(NUM_SPECIAL) : pick(RANGES) });
  }
  const from = { c: coin(0.2) ? pick(NUM_SPECIAL) : pick(COORDS), r: pick(COORDS) };
  const to = { c: pick(COORDS), r: coin(0.2) ? pick(NUM_SPECIAL) : pick(COORDS) };
  const res = siegeMoveRefused(ru, s, threats, from, to);
  moveCases.push({ ru, wall: s, threats, from, to, gate: res.gate, expect: res.refused, special: true });
}

// Wybor celu podejscia: losowe bloki i zagrozenia, plus przypadki graniczne (limit BFS, NaN celu).
const safeCases = [];
for (let k = 0; k < 700; k++) {
  const sq = Math.floor(rnd() * BF_COLS);
  const sr = Math.floor(rnd() * BF_ROWS);
  const tc = coin(0.9) ? pick(COORDS_K1) : pick(NUM_SPECIAL);
  const tr = coin(0.9) ? pick(COORDS_K1) : pick(NUM_SPECIAL);
  const nt = Math.floor(rnd() * 4);
  const threats = [];
  for (let i = 0; i < nt; i++) {
    threats.push({ q: coin(0.7) ? Math.max(0, sq + Math.floor(rnd() * 13) - 6) : pick(COORDS_K1),
      r: coin(0.7) ? Math.max(0, sr + Math.floor(rnd() * 13) - 6) : pick(COORDS_K1),
      range: pick([0, 1, 2, 3, 5, 9, 25, 40]) });
  }
  const blocked = new Set();
  const nb = pick([0, 0, 10, 60, 250]);
  for (let i = 0; i < nb; i++) blocked.add(Math.floor(rnd() * BF_COLS) + ',' + Math.floor(rnd() * BF_ROWS));
  const res = safeApproachGoal(sq, sr, tc, tr, threats, blocked);
  safeCases.push({ start: { q: sq, r: sr }, target: { c: tc, r: tr }, threats, blocked: [...blocked],
    expect: res.goal === null ? null : res.goal.split(',').map(Number),
    startSafe: res.startSafe, found: res.goal !== null, capHit: res.capHit, hasBlocks: nb > 0 });
}
// Przypadki graniczne jawnie: otwarte pole bez zagrozen (limit BFS), start w rogu, cel NaN, zagrozenie NaN.
for (const c of [
  { sq: 0, sr: 0, tc: 67, tr: 155, threats: [] },
  { sq: 34, sr: 78, tc: 0, tr: 0, threats: [] },
  { sq: 10, sr: 10, tc: NaN, tr: 3, threats: [] },
  { sq: 10, sr: 10, tc: 5, tr: 5, threats: [{ q: 10, r: 10, range: NaN }] },
  { sq: 10, sr: 10, tc: 5, tr: 5, threats: [{ q: 0, r: 0, range: Infinity }] },
  { sq: 10, sr: 10, tc: 5, tr: 5, threats: [{ q: 10, r: 10, range: -Infinity }] },
]) {
  const res = safeApproachGoal(c.sq, c.sr, c.tc, c.tr, c.threats, new Set());
  safeCases.push({ start: { q: c.sq, r: c.sr }, target: { c: c.tc, r: c.tr }, threats: c.threats, blocked: [],
    expect: res.goal === null ? null : res.goal.split(',').map(Number),
    startSafe: res.startSafe, found: res.goal !== null, capHit: res.capHit, hasBlocks: false, special: true });
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_approach_vectors');
mkdirSync(outDir, { recursive: true });
const branches = {};
for (const c of approachCases) branches[c.branch] = (branches[c.branch] ?? 0) + 1;
const payload = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75, linie 7924-7937, 7939-7943, 7951-7960',
  generator: 'rust-port/engine/tests/p6_siege_tactics_approach_gen.mjs (node ' + process.version + ', seed 217)',
  threatSlack: slackCases,
  shooterThreats: shooterCases,
  approach: approachCases,
  moveRefused: moveCases,
  safeApproachGoal: safeCases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v), 1) + '\n');
console.log('slack', slackCases.length, 'shooter', shooterCases.length, 'approach', approachCases.length, JSON.stringify(branches));
const gates = {};
for (const c of moveCases) gates[c.gate] = (gates[c.gate] ?? 0) + 1;
console.log('moveRefused', moveCases.length, JSON.stringify(gates), 'safeApproachGoal', safeCases.length, 'found', safeCases.filter((c) => c.found).length, 'capHit', safeCases.filter((c) => c.capHit).length);
