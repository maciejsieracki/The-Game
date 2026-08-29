'use strict';
/**
 * building-detail-card-entitycard-migration-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T5 MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA.
 *
 * Weryfikuje:
 *  (A) treść `entityCards/buildingAdapter.ts` na REALNYM budynku z `gra/data/buildings.json`
 *      ("stolarnia" — wybrany bo trafia w większość gałęzi: maksPoziom>1, przyrostKosztu>0,
 *      koszt_surowce niepusty, wymagania niepuste), przez `buildEntityCardData('building', ...)`
 *      bundlowane z PRAWDZIWEGO `renderer.ts` (esbuild+jsdom, ten sam wzorzec co
 *      `entity-card-contract-test.cjs`/`unit-info-card-entitycard-migration-test.cjs`);
 *  (B) NOWY tryb `mode:'hover'` w `openEntityCard()` — doczepia się do
 *      `attachHoverDetail(anchor, ..., 220, 'left')` zamiast backdropu/natychmiastowego
 *      appendChild, i wywołuje `buildEntityCardData`/`renderEntityCard` DOPIERO po
 *      faktycznym hoverze (wymóg wydajności hover z dispatchu T5) — sprawdzone REALNYM
 *      timerem (nie stub), symulowanym `mouseenter` na jsdom;
 *  (C) wiring w `cityPanel.ts` (`buildBuildingDetailCard`/`buildBuildingBuildTabDetailCard`)
 *      — `cityPanel.ts` jest zbyt ciężki do bezpiecznego bundlowania w izolacji (te same
 *      dziesiątki zależności co `owned-building-detail-side-test.cjs` już dokumentuje jako
 *      precedens) — więc ta część jest text-anchor na źródle, wzorem tego pliku, plus
 *      mutacyjna sekcja łapiąca regresję (usunięcie fallbacku / złą kolejność wywołań).
 *
 * Usage (z gra/): node tools/building-detail-card-entitycard-migration-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[building-detail-card-entitycard-migration-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.building-detail-card-migration-entry.ts');
const BUNDLE = path.resolve(__dirname, '.building-detail-card-migration-bundle.cjs');

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
    "export { renderEntityCard, openEntityCard, buildEntityCardData } from '../src/ui/entityCards/renderer.ts';",
    '',
  ].join('\n'),
  'utf8',
);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail ? ' — ' + detail : '')); }
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
  global.MouseEvent = dom.window.MouseEvent;

  const { renderEntityCard, openEntityCard, buildEntityCardData } = require(BUNDLE);

  // =========================================================================
  // (A) buildingAdapter — treść na realnym budynku "stolarnia"
  // =========================================================================
  console.log('\n-- (A) buildingAdapter: treść realnego budynku "stolarnia" --');

  const cityState = {
    hasCity: true,
    displayLevel: 2,
    buildCostPace: 'niski',
    difficulty: 'normal',
    ownerId: 0,
  };
  const data = buildEntityCardData('building', 'stolarnia', { city: cityState });
  check('buildEntityCardData("building","stolarnia"): nie-null (resolver znalazł budynek)', data !== null);

  if (data) {
    check('kind === "building"', data.kind === 'building');
    check('id === "stolarnia"', data.id === 'stolarnia');
    check('title === "Stolarnia"', data.title === 'Stolarnia', data.title);
    check('civpediaLink === {folder:"budynki", slug:"stolarnia"} (plan §5, mapowanie 1:1)',
      data.civpediaLink && data.civpediaLink.folder === 'budynki' && data.civpediaLink.slug === 'stolarnia');

    const bySectionKey = Object.fromEntries(data.sections.map((s) => [s.key, s]));

    // --- Charakterystyka ---------------------------------------------------
    const charRows = bySectionKey.characteristics ? bySectionKey.characteristics.rows : [];
    const rowByLabel = (rows, label) => rows.find((r) => r.label === label);
    check('sekcja "characteristics" obecna', !!bySectionKey.characteristics);
    check('Kategoria === "Produkcja"', rowByLabel(charRows, 'Kategoria')?.value === 'Produkcja');
    check('Epoka wejścia === "Kamień" (epokaWejscia=1)', rowByLabel(charRows, 'Epoka wejścia')?.value === 'Kamień');
    check('Typ === "Unikalny w mieście" (wielokrotny nieustawiony)',
      rowByLabel(charRows, 'Typ')?.value === 'Unikalny w mieście');
    check('Poziom w tym mieście: hasCity=true → "L2 (epoka miasta — jak liczy silnik)"',
      rowByLabel(charRows, 'Poziom w tym mieście')?.value === 'L2 (epoka miasta — jak liczy silnik)',
      rowByLabel(charRows, 'Poziom w tym mieście')?.value);

    // --- Plony i efekty (baza.praca=5, przyrost.praca=3, displayLevel=2) ----
    const yieldRows = bySectionKey.yield ? bySectionKey.yield.rows : [];
    check('sekcja "yield" obecna', !!bySectionKey.yield);
    const pracaRow = rowByLabel(yieldRows, 'Praca');
    check('wiersz "Praca" obecny (baza=5, przyrost=3, oba niezerowe)', !!pracaRow);
    // buildingEffectAtLevel(5,3,2) = 5 + 3*(2-1) = 8
    check('Praca @ L2 === "+8 pkt/turę (poziom 2: baza 5 + przyrost 3 × 1)"',
      pracaRow && pracaRow.value === '+8 pkt/turę (poziom 2: baza 5 + przyrost 3 × 1)', pracaRow && pracaRow.value);
    check('wiersz "Praca — skala poziomów" obecny (maksPoziom=3>1, przyrost!=0)',
      !!rowByLabel(yieldRows, 'Praca — skala poziomów'));
    check('skala poziomów L1..L3: "L1: +5 · L2: +8 · L3: +11"',
      rowByLabel(yieldRows, 'Praca — skala poziomów')?.value === 'L1: +5 · L2: +8 · L3: +11',
      rowByLabel(yieldRows, 'Praca — skala poziomów')?.value);
    check('brak innych plonów (pieniądz/żywność/etc. wszystkie 0) — tylko 2 wiersze Pracy',
      yieldRows.length === 2, JSON.stringify(yieldRows));

    // --- Koszty budowy i utrzymania -----------------------------------------
    const costRows = bySectionKey.cost ? bySectionKey.cost.rows : [];
    check('sekcja "cost" obecna', !!bySectionKey.cost);
    check('wiersz "Koszt budowy (jednorazowy)" obecny i kończy się na "pkt Pracy"',
      /pkt Pracy$/.test(rowByLabel(costRows, 'Koszt budowy (jednorazowy)')?.value ?? ''),
      rowByLabel(costRows, 'Koszt budowy (jednorazowy)')?.value);
    check('wiersz "Przyrost kosztu budowy" === "+10 pkt Pracy / poziom" (przyrostKosztu=10, niezależne od pace/difficulty)',
      rowByLabel(costRows, 'Przyrost kosztu budowy')?.value === '+10 pkt Pracy / poziom',
      rowByLabel(costRows, 'Przyrost kosztu budowy')?.value);
    check('wiersz "Utrzymanie (co turę)" obecny', !!rowByLabel(costRows, 'Utrzymanie (co turę)'));
    check('BRAK wiersza "Przyrost utrzymania" (przyrostUtrzymania=0 w danych)',
      !rowByLabel(costRows, 'Przyrost utrzymania'));
    const stockRow = rowByLabel(costRows, 'Koszt surowcowy (jednorazowy)');
    // `buildingStockCost()` skaluje ×2 vs JSON (R-NADMIAR-POOLS FALA2, `building-stock-cost.ts`
    // nagłówek) — koszt_surowce.drewno=25 w danych → 50 w karcie, TA SAMA funkcja co dawny
    // `buildBuildingDetailCard`, więc to parytet, nie regresja (zweryfikowane czytaniem
    // `game/building-stock-cost.ts::buildingStockCost`/`scaleStockCostRecord`).
    check('wiersz "Koszt surowcowy (jednorazowy)" zawiera "50" (drewno=25 ×2 FALA2) i "— z magazynu państwa"',
      !!stockRow && stockRow.value.includes('50') && stockRow.value.includes('— z magazynu państwa'),
      stockRow && stockRow.value);

    // --- Poziomy -------------------------------------------------------------
    const lvlRows = bySectionKey.levels ? bySectionKey.levels.rows : [];
    check('sekcja "levels" obecna (maksPoziom=3>1)', !!bySectionKey.levels);
    check('Maks. poziom === "3"', rowByLabel(lvlRows, 'Maks. poziom')?.value === '3');
    check('Nazwy przycięte do maksPoziom=3: "Warsztat drewna → Stolarnia → Manufaktura drewna"',
      rowByLabel(lvlRows, 'Nazwy')?.value === 'Warsztat drewna → Stolarnia → Manufaktura drewna',
      rowByLabel(lvlRows, 'Nazwy')?.value);

    // --- Wymagania budynku -----------------------------------------------------
    const reqRows = bySectionKey.requirements ? bySectionKey.requirements.rows : [];
    check('sekcja "requirements" obecna (wymagania niepuste w danych)', !!bySectionKey.requirements);
    check('Wymagania === tekst z buildings.json',
      rowByLabel(reqRows, 'Wymagania')?.value === 'Drewno w magazynie państwa (na koszt budowy i bramkę surowca)');

    // --- Tryb podglądu bez miasta (ctx.city pominięte) — L1 fallback ---------
    const previewData = buildEntityCardData('building', 'stolarnia', {});
    const previewChar = previewData.sections.find((s) => s.key === 'characteristics').rows;
    check('bez ctx.city: "Poziom w tym mieście" === "L1 (podgląd; w mieście rośnie z epoką, max 3)"',
      rowByLabel(previewChar, 'Poziom w tym mieście')?.value === 'L1 (podgląd; w mieście rośnie z epoką, max 3)',
      rowByLabel(previewChar, 'Poziom w tym mieście')?.value);

    // --- Render DOM — smoke check że dane renderują się bez wyjątku ----------
    const cardEl = renderEntityCard(data);
    check('renderEntityCard(data): zwraca element klasy entity-card entity-card-building',
      cardEl.classList.contains('entity-card') && cardEl.classList.contains('entity-card-building'));
    check('renderEntityCard(data): tytuł "Stolarnia" w DOM', cardEl.textContent.includes('Stolarnia'));
  }

  // =========================================================================
  // (B) openEntityCard mode:'hover' — lazy build, attachHoverDetail(anchor, ..., 220, 'left')
  // =========================================================================
  console.log('\n-- (B) openEntityCard mode:\'hover\': lazy + attachHoverDetail --');

  const row = document.createElement('div');
  document.body.appendChild(row);

  let threwForMissingAnchor = false;
  try { openEntityCard('building', 'stolarnia', { mode: 'hover' }); }
  catch (e) { threwForMissingAnchor = true; }
  check('mode:"hover" bez opts.container (anchor) rzuca błąd jasno opisujący wymóg',
    threwForMissingAnchor);

  const dismiss = openEntityCard('building', 'stolarnia', { mode: 'hover', container: row, ctx: { city: cityState } });
  check('openEntityCard(hover) zwraca funkcję dismiss()', typeof dismiss === 'function');
  check('WYDAJNOŚĆ: zaraz po openEntityCard(hover) — ŻADNA karta jeszcze nie zbudowana w DOM (lazy)',
    document.querySelector('.entity-card-building') === null);

  row.dispatchEvent(new dom.window.MouseEvent('mouseenter', { bubbles: true }));
  check('tuż po mouseenter (przed upływem 220ms) — karta WCIĄŻ nie zbudowana (delay respektowany)',
    document.querySelector('.entity-card-building') === null);

  await new Promise((resolve) => setTimeout(resolve, 260));
  const hoverCard = document.querySelector('.entity-card-building');
  check('po ~260ms od mouseenter (> 220ms delay) — karta ZBUDOWANA i w DOM (attachHoverDetail zadziałał)',
    hoverCard !== null);
  check('karta hover ma tytuł "Stolarnia"', hoverCard !== null && hoverCard.textContent.includes('Stolarnia'));

  console.log('\n-- (C) cityPanel.ts wiring — text-anchor (bundlowanie zbyt kosztowne, precedens P-owned-building-detail-side-test) --');
  const CITY_PANEL_TS = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
  const cpSrc = fs.readFileSync(CITY_PANEL_TS, 'utf8');

  check('cityPanel.ts importuje buildingAdapter z ./entityCards/buildingAdapter',
    /import\s*\{\s*buildingAdapter,\s*type BuildingCardCityState\s*\}\s*from '\.\/entityCards\/buildingAdapter';/.test(cpSrc));
  check('cityPanel.ts importuje renderEntityCard/ENTITY_CARD_CSS z ./entityCards/renderer',
    /import\s*\{\s*renderEntityCard,\s*ENTITY_CARD_CSS\s*\}\s*from '\.\/entityCards\/renderer';/.test(cpSrc));

  const viaStart = cpSrc.indexOf('function buildBuildingDetailCardViaEntityCard(');
  check('function buildBuildingDetailCardViaEntityCard( istnieje', viaStart > -1);
  const viaEnd = cpSrc.indexOf('\n/** Publiczna sygnatura BEZ ZMIAN.', viaStart);
  check('koniec buildBuildingDetailCardViaEntityCard znaleziony', viaEnd > viaStart);
  const viaSrc = viaStart > -1 && viaEnd > viaStart ? cpSrc.slice(viaStart, viaEnd) : '';
  check('buildBuildingDetailCardViaEntityCard woła buildingAdapter(def, { city: cityState })',
    viaSrc.includes('buildingAdapter(def, { city: cityState })'));
  check('buildBuildingDetailCardViaEntityCard woła renderEntityCard(built)',
    viaSrc.includes('renderEntityCard(built)'));
  check('buildBuildingDetailCardViaEntityCard dopełnia sekcję Technologie (appendTechDetailBlock, NIE migrowana w T5)',
    viaSrc.includes("appendTechDetailBlock(techBody, data, def.techUnlock)"));
  check('buildBuildingDetailCardViaEntityCard dopełnia sekcję Uwagi (playerFacingNote)',
    viaSrc.includes('playerFacingNote(def.uwagi)'));

  const pubStart = cpSrc.indexOf('function buildBuildingDetailCard(def: BuildingDef, data: GameData, city?: City): HTMLDivElement {\n  try {');
  check('publiczna funkcja buildBuildingDetailCard( próbuje ścieżkę entityCards w try/catch', pubStart > -1);
  check('...i ma fallback do _legacyBuildBuildingDetailCard w catch',
    cpSrc.includes('return _legacyBuildBuildingDetailCard(def, data, city);'));
  check('_legacyBuildBuildingDetailCard( istnieje (stara implementacja zachowana)',
    cpSrc.includes('function _legacyBuildBuildingDetailCard(def: BuildingDef, data: GameData, city?: City): HTMLDivElement {'));
  check('stara implementacja nadal buduje klasę "detail-card bld-detail-card" (parytet DOM fallbacku)',
    /_legacyBuildBuildingDetailCard[\s\S]{0,200}el\('div', 'detail-card bld-detail-card'\)/.test(cpSrc));

  // buildBuildingBuildTabDetailCard powinien pozostać BEZ ZMIAN — nadal woła buildBuildingDetailCard(def, data, city)
  check('buildBuildingBuildTabDetailCard nadal woła buildBuildingDetailCard(def, data, city) (bez zmian, T5 nie dotyka tej funkcji)',
    cpSrc.includes('const card = buildBuildingDetailCard(def, data, city);'));

  // Mutacja: usunięcie fallbacku w try/catch -- test MUSI złapać czerwono.
  if (!process.argv.includes('--self-check-skip-mutation')) {
    console.log('\n-- Mutacja: usunięcie fallbacku z buildBuildingDetailCard --');
    const backup = cpSrc;
    const mutated = cpSrc.replace(
      'return _legacyBuildBuildingDetailCard(def, data, city);',
      'return buildBuildingDetailCardViaEntityCard(def, data, city); // MUTOWANE — fallback usunięty',
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
    check('mutacja (fallback usunięty) łapana czerwono przez sekcję (C) tego samego testu', mutantFailed);
    check('plik cityPanel.ts przywrócony do stanu oryginalnego po mutacji', fs.readFileSync(CITY_PANEL_TS, 'utf8') === backup);
  }

  // Sprzątanie plików tymczasowych (entry/bundle esbuild).
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(BUNDLE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[building-detail-card-entitycard-migration-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
