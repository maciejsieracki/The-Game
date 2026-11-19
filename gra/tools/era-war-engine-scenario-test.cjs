'use strict';
/**
 * era-war-engine-scenario-test.cjs — R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 (runda 3, zarzuty 1 i 6).
 * Run from gra/:  node tools/era-war-engine-scenario-test.cjs
 *   MUTATE_NO_BACKFILL=1 node tools/era-war-engine-scenario-test.cjs   (mutacja: bez zapisu wejścia gracza)
 *
 * Tor: prawdziwe funkcje z src/game/war-rules-multiwar.ts i src/game/forced-war-common.ts (esbuild bundle),
 * wołane w kolejności, w jakiej robi to pętla main.ts (backfill wejścia gracza -> bramka puli gracza ->
 * freeTargetCandidates -> assignForcedWarPairings). Ten plik NIE odtwarza całej pętli main.ts.
 *
 *   S1 gracz w Brązie od tury 77 bez zapisanego wejścia: po backfillu (tura 77) bramka zamknięta do tury 116,
 *      otwarta w turze 117 (próg eraForcedWarStartTurnsFromEra.bronze = 40).
 *   S2 kontrola: bez backfillu bramka otwarta od razu (defekt zarzutu 6 — zachowanie sprzed poprawki).
 *   S3 fallback pending Brązu AI: w turze 80 gracz odfiltrowany z freeTargetCandidates -> brak przydziału;
 *      w turze 117 -> przydział do gracza (ownerId 0).
 *   S4 Kamień: pending Kamienia nie dostaje fallbacku nawet przy wolnym graczu (limit R2, celowo).
 *   NIE ZMIERZONO tutaj: sekwencja Kamień trwa -> Brąz pending -> pokój -> start w pierwszej turze po pokoju
 *   (wymaga pętli main.ts i przeglądarki); mutacja kopii main.ts NIE wykonana w tej rundzie.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[era-war-engine-scenario-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.era-war-engine-scenario-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.era-war-engine-scenario-bundle.cjs');
const NO_BACKFILL = process.env.MUTATE_NO_BACKFILL === '1';

const ENTRY_TS = `
export {
  assignForcedWarPairings,
} from ${JSON.stringify(AI_SRC + '/game/forced-war-common')};
export {
  WAR_RULES_PARAMS,
  isPlayerEligibleForEraWarPool,
  backfillMissingEraEntryTurns,
} from ${JSON.stringify(AI_SRC + '/game/war-rules-multiwar')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[era-war-engine-scenario-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  assignForcedWarPairings,
  WAR_RULES_PARAMS,
  isPlayerEligibleForEraWarPool,
  backfillMissingEraEntryTurns,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  PASS: ' + msg); }
  else { failed++; console.log('  FAIL: ' + msg); }
}

const hexDist = (aq, ar, bq, br) => Math.max(Math.abs(aq - bq), Math.abs(ar - br));
const noBlock = () => false;
const noWars = () => 0;

// Gracz w Brązie (epoka 2) od tury 77, bez zapisanego wejścia — jak w biegu rundy 2.
const PLAYER_EPOCH = 2;
const PLAYER_ENTRY_OBSERVED_TURN = 77;
const poolInput = (turn, entry) => ({
  currentTurn: turn,
  playerEpoch: PLAYER_EPOCH,
  activeForcedWarsTotal: 0,
  activeForcedWarsInPlayerEra: 0,
  eraEnterTurn: entry,
  poolStartTurn: 0,
});
// Kolejność jak w main.ts: najpierw backfill wejścia gracza, potem bramka puli.
function playerEligibleAt(turn, entryMap) {
  if (!NO_BACKFILL) backfillMissingEraEntryTurns(entryMap, new Map([[0, PLAYER_EPOCH]]), PLAYER_ENTRY_OBSERVED_TURN);
  return isPlayerEligibleForEraWarPool(poolInput(turn, entryMap.get(0)), WAR_RULES_PARAMS);
}

const delay = WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.bronze;
console.log(`S1 gracz bez zapisanego wejścia w Brąz: bramka po backfillu (próg ${delay} tur)`);
{
  const entryMap = new Map();
  const at80 = playerEligibleAt(80, entryMap);
  assert(at80 === false, `S1: tura 80 (3 tury po wejściu) -> gracz NIEdopuszczony (got ${at80})`);
  const at116 = isPlayerEligibleForEraWarPool(poolInput(PLAYER_ENTRY_OBSERVED_TURN + delay - 1, entryMap.get(0)), WAR_RULES_PARAMS);
  assert(at116 === false, `S1: tura ${PLAYER_ENTRY_OBSERVED_TURN + delay - 1} -> nadal NIE`);
  const at117 = isPlayerEligibleForEraWarPool(poolInput(PLAYER_ENTRY_OBSERVED_TURN + delay, entryMap.get(0)), WAR_RULES_PARAMS);
  assert(at117 === true, `S1: tura ${PLAYER_ENTRY_OBSERVED_TURN + delay} -> dopuszczony`);
}

console.log('S2 kontrola: bez backfillu gracz wchodzi od razu (defekt zarzutu 6)');
{
  const entryMap = new Map();
  const direct = isPlayerEligibleForEraWarPool(poolInput(80, entryMap.get(0)), WAR_RULES_PARAMS);
  assert(direct === true, 'S2: undefined wejście -> true (zachowanie sprzed poprawki, potwierdza potrzebę backfillu)');
}

console.log('S3 fallback pending Brązu AI: gracz tylko po progu');
{
  const base = { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars };
  const lone = [{ ownerId: 2, q: 0, r: 0, era: 'bronze' }];
  const player = { ownerId: 0, q: 1, r: 0 };
  const far = { ownerId: 5, q: 9, r: 0, era: 'bronze' };
  // Tura 80: wywołujący (main.ts) nie wkłada gracza do freeTargetCandidates.
  const entryMap = new Map();
  const eligible80 = playerEligibleAt(80, entryMap);
  const r80 = assignForcedWarPairings(lone, [], { ...base, freeTargetCandidates: [far, ...(eligible80 ? [player] : [])] });
  const a80 = r80.assignments.find(a => a.ownerId === 2);
  assert(a80 && a80.targetId === 5, `S3: tura 80 -> cel = 5 (nie gracz), got ${JSON.stringify(a80)}`);
  // Tura 117: gracz przechodzi bramkę i jest najbliższy -> cel = gracz 0.
  const eligible117 = isPlayerEligibleForEraWarPool(poolInput(PLAYER_ENTRY_OBSERVED_TURN + delay, entryMap.get(0)), WAR_RULES_PARAMS);
  const r117 = assignForcedWarPairings(lone, [], { ...base, freeTargetCandidates: [far, ...(eligible117 ? [player] : [])] });
  const a117 = r117.assignments.find(a => a.ownerId === 2);
  assert(a117 && a117.targetId === 0, `S3: tura 117 -> cel = gracz 0, got ${JSON.stringify(a117)}`);
}

console.log('S4 Kamień: pending Kamienia bez fallbacku (limit R2) także przy wolnym graczu');
{
  const base = { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars };
  const stone = [{ ownerId: 2, q: 0, r: 0, era: 'stone' }];
  const res = assignForcedWarPairings(stone, [], { ...base, freeTargetCandidates: [{ ownerId: 0, q: 1, r: 0 }] });
  assert(res.assignments.length === 0, 'S4: pending Kamienia nie dostaje przydziału z fallbacku');
}

console.log('S5 wiring main.ts: backfill wejścia gracza przed bramką puli (usunięcie linii czerwieni test)');
{
  const mainSrc = fs.readFileSync(path.resolve(AI_SRC, 'main.ts'), 'utf8');
  assert(/if \(playerEpochNow >= 2\) backfillMissingEraEntryTurns\(bronzeEraEnterTurnByOwner, new Map\(\[\[0, playerEpochNow\]\]\), turn\);/.test(mainSrc),
    'S5: main.ts: backfill bronzeEraEnterTurnByOwner dla gracza (epoka >= 2) przed playerEraPoolEligible');
  const idxBackfill = mainSrc.indexOf('new Map([[0, playerEpochNow]]), turn);');
  const idxGate = mainSrc.indexOf('const playerEraPoolEligible = !!playerCity');
  assert(idxBackfill > 0 && idxGate > idxBackfill, 'S5: backfill stoi PRZED bramką playerEraPoolEligible');
}

console.log(`WYNIK: ${passed} OK / ${failed} FAIL`);
if (failed > 0) process.exit(1);
