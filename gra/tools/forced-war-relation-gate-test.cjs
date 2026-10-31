'use strict';
/**
 * forced-war-relation-gate-test.cjs -- R-WEB-PEACE-RULES-R8R9-Q1, kryterium 1 (R8).
 *
 * Wojna epoki (Kamień / Brąz / Żelazo) jest BLOKOWANA wobec partnera, z którym Relacja
 * (relationScore: Zaufanie + Respekt, 0–200) wynosi co najmniej 100 (decyzja właściciela D1).
 * Próg 99 nie blokuje, 100 blokuje.
 *
 * Część A -- PRAWDZIWY moduł (esbuild): game/forced-war-common.ts (assignForcedWarPairings,
 *           isForcedWarRelationBlocked). Bez reimplementacji.
 * Część B -- kontrakt okablowania main.ts (tekstowy): bramka R8 w isForcedWarPairBlocked
 *           i w opts przekazywanych do assignForcedWarPairings.
 *
 * Mutacje (test MUSI paść): usunięcie linii `pairRelationScore: pairRelationOfR8,` z main.ts
 * lub zdjęcie bramki `|| isForcedWarRelationBlocked(...)` z isForcedWarPairBlocked.
 * Uruchomienie (z katalogu gra/): node tools/forced-war-relation-gate-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const entry = path.resolve(__dirname, '.forced-war-relation-gate-entry.ts');
const bundle = path.resolve(__dirname, '.forced-war-relation-gate-bundle.cjs');
const J = (p) => JSON.stringify(path.join(SRC, p));
fs.writeFileSync(entry, `
export * from ${J('game/forced-war-common')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(JSON.stringify(a) === JSON.stringify(b), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const hexDist = (aq, ar, bq, br) => Math.abs(aq - bq) + Math.abs(ar - br);

let api;
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  api = require(bundle);
} finally {
  try { fs.unlinkSync(entry); } catch (e) { /* nieistotne */ }
}

console.log('--- A1: progi relacji (isForcedWarRelationBlocked) ---');
eq(api.FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD, 100, 'próg bramki R8 = 100');
eq(api.isForcedWarRelationBlocked(0), false, 'Relacja 0 nie blokuje');
eq(api.isForcedWarRelationBlocked(99), false, 'Relacja 99 NIE blokuje');
eq(api.isForcedWarRelationBlocked(100), true, 'Relacja 100 BLOKUJE');
eq(api.isForcedWarRelationBlocked(200), true, 'Relacja 200 blokuje');

// Dwa podmioty (1 i 2) w pustym świecie, obaj warless, obaj stone-era, sąsiedzi.
function pairFor(relation, extra = {}) {
  return api.assignForcedWarPairings(
    [
      { ownerId: 1, q: 0, r: 0, era: 'stone' },
      { ownerId: 2, q: 1, r: 0, era: 'stone' },
    ],
    [],
    {
      isPairBlocked: () => false,
      hexDistanceFn: hexDist,
      totalActiveForcedWarsByOwner: () => 0,
      pairRelationScore: (a, b) => (
        (a === 1 && b === 2) || (a === 2 && b === 1) ? relation : 0
      ),
      ...extra,
    },
  );
}

console.log('--- A2: parowanie 1v1 (AI↔AI) przy Relacji 100 / 99 ---');
{
  const at100 = pairFor(100);
  eq(at100.assignments, [], 'Relacja 100: para 1↔2 NIE powstaje (brak wypowiedzenia wojny epoki)');
  const at99 = pairFor(99);
  assert(
    at99.assignments.some(a => a.ownerId === 1 && a.targetId === 2)
      && at99.assignments.some(a => a.ownerId === 2 && a.targetId === 1),
    'Relacja 99: para 1↔2 powstaje (obie strony kierują wojnę na siebie)',
  );
}

console.log('--- A3: gracz-pierwszy (playerFirst): kandydat z Relacją >= 100 pominięty, następny wolny wybrany ---');
{
  // Gracz 0 w (0,0). AI 3 najbliżej (dystans 1), AI 4 dalej (dystans 2).
  const subjects = [
    { ownerId: 0, q: 0, r: 0 },
    { ownerId: 3, q: 1, r: 0, era: 'stone' },
    { ownerId: 4, q: 2, r: 0, era: 'stone' },
  ];
  const playerFirstOpts = (relWith3) => ({
    isPairBlocked: () => false,
    hexDistanceFn: hexDist,
    totalActiveForcedWarsByOwner: () => 0,
    pairRelationScore: (a, b) => {
      const other = a === 0 ? b : (b === 0 ? a : null);
      if (other === 3) return relWith3;
      return 0;
    },
    playerFirst: {
      playerOwnerId: 0,
      isPlayerPairGateOpen: () => true,
      candidates: [
        { ownerId: 3, q: 1, r: 0, era: 'stone' },
        { ownerId: 4, q: 2, r: 0, era: 'stone' },
      ],
    },
  });
  const skip = api.assignForcedWarPairings(subjects, [], playerFirstOpts(100));
  eq(skip.playerFirstPartnerId, 4, 'Relacja gracza z AI 3 = 100: AI 3 pominięty, partnerem gracza zostaje AI 4');
  const pick = api.assignForcedWarPairings(subjects, [], playerFirstOpts(99));
  eq(pick.playerFirstPartnerId, 3, 'Relacja gracza z AI 3 = 99: AI 3 (najbliższy) wybrany jak dotąd');
}

console.log('--- A4: dołączanie trzeciego (leftover) nie wybiera pary z Relacją >= 100 ---');
{
  // Podmiot 5 (warless, leftover) i istniejąca para 6↔7. Relacja 5↔6 = 100 -> para odpada.
  const res = api.assignForcedWarPairings(
    [{ ownerId: 5, q: 0, r: 0, era: 'iron' }],
    [{ attackerId: 6, targetId: 7, era: 'bronze' }],
    {
      isPairBlocked: () => false,
      hexDistanceFn: hexDist,
      totalActiveForcedWarsByOwner: (oid) => (oid === 5 ? 0 : 1),
      pairRelationScore: (a, b) => ((a === 5 && (b === 6 || b === 7)) || (b === 5 && (a === 6 || a === 7)) ? 100 : 0),
    },
  );
  eq(res.assignments, [], 'leftover 5 z Relacją 100 do pary 6↔7 NIE dołącza');
  eq(res.unresolvedOwnerIds, [5], 'leftover 5 zostaje nierozwiązany (ECHO: nie zgadujemy)');
}

console.log('--- B: okablowanie main.ts (R8) ---');
{
  const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  assert(
    /const isForcedWarPairBlocked = \(a: number, b: number\): boolean =>[\s\S]{0,400}?\|\| isForcedWarRelationBlocked\(pairRelationOfR8\(a, b\)\);/.test(mainSrc),
    'B1: isForcedWarPairBlocked zawiera bramkę Relacji R8',
  );
  assert(
    /const pairRelationOfR8 = \(x: number, y: number\): number => relationScore\(getDiploRelation\(x, y\)\);/.test(mainSrc),
    'B2: pairRelationOfR8 czyta relationScore(getDiploRelation(...)) -- ta sama miara co licznik pokoju R7',
  );
  assert(
    /isPairBlocked: isForcedWarPairBlocked,\s*\n\s*pairRelationScore: pairRelationOfR8,/.test(mainSrc),
    'B3: opts assignForcedWarPairings dostaje pairRelationScore (kandydaci gracza-pierwszego i parowanie)',
  );
}

console.log(`\nforced-war-relation-gate-test: ${passed} pass, ${failed} fail`);
try { fs.unlinkSync(bundle); } catch (e) { /* nieistotne */ }
if (failed > 0) process.exit(1);
