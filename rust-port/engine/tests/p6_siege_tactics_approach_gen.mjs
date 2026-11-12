// P6 SIEGE-TAKTYKA K0b: generator wektorow z kodu weba (pin 07d2fbd72, gra/src/battle/battleScene.ts).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_approach_gen.mjs
// Wycieta logika (bez typow TS, bez `this.`, reczne wyciecie jak w p6_siege_tactics_gen.mjs):
//   _siegeShooterThreats 7924-7937, _threatSlack 7939-7943, _siegeApproachRestricted 7951-7960.
// Wejscia stanu sceny i pomocnicze (canShoot, isSiegeUnit, _applyTerrainRange) sa podawane jawnie w wektorach.
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
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, (k, v) => (v === Infinity ? 'Infinity' : v), 1) + '\n');
console.log('slack', slackCases.length, 'shooter', shooterCases.length, 'approach', approachCases.length, JSON.stringify(branches));
