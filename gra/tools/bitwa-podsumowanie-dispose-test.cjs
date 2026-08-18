'use strict';
/**
 * bitwa-podsumowanie-dispose-test.cjs
 *
 * P-BITWA-PODSUMOWANIE-NIGDY-NIE-WIDOCZNE:
 * Po kliknięciu „Powrót na mapę" w ekranie końca bitwy 3D sekwencja to:
 *   onFinishCb → showPostBattleSummary (mapa) → dispose() → _hideEndDetails()
 * Stary błąd: _hideEndDetails() wołało hidePostBattleSummary() gdy
 * isPostBattleSummaryOpen() — kasowało świeżo otwarte mapowe podsumowanie
 * w tym samym ticku (gracz nigdy nie widział ekranu).
 *
 * Trzy części:
 *  A) REPRO behawioralny (esbuild + jsdom): pełna kolejność onFinish → summary → dispose-hide
 *  B) NEGACJA: stary warunek (|| isPostBattleSummaryOpen) kasuje mapowe podsumowanie;
 *     naprawiony warunek (_battleStatsOpen tylko) — nie
 *  C) PIN tekstowy na battleScene.ts — bez pinu A/B przechodziłyby po cofnięciu fixu
 *
 * Usage (z gra/): node tools/bitwa-podsumowanie-dispose-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[bitwa-podsumowanie-dispose-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const BATTLE_TS = path.join(GRA, 'src', 'battle', 'battleScene.ts');
const ENTRY = path.join(__dirname, '.bitwa-podsumowanie-dispose-entry.ts');
const BUNDLE = path.join(__dirname, '.bitwa-podsumowanie-dispose-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  [
    "export { showPostBattleSummary, hidePostBattleSummary, isPostBattleSummaryOpen } from '../src/ui/postBattleSummary.ts';",
    "export { buildPostBattleSummary } from '../src/game/battle-summary.ts';",
  ].join('\n'),
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const {
  showPostBattleSummary,
  hidePostBattleSummary,
  isPostBattleSummaryOpen,
  buildPostBattleSummary,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

function setupDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  global.MouseEvent = dom.window.MouseEvent;
  hidePostBattleSummary();
}

function minimalSummaryData() {
  return buildPostBattleSummary({
    winner: 'atakujacy',
    atkLabel: 'Legion',
    defLabel: 'Barbarzyńcy',
    mode: 'manual',
    atkBefore: [{ id: 'a1', typeId: 'Hastati', kategoria: 'Wrecz', hp: 40, maxHp: 40 }],
    defBefore: [{ id: 'd1', typeId: 'Lucznik', kategoria: 'Lucznik', hp: 30, maxHp: 30 }],
    lookupHp: (id) => (id === 'd1' ? 0 : 35),
  });
}

/** Stary (buggy) warunek sprzed 38025d4b — repro negacji. */
function hideEndDetailsBuggy(battleStatsOpen) {
  if (battleStatsOpen || isPostBattleSummaryOpen()) {
    hidePostBattleSummary();
  }
}

/** Naprawiony warunek — tylko overlay sceny bitwy (Szczegóły / roster w bitwie). */
function hideEndDetailsFixed(battleStatsOpen) {
  if (battleStatsOpen) {
    hidePostBattleSummary();
  }
}

/** Symuluje dispose() końcówkę: tylko _hideEndDetails (mapa już otwarta przez onFinishCb). */
function simulateDisposeHideEndDetails(hideFn, battleStatsOpen) {
  hideFn(battleStatsOpen);
}

console.log('bitwa-podsumowanie-dispose-test (P-BITWA-PODSUMOWANIE-NIGDY-NIE-WIDOCZNE)\n');

// ---------------------------------------------------------------------------
// A) REPRO: onFinishCb → showPostBattleSummary → dispose/_hideEndDetails (naprawiony)
// ---------------------------------------------------------------------------
setupDom();
let onContinueCalled = false;
const onFinishCb = () => {
  showPostBattleSummary(minimalSummaryData(), () => { onContinueCalled = true; });
};
onFinishCb();
ok(isPostBattleSummaryOpen(), '[A1] po onFinishCb mapowe podsumowanie jest otwarte');
ok(document.querySelectorAll('.pbs-roster-col').length >= 2,
  '[A2] DOM zawiera kolumny rosteru (.pbs-roster-col)');

simulateDisposeHideEndDetails(hideEndDetailsFixed, false);
ok(isPostBattleSummaryOpen(), '[A3] po dispose/_hideEndDetails (battleStatsOpen=false) mapowe podsumowanie NADAL otwarte');
ok(document.querySelectorAll('.pbs-roster-col').length >= 2,
  '[A4] kolumny rosteru nadal w DOM po dispose');
ok(!onContinueCalled, '[A5] onContinue NIE wywołany automatycznie (gracz decyduje)');

// ---------------------------------------------------------------------------
// B) NEGACJA: stary warunek kasuje mapowe podsumowanie; naprawiony — nie
// ---------------------------------------------------------------------------
setupDom();
onFinishCb();
ok(isPostBattleSummaryOpen(), '[B1] negacja: podsumowanie otwarte przed dispose');

simulateDisposeHideEndDetails(hideEndDetailsBuggy, false);
ok(!isPostBattleSummaryOpen(), '[B2] negacja: stary warunek (|| isPostBattleSummaryOpen) KASUJE mapowe podsumowanie');
ok(document.querySelectorAll('.pbs-roster-col').length === 0,
  '[B3] negacja: po starym warunku brak .pbs-roster-col w DOM');

setupDom();
onFinishCb();
simulateDisposeHideEndDetails(hideEndDetailsFixed, false);
ok(isPostBattleSummaryOpen(), '[B4] negacja: naprawiony warunek NIE kasuje mapowego podsumowania');

// ---------------------------------------------------------------------------
// B2) Wewnętrzny overlay bitwy (_battleStatsOpen=true) nadal się zamyka
// ---------------------------------------------------------------------------
setupDom();
let battleOverlayClosed = false;
showPostBattleSummary(minimalSummaryData(), () => { battleOverlayClosed = true; });
simulateDisposeHideEndDetails(hideEndDetailsFixed, true);
ok(!isPostBattleSummaryOpen(), '[B5] overlay sceny bitwy (_battleStatsOpen) nadal zamykany przy dispose');
ok(document.querySelectorAll('.pbs-roster-col').length === 0,
  '[B6] overlay sceny bitwy usunięty z DOM');

// ---------------------------------------------------------------------------
// C) PIN tekstowy na battleScene.ts
// ---------------------------------------------------------------------------
const battleSrc = fs.readFileSync(BATTLE_TS, 'utf8');

{
  const fnStart = battleSrc.indexOf('private _hideEndDetails(): void {');
  ok(fnStart >= 0, '[C1] znaleziono _hideEndDetails() w battleScene.ts');
  const fnEnd = battleSrc.indexOf('\n  /** Usuwa overlay podsumowania', fnStart);
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? battleSrc.slice(fnStart, fnEnd) : '';

  ok(/if \(this\._battleStatsOpen\)/.test(fnBody),
    '[C2] _hideEndDetails woła hidePostBattleSummary tylko gdy _battleStatsOpen');
  ok(!/isPostBattleSummaryOpen\(\)/.test(fnBody),
    '[C3] _hideEndDetails NIE używa isPostBattleSummaryOpen() (stary bug)');
  ok(/onFinishCb/.test(fnBody),
    '[C4] komentarz dokumentuje sekwencję onFinishCb → dispose');
}

{
  const disposeStart = battleSrc.indexOf('  dispose(): void {');
  const hideIdx = battleSrc.indexOf('this._hideEndDetails();', disposeStart);
  ok(disposeStart >= 0 && hideIdx > disposeStart,
    '[C5] dispose() woła this._hideEndDetails()');
}

for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch { /* ignore */ } }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
