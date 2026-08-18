'use strict';
/**
 * praca-split-ui-test.cjs — P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1.
 *
 * Cel: globalny split całej puli Pracy imperium ma być widoczny także przy
 * ręcznym trybie ulepszeń, a lokalny suwak override miasta ma pozostać
 * osobnym mechanizmem.
 *
 * Uruchom z gra/: node tools/praca-split-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[praca-split-ui-test] jsdom missing');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'buildmodehud-brandassets-stub.ts');
const ENTRY = path.resolve(__dirname, '.praca-split-ui-entry.ts');
const BUNDLE = path.resolve(__dirname, '.praca-split-ui-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { createBuildModeHud } from '../src/ui/buildModeHud.ts';\n`,
  'utf8',
);

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log('PASS: ' + name);
  } else {
    fail++;
    console.error('FAIL: ' + name + (detail ? ' — ' + detail : ''));
  }
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
    plugins: [stubBrandAssetsPlugin],
    logLevel: 'silent',
  });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;
  global.MouseEvent = dom.window.MouseEvent;

  const { createBuildModeHud } = require(BUNDLE);
  const config = {
    listTypes: () => [],
    getActiveKey: () => null,
    onSelectType: () => {},
    onExit: () => {},
    isOpen: () => true,
    listPlayerCities: () => [{ id: 'ateny', name: 'Ateny' }],
    getUlepszeniaCityId: () => 'ateny',
    // Automatyzacja jest wyłączona: globalny split mimo tego musi być widoczny.
    getUlepszeniaEmpireState: () => ({
      focus: 'zrownowazone',
      tryb: 'reczny',
      onlyWorked: false,
      pracaAutoPercent: 33,
    }),
    getUlepszeniaCityOverride: () => true,
    getUlepszeniaEffectiveState: () => ({
      focus: 'zywnosc',
      tryb: 'auto',
      onlyWorked: false,
      pracaAutoPercent: 20,
      override: true,
    }),
  };

  const hud = createBuildModeHud(config);
  const globalSummary = hud.el.querySelector('[data-praca-split-scope="empire"]');
  const globalSlider = hud.el.querySelector('[data-ulepszenia-empire-percent]');
  const citySlider = hud.el.querySelector('[data-ulepszenia-city-percent]');

  check(
    'globalne podsumowanie renderuje się przy wyłączonej automatyzacji',
    !!globalSummary,
  );
  check(
    'podsumowanie nazywa zakres jako całą pulę Pracy imperium',
    !!globalSummary && globalSummary.textContent.includes('Cała pula Pracy imperium'),
    globalSummary?.textContent,
  );
  check(
    'podsumowanie pokazuje ulepszenia i budynki jako 100% wspólnego splitu',
    !!globalSummary && globalSummary.textContent.includes('33% ulepszenia / 67% budynki'),
    globalSummary?.textContent,
  );
  check(
    'globalny suwak ma zakres 0–50%',
    !!globalSlider && globalSlider.getAttribute('min') === '0' && globalSlider.getAttribute('max') === '50',
  );
  check(
    'globalny suwak ma opis całej puli Pracy imperium',
    !!globalSlider
      && (globalSlider.getAttribute('title') || '').includes('całej puli Pracy imperium'),
  );
  check(
    'lokalny suwak miasta nadal jest osobnym elementem',
    !!globalSlider && !!citySlider && globalSlider !== citySlider
      && citySlider.getAttribute('data-ulepszenia-city-percent') === '',
  );
  check(
    'lokalny suwak ma tekst, że dotyczy tylko wybranego miasta',
    !!citySlider
      && (citySlider.getAttribute('title') || '').includes('wybranego miasta')
      && (citySlider.getAttribute('title') || '').includes('nie zmienia globalnego splitu'),
  );

  hud.destroy();
  console.log(`\n[praca-split-ui-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
