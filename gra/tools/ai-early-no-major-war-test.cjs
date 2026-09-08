'use strict';
/**
 * ai-early-no-major-war-test.cjs — P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1.
 * Bramka: w oknie pierwszych AI_MAJOR_EARLY_NO_WAR_TURNS tur (Priorytet 4,
 * decideAIDiplomacy) GŁÓWNA cywilizacja AI nie wypowiada "zwykłej" wojny drugiej
 * GŁÓWNEJ cywilizacji, ale ataki na miasta-państwo (isMinorCivPartner) pozostają
 * bez zmian, a po turze > AI_MAJOR_EARLY_NO_WAR_TURNS zachowanie wraca do normy.
 * Run from gra/: node tools/ai-early-no-major-war-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.ai-early-no-major-war-bundle.cjs');
const entryFile = path.resolve(__dirname, '.ai-early-no-major-war-entry.ts');
fs.writeFileSync(entryFile, `
export {
  decideAIDiplomacy,
  loadDefaultAIDiplomacyProgs,
  AI_MAJOR_EARLY_NO_WAR_TURNS,
} from '../src/game/ai.ts';
`);

esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  decideAIDiplomacy,
  AI_MAJOR_EARLY_NO_WAR_TURNS,
} = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}

console.log(`AI_MAJOR_EARLY_NO_WAR_TURNS = ${AI_MAJOR_EARLY_NO_WAR_TURNS}`);
assert(AI_MAJOR_EARLY_NO_WAR_TURNS === 25, 'stała okna = 25 (zgodnie z GOAL/dispatch)');

/**
 * Relacja "wrogo nastawiona, AI silniejsze" — dobrana tak, by W BRAKU nowego guarda
 * Priorytet 4 (wypowiedz_wojne) ZAWSZE odpalał: niskie zaufanie/respekt (score bardzo
 * niski), respektWzgledny wysoki (AI znacznie silniejsze), brak stanu wojny/NAP/
 * peaceLocked. agresja=0.8 (>> PROG_WOJNA_AGRESJA domyślne 0.5).
 */
function hostileRelacja(partnerId, overrides = {}) {
  return {
    partnerId,
    relation: { zaufanie: 5, respekt: 5, status: 'pokoj' },
    respektWzgledny: 0.85,
    stanWojny: false,
    peaceLocked: false,
    hasNapTreaty: false,
    partnerTypCywilizacji: 'rzymianie',
    ...overrides,
  };
}

function warCommandFor(partnerId, cmds) {
  return cmds.find(c => c.type === 'wypowiedz_wojne' && c.targetId === partnerId);
}

function runCase(label, currentTurn, isMinorCivPartner) {
  const cmds = decideAIDiplomacy({
    myPlayerId: '1',
    agresja: 0.8,
    myTypCywilizacji: 'grecy',
    currentTurn,
    relacje: [hostileRelacja('2', { isMinorCivPartner })],
  });
  const fired = !!warCommandFor('2', cmds);
  console.log(`  [${label}] tura=${currentTurn} isMinorCivPartner=${isMinorCivPartner} -> wypowiedz_wojne=${fired}`);
  return fired;
}

// ---------------------------------------------------------------------------
// PRZED (kontrolne, sprzed naprawy): dowód że baseline scenariusza faktycznie
// wyzwala Priorytet 4 bez żadnego okna — sprawdzone wprost commitem sprzed
// naprawy (patrz raport operatora, sekcja TESTY: git stash + uruchomienie tego
// samego scenariusza na ai.ts sprzed edycji). Tu sprawdzamy wyłącznie PO.
// ---------------------------------------------------------------------------

console.log('\n--- A: tura 1..25, partner = GŁÓWNA cywilizacja -> wojna NIE wypowiadana ---');
for (const t of [1, 10, 24, 25]) {
  assert(runCase('A', t, false) === false, `A: tura ${t} major-vs-major -> brak wypowiedz_wojne`);
}

console.log('\n--- B: tura 1..25, partner = MIASTO-PAŃSTWO -> wojna nadal dozwolona ---');
for (const t of [1, 10, 24, 25]) {
  assert(runCase('B', t, true) === true, `B: tura ${t} major-vs-miasto-panstwo -> wypowiedz_wojne nadal odpala`);
}

console.log('\n--- C: tura > 25, partner = GŁÓWNA cywilizacja -> zachowanie wraca do normy ---');
for (const t of [26, 40, 100]) {
  assert(runCase('C', t, false) === true, `C: tura ${t} major-vs-major -> wypowiedz_wojne wraca (brak trwałego wyłączenia)`);
}

console.log('\n--- D: brak currentTurn (undefined -> traktowane jak tura 0) -> wciąż w oknie ---');
{
  const cmds = decideAIDiplomacy({
    myPlayerId: '1',
    agresja: 0.8,
    myTypCywilizacji: 'grecy',
    relacje: [hostileRelacja('2', { isMinorCivPartner: false })],
  });
  assert(!warCommandFor('2', cmds), 'D: currentTurn undefined (=0) -> nadal w oknie, brak wojny major-vs-major');
}

console.log('\n--- E: ścieżki wymuszonej wojny (clusterForceWarTargetId) całkowicie POZA oknem ---');
{
  const cmds = decideAIDiplomacy({
    myPlayerId: '1',
    agresja: 0.8,
    myTypCywilizacji: 'grecy',
    currentTurn: 5,
    clusterForceWarTargetId: 2,
    relacje: [hostileRelacja('2', { isMinorCivPartner: true })],
  });
  assert(!!warCommandFor('2', cmds), 'E: clusterForceWarTargetId nadal wypowiada wojnę w turze 5 (regresja zerowa)');
}

console.log('\n========================================');
console.log(`ai-early-no-major-war-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
