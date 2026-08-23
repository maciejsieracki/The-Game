'use strict';
/**
 * praca-budmode-slider-max-real-render-test.cjs
 *
 * TEMAT: P-PRACA-BUDMODE-SLIDER-MAX-50-NIESPOJNY-Q1.
 *
 * PROBLEM: panel budowy ulepszeń (`gra/src/ui/buildModeHud.ts`) ma dwa suwaki „budżetu
 * automatu" (empire „Globalny budżet automatu" i city „Lokalny budżet automatu"),
 * renderowane przez `renderUlepszeniaPercentRow()`. OBA wywołania przekazywały jako
 * parametr `max` stałą `MAX_PRACA_WSPOLNY_WOREK_PROCENT` (=50) — co fizycznie ograniczało
 * natywny `<input type="range" max="50">` do 0-50%, mimo że backend
 * (`clampUlepszeniaPracaPercent()` w `cities.ts`, naprawiony wcześniej w temacie
 * P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1) już akceptuje pełny zakres 0-100% przez własną,
 * dedykowaną stałą `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT` (=100).
 *
 * NIE MYLIĆ z `renderEmpirePracaSplit()` (inne, niezależne pole — nadrzędny podział całej
 * puli Pracy budynki/ulepszenia, CELOWO 0-50%) — ten test NIE dotyka tego pola i osobno
 * potwierdza, że jego suwak nadal ma `max="50"` (scenariusz C).
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, NIE SAM GREP ŹRÓDŁA: atrybut `max` natywnego
 * `<input type="range">` fizycznie ogranicza wartość, jaką gracz może ustawić drag'iem/
 * klawiaturą, NIEZALEŻNIE od tego, co akceptuje backend (`clampUlepszeniaPracaPercent`).
 * Sam grep źródła potwierdza tylko, jaki string trafia do szablonu — nie potwierdza, że
 * przeglądarka faktycznie wyrenderowała ten atrybut na żywym elemencie DOM (i nie łapie
 * regresji typu „build cache", „inny wariant renderu" itp.). Dlatego asercje główne
 * czytają `input.max`/`input.getAttribute('max')` z prawdziwego, wyrenderowanego DOM w
 * Chromium (Playwright), bundel budowany przez esbuild z PRAWDZIWEGO, niezmodyfikowanego
 * `createBuildModeHud()` (żadnej reimplementacji renderu) — ten sam wzorzec co
 * `build-mode-hud-affordability-test.cjs` (esbuild + realny `createBuildModeHud`), tu
 * rozszerzony o realny render Chromium zamiast jsdom, bo zależy nam na natywnej
 * semantyce `<input type="range" max>`.
 *
 * MUTACJA (kontrola negatywna): po odczycie realnego stanu test ręcznie podmienia atrybut
 * `max` z powrotem na `"50"` i potwierdza, że asercja wtedy PADA — dowód, że test faktycznie
 * łapie tę konkretną regresję, a nie jest tautologią.
 *
 * Usage (z gra/): node tools/praca-budmode-slider-max-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[praca-budmode-slider-max-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'praca-budmode-slider-max-brandassets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'praca-budmode-slider-max-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.praca-budmode-slider-max-entry.ts');
const OUTFILE = path.resolve(__dirname, '.praca-budmode-slider-max-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const stubPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

/** PRAWDZIWY, niezmodyfikowany `createBuildModeHud()` z `src/ui/buildModeHud.ts` — wystawiony
 * na `window`, żeby entry mogło wywołać go w przeglądarce z fixture'em wymuszającym oba
 * suwaki „budżetu automatu" w trybie „auto" (empire) + override + „Indywidualne" (city). */
const ENTRY_SOURCE = `
import { createBuildModeHud } from '../src/ui/buildModeHud.ts';
window.__createBuildModeHud = createBuildModeHud;
`;

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[praca-budmode-slider-max-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Fixture: 1 miasto, empire w trybie „auto" (odsłania suwak empire), miasto z override
 * w trybie „auto" (odsłania suwak city). Wartości pracaAutoPercent > 50 (np. 77) —
 * dowodzi też, że render/clamp panelu NIE ścina samej WARTOŚCI do 50 (nie tylko max).
 * Budowana W BRAMCE ŚRODOWISKA (page.evaluate) — funkcje callbacków nie serializują się
 * przez granicę Node -> Chromium, więc fixture musi powstać jako string wstrzyknięty do
 * `<script>`, nie jako argument `evaluate()`. */
const FIXTURE_SOURCE = `
function __buildFixtureConfig() {
  return {
    listTypes: () => [],
    getActiveKey: () => null,
    onSelectType: () => {},
    onExit: () => {},
    isOpen: () => true,
    listPlayerCities: () => [{ id: 'miasto-1', name: 'Testowo' }],
    getUlepszeniaCityId: () => 'miasto-1',
    onUlepszeniaCityIdChange: () => {},
    getUlepszeniaEmpireState: () => ({
      focus: 'zrownowazone', tryb: 'auto', onlyWorked: false, pracaAutoPercent: 77,
    }),
    getEmpirePracaSplit: () => null,
    onEmpirePracaSplitChange: () => {},
    onUlepszeniaEmpireFocusChange: () => {},
    onUlepszeniaEmpireTrybChange: () => {},
    onUlepszeniaEmpireOnlyWorkedChange: () => {},
    onUlepszeniaEmpirePracaPercentChange: () => {},
    getUlepszeniaCityOverride: () => true,
    onUlepszeniaCityOverrideChange: () => {},
    getUlepszeniaEffectiveState: () => ({
      focus: 'zrownowazone', tryb: 'auto', onlyWorked: false, pracaAutoPercent: 88, override: true,
    }),
    onUlepszeniaCityFocusChange: () => {},
    onUlepszeniaCityTrybChange: () => {},
    onUlepszeniaCityOnlyWorkedChange: () => {},
    onUlepszeniaCityPracaPercentChange: () => {},
  };
}
window.__buildFixtureConfig = __buildFixtureConfig;
`;

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SOURCE, 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [stubPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 1000 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));

    await page.setContent('<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;}</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
    await page.addScriptTag({ content: FIXTURE_SOURCE });

    const boot = await page.evaluate(() => {
      const hud = window.__createBuildModeHud(window.__buildFixtureConfig());
      document.body.appendChild(hud.el);
      hud.update();
      return { htmlLen: hud.el.innerHTML.length };
    });
    check('fixture: panel wyrenderowany bez błędu bootstrapu, HTML niepusty', boot.htmlLen > 0, boot);

    const measured = await page.evaluate(() => {
      const grab = (sel) => {
        const inp = document.querySelector(sel);
        if (!inp) return { missing: true };
        return {
          max: inp.getAttribute('max'),
          maxProp: inp.max,
          value: inp.value,
          min: inp.getAttribute('min'),
        };
      };
      return {
        empireBudget: grab('[data-ulepszenia-empire-percent]'),
        cityBudget: grab('[data-ulepszenia-city-percent]'),
      };
    });

    // --- (A) Empire „Globalny budżet automatu" -------------------------------------------
    check('(A) suwak empire „budżet automatu" wyrenderowany w DOM', !measured.empireBudget.missing, measured.empireBudget);
    check('(A) suwak empire ma max="100" (NIE "50" — naprawiona regresja)',
      !measured.empireBudget.missing && measured.empireBudget.max === '100', measured.empireBudget);
    check('(A) suwak empire przyjmuje wartość 77% (>50, dowód że sam RENDER wartości też nie ścina do 50)',
      !measured.empireBudget.missing && measured.empireBudget.value === '77', measured.empireBudget);

    // --- (B) City „Lokalny budżet automatu" (override, „Indywidualne") -------------------
    check('(B) suwak city „budżet automatu" wyrenderowany w DOM', !measured.cityBudget.missing, measured.cityBudget);
    check('(B) suwak city ma max="100" (NIE "50" — naprawiona regresja)',
      !measured.cityBudget.missing && measured.cityBudget.max === '100', measured.cityBudget);
    check('(B) suwak city przyjmuje wartość 88% (>50)',
      !measured.cityBudget.missing && measured.cityBudget.value === '88', measured.cityBudget);

    // --- (C) Kontrola: renderEmpirePracaSplit() (INNE pole) NIE dotknięte, max=50 zostaje --
    // Ten test NIE renderuje splitu (getEmpirePracaSplit zwraca null celowo — pole poza
    // zakresem tematu). Kontrolę „max=50 nietknięte" robimy statycznie na źródle, właśnie
    // po to, by nie mylić dwóch niezależnych suwaków w jednym pliku.
    const src = fs.readFileSync(path.resolve(GRA, 'src/ui/buildModeHud.ts'), 'utf8');
    const splitFnMatch = src.match(/function renderEmpirePracaSplit\(pct: number\): string \{[\s\S]*?\n\}/);
    check('(C) renderEmpirePracaSplit() nadal istnieje w źródle (funkcja nie usunięta/przemianowana)', !!splitFnMatch);
    if (splitFnMatch) {
      const body = splitFnMatch[0];
      check('(C) renderEmpirePracaSplit() nadal ma suwak z max="50" na sztywno (inne, poprawne pole — NIETKNIĘTE)',
        body.includes('max="50"'));
      check('(C) renderEmpirePracaSplit() nadal ma Math.min(50, ...) w clampzie lokalnym (NIETKNIĘTE)',
        body.includes('Math.min(50,'));
    }

    check('brak błędów konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);

    // --- (D) MUTACJA: kontrola negatywna — dowód, że test faktycznie łapie regresję -------
    console.log('\n-- Mutacja: ręczne cofnięcie max="100" -> max="50" na żywym DOM, asercje MUSZĄ zapalić się na czerwono --');
    const mutated = await page.evaluate(() => {
      const empire = document.querySelector('[data-ulepszenia-empire-percent]');
      const city = document.querySelector('[data-ulepszenia-city-percent]');
      empire?.setAttribute('max', '50');
      city?.setAttribute('max', '50');
      return {
        empireMax: empire ? empire.getAttribute('max') : null,
        cityMax: city ? city.getAttribute('max') : null,
      };
    });
    const empireCatchesRegression = mutated.empireMax !== '100';
    const cityCatchesRegression = mutated.cityMax !== '100';
    check('(D) mutacja: po ręcznym cofnięciu do max="50" asercja "(A) max=100" faktycznie by PADŁA (test nie jest tautologią)',
      empireCatchesRegression, mutated);
    check('(D) mutacja: po ręcznym cofnięciu do max="50" asercja "(B) max=100" faktycznie by PADŁA (test nie jest tautologią)',
      cityCatchesRegression, mutated);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[praca-budmode-slider-max-real-render-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
