'use strict';
/**
 * owned-building-detail-side-test.cjs — FIX (Evaluator FAIL, P-PRODUKCJA-BUDYNKI-WYBUDOWANE-PRAWA-KOLUMNA).
 *
 * Run from gra/: node tools/owned-building-detail-side-test.cjs
 *
 * Evaluator commitu 7ae5d8f8 znalazł: po przeniesieniu listy "Budynki w mieście" do prawej
 * kolumny, karty szczegółów (upgrade/hover/click) nadal miały zahardkodowane `sideHint:'left'`
 * w `appendOwnedBuildingRow` — kliknięcie w prawej kolumnie otwierało kartę po LEWEJ stronie
 * ekranu i przesuwało szynę ikon (`--civ-detail-dock-left-w`) o 400px w prawo. Naprawa:
 * `renderBuildingsOwned` liczy `detailSide` z `mount.closest('.civ-ux-right')` (mount jest już
 * w DOM w tym momencie) i przekazuje go przez `opts.detailSide` do `appendOwnedBuildingRow`,
 * które teraz używa `detailSide` zamiast trzech literałów `'left'`.
 *
 * Wzorzec: text-anchor na źródle (nie pełne wykonanie — appendOwnedBuildingRow ma zbyt wiele
 * zależności DOM/cfg do bezpiecznego jsdom-bundlowania w tym zakresie), zweryfikowany mutacją.
 */

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const CITY_PANEL_TS = path.join(__dirname, '..', 'src', 'ui', 'cityPanel.ts');
const src = fs.readFileSync(CITY_PANEL_TS, 'utf8');

// A. renderBuildingsOwned liczy detailSide z mount.closest('.civ-ux-right')
console.log('\n-- A. renderBuildingsOwned: detailSide liczony z mount.closest --');
{
  const fnStart = src.indexOf('function renderBuildingsOwned(');
  ok(fnStart > -1, 'kotwica "function renderBuildingsOwned(" znaleziona');
  const fnEnd = src.indexOf('\nfunction renderSplitPane(', fnStart);
  ok(fnEnd > fnStart, 'kotwica końca (function renderSplitPane) znaleziona');
  const fnSrc = src.slice(fnStart, fnEnd);
  ok(
    /const detailSide: 'left' \| 'right' = mount\.closest\('\.civ-ux-right'\) \? 'right' : 'left';/.test(fnSrc),
    'renderBuildingsOwned zawiera dokładnie: detailSide liczony z mount.closest(\'.civ-ux-right\')',
  );
  ok(
    fnSrc.includes('{ compact, detailSide }'),
    'wywołanie appendOwnedBuildingRow(...) przekazuje detailSide w opts',
  );
}

// B. appendOwnedBuildingRow: brak twardych literałów 'left' w sideHint/attachHoverDetail/showHoverDetailNow
console.log('\n-- B. appendOwnedBuildingRow: zero zahardkodowanych \'left\' w wywołaniach detail --');
{
  const fnStart = src.indexOf('function appendOwnedBuildingRow(');
  ok(fnStart > -1, 'kotwica "function appendOwnedBuildingRow(" znaleziona');
  const fnEnd = src.indexOf('\n/**', fnStart);
  ok(fnEnd > fnStart, 'kotwica końca (następny blok komentarza) znaleziona');
  const fnSrc = src.slice(fnStart, fnEnd);

  ok(fnSrc.includes("opts?: { compact?: boolean; detailSide?: 'left' | 'right' }"),
    'sygnatura przyjmuje opts.detailSide');
  ok(/const detailSide: 'left' \| 'right' = opts\?\.detailSide \?\? 'left';/.test(fnSrc),
    'detailSide domyślnie \'left\' gdy opts.detailSide nie podany (zachowuje stare wywołania, np. linia ~7053)');

  ok(!/sideHint:\s*'left'/.test(fnSrc), "REGRESJA-EVALUATORA: brak zahardkodowanego sideHint: 'left'");
  ok(fnSrc.includes('sideHint: detailSide'), 'attachInteractiveDetail woła z sideHint: detailSide (zmienna, nie literał)');

  ok(
    fnSrc.includes('attachHoverDetail(row, () => buildBuildingDetailCard(def, data, city), 280, detailSide);'),
    'attachHoverDetail woła z detailSide (zmienna, nie literał)',
  );
  ok(
    !fnSrc.includes("attachHoverDetail(row, () => buildBuildingDetailCard(def, data, city), 280, 'left');"),
    "REGRESJA-EVALUATORA: attachHoverDetail bez zahardkodowanego 'left'",
  );

  ok(
    fnSrc.includes('showHoverDetailNow(row, () => buildBuildingDetailCard(def, data, city), detailSide);'),
    'showHoverDetailNow woła z detailSide (zmienna, nie literał)',
  );
  ok(
    !fnSrc.includes("showHoverDetailNow(row, () => buildBuildingDetailCard(def, data, city), 'left');"),
    "REGRESJA-EVALUATORA: showHoverDetailNow bez zahardkodowanego 'left'",
  );
}

// C. Mutacja: przywrócenie zahardkodowanego 'left' w attachHoverDetail -- test MUSI złapać czerwono
// (pomijana w trybie --self-check-skip-mutation, żeby uniknąć nieskończonej rekurencji -- ten
// tryb uruchamia TEN SAM plik na zmutowanym źródle i oczekuje że sekcje A/B złapią to czerwono)
if (!process.argv.includes('--self-check-skip-mutation')) {
console.log('\n-- C. Mutacja: przywrócenie zahardkodowanego \'left\' w attachHoverDetail --');
{
  const backup = src;
  const mutated = src.replace(
    "attachHoverDetail(row, () => buildBuildingDetailCard(def, data, city), 280, detailSide);",
    "attachHoverDetail(row, () => buildBuildingDetailCard(def, data, city), 280, 'left');",
  );
  ok(mutated !== backup, 'mutacja faktycznie zmieniła źródło (kotwica zamiany istnieje)');

  fs.writeFileSync(CITY_PANEL_TS, mutated, 'utf8');
  const { execSync } = require('child_process');
  let mutantOut = '';
  let mutantFailed = false;
  try {
    execSync(`node ${__filename} --self-check-skip-mutation`, { cwd: __dirname, stdio: 'pipe' });
  } catch (e) {
    mutantFailed = true;
    mutantOut = (e.stdout || '').toString();
  } finally {
    fs.writeFileSync(CITY_PANEL_TS, backup, 'utf8');
  }
  ok(mutantFailed, 'mutacja (przywrócony zahardkodowany \'left\') łapana czerwono przez sekcję B tego samego testu');
  ok(fs.readFileSync(CITY_PANEL_TS, 'utf8') === backup, 'plik przywrócony do stanu oryginalnego po mutacji (md5 identyczny)');
}
}

if (process.argv.includes('--self-check-skip-mutation')) {
  console.log(`\nowned-building-detail-side-test (self-check): ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

console.log(`\nowned-building-detail-side-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
