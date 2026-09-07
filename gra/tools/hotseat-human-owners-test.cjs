'use strict';
/**
 * hotseat-human-owners-test.cjs — bramka R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1.
 * Testuje wyłącznie gra/src/game/human-owners.ts (moduł bezstanowy, Etap 0 planu
 * hot-seat). Run: node tools/hotseat-human-owners-test.cjs (z katalogu gra/)
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hotseat-human-owners-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.hotseat-human-owners-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hotseat-human-owners-bundle.cjs');

const ENTRY_TS = `
export {
  HUMAN_OWNER_PRIMARY,
  isHumanOwner,
  isActiveHuman,
  isAiOwner,
  nextHumanSeat,
  isHotSeat,
} from '../src/game/human-owners';
export { BARBARIAN_OWNER_ID } from '../src/game/barbarians';
export { REBEL_FACTION_OWNER_ID } from '../src/game/society-breakdown';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[hotseat-human-owners-test] esbuild bundle failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch { /* best-effort */ }
}

let mod;
try {
  delete require.cache[require.resolve(BUNDLE_FILE)];
  mod = require(BUNDLE_FILE);
} catch (e) {
  console.error('[hotseat-human-owners-test] require bundle failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(BUNDLE_FILE); } catch { /* best-effort */ }
}

const {
  HUMAN_OWNER_PRIMARY,
  isHumanOwner,
  isActiveHuman,
  isAiOwner,
  nextHumanSeat,
  isHotSeat,
  BARBARIAN_OWNER_ID,
  REBEL_FACTION_OWNER_ID,
} = mod;

// ---------------------------------------------------------------------------
// Asercje
// ---------------------------------------------------------------------------

let pass = 0;
let fail = 0;

function assertEq(actual, expected, label) {
  if (actual === expected) {
    pass++;
  } else {
    fail++;
    console.error(`FAIL: ${label} -- oczekiwano ${JSON.stringify(expected)}, otrzymano ${JSON.stringify(actual)}`);
  }
}

// --- HUMAN_OWNER_PRIMARY ---
assertEq(HUMAN_OWNER_PRIMARY, 0, 'HUMAN_OWNER_PRIMARY === 0');

// --- single-human ---
const single = { humanOwnerIds: [0], activeHumanOwnerId: 0 };
assertEq(isHumanOwner(single, 0), true, 'single: isHumanOwner(0) === true');
assertEq(isHumanOwner(single, 1), false, 'single: isHumanOwner(1) === false');
assertEq(isActiveHuman(single, 0), true, 'single: isActiveHuman(0) === true');
assertEq(isActiveHuman(single, 1), false, 'single: isActiveHuman(1) === false');
assertEq(isAiOwner(single, 1), true, 'single: isAiOwner(1) === true (rywal AI)');
assertEq(isAiOwner(single, 0), false, 'single: isAiOwner(0) === false (fotel ludzki)');
assertEq(isAiOwner(single, BARBARIAN_OWNER_ID), false, 'single: isAiOwner(barbarzynca) === false');
assertEq(isAiOwner(single, REBEL_FACTION_OWNER_ID), false, 'single: isAiOwner(rebeliant) === false');
assertEq(nextHumanSeat(single), null, 'single: nextHumanSeat === null (tylko jeden fotel)');
assertEq(isHotSeat(single), false, 'single: isHotSeat === false');

// --- hot-seat 2-human (fotele 0 i 3) ---
const hotA = { humanOwnerIds: [0, 3], activeHumanOwnerId: 0 };
const hotB = { humanOwnerIds: [0, 3], activeHumanOwnerId: 3 };
assertEq(isHumanOwner(hotA, 0), true, 'hotseat: isHumanOwner(0) === true');
assertEq(isHumanOwner(hotA, 3), true, 'hotseat: isHumanOwner(3) === true');
assertEq(isHumanOwner(hotA, 1), false, 'hotseat: isHumanOwner(1) === false (rywal AI)');
assertEq(isActiveHuman(hotA, 0), true, 'hotseat: activeHumanOwnerId=0 -> isActiveHuman(0) === true');
assertEq(isActiveHuman(hotA, 3), false, 'hotseat: activeHumanOwnerId=0 -> isActiveHuman(3) === false');
assertEq(isActiveHuman(hotB, 3), true, 'hotseat: activeHumanOwnerId=3 -> isActiveHuman(3) === true');
assertEq(isActiveHuman(hotB, 0), false, 'hotseat: activeHumanOwnerId=3 -> isActiveHuman(0) === false');
assertEq(isAiOwner(hotA, 0), false, 'hotseat: isAiOwner(0) === false (fotel ludzki)');
assertEq(isAiOwner(hotA, 3), false, 'hotseat: isAiOwner(3) === false (fotel ludzki)');
assertEq(isAiOwner(hotA, 1), true, 'hotseat: isAiOwner(1) === true (rywal AI)');
assertEq(isAiOwner(hotA, BARBARIAN_OWNER_ID), false, 'hotseat: isAiOwner(barbarzynca) === false');
assertEq(isAiOwner(hotA, REBEL_FACTION_OWNER_ID), false, 'hotseat: isAiOwner(rebeliant) === false');
assertEq(isHotSeat(hotA), true, 'hotseat: isHotSeat === true');

// --- nextHumanSeat cykliczność (w obie strony) ---
assertEq(nextHumanSeat(hotA), 3, 'hotseat: nextHumanSeat(active=0) === 3');
assertEq(nextHumanSeat(hotB), 0, 'hotseat: nextHumanSeat(active=3) === 0 (cyklicznie z powrotem)');

// --- nextHumanSeat: activeHumanOwnerId spoza humanOwnerIds -> null ---
const hotOrphan = { humanOwnerIds: [0, 3], activeHumanOwnerId: 7 };
assertEq(nextHumanSeat(hotOrphan), null, 'hotseat: nextHumanSeat(active nie w liście) === null');

// --- sentinel realne wartości (dowód nietautologiczności: nie duplikujemy liczb) ---
assertEq(BARBARIAN_OWNER_ID, -1, 'sentinel: BARBARIAN_OWNER_ID === -1 (barbarians.ts)');
assertEq(REBEL_FACTION_OWNER_ID, -99, 'sentinel: REBEL_FACTION_OWNER_ID === -99 (society-breakdown.ts)');

// ---------------------------------------------------------------------------

console.log(`hotseat-human-owners-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
