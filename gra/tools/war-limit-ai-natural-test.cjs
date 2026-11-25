'use strict';
/**
 * war-limit-ai-natural-test.cjs — R-WEB-WAR-LIMIT-AI-NATURAL-VIOLATION-Q1.
 *
 * Regresja: seed 4242, tura 60 — AI 28 dostał DWIE wojny naturalne naraz (1↔28 i 22↔28)
 * przy limicie 1. Przyczyna: applyAllianceObligationsOnWar sprawdzał limit sojusznika
 * ZANIM główna wojna (attacker↔victim) została zapisana w diplomacyRelations, więc
 * obrońca (28) wyglądał na wolnego od wojen naturalnych.
 *
 * Test: (a) czysta funkcja limitu na liście wojen zawierającej wojnę oczekującą — blokuje;
 * (b) źródło main.ts: bramka dołączenia sojusznika dostaje `pendingPrincipal` (asercja
 * negatywna: stara bramka bez argumentu nie może wystąpić); (c) helper pendingPrincipalCounts
 * i liczenie wojny oczekującej w warTypesForOwner.
 * Mutacja: usunięcie argumentu `pendingPrincipal` z bramki sojusznika -> ten test czerwony.
 * Run: node tools/war-limit-ai-natural-test.cjs   (wymaga gra/node_modules z esbuild)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAIN_TS = process.env.WAR_LIMIT_MAIN_TS || path.resolve(ROOT, 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; console.log(`FAIL ${name}${detail ? ': ' + detail : ''}`); }
}
function count(haystack, needle) {
  let n = 0;
  let at = haystack.indexOf(needle);
  while (at !== -1) { n++; at = haystack.indexOf(needle, at + needle.length); }
  return n;
}

// (a) czysta logika limitu: wojna oczekująca w liście blokuje drugą naturalną (obrońca 28).
let limitMod = null;
try {
  const esbuild = require(path.resolve(ROOT, 'node_modules', 'esbuild'));
  const BUNDLE = path.resolve(__dirname, '.war-limit-ai-natural-bundle.cjs');
  esbuild.buildSync({
    entryPoints: [path.resolve(ROOT, 'src', 'game', 'diplomacy-war-limit.ts')],
    bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent',
  });
  limitMod = require(BUNDLE);
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
} catch (e) {
  console.log('UWAGA: brak esbuild/node_modules, pomijam test czystej logiki: ' + String(e && e.message).slice(0, 120));
}
if (limitMod) {
  const P = { limitWojenAktywny: true, maxWojenEpoki: 1, maxWojenNaturalnych: 1 };
  limitMod.setWarLimitEnabledForTest(null);
  // 28 ma już wojnę oczekującą (1↔28, naturalna) -> druga naturalna dla 28 zablokowana.
  ok('obrońca z wojną oczekującą: blok', limitMod.warLimitAllows('naturalna', [], ['naturalna'], P) === false);
  // Bez oczekującej wojny (stan przed poprawką) — wolno. To jest błąd, który test wyłapuje w mainie.
  ok('obrońca bez wojny: dozwolone', limitMod.warLimitAllows('naturalna', [], [], P) === true);
  // Wojna epoki nie liczy się do limitu naturalnego.
  ok('epoka nie blokuje naturalnej', limitMod.warLimitAllows('naturalna', [], ['epoki'], P) === true);
}

// (b) źródło main.ts: bramka dołączenia sojusznika musi dostać wojnę główną.
const allyGateWithPending = 'if (!isMe(allyId) && !warLimitAllowsDeclaration(allyId, ob.mustDeclareWarOn, typWojny, pendingPrincipal)) continue;';
const allyGateOld = 'if (!isMe(allyId) && !warLimitAllowsDeclaration(allyId, ob.mustDeclareWarOn, typWojny)) continue;';
ok('bramka sojusznika dostaje pendingPrincipal', count(mainSrc, allyGateWithPending) === 1);
ok('stara bramka bez pendingPrincipal nieobecna', count(mainSrc, allyGateOld) === 0);
ok('pendingPrincipal zbudowany w applyAllianceObligationsOnWar',
  count(mainSrc, 'const pendingPrincipal: PendingPrincipalWar = { a: attackerId, b: victimId, typ: typWojny };') === 1);

// (c) helper liczenia wojny oczekującej w warTypesForOwner.
ok('warTypesForOwner przyjmuje pending', count(mainSrc, 'function warTypesForOwner(ownerId: number, pomijany: number, pending?: PendingPrincipalWar): TypWojny[]') === 1);
ok('warTypesForOwner dopisuje wojnę oczekującą',
  count(mainSrc, 'if (pending && pendingPrincipalCounts(ownerId, pomijany, pending)) wars.push(pending.typ);') === 1);
ok('pendingPrincipalCounts istnieje', count(mainSrc, 'function pendingPrincipalCounts(ownerId: number, pomijany: number, pending: PendingPrincipalWar): boolean') === 1);

console.log(`war-limit-ai-natural-test: PASS ${pass} / FAIL ${fail}`);
process.exit(fail === 0 ? 0 : 1);
