// P6 SIEGE-TAKTYKA K2: generator wektorow z kodu weba (pin 07d2fbd72, gra/src/game/city-fortification.ts).
// Uruchomienie: node rust-port/engine/tests/p6_siege_city_fortification_gen.mjs
// Wycieta logika (bez typow TS, bez `?.`/`??` poza miejscami zachowanymi 1:1 z webem):
//   cityFortificationKind 29-36, MeleeWallContext 61-70 (tylko do wiedzy o polach), meleeBlockedByWall 76-79,
//   attackerWallEntryIsBreach 96-98.
// Wynik -> p6_siege_city_fortification_vectors/vectors.json.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Straznik zrodla: wyciete fragmenty musza byc BAJT W BAJT tekstem z pinu (git show, bez checkoutu).
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/game/city-fortification.ts';
const FRAGMENT_SHA256 = '6a22a8e2f3eb56a65bbe7f357219bd490b9935b38eacbfbe8db8e1c29a2dec4b';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const pinRange = (a, b) => pinLines.slice(a - 1, b).join('\n');
const fragmentDigest = createHash('sha256')
  .update([pinRange(29, 36), pinRange(61, 70), pinRange(76, 79), pinRange(96, 98)].join('\n---\n'))
  .digest('hex');
if (process.env.PRINT_DIGEST === '1') console.log('digest', fragmentDigest);
if (fragmentDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu 29-36/61-70/76-79/96-98 nie zgadzaja sie z hashem: ${fragmentDigest}`);
}

// --- wycieta z city-fortification.ts:29-36 ---
// Zwraca { kind, branch }: branch oznacza galez w kodzie weba (dla pokrycia testu).
function cityFortificationKind(builtBuildingIds) {
  const built = builtBuildingIds ?? [];
  if (built.includes('mury') || built.includes('fort') || built.includes('mury_kamienne')) return { kind: 'mur', branch: 'mur' };
  if (built.includes('palisada')) return { kind: 'palisada', branch: 'palisada' };
  return { kind: 'none', branch: 'none' };
}

// Galezie `??` (null/undefined -> []) sa osobna galezia wejscia; web traktuje oba jednakowo.
function kindBranch(builtBuildingIds) {
  return builtBuildingIds === null || builtBuildingIds === undefined ? 'null' : 'list';
}

// --- wycieta z city-fortification.ts:76-79 ---
// Galezie: (a) wallBreached === true; (b) !attackerIsMelee; (c) attackerOnWall; (d) !defenderOnWall; (e) blokada.
function meleeBlockedByWall(ctx) {
  if (ctx.wallBreached === true) return { value: false, branch: 'a-breached' };
  if (!ctx.attackerIsMelee) return { value: false, branch: 'b-notMelee' };
  if (ctx.attackerOnWall) return { value: false, branch: 'c-attackerOnWall' };
  if (!ctx.defenderOnWall) return { value: false, branch: 'd-defenderOffWall' };
  return { value: true, branch: 'e-blocked' };
}

// --- wycieta z city-fortification.ts:96-98 ---
function attackerWallEntryIsBreach(side, onWallWalkway) {
  if (side !== 'atk') return { value: false, branch: 'def' };
  if (onWallWalkway !== true) return { value: false, branch: 'atk-noWalkway' };
  return { value: true, branch: 'atk-walkway' };
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

// --- cityFortificationKind ---
const BUILDING_POOL = ['mury', 'fort', 'mury_kamienne', 'palisada', 'kuznia', 'Mury', 'palisada_x', 'targ', '', 'swiatynia'];
const kindCases = [];
kindCases.push({ builtBuildingIds: null, expect: 'none', branch: 'null' });
kindCases.push({ builtBuildingIds: undefined, expect: 'none', branch: 'null' });
kindCases.push({ builtBuildingIds: [], expect: 'none', branch: 'none' });
for (const ids of [
  ['mury'], ['fort'], ['mury_kamienne'], ['palisada'], ['mury', 'palisada'], ['palisada', 'fort'],
  ['kuznia'], ['Mury'], [''], ['palisada_x'], ['mury', 'mury_kamienne', 'fort'],
]) {
  const r = cityFortificationKind(ids);
  kindCases.push({ builtBuildingIds: ids, expect: r.kind, branch: r.branch });
}
for (let k = 0; k < 200; k++) {
  const n = Math.floor(rnd() * 6);
  const ids = [];
  for (let i = 0; i < n; i++) ids.push(pick(BUILDING_POOL));
  const r = cityFortificationKind(ids);
  kindCases.push({ builtBuildingIds: ids, expect: r.kind, branch: `${kindBranch(ids)}:${r.branch}` });
}

// --- meleeBlockedByWall ---
// Wszystkie kombinacje 3 flag logicznych x wallBreached (brak / false / true) + losowe.
const meleeCases = [];
const WALL_OPTIONS = ['absent', false, true];
for (const attackerIsMelee of [false, true]) {
  for (const attackerOnWall of [false, true]) {
    for (const defenderOnWall of [false, true]) {
      for (const wb of WALL_OPTIONS) {
        const ctx = { attackerIsMelee, attackerOnWall, defenderOnWall };
        if (wb !== 'absent') ctx.wallBreached = wb;
        const r = meleeBlockedByWall(ctx);
        meleeCases.push({ ctx, expect: r.value, branch: `${r.branch}:wb-${wb === 'absent' ? 'absent' : wb}` });
      }
    }
  }
}
for (let k = 0; k < 300; k++) {
  const ctx = {
    attackerIsMelee: coin(0.6),
    attackerOnWall: coin(0.3),
    defenderOnWall: coin(0.6),
  };
  const wb = pick(WALL_OPTIONS);
  if (wb !== 'absent') ctx.wallBreached = wb;
  const r = meleeBlockedByWall(ctx);
  meleeCases.push({ ctx, expect: r.value, branch: `${r.branch}:wb-${wb}` });
}

// --- attackerWallEntryIsBreach ---
const entryCases = [];
for (const side of ['atk', 'def']) {
  for (const onWallWalkway of [true, false, undefined]) {
    const r = attackerWallEntryIsBreach(side, onWallWalkway);
    entryCases.push({ side, onWallWalkway: onWallWalkway === undefined ? null : onWallWalkway, expect: r.value, branch: r.branch });
  }
}
for (let k = 0; k < 200; k++) {
  const side = coin(0.5) ? 'atk' : 'def';
  const onWallWalkway = pick([true, false, undefined]);
  const r = attackerWallEntryIsBreach(side, onWallWalkway);
  entryCases.push({ side, onWallWalkway: onWallWalkway === undefined ? null : onWallWalkway, expect: r.value, branch: r.branch });
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_city_fortification_vectors');
mkdirSync(outDir, { recursive: true });
const tally = (cases) => {
  const t = {};
  for (const c of cases) t[c.branch] = (t[c.branch] ?? 0) + 1;
  return t;
};
const payload = {
  source: 'gra/src/game/city-fortification.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75, linie 29-36, 61-70, 76-79, 96-98',
  generator: 'rust-port/engine/tests/p6_siege_city_fortification_gen.mjs (node ' + process.version + ', seed 217)',
  cityFortificationKind: kindCases,
  meleeBlockedByWall: meleeCases,
  attackerWallEntryIsBreach: entryCases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, null, 1) + '\n');
console.log('kind', kindCases.length, JSON.stringify(tally(kindCases)));
console.log('melee', meleeCases.length, JSON.stringify(tally(meleeCases)));
console.log('entry', entryCases.length, JSON.stringify(tally(entryCases)));
