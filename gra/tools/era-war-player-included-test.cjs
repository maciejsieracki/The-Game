'use strict';
/**
 * era-war-player-included-test.cjs — R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
 * (decyzja właściciela 2026-11-19: gracz objęty wojnami epoki Kamienia, Brązu i Żelaza jak inne cywilizacje).
 * Run from gra/:  node tools/era-war-player-included-test.cjs
 *
 * Zakres: CZYSTA logika (forced-war-common.ts, war-rules-multiwar.ts). Pętli main.ts ten test NIE odtwarza;
 * pełny bieg silnika (Kamień trwa -> Brąz pending -> pokój -> start) NIE ZMIERZONO w tej rundzie.
 *
 *   T1 fallback: pending Brązu bez partnera w puli dostaje WOLNEGO celu = gracz (ownerId 0), gdy jest najbliższy.
 *   T2 fallback: gracz zablokowany sojuszem z napastnikiem -> cel nie jest graczem (wybór innego celu).
 *   T3 licznik: gracz z wyczerpanym licznikiem epoki (canCivJoin = false) nie jest celem fallbacku.
 *   T4 Kamień: fallback wyłączony także dla gracza (pending Kamienia nie dostaje przydziału).
 *   T5 parowanie: pending AI paruje się z graczem (cel = 0), gdy gracz jest w puli warless.
 *   T6 licznik per cywilizacja liczy gracza: recordEraForcedWarParticipation(0) zużywa slot gracza.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[era-war-player-included-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.era-war-player-included-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.era-war-player-included-bundle.cjs');

const ENTRY_TS = `
export {
  assignForcedWarPairings,
} from ${JSON.stringify(AI_SRC + '/game/forced-war-common')};
export {
  WAR_RULES_PARAMS,
  canCivJoinEraForcedWar,
  recordEraForcedWarParticipation,
  eraWarCountFor,
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
  console.error('[era-war-player-included-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  assignForcedWarPairings,
  WAR_RULES_PARAMS,
  canCivJoinEraForcedWar,
  recordEraForcedWarParticipation,
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

// T1: pending Brązu (AI 2) bez partnera; jedyny wolny cel to gracz (0) -- najbliższy.
console.log('T1 fallback: wolny cel = gracz (ownerId 0)');
{
  const base = { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars };
  const lone = [{ ownerId: 2, q: 0, r: 0, era: 'bronze' }];
  const player = { ownerId: 0, q: 1, r: 0 };
  const far = { ownerId: 5, q: 9, r: 0, era: 'bronze' };
  const res = assignForcedWarPairings(lone, [], { ...base, freeTargetCandidates: [far, player] });
  const a2 = res.assignments.find(a => a.ownerId === 2);
  assert(res.unresolvedOwnerIds.length === 0, 'T1: brak unresolved');
  assert(a2 && a2.era === 'bronze' && a2.targetId === 0, `T1: owner 2 -> gracz 0 (got ${JSON.stringify(a2)})`);
}

// T2: gracz zablokowany sojuszem z napastnikiem -> nie jest wybierany.
console.log('T2 sojusz z napastnikiem blokuje gracza jako cel');
{
  const blockPlayer = (a, b) => (a === 2 && b === 0) || (a === 0 && b === 2);
  const base = { isPairBlocked: blockPlayer, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars };
  const lone = [{ ownerId: 2, q: 0, r: 0, era: 'bronze' }];
  const player = { ownerId: 0, q: 1, r: 0 };
  const other = { ownerId: 6, q: 3, r: 0, era: 'bronze' };
  const res = assignForcedWarPairings(lone, [], { ...base, freeTargetCandidates: [player, other] });
  const a2 = res.assignments.find(a => a.ownerId === 2);
  assert(a2 && a2.targetId === 6, `T2: cel = 6 (gracz zablokowany), got ${JSON.stringify(a2)}`);
}

// T3: licznik gracza wyczerpany w epoce Brązu -> gracz nie jest celem fallbacku.
console.log('T3 wyczerpany licznik gracza wyklucza go z fallbacku');
{
  const exhaustedPlayer = (oid) => oid === 0;
  const base = { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars,
    isEraWarExhausted: exhaustedPlayer };
  const lone = [{ ownerId: 2, q: 0, r: 0, era: 'bronze' }];
  const player = { ownerId: 0, q: 1, r: 0 };
  const res = assignForcedWarPairings(lone, [], { ...base, freeTargetCandidates: [player] });
  const a2 = res.assignments.find(a => a.ownerId === 2);
  assert(!a2 && res.unresolvedOwnerIds.includes(2), `T3: brak przydziału (gracz wyczerpany), got ${JSON.stringify(a2)}`);
}

// T4: Kamień nie korzysta z fallbacku, także gdy kandydatem jest gracz.
console.log('T4 Kamień: fallback wyłączony także dla gracza');
{
  const base = { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars };
  const stoneLone = [{ ownerId: 2, q: 0, r: 0, era: 'stone' }];
  const player = { ownerId: 0, q: 1, r: 0 };
  const res = assignForcedWarPairings(stoneLone, [], { ...base, freeTargetCandidates: [player] });
  assert(res.assignments.length === 0, 'T4: Kamień bez partnera -> brak przydziału (gracz nie jest fallbackiem)');
}

// T5: parowanie z pulą -- gracz w puli warless paruje się z AI (cel gracza = 0 po stronie AI).
console.log('T5 parowanie: gracz w puli warless paruje się z najbliższym AI');
{
  const base = { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars };
  const subjects = [
    { ownerId: 0, q: 0, r: 0, era: 'bronze' },
    { ownerId: 3, q: 1, r: 0, era: 'bronze' },
  ];
  const res = assignForcedWarPairings(subjects, [], base);
  const a3 = res.assignments.find(a => a.ownerId === 3);
  assert(a3 && a3.targetId === 0, `T5: AI 3 -> cel gracz 0 (got ${JSON.stringify(a3)})`);
  assert(res.unresolvedOwnerIds.length === 0, 'T5: brak unresolved');
}

// T6: licznik per cywilizacja liczy gracza (slot epoki Brązu zajęty przez wypowiedzenie gracza jako celu).
console.log('T6 licznik wojen epoki liczy gracza');
{
  // Epoka 2 = Brąz. AI 2 (napastnik) wypowiada wojnę graczowi (cel 0): licznik gracza w Brązie rośnie.
  const counts = new Map();
  const before = canCivJoinEraForcedWar(counts, 0, 2, WAR_RULES_PARAMS);
  recordEraForcedWarParticipation(counts, 2, 0, 2, 2);
  const after = canCivJoinEraForcedWar(counts, 0, 2, WAR_RULES_PARAMS);
  const otherEra = canCivJoinEraForcedWar(counts, 0, 3, WAR_RULES_PARAMS);
  assert(before === true, 'T6: przed wojną gracz może wejść w wojnę epoki Brązu');
  assert(after === false, `T6: po wojnie epoki w Brązie (cel = gracz) licznik gracza zużyty (max=${WAR_RULES_PARAMS.maxEraForcedWarsPerCivPerEra})`);
  assert(otherEra === true, 'T6: licznik jest per epoka (Żelazo nadal wolne dla gracza)');
}

console.log(`\nWYNIK: ${passed} OK / ${failed} FAIL`);
if (failed > 0) process.exit(1);
