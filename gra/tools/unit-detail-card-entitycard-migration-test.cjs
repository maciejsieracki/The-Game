'use strict';
/**
 * unit-detail-card-entitycard-migration-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T6 MIGRACJA-KARTA-JEDNOSTKI-PANEL-MIASTA.
 *
 * Weryfikuje:
 *  (A) treść `entityCards/unitAdapter.ts` (WSPÓLNY z T4, karta jednostki na mapie) na
 *      REALNEJ jednostce z `gra/data/units.json` ("Wojownik" — trafia w większość
 *      dodatkowych pól T6: Klasa, Widok pola, Kara flanki/tyłu, Próg dezercji, Ruch w
 *      bitwie, Uderzenie, Morale bazowe/ucieczki; jedyne pole bez pokrycia w danych dziś
 *      to "Bonus szarży" — potwierdzone brakiem w CAŁYM `units.json`, patrz assert niżej)
 *      — parytet TREŚCI z dawną `cityPanel.ts::buildUnitDetailCard` (karta rekrutacji)
 *      I z `unitInfoCard.ts` (karta mapy, T4), bundlowane esbuild+jsdom (ten sam wzorzec
 *      co `unit-info-card-entitycard-migration-test.cjs`/`entity-card-contract-test.cjs`);
 *  (B) wiring w `cityPanel.ts` (`buildUnitDetailCard`/`attachUnitRowThumb`) — text-anchor
 *      na źródle (`cityPanel.ts` zbyt ciężki do bezpiecznego bundlowania w izolacji,
 *      precedens `building-detail-card-entitycard-migration-test.cjs` §C) + mutacyjna
 *      sekcja łapiąca regresję (usunięcie fallbacku).
 *
 * Usage (z gra/): node tools/unit-detail-card-entitycard-migration-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[unit-detail-card-entitycard-migration-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.unit-detail-card-migration-entry.ts');
const BUNDLE = path.resolve(__dirname, '.unit-detail-card-migration-bundle.cjs');

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));

const stubIconsPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

fs.writeFileSync(
  ENTRY,
  [
    "export { unitAdapter } from '../src/ui/entityCards/unitAdapter.ts';",
    "export { renderEntityCard } from '../src/ui/entityCards/renderer.ts';",
    '',
  ].join('\n'),
  'utf8',
);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [stubIconsPlugin],
    logLevel: 'silent',
  });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;

  const { unitAdapter, renderEntityCard } = require(BUNDLE);

  // =========================================================================
  // (A) unitAdapter — treść na realnej jednostce "Wojownik" (WSPÓLNY adapter z T4)
  // =========================================================================
  console.log('\n-- (A) unitAdapter (wspólny z kartą mapy T4): treść realnej jednostki "Wojownik" --');

  const unit = units.find((u) => u.Jednostka === 'Wojownik');
  check('fixture: "Wojownik" istnieje w units.json', !!unit);
  if (!unit) { process.exit(1); return; }

  // Kontrola założenia z nagłówka: "Bonus szarży" nie ma dziś pokrycia w danych — jeśli to
  // się zmieni, ten test ma o tym jawnie ostrzec zamiast cicho przestać sprawdzać pole.
  const anyBonusSzarzy = units.some((u) => {
    const v = u['Bonus szarży'];
    return v != null && String(v).trim() !== '' && String(v).trim() !== '—';
  });
  check('założenie testu: ŻADNA jednostka w units.json nie ma dziś "Bonus szarży" (jeśli to się zmieni, dopisz fixture z niepustą wartością)', !anyBonusSzarzy);

  const built = unitAdapter(unit, {});
  check('kind === "unit"', built.kind === 'unit');
  check('title === "Wojownik"', built.title === 'Wojownik', built.title);

  const bySectionKey = Object.fromEntries(built.sections.map((s) => [s.key, s]));
  const rowByLabel = (rows, label) => rows.find((r) => r.label === label);

  // --- Charakterystyka (T6: NOWA sekcja we wspólnym adapterze) ---------------------------
  check('sekcja "characteristics" obecna (T6)', !!bySectionKey.characteristics);
  const charRows = bySectionKey.characteristics ? bySectionKey.characteristics.rows : [];
  check('Linia === u["Rola (linia)"] (parytet z dawną kartą rekrutacji)',
    rowByLabel(charRows, 'Linia')?.value === String(unit['Rola (linia)'] ?? ''),
    { got: rowByLabel(charRows, 'Linia')?.value, want: unit['Rola (linia)'] });
  check('Klasa === u.Klasa (parytet z dawną kartą rekrutacji, pole spoza typowanego UnitDef)',
    rowByLabel(charRows, 'Klasa')?.value === String(unit.Klasa ?? ''),
    { got: rowByLabel(charRows, 'Klasa')?.value, want: unit.Klasa });

  // --- Statystyki bojowe: pola T4 (bez zmian) + pola T6 (dodane) --------------------------
  check('sekcja "combat" obecna', !!bySectionKey.combat);
  const combatRows = bySectionKey.combat ? bySectionKey.combat.rows : [];
  check('Atak (T4, bez zmian) === u.Atak', rowByLabel(combatRows, 'Atak')?.value === String(unit.Atak));
  check('Obrona (T4, bez zmian) === u.Obrona', rowByLabel(combatRows, 'Obrona')?.value === String(unit.Obrona));
  check('Obrażenia broni (T6, NOWE) === u.Uderzenie', rowByLabel(combatRows, 'Obrażenia broni')?.value === String(unit.Uderzenie));
  check('Ruch (bitwa) (T6, NOWE) === "4 hex"', rowByLabel(combatRows, 'Ruch (bitwa)')?.value === '4 hex',
    rowByLabel(combatRows, 'Ruch (bitwa)')?.value);
  check('Widok pola (T6, NOWE) === "2 hex"', rowByLabel(combatRows, 'Widok pola')?.value === '2 hex',
    rowByLabel(combatRows, 'Widok pola')?.value);
  check('Kara flanki (T6, NOWE) === "15%"', rowByLabel(combatRows, 'Kara flanki')?.value === '15%',
    rowByLabel(combatRows, 'Kara flanki')?.value);
  check('Kara od tyłu (T6, NOWE) === "30%"', rowByLabel(combatRows, 'Kara od tyłu')?.value === '30%',
    rowByLabel(combatRows, 'Kara od tyłu')?.value);
  check('Próg dezercji (T6, NOWE) === "40% HP" (0.4 × 100, zaokrąglone, parytet z dawnym `fmt`)',
    rowByLabel(combatRows, 'Próg dezercji')?.value === '40% HP', rowByLabel(combatRows, 'Próg dezercji')?.value);
  check('Morale bazowe (T6, NOWE) === "50"', rowByLabel(combatRows, 'Morale bazowe')?.value === '50',
    rowByLabel(combatRows, 'Morale bazowe')?.value);
  check('Morale ucieczki (T6, NOWE) === "22"', rowByLabel(combatRows, 'Morale ucieczki')?.value === '22',
    rowByLabel(combatRows, 'Morale ucieczki')?.value);
  check('Bonus szarży (T6, NOWE): pominięty jako pusty wiersz (Wojownik nie ma tego pola w danych — parytet "brakujące pola pomijane" z T4)',
    !rowByLabel(combatRows, 'Bonus szarży'));

  const pociskiUnit = units.find((u) => u.Jednostka === 'Procarz');
  check('fixture: "Procarz" istnieje (ma niepuste "Ilość pocisków")', !!pociskiUnit);
  if (pociskiUnit) {
    const builtPociski = unitAdapter(pociskiUnit, {});
    const combatPociski = builtPociski.sections.find((s) => s.key === 'combat').rows;
    check('Pociski (T6, NOWE) === u["Ilość pocisków"] (fixture "Procarz")',
      rowByLabel(combatPociski, 'Pociski')?.value === String(pociskiUnit['Ilość pocisków']),
      rowByLabel(combatPociski, 'Pociski')?.value);
  }

  // --- Kontry (T4, bez zmian w T6 — dziedziczone przez wspólny adapter) -------------------
  const reqRows = bySectionKey.requirements ? bySectionKey.requirements.rows : [];
  check('Kontry (T4, dziedziczone w T6): wiersz "Kontry" obecny dla jednostki z wpisem w counters.json',
    !!rowByLabel(reqRows, 'Kontry'));

  // --- Render DOM — smoke check że rozszerzone dane renderują się bez wyjątku -------------
  const cardEl = renderEntityCard(built);
  check('renderEntityCard(built): zwraca element klasy entity-card entity-card-unit',
    cardEl.classList.contains('entity-card') && cardEl.classList.contains('entity-card-unit'));
  check('renderEntityCard(built): nowe pola T6 obecne w DOM ("Obrażenia broni", "Morale bazowe")',
    cardEl.textContent.includes('Obrażenia broni') && cardEl.textContent.includes('Morale bazowe'));

  // =========================================================================
  // (B) cityPanel.ts wiring — text-anchor (bundlowanie zbyt kosztowne, precedens T5)
  // =========================================================================
  console.log('\n-- (B) cityPanel.ts wiring — text-anchor (bundlowanie zbyt kosztowne, precedens T5) --');
  const CITY_PANEL_TS = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
  const cpSrc = fs.readFileSync(CITY_PANEL_TS, 'utf8');

  check('cityPanel.ts importuje unitAdapter z ./entityCards/unitAdapter',
    /import\s*\{\s*unitAdapter\s*\}\s*from '\.\/entityCards\/unitAdapter';/.test(cpSrc));

  const viaStart = cpSrc.indexOf('function buildUnitDetailCardViaEntityCard(');
  check('function buildUnitDetailCardViaEntityCard( istnieje', viaStart > -1);
  const viaEnd = cpSrc.indexOf('\n/** Publiczna sygnatura BEZ ZMIAN.', viaStart);
  check('koniec buildUnitDetailCardViaEntityCard znaleziony', viaEnd > viaStart);
  const viaSrc = viaStart > -1 && viaEnd > viaStart ? cpSrc.slice(viaStart, viaEnd) : '';
  check('buildUnitDetailCardViaEntityCard woła unitAdapter(u, {})', viaSrc.includes('unitAdapter(u, {})'));
  check('buildUnitDetailCardViaEntityCard woła renderEntityCard(built)', viaSrc.includes('renderEntityCard(built)'));
  check('buildUnitDetailCardViaEntityCard dopełnia sekcję Technologie (appendTechDetailBlock, jak dla budynków w T5)',
    viaSrc.includes('appendTechDetailBlock(techBody, data, u.Tech)'));
  check('buildUnitDetailCardViaEntityCard dopełnia sekcję Uwagi (u.Uwagi, jak dla budynków w T5)',
    viaSrc.includes('note.textContent = u.Uwagi;'));

  const pubStart = cpSrc.indexOf('function buildUnitDetailCard(u: UnitDef, data: GameData): HTMLDivElement {\n  try {');
  check('publiczna funkcja buildUnitDetailCard( próbuje ścieżkę entityCards w try/catch', pubStart > -1);
  check('...i ma fallback do _legacyBuildUnitDetailCard w catch',
    cpSrc.includes('return _legacyBuildUnitDetailCard(u, data);'));
  check('_legacyBuildUnitDetailCard( istnieje (stara implementacja zachowana)',
    cpSrc.includes("function _legacyBuildUnitDetailCard(u: UnitDef, data: GameData): HTMLDivElement {"));
  check('stara implementacja nadal buduje klasę "detail-card" (parytet DOM fallbacku)',
    /_legacyBuildUnitDetailCard[\s\S]{0,200}el\('div', 'detail-card'\)/.test(cpSrc));

  check('attachUnitRowThumb nadal woła buildUnitDetailCard(udef, data) jako hover-detail budowniczy (bez zmian)',
    /attachHoverDetail\(thumb, \(\) => buildUnitDetailCard\(udef, data\), 180\)/.test(cpSrc));

  // Mutacja: usunięcie fallbacku w try/catch -- test MUSI złapać czerwono.
  if (!process.argv.includes('--self-check-skip-mutation')) {
    console.log('\n-- Mutacja: usunięcie fallbacku z buildUnitDetailCard --');
    const backup = cpSrc;
    const mutated = cpSrc.replace(
      'return _legacyBuildUnitDetailCard(u, data);',
      'return buildUnitDetailCardViaEntityCard(u, data); // MUTOWANE — fallback usunięty',
    );
    check('mutacja faktycznie zmieniła źródło (kotwica zamiany istnieje)', mutated !== backup);
    fs.writeFileSync(CITY_PANEL_TS, mutated, 'utf8');
    const { execSync } = require('child_process');
    let mutantFailed = false;
    try {
      execSync(`node ${__filename} --self-check-skip-mutation`, { cwd: __dirname, stdio: 'pipe' });
    } catch (e) {
      mutantFailed = true;
    } finally {
      fs.writeFileSync(CITY_PANEL_TS, backup, 'utf8');
    }
    check('mutacja (fallback usunięty) łapana czerwono przez sekcję (B) tego samego testu', mutantFailed);
    check('plik cityPanel.ts przywrócony do stanu oryginalnego po mutacji', fs.readFileSync(CITY_PANEL_TS, 'utf8') === backup);
  }

  // Sprzątanie plików tymczasowych (entry/bundle esbuild).
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(BUNDLE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[unit-detail-card-entitycard-migration-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
