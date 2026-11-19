'use strict';
/**
 * diplomacy-war-limit-unit-test.cjs — R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1.
 * Czyste testy na prawdziwym module src/game/diplomacy-war-limit.ts (esbuild, bez DOM).
 * Pokrycie: limit epoki i naturalnej niezależnie, atakujący i obrońca, flaga OFF = parytet,
 * stare zapisy bez typWojny = 'naturalna', parser wartości JSON.
 * Poza zakresem tego testu (pokrywa main.ts, nie mierzone tutaj): barbarzyńcy wykluczani przez
 * warTypesForOwner, wpięcie w kaskadę sojuszniczą i bramkę wypowiedzenia.
 * Run: node tools/diplomacy-war-limit-unit-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', 'game', 'diplomacy-war-limit.ts');
const BUNDLE = path.resolve(__dirname, '.dip-warlimit-bundle.cjs');

esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

let pass = 0;
let fail = 0;
function eq(name, got, want) {
  const ok = Object.is(got, want) || JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

const ON = { limitWojenAktywny: true, maxWojenEpoki: 1, maxWojenNaturalnych: 1 };
const OFF = { limitWojenAktywny: false, maxWojenEpoki: 1, maxWojenNaturalnych: 1 };

// --- flaga i parametry ---
M.setWarLimitEnabledForTest(null);
eq('flaga domyslnie OFF (JSON)', M.isWarLimitEnabled(M.WAR_LIMIT_PARAMS), false);
eq('parametr maxWojenEpoki = 1', M.WAR_LIMIT_PARAMS.maxWojenEpoki, 1);
eq('parametr maxWojenNaturalnych = 1', M.WAR_LIMIT_PARAMS.maxWojenNaturalnych, 1);
eq('loader: wartosc z obiektu', M.loadWarLimitParams({ limitWojenAktywny: { wartosc: true }, maxWojenEpoki: { wartosc: 2 } }).limitWojenAktywny, true);
eq('loader: smieci -> bezpieczne', M.loadWarLimitParams({ maxWojenEpoki: 'x', maxWojenNaturalnych: -3 }), { limitWojenAktywny: false, maxWojenEpoki: 1, maxWojenNaturalnych: 1 });
eq('loader: brak danych -> domyslne', M.loadWarLimitParams(undefined), OFF);

// --- typ wojny (kompatybilnosc wsteczna) ---
eq('stary zapis (brak pola) = naturalna', M.parseTypWojny(undefined), 'naturalna');
eq('null = naturalna', M.parseTypWojny(null), 'naturalna');
eq('epoki = epoki', M.parseTypWojny('epoki'), 'epoki');
eq('nieznana wartosc = naturalna', M.parseTypWojny('cokolwiek'), 'naturalna');

// --- flaga OFF = parytet (zawsze wolno) ---
eq('OFF: 1 epoki + nowa epoka wolno', M.warLimitAllows('epoki', ['epoki'], ['epoki'], OFF), true);
eq('OFF: 3 naturalne + nowa naturalna wolno', M.warLimitAllows('naturalna', ['naturalna', 'naturalna', 'naturalna'], [], OFF), true);
M.setWarLimitEnabledForTest(true);
eq('hak ON nadpisuje JSON', M.isWarLimitEnabled(OFF), true);
M.setWarLimitEnabledForTest(false);
eq('hak OFF nadpisuje JSON ON', M.isWarLimitEnabled(ON), false);
M.setWarLimitEnabledForTest(null);

// --- limit epoki i naturalnej niezaleznie ---
eq('ON: 0 wojen -> epoki wolno', M.warLimitAllows('epoki', [], [], ON), true);
eq('ON: atakujacy ma epoke -> 2. epoka zabroniona', M.warLimitAllows('epoki', ['epoki'], [], ON), false);
eq('ON: atakujacy ma naturalna -> nowa epoka wolno (niezaleznie)', M.warLimitAllows('epoki', ['naturalna'], [], ON), true);
eq('ON: atakujacy ma epoke -> nowa naturalna wolno (niezaleznie)', M.warLimitAllows('naturalna', ['epoki'], [], ON), true);
eq('ON: atakujacy ma naturalna -> 2. naturalna zabroniona', M.warLimitAllows('naturalna', ['naturalna'], [], ON), false);
eq('ON: 1 epoki + 1 naturalna u atakujacego -> nowa epoka zabroniona', M.warLimitAllows('epoki', ['epoki', 'naturalna'], [], ON), false);
eq('ON: 1 epoki + 1 naturalna u atakujacego -> nowa naturalna zabroniona', M.warLimitAllows('naturalna', ['epoki', 'naturalna'], [], ON), false);

// --- obronca ogranicza tak samo jak atakujacy ---
eq('ON: obronca ma epoke -> nowa epoka zabroniona', M.warLimitAllows('epoki', [], ['epoki'], ON), false);
eq('ON: obronca ma naturalna -> nowa naturalna zabroniona', M.warLimitAllows('naturalna', [], ['naturalna'], ON), false);
eq('ON: obronca ma naturalna -> nowa epoka wolno', M.warLimitAllows('epoki', [], ['naturalna'], ON), true);
eq('ON: obronca ma epoke -> nowa naturalna wolno', M.warLimitAllows('naturalna', [], ['epoki'], ON), true);

// --- limit wiekszy niz 1 (parametr) ---
const TWO = { limitWojenAktywny: true, maxWojenEpoki: 2, maxWojenNaturalnych: 1 };
eq('max 2 epoki: 1 aktywna -> wolno', M.warLimitAllows('epoki', ['epoki'], [], TWO), true);
eq('max 2 epoki: 2 aktywne -> zabronione', M.warLimitAllows('epoki', ['epoki', 'epoki'], [], TWO), false);

// --- countWarsOfType ---
eq('countWarsOfType', M.countWarsOfType(['epoki', 'naturalna', 'epoki'], 'epoki'), 2);

// --- brzegowy: limit 0 blokuje kazda wojne danego typu ---
const ZERO = { limitWojenAktywny: true, maxWojenEpoki: 0, maxWojenNaturalnych: 1 };
eq('max 0 epoki: blokuje nawet pierwsza', M.warLimitAllows('epoki', [], [], ZERO), false);

try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`diplomacy-war-limit-unit-test: pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
