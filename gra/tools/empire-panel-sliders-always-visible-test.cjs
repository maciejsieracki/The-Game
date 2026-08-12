'use strict';
/**
 * empire-panel-sliders-always-visible-test.cjs — BUG-SUWAKI-PRACA-SKARBIEC-ZNIKAJA-PRZY-FILTRZE-CHIPU
 *
 * Chroni gra/src/ui/empireDetailPanel.ts, sekcję „ZASOBY IMPERIUM": suwaki globalne Skarbca
 * (renderDefaultHandelSplitSection) i Pracy (renderDefaultPodzialPracySection) muszą się
 * renderować ZAWSZE, niezależnie od tego, który chip HUD (np. „Praca"/„Skarbiec") ustawił
 * `onlyEconId`. C-PANEL=B (Maciej 2026-07-24) zostaje nienaruszone dla WIERSZY ekonomii —
 * pętla `econRows` nadal filtruje po `onlyEconId`; naprawiony jest wyłącznie fakt, że oba
 * wywołania suwaków były owinięte w `if (!onlyEconId) { ... }` i znikały razem z resztą
 * wierszy przy kliknięciu chipu „Praca"/„Skarbiec" (zgłoszenie Macieja z playtestu FALI 268).
 *
 * Wzorzec testu: source-text regex na wyciętym fragmencie (esbuild nie może zbundlować całego
 * empireDetailPanel.ts bez loaderów SVG/audio — patrz CLAUDE.md, znane pre-istniejące porażki
 * map-field-battle-test/pre-battle-save-test), analogicznie do
 * spichlerz-cap-citypanel-wiring-test.cjs / border-march-wygasanie-test.cjs.
 *
 * EN: Guards the "ZASOBY IMPERIUM" section — the global Treasury and Labor sliders must always
 * render regardless of the active HUD chip filter (onlyEconId). C-PANEL=B row filter itself
 * stays intact; only the two slider calls must live outside any `if (!onlyEconId)` guard.
 *
 * Run from gra/: node tools/empire-panel-sliders-always-visible-test.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '..', 'src', 'ui', 'empireDetailPanel.ts');
const src = fs.readFileSync(SRC_PATH, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// Wytnij ciało sekcji „ZASOBY IMPERIUM": od nagłówka eyebrow do stopki sekcji.
// ---------------------------------------------------------------------------
const sectionMarker = 'ZASOBY IMPERIUM (STAN + PRZYROST)';
const markerIdx = src.indexOf(sectionMarker);
ok(markerIdx >= 0, 'znaleziono nagłówek sekcji "ZASOBY IMPERIUM" w empireDetailPanel.ts');

const footMarker = 'Duża liczba = stan · zielone = netto.';
const footIdx = markerIdx >= 0 ? src.indexOf(footMarker, markerIdx) : -1;
ok(footIdx > markerIdx, 'znaleziono stopkę sekcji ZASOBY IMPERIUM (civ-emp-foot)');

const sectionBody = markerIdx >= 0 && footIdx > markerIdx ? src.slice(markerIdx, footIdx) : '';

// ---------------------------------------------------------------------------
// Wymóg 1: C-PANEL=B nienaruszone — pętla econRows nadal filtruje wiersze po onlyEconId.
// ---------------------------------------------------------------------------
ok(/if\s*\(onlyEconId\s*&&\s*r\.id\s*!==\s*onlyEconId\)\s*continue;/.test(sectionBody),
  'filtr onlyEconId nadal działa na pętli econRows (C-PANEL=B nienaruszone)');

// ---------------------------------------------------------------------------
// Wymóg 2: oba wywołania suwaków są obecne w sekcji ZASOBY IMPERIUM.
// ---------------------------------------------------------------------------
ok(/renderDefaultHandelSplitSection\(\)/.test(sectionBody),
  'renderDefaultHandelSplitSection() (suwak Skarbiec+Nauka) wywołane w sekcji ZASOBY IMPERIUM');
ok(/renderDefaultPodzialPracySection\(\)/.test(sectionBody),
  'renderDefaultPodzialPracySection() (suwak Praca) wywołane w sekcji ZASOBY IMPERIUM');

// ---------------------------------------------------------------------------
// Wymóg 3 (kluczowy, dokładna regresja BUG-SUWAKI): żadne z tych dwóch wywołań nie może być
// owinięte w `if (!onlyEconId) { ... }` — dokładnie ten wzorzec sprawiał, że suwaki znikały
// po kliknięciu chipu HUD „Praca"/„Skarbiec" (activeSection='econ-praca'/'econ-skarbiec').
// ---------------------------------------------------------------------------
const guardedBlocks = sectionBody.match(/if\s*\(!onlyEconId\)\s*\{[\s\S]*?\n\s*\}/g) || [];
ok(guardedBlocks.length === 0
  || guardedBlocks.every(b => !/renderDefaultHandelSplitSection\(\)/.test(b) && !/renderDefaultPodzialPracySection\(\)/.test(b)),
  'suwaki Skarbiec/Praca NIE są wewnątrz żadnego bloku if(!onlyEconId) w sekcji ZASOBY IMPERIUM (regres BUG-SUWAKI-PRACA-SKARBIEC)');

// Kontrola przytomności: to nie jest test próżny — jeżeli ktoś przywróci stary wzorzec, wykryjemy
// go wprost (symulacja regresu na kopii tekstu, bez modyfikacji pliku źródłowego).
const regressedSection = sectionBody.replace(
  /zasoby \+= renderDefaultHandelSplitSection\(\);[\s\S]*?zasoby \+= renderDefaultPodzialPracySection\(\);/,
  `if (!onlyEconId) {\n    zasoby += renderDefaultHandelSplitSection();\n    zasoby += renderDefaultPodzialPracySection();\n  }`,
);
const regressedGuardedBlocks = regressedSection.match(/if\s*\(!onlyEconId\)\s*\{[\s\S]*?\n\s*\}/g) || [];
ok(regressedGuardedBlocks.length > 0
  && regressedGuardedBlocks.some(b => /renderDefaultHandelSplitSection\(\)/.test(b) && /renderDefaultPodzialPracySection\(\)/.test(b)),
  'kontrola przytomności: symulowany regres (suwaki z powrotem w if(!onlyEconId)) jest wykrywalny przez ten sam regex');

console.log(`\nempire-panel-sliders-always-visible-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
