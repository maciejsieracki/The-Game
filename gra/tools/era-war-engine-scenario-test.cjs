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
 *   S6-S9 (runda 4): SEKWENCJA turowa przez realne funkcje (isEligibleForBronzeForcedWar, isEraWarTargetDelayOk -- wyciągnięta
 *      z main.ts do war-rules-multiwar.ts --, isPlayerEligibleForEraWarPool, assignForcedWarPairings z playerFirst):
 *      Kamień trwa -> Brąz pending -> pokój -> Brąz startuje w PIERWSZEJ turze po pokoju (gracz = cel), także gdy blokadą była
 *      wojna naturalna; opóźnienie 40 tur AI od wejścia; zasada "AI w wojnie z graczem nie jest partnerem" (pin main.ts).
 *   Mutacje (MUTATE=delay|wiring|gate|nobackfill): delay = isEraWarTargetDelayOk zawsze true (esbuild onLoad),
 *      wiring = main.ts bez wywołania eraWarTargetDelayOk w parze gracza, gate = main.ts bez filtra wojny pary AI-gracz.
 *   Pętla main.ts jako całość nie wykonuje się w node (przeglądarka) -- sekwencja jest lustrem jej kroków na realnych funkcjach;
 *   wiązanie main.ts z tymi funkcjami pilnują piny S5/S9.
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
const MUTATE = process.env.MUTATE || '';
const NO_BACKFILL = process.env.MUTATE_NO_BACKFILL === '1' || MUTATE === 'nobackfill';

// Mutacja delay: kopia war-rules-multiwar.ts z isEraWarTargetDelayOk zawsze true (plik pomocniczy obok oryginału, nie do commita).
let MULTIWAR_MODULE = AI_SRC + '/game/war-rules-multiwar';
if (MUTATE === 'delay') {
  const orig = fs.readFileSync(path.resolve(AI_SRC, 'game', 'war-rules-multiwar.ts'), 'utf8');
  const needle = 'return inp.turn - entry >= params.eraForcedWarStartTurnsFromEra[tag];';
  if (!orig.includes(needle)) { console.error('mutacja delay: brak punktu zaczepienia'); process.exit(1); }
  fs.writeFileSync(path.resolve(AI_SRC, 'game', 'mutdelay-war-rules-multiwar.ts'), orig.replace(needle, 'return true;'), 'utf8');
  MULTIWAR_MODULE = AI_SRC + '/game/mutdelay-war-rules-multiwar';
}

const ENTRY_TS = `
export {
  assignForcedWarPairings,
} from ${JSON.stringify(AI_SRC + '/game/forced-war-common')};
export {
  WAR_RULES_PARAMS,
  isPlayerEligibleForEraWarPool,
  backfillMissingEraEntryTurns,
  isEraWarTargetDelayOk,
} from ${JSON.stringify(MULTIWAR_MODULE)};
export { isEligibleForBronzeForcedWar } from ${JSON.stringify(AI_SRC + '/game/forced-war-bronze')};
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

// Plik pomocniczy mutacji delay jest tylko na czas bundlowania.
if (MUTATE === 'delay') { try { fs.unlinkSync(path.resolve(AI_SRC, 'game', 'mutdelay-war-rules-multiwar.ts')); } catch (_) { /* brak */ } }

const {
  assignForcedWarPairings,
  WAR_RULES_PARAMS,
  isPlayerEligibleForEraWarPool,
  backfillMissingEraEntryTurns,
  isEraWarTargetDelayOk,
  isEligibleForBronzeForcedWar,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  PASS: ' + msg); }
  else { failed++; console.log('  FAIL: ' + msg); }
}

function readMain() {
  let src = fs.readFileSync(path.resolve(AI_SRC, 'main.ts'), 'utf8');
  if (MUTATE === 'wiring') src = src.split('&& eraWarTargetDelayOk(aiOwnerId)').join('');
  if (MUTATE === 'gate') src = src.split("&& getDiploRelation(aiOwnerId, 0).status !== 'wojna'").join('');
  return src;
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
  const mainSrc = readMain();
  assert(/if \(playerEpochNow >= 2\) backfillMissingEraEntryTurns\(bronzeEraEnterTurnByOwner, new Map\(\[\[0, playerEpochNow\]\]\), turn\);/.test(mainSrc),
    'S5: main.ts: backfill bronzeEraEnterTurnByOwner dla gracza (epoka >= 2) przed playerEraPoolEligible');
  const idxBackfill = mainSrc.indexOf('new Map([[0, playerEpochNow]]), turn);');
  const idxGate = mainSrc.indexOf('const playerEraPoolEligible = !!playerCity');
  assert(idxBackfill > 0 && idxGate > idxBackfill, 'S5: backfill stoi PRZED bramką playerEraPoolEligible');
}

console.log('S6-S8 sekwencja: Kamień trwa -> Brąz pending -> pokój -> start w 1. turze po pokoju (gracz = cel)');
{
  const BRONZE_ENTER_AI = 41;
  const PLAYER_ENTER = 41;
  const PEACE_TURN = 85; // pokój w turze 85 (wojna Kamienia 1<->2 kończy się); tura 86 = pierwsza po pokoju
  const params = WAR_RULES_PARAMS;
  const pos = { 0: [1, 0], 1: [0, 0], 2: [5, 0] };
  // Jedna tura: lustro kroków main.ts na realnych funkcjach.
  function turnStep(turn, st) {
    const triggered = [];
    const alreadyAtWarAnyRole = st.stoneWarActive || st.natural1 > 0;
    if (isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: alreadyAtWarAnyRole, currentTurn: turn, eraEnterTurn: BRONZE_ENTER_AI })) {
      triggered.push({ ownerId: 1, q: pos[1][0], r: pos[1][1], era: 'bronze' });
    }
    const playerEligible = isPlayerEligibleForEraWarPool({ currentTurn: turn, playerEpoch: 2, activeForcedWarsTotal: 0, activeForcedWarsInPlayerEra: 0, eraEnterTurn: st.playerEnter ?? PLAYER_ENTER, poolStartTurn: 0 }, params);
    if (playerEligible) triggered.push({ ownerId: 0, q: pos[0][0], r: pos[0][1] });
    const candidates = [
      { ownerId: 1, q: pos[1][0], r: pos[1][1], era: 'bronze' },
      { ownerId: 2, q: pos[2][0], r: pos[2][1], era: 'stone' },
    ];
    const res = assignForcedWarPairings(triggered, [], {
      isPairBlocked: noBlock,
      hexDistanceFn: hexDist,
      totalActiveForcedWarsByOwner: (oid) => (st.stoneWarActive && (oid === 1 || oid === 2) ? 1 : 0),
      freeTargetCandidates: [],
      playerFirst: {
        playerOwnerId: 0,
        // Lustro isPlayerPairGateOpen z main.ts: brak aktywnej wojny epoki, opóźnienie AI (funkcja realna), brak wojny AI<->gracz.
        isPlayerPairGateOpen: (aiId) => !(st.stoneWarActive && (aiId === 1 || aiId === 2))
          && isEraWarTargetDelayOk({ turn, ownerId: aiId, epoch: aiId === 1 ? 2 : 1, bronzeEnterTurn: aiId === 1 ? BRONZE_ENTER_AI : undefined, ironEnterTurn: undefined }, params)
          && !(aiId === 1 && st.pairAtWarWithPlayer),
        candidates,
      },
    });
    return res.assignments.find((a) => a.ownerId === 1);
  }
  const during = turnStep(PEACE_TURN, { stoneWarActive: true, natural1: 1, pairAtWarWithPlayer: false });
  assert(during === undefined, 'S6: w trakcie wojny Kamienia (t85) Brąz AI 1 NIE dostaje celu');
  const first = turnStep(PEACE_TURN + 1, { stoneWarActive: false, natural1: 0, pairAtWarWithPlayer: false });
  assert(first && first.era === 'bronze' && first.targetId === 0, `S6: tura ${PEACE_TURN + 1} (pierwsza po pokoju) -> Brąz AI 1 -> cel gracz 0, got ${JSON.stringify(first)}`);
  // S7: blokadą była wojna NATURALNA, a drogą startu fallback wolnego celu (gracz poza grą/pulą) -- ta sama reguła "1. tura po pokoju".
  function fallbackStep(turn, natural1) {
    const triggered = [];
    if (isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: natural1 > 0, currentTurn: turn, eraEnterTurn: BRONZE_ENTER_AI })) {
      triggered.push({ ownerId: 1, q: pos[1][0], r: pos[1][1], era: 'bronze' });
    }
    const free = [{ ownerId: 3, q: 9, r: 0, era: 'bronze' }].filter((c) => isEraWarTargetDelayOk({ turn, ownerId: c.ownerId, epoch: 2, bronzeEnterTurn: 41, ironEnterTurn: undefined }, params));
    const res = assignForcedWarPairings(triggered, [], { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars, freeTargetCandidates: free });
    return res.assignments.find((a) => a.ownerId === 1);
  }
  const natDuring = fallbackStep(PEACE_TURN, 1);
  assert(natDuring === undefined, 'S7: wojna naturalna AI 1 (t85) blokuje start Brązu (fallback)');
  const natFirst = fallbackStep(PEACE_TURN + 1, 0);
  assert(natFirst && natFirst.era === 'bronze' && natFirst.targetId === 3, `S7: pierwsza tura po pokoju naturalnym -> Brąz startuje (cel 3), got ${JSON.stringify(natFirst)}`);
  const natEarly = fallbackStep(51, 0);
  assert(natEarly === undefined, 'S7: kontrola opóźnienia (t51, 10 tur po wejściu) -> brak startu');
  // S7b: AI w wojnie naturalnej Z GRACZEM nie jest partnerem pary gracza (pin main.ts w S9; tu lustro gate).
  const atWarWithPlayer = turnStep(PEACE_TURN + 1, { stoneWarActive: false, natural1: 1, pairAtWarWithPlayer: true });
  assert(atWarWithPlayer === undefined, 'S7b: AI 1 w wojnie z graczem nie dostaje pary z graczem (kandydat odrzucony przez gate)');
  const early = turnStep(51, { stoneWarActive: false, natural1: 0, pairAtWarWithPlayer: false });
  assert(early === undefined, `S8: tura 51 (10 tur po wejściu AI) -> brak celu mimo braku wojny, got ${JSON.stringify(early)}`);
  // S8b: gracz już dopuszczony (wejście t5), ale kandydat-AI 1 wszedł w t41 -- w t51 opóźnienie AI blokuje parę; w t81 otwiera (mutacja delay czerwona).
  const aiDelayed = turnStep(51, { stoneWarActive: false, natural1: 0, pairAtWarWithPlayer: false, playerEnter: 5 });
  assert(aiDelayed === undefined, `S8b: gracz dopuszczony, ale AI 1 (wejście t41) w t51 jeszcze za wcześnie -> brak pary, got ${JSON.stringify(aiDelayed)}`);
  const d = params.eraForcedWarStartTurnsFromEra.bronze;
  const at81 = turnStep(BRONZE_ENTER_AI + d, { stoneWarActive: false, natural1: 0, pairAtWarWithPlayer: false });
  assert(at81 && at81.targetId === 0, `S8: tura ${BRONZE_ENTER_AI + d} (próg ${d} tur po wejściu) -> cel gracz 0, got ${JSON.stringify(at81)}`);
}

console.log('S9 wiring main.ts: eraWarTargetDelayOk -> isEraWarTargetDelayOk; para gracza z delay i filtrem wojny AI-gracz');
{
  const mainSrc = readMain();
  assert(/const eraWarTargetDelayOk = \(oid: number\): boolean => isEraWarTargetDelayOk\(/.test(mainSrc), 'S9: main.ts: eraWarTargetDelayOk wola isEraWarTargetDelayOk (czysta funkcja)');
  assert(/isPlayerPairGateOpen: \(aiOwnerId: number\): boolean =>[\s\S]{0,400}&& eraWarTargetDelayOk\(aiOwnerId\)/.test(mainSrc), 'S9: main.ts: para gracza wymaga eraWarTargetDelayOk(aiOwnerId)');
  assert(/isPlayerPairGateOpen: \(aiOwnerId: number\): boolean =>[\s\S]{0,900}&& getDiploRelation\(aiOwnerId, 0\)\.status !== 'wojna'/.test(mainSrc), 'S9: main.ts: para gracza odrzuca AI w wojnie naturalnej z graczem');
  assert(/freeTargetCandidates: \[[\s\S]{0,900}eraWarTargetDelayOk\(s\.ownerId\)/.test(mainSrc), 'S9: main.ts: fallback freeTargetCandidates filtruje eraWarTargetDelayOk');
  assert(/\(prev < 2 && next >= 2\) \|\| \(next >= 2 && !bronzeEraEnterTurnByOwner\.has\(0\)\)/.test(mainSrc), 'S9: main.ts: reconcilePlayerEraFromResearch zapisuje wejście gracza w Brąz także przy braku wpisu');
}

console.log(`WYNIK: ${passed} OK / ${failed} FAIL`);
if (failed > 0) process.exit(1);
