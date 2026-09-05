'use strict';
/**
 * entity-card-contract-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T1 KONTRAKT-KARTA-ENCJI.
 *
 * Weryfikuje fundament wspólnego kontraktu karty encji (`gra/src/ui/entityCards/**`):
 * `renderEntityCard`/`openEntityCard` w trybie `dialog` dla WSZYSTKICH 4 kinds
 * (unit/building/technology/improvement), na przykładowych, REALNYCH id z
 * `gra/data/{units,buildings,tech,terrain-improvements}.json` — nie na danych
 * zmyślonych, żeby test faktycznie sprawdzał resolvery `registry.ts`, nie tylko
 * kształt renderera. Żadna istniejąca karta (`unitInfoCard.ts`/`cityPanel.ts`/
 * `techDiscoveryNotice.ts`) go jeszcze nie woła (T1 to fundament, nie migracja).
 *
 * Bunduje PRAWDZIWY `src/ui/entityCards/renderer.ts` przez esbuild (node/cjs) + jsdom
 * jako document, ten sam wzorzec co `build-mode-hud-affordability-test.cjs` /
 * `army-merge-dismiss-bounce-test.cjs`.
 *
 * Usage (z gra/): node tools/entity-card-contract-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[entity-card-contract-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.entity-card-contract-entry.ts');
const BUNDLE = path.resolve(__dirname, '.entity-card-contract-bundle.cjs');

// `registry.ts` reużywa `sciencePicker.ts` (technology resolver, ECHO=C), które ciągnie
// za sobą `scienceHubHud.ts` → `icons/brandAssets` i `icons/scienceOwlIcon` — oba mają
// importy `.svg?raw` (Vite-only), które esbuild/node nie rozumie bez pluginu. Test
// kontraktu kart nie testuje ikon brandu — stubujemy oba, wzorem
// `build-mode-hud-affordability-test.cjs`.
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
    "export { slugify } from '../src/ui/entityCards/slug.ts';",
    "export { unitToSlug, technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
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

  // `pretendToBeVisual: true` — jsdom daje wtedy PRAWDZIWĄ (timer-based) parę
  // requestAnimationFrame/cancelAnimationFrame na window (nie stub w tym pliku).
  // Potrzebne bo renderEntityCard(unit) → mountUnitMiniPreview → drainQueue()
  // (unitMiniPreview.ts) woła requestAnimationFrame, którego gołe Node nie ma.
  // Sam render 3D (WebGLRenderer) i tak nie zadziała pod jsdom (brak realnego
  // WebGL) — ensureGl() w unitMiniPreview.ts łapie to w try/catch i zwraca
  // null, więc kontrakt karty (DOM: sekcje/tytuł/atrybuty) mierzy się dalej,
  // podglądu 3D po prostu nie ma (fallback tekstowy), bez zmiany zachowania
  // w przeglądarce.
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    pretendToBeVisual: true,
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.MouseEvent = dom.window.MouseEvent;
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  // Uwaga: NIE nadpisujemy global.navigator — Node już ma własny getter-only
  // `navigator`; `escapeOverlayStack.ts` obsługuje brak `navigator.keyboard` (Keyboard
  // Lock API) jako no-op, więc test działa bez podmiany.

  const { renderEntityCard, openEntityCard, buildEntityCardData, slugify, unitToSlug, technologyIdFromName } = require(BUNDLE);

  // ---------------------------------------------------------------------
  // slug.ts — dryf realny opisany w 07-operator-T1.md: "ł" musi dać "l", nie zniknąć.
  // ---------------------------------------------------------------------
  check('slugify("Łucznik") === "lucznik" (nie gubi litery ł, w przeciwieństwie do NFD-strip)', slugify('Łucznik') === 'lucznik', slugify('Łucznik'));
  check('slugify("Koło") === "kolo"', slugify('Koło') === 'kolo', slugify('Koło'));
  check('slugify("Rydwan (woły)") === "rydwan_woly"', slugify('Rydwan (woły)') === 'rydwan_woly', slugify('Rydwan (woły)'));
  check('unitToSlug === slugify (deleguje)', unitToSlug('Łucznik') === 'lucznik', unitToSlug('Łucznik'));

  // ---------------------------------------------------------------------
  // buildEntityCardData + renderEntityCard dla 4 kinds, na realnych id z danych gry.
  // ---------------------------------------------------------------------
  const unitId = unitToSlug('Wojownik');
  const unitData = buildEntityCardData('unit', unitId, {});
  check('buildEntityCardData("unit", "wojownik") znajduje encję', unitData !== null);
  if (unitData) {
    check('unit: kind === "unit"', unitData.kind === 'unit');
    check('unit: id === id zapytania (kontrakt id)', unitData.id === unitId, unitData.id);
    check('unit: title === "Wojownik"', unitData.title === 'Wojownik', unitData.title);
    check('unit: ma >=1 sekcję z >=1 wierszem', unitData.sections.some((s) => s.rows.length > 0));
  }

  const buildingId = 'stolarnia';
  const buildingData = buildEntityCardData('building', buildingId, {});
  check('buildEntityCardData("building", "stolarnia") znajduje encję', buildingData !== null);
  if (buildingData) {
    check('building: kind === "building"', buildingData.kind === 'building');
    check('building: id === "stolarnia"', buildingData.id === buildingId);
    check('building: civpediaLink.folder === "budynki"', buildingData.civpediaLink && buildingData.civpediaLink.folder === 'budynki');
  }

  const techId = technologyIdFromName('Łowiectwo');
  const techData = buildEntityCardData('technology', techId, {});
  check('buildEntityCardData("technology", techToSlug("Łowiectwo")) znajduje encję (technology REUŻYWA TECH_MAP, nie nowy slug.ts)', techData !== null, techId);
  if (techData) {
    check('technology: kind === "technology"', techData.kind === 'technology');
    check('technology: id === id zapytania', techData.id === techId, techData.id);
    check('technology: title === "Łowiectwo"', techData.title === 'Łowiectwo', techData.title);
  }

  const improvementId = 'farma';
  const improvementData = buildEntityCardData('improvement', improvementId, {});
  check('buildEntityCardData("improvement", "farma") znajduje encję', improvementData !== null);
  if (improvementData) {
    check('improvement: kind === "improvement"', improvementData.kind === 'improvement');
    check('improvement: id === "farma" (nadpisane przez buildEntityCardData, patrz renderer.ts)', improvementData.id === improvementId, improvementData.id);
    check('improvement: title === "Farma"', improvementData.title === 'Farma', improvementData.title);
  }

  // Resolver zwraca null dla id nieistniejącego — buildEntityCardData propaguje null,
  // nie rzuca.
  check('buildEntityCardData zwraca null dla nieistniejącego id', buildEntityCardData('unit', 'nie_istnieje_xyz', {}) === null);

  // ---------------------------------------------------------------------
  // renderEntityCard — DOM sensowny dla wszystkich 4 kinds.
  // ---------------------------------------------------------------------
  for (const data of [unitData, buildingData, techData, improvementData]) {
    if (!data) continue;
    const el = renderEntityCard(data);
    check(`renderEntityCard(${data.kind}): zwraca HTMLElement`, el instanceof dom.window.HTMLElement);
    check(`renderEntityCard(${data.kind}): data-entity-kind poprawny`, el.getAttribute('data-entity-kind') === data.kind);
    check(`renderEntityCard(${data.kind}): data-entity-id poprawny`, el.getAttribute('data-entity-id') === data.id);
    check(`renderEntityCard(${data.kind}): h2 z tytułem`, (el.querySelector('h2') || {}).textContent === data.title);
    check(`renderEntityCard(${data.kind}): >=1 sekcja w DOM`, el.querySelectorAll('.entity-card-section').length >= 1);
  }

  // ---------------------------------------------------------------------
  // openEntityCard(mode: 'dialog') — backdrop w document.body, dismiss() sprząta.
  // ---------------------------------------------------------------------
  const dismiss = openEntityCard('unit', unitId, { mode: 'dialog' });
  const backdrop = document.querySelector('.entity-card-backdrop');
  check('openEntityCard(dialog): backdrop zamontowany w document.body', backdrop !== null);
  check('openEntityCard(dialog): karta wewnątrz backdropu', backdrop !== null && backdrop.querySelector('.entity-card') !== null);
  dismiss();
  check('dismiss(): backdrop usunięty z DOM', document.querySelector('.entity-card-backdrop') === null);

  // openEntityCard dla nieistniejącego id nie rzuca, zwraca no-op dismiss.
  let threw = false;
  let noopDismiss;
  try { noopDismiss = openEntityCard('unit', 'nie_istnieje_xyz', { mode: 'dialog' }); }
  catch (e) { threw = true; }
  check('openEntityCard z nieistniejącym id NIE rzuca (zwraca no-op dismiss)', !threw);
  if (typeof noopDismiss === 'function') noopDismiss();
  check('openEntityCard z nieistniejącym id NIE dodaje backdropu', document.querySelector('.entity-card-backdrop') === null);

  // ---------------------------------------------------------------------
  // T1b — rozszerzenie kontraktu renderera: 6 funkcjonalności na fixture'ach
  // (patrz `13-dispatch-T1b-rozszerzenie-renderera.md`). Wszystkie nowe pola są
  // opcjonalne — powyższe 47 asercji (T1, bez zmian) musi nadal przechodzić.
  // ---------------------------------------------------------------------
  const SVG_STAR = '<svg data-t1b-icon="star" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>';

  function fixtureCardData(sections) {
    return {
      kind: 'unit',
      id: 't1b-fixture',
      title: 'T1b Fixture',
      medallion: { kind: 'icon', svg: '<svg></svg>' },
      sections,
    };
  }

  // (1) Akordeon — collapsible/openDefault realnie obsłużone + highlighted.
  {
    const data = fixtureCardData([
      { key: 'acc-open', title: 'Sekcja otwarta', rows: [{ label: 'A', value: '1' }], collapsible: true, openDefault: true, highlighted: true },
      { key: 'acc-closed', title: 'Sekcja zwinięta', rows: [{ label: 'B', value: '2' }], collapsible: true, openDefault: false },
    ]);
    const cardEl = renderEntityCard(data);
    const openSec = cardEl.querySelector('[data-section-key="acc-open"]');
    const closedSec = cardEl.querySelector('[data-section-key="acc-closed"]');
    check('(1) akordeon: sekcja highlighted ma klasę entity-card-section--hi', openSec && openSec.classList.contains('entity-card-section--hi'));
    check('(1) akordeon: sekcja openDefault=true ma data-open="1"', openSec && openSec.getAttribute('data-open') === '1');
    check('(1) akordeon: sekcja openDefault=false ma data-open="0"', closedSec && closedSec.getAttribute('data-open') === '0');
    const closedBody = closedSec && closedSec.querySelector('.entity-card-section-body');
    check('(1) akordeon: body sekcji zwiniętej ma hidden', closedBody && closedBody.hidden === true);
    const headBtn = closedSec && closedSec.querySelector('.entity-card-section-head');
    check('(1) akordeon: przycisk nagłówka ma aria-expanded="false"', headBtn && headBtn.getAttribute('aria-expanded') === 'false');
    if (headBtn) headBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    check('(1) akordeon: klik nagłówka rozwija (aria-expanded="true", hidden usunięty)',
      headBtn.getAttribute('aria-expanded') === 'true' && closedBody.hidden === false);
  }

  // (2) Ikona per wiersz — wstawiana jako markup (SVG realny w DOM, nie tekst).
  {
    const data = fixtureCardData([
      { key: 'icons', title: 'Ikony', rows: [{ label: 'Łucznik', value: 'Jednostka', icon: { kind: 'svg', svg: SVG_STAR } }] },
    ]);
    const cardEl = renderEntityCard(data);
    const iconEl = cardEl.querySelector('.entity-card-row-icon');
    check('(2) ikona: kafelek ikony obecny w wierszu', iconEl !== null);
    check('(2) ikona: SVG wstawiony jako markup (querySelector("svg") działa)', iconEl && iconEl.querySelector('svg[data-t1b-icon="star"]') !== null);
    check('(2) ikona: NIE wstawiony jako tekst (textContent nie zawiera "<svg")', iconEl && !iconEl.textContent.includes('<svg'));
  }

  // (3) Pole "trailing" — osobne od value.
  {
    const data = fixtureCardData([
      { key: 'trailing', title: 'Jednostki', rows: [{ label: 'Rydwan', value: 'Opis', trailing: 'Kawaleria' }] },
    ]);
    const cardEl = renderEntityCard(data);
    const trailingEl = cardEl.querySelector('.entity-card-row-trailing');
    check('(3) trailing: element trailing obecny', trailingEl !== null);
    check('(3) trailing: tekst trailing poprawny', trailingEl && trailingEl.textContent === 'Kawaleria');
    const valueEl = cardEl.querySelector('.entity-card-row-value');
    check('(3) trailing: value pozostaje osobne od trailing', valueEl && valueEl.textContent === 'Opis');
  }

  // (4) Kolorowane odznaki per wiersz (ok/warn/muted).
  {
    const data = fixtureCardData([
      {
        key: 'actions', title: 'Co możesz teraz zrobić', rows: [
          { label: 'Możesz teraz', value: 'Sprawdź dostęp do surowca.', badge: { kind: 'ok', label: 'Możesz teraz' } },
          { label: 'Najpierw spełnij', value: 'Zbuduj X.', badge: { kind: 'warn', label: 'Najpierw spełnij' } },
          { label: 'Nie oznacza', value: 'Odkrycie nie buduje automatycznie.', badge: { kind: 'muted', label: 'Nie oznacza' } },
        ],
      },
    ]);
    const cardEl = renderEntityCard(data);
    const badges = cardEl.querySelectorAll('.entity-card-row-badge');
    check('(4) badge: 3 odznaki per-wiersz w DOM', badges.length === 3, String(badges.length));
    check('(4) badge: kind="ok" ma klasę entity-card-row-badge--ok', cardEl.querySelector('.entity-card-row-badge--ok') !== null);
    check('(4) badge: kind="warn" ma klasę entity-card-row-badge--warn', cardEl.querySelector('.entity-card-row-badge--warn') !== null);
    check('(4) badge: kind="muted" ma klasę entity-card-row-badge--muted', cardEl.querySelector('.entity-card-row-badge--muted') !== null);
    check('(4) badge: etykieta odznaki poprawna', cardEl.querySelector('.entity-card-row-badge--ok').textContent === 'Możesz teraz');
  }

  // (5) Paginacja "Pokaż pozostałe N" (previewLimit) + sprzężenie z compactHeaderOnExpand.
  {
    const rows = [1, 2, 3, 4, 5].map(n => ({ label: `Jednostka ${n}`, value: 'x' }));
    const data = { ...fixtureCardData([{ key: 'units', title: 'Jednostki', rows, previewLimit: 3 }]), compactHeaderOnExpand: true };
    const cardEl = renderEntityCard(data);
    const grids = cardEl.querySelectorAll('.entity-card-section-grid');
    check('(5) paginacja: pierwsza siatka pokazuje dokładnie previewLimit=3 wiersze', grids[0] && grids[0].querySelectorAll('.entity-card-row').length === 3);
    const moreBtn = cardEl.querySelector('.entity-card-more');
    check('(5) paginacja: przycisk "Pokaż pozostałe N" obecny z poprawnym N (=5-3=2)', moreBtn && moreBtn.textContent === 'Pokaż pozostałe 2');
    const restGrid = grids[1];
    check('(5) paginacja: reszta wierszy (2) ukryta domyślnie (hidden)', restGrid && restGrid.hidden === true);
    if (moreBtn) moreBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    check('(5) paginacja: klik "Pokaż pozostałe" odkrywa resztę (hidden usunięty)', restGrid.hidden === false);
    check('(5) paginacja: compactHeaderOnExpand=true dodaje entity-card--compact na karcie po kliknięciu', cardEl.classList.contains('entity-card--compact'));

    // Sekcja BEZ previewLimit (undefined) renderuje wszystkie wiersze bez przycisku — brak regresji.
    const dataNoLimit = fixtureCardData([{ key: 'units2', title: 'Jednostki2', rows }]);
    const cardElNoLimit = renderEntityCard(dataNoLimit);
    check('(5) paginacja: bez previewLimit — wszystkie 5 wierszy widoczne, brak przycisku "Pokaż pozostałe"',
      cardElNoLimit.querySelectorAll('.entity-card-row').length === 5 && cardElNoLimit.querySelector('.entity-card-more') === null);
  }

  // (6) Layout 'pills' z checkmarkiem (Wymagania).
  {
    const data = fixtureCardData([
      { key: 'requirements', title: 'Wymagania', rows: [{ label: 'Rolnictwo', value: '' }, { label: 'Koło', value: '' }], layout: 'pills' },
    ]);
    const cardEl = renderEntityCard(data);
    const pillsWrap = cardEl.querySelector('.entity-card-section-pills');
    check('(6) pills: kontener pigułek obecny (layout="pills")', pillsWrap !== null);
    const pills = cardEl.querySelectorAll('.entity-card-pill');
    check('(6) pills: 2 pigułki w DOM', pills.length === 2, String(pills.length));
    check('(6) pills: tekst pierwszej pigułki poprawny', pills[0] && pills[0].querySelector('.entity-card-pill-text').textContent === 'Rolnictwo');
    check('(6) pills: checkmark "✓" obecny w pigułce', pills[0] && pills[0].querySelector('.entity-card-pill-check').textContent === '✓');
    check('(6) pills: sekcja BEZ layout (domyślnie "grid") NIE renderuje pigułek',
      renderEntityCard(fixtureCardData([{ key: 'grid-default', title: 'Domyślnie grid', rows: [{ label: 'X', value: 'Y' }] }]))
        .querySelector('.entity-card-section-pills') === null);
  }

  console.log('');
  console.log(`[entity-card-contract-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
