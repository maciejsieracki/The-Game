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

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.MouseEvent = dom.window.MouseEvent;
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

  console.log('');
  console.log(`[entity-card-contract-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
