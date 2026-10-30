// Patch ONLY the scratch copy of gra/src/game/economy.ts (pin 91dc998a) used for vector generation.
// Not part of the repo. Adds `export` to four private functions (as in r3) and a test-only
// data-source shim in buildTerrainYields (globalThis.__TERRAIN_ROWS__ overrides terrain_types;
// the loop body itself is unchanged).
import { readFileSync, writeFileSync } from 'node:fs';

const file = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/pin/gra/src/game/economy.ts';
let src = readFileSync(file, 'utf8');
const names = ['terrainRowToTileYield', 'buildTerrainYields', 'terrainModifier', 'civMatrixMnoznikHandelPieniadzRaw'];
for (const n of names) {
  const re = new RegExp('^function ' + n + '\\(', 'm');
  if (!re.test(src)) throw new Error('missing ' + n);
  src = src.replace(re, 'export function ' + n + '(');
}
const loop = 'for (const row of terrainYieldsData.terrain_types) {';
if (src.split(loop).length !== 2) throw new Error('loop count');
src = src.replace(loop, 'for (const row of ((globalThis as any).__TERRAIN_ROWS__ ?? terrainYieldsData.terrain_types)) {');
writeFileSync(file, src);
console.log('PATCHED');
