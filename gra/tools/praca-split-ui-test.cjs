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

  let splitChanged = null;
  const { createBuildModeHud } = require(BUNDLE);
  const empirePanelSource = fs.readFileSync(
    path.resolve(GRA, 'src/ui/empireDetailPanel.ts'),
    'utf8',
  );
  const cityPanelSource = fs.readFileSync(
    path.resolve(GRA, 'src/ui/cityPanel.ts'),
    'utf8',
  );
  check(
    'panel imperium ma jeden nadrzędny suwak ulepszeń 0–50%',
    empirePanelSource.includes('min="0" max="50" step="1" value="${pctU}"')
      && empirePanelSource.includes('data-praca-empire-split'),
  );
  check(
    'panel imperium opisuje budynki jako remainder 100% − ulepszenia',
    empirePanelSource.includes('Budynki zawsze = 100% − Ulepszenia.'),
  );
  check(
    'panel miasta odróżnia lokalną pulę Pracy od nadrzędnych ulepszeń',
    cityPanelSource.includes('Budynki / Pula Pracy (lokalnie)')
      && !cityPanelSource.includes('Budynki / Ulepszenia (lokalnie)'),
  );
  const config = {
    listTypes: () => [],
    getActiveKey: () => null,
    onSelectType: () => {},
    onExit: () => {},
    isOpen: () => true,
    listPlayerCities: () => [{ id: 'ateny', name: 'Ateny' }],
    getUlepszeniaCityId: () => 'ateny',
    // Globalny split jest niezależny od historycznego budżetu automatu.
    getUlepszeniaEmpireState: () => ({
      focus: 'zrownowazone',
      tryb: 'auto',
      onlyWorked: false,
      pracaAutoPercent: 33,
    }),
    getEmpirePracaSplit: () => 10,
    onEmpirePracaSplitChange: (pct) => { splitChanged = pct; },
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
  const globalSlider = hud.el.querySelector('[data-praca-empire-split]');
  const autoSlider = hud.el.querySelector('[data-ulepszenia-empire-percent]');
  const citySlider = hud.el.querySelector('[data-ulepszenia-city-percent]');

  check(
    'globalne podsumowanie renderuje się niezależnie od automatyzacji',
    !!globalSummary,
  );
  check(
    'podsumowanie nazywa nadrzędny podział Pracy',
    !!globalSummary && globalSummary.textContent.includes('Podział Praca: budynki / ulepszenia'),
    globalSummary?.textContent,
  );
  check(
    '10% ulepszeń daje 90% budynków jako remainder',
    !!globalSummary && globalSummary.textContent.includes('10% ulepszenia / 90% budynki'),
    globalSummary?.textContent,
  );
  check(
    'nadrzędny suwak ulepszeń ma zakres 0–50%',
    !!globalSlider && globalSlider.getAttribute('min') === '0' && globalSlider.getAttribute('max') === '50',
  );
  check(
    'nadrzędny suwak opisuje remainder budynków i odróżnia automat',
    !!globalSlider
      && (globalSlider.getAttribute('title') || '').includes('budynki dostają remainder')
      && (globalSlider.getAttribute('title') || '').includes('To nie jest globalny budżet automatu'),
    globalSlider?.getAttribute('title'),
  );
  check(
    'historyczny suwak automatu ma niezależny zakres 0–100%',
    !!autoSlider && autoSlider.getAttribute('min') === '0' && autoSlider.getAttribute('max') === '100',
  );
  check(
    'lokalny suwak miasta nadal jest osobnym elementem',
    !!globalSlider && !!autoSlider && !!citySlider
      && globalSlider !== autoSlider && globalSlider !== citySlider
      && citySlider.getAttribute('data-ulepszenia-city-percent') === '',
  );
  check(
    'lokalny suwak ma tekst, że dotyczy tylko wybranego miasta',
    !!citySlider
      && (citySlider.getAttribute('title') || '').includes('tego miasta')
      && (citySlider.getAttribute('title') || '').includes('Nie zmienia nadrzędnego splitu Praca'),
    citySlider?.getAttribute('title'),
  );

  globalSlider.value = '100';
  globalSlider.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  check(
    'zdarzenie nadrzędnego suwaka zaciska ulepszenia do 50%',
    splitChanged === 50
      && globalSlider.value === '50'
      && globalSummary.textContent.includes('50% ulepszenia / 50% budynki'),
  );

  hud.destroy();
  console.log(`\n[praca-split-ui-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
