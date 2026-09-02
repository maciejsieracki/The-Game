'use strict';
/**
 * unit-card-3d-preview-coverage-test.cjs
 *
 * TEMAT: R-KARTA-JEDNOSTKI-3D-PODGLAD-BRAKUJACY-Q1.
 *
 * ZGŁOSZENIE. Podgląd 3D jednostki (`mountUnitMiniPreview`/`defaultOwnerColor` z
 * `src/ui/unitMiniPreview.ts`) był podłączony WYŁĄCZNIE w `unitInfoCard.ts` (karta
 * jednostki z listy armii) — karta rekrutacji w panelu miasta (`cityPanel.ts`) i
 * generyczna ścieżka linków krzyżowych (`entityCards/renderer.ts::buildEntityCardData`)
 * pokazywały tylko statyczną ikonę SVG mimo miejsca na medalion 3D w nagłówku.
 *
 * NAPRAWA. Oba dodatkowe call-site'y nadpisują teraz `medallion` na
 * `{ kind: 'unit3d', mount: (slot) => mountUnitMiniPreview(slot, u, defaultOwnerColor(),
 * fallbackMsg) }`, DOKŁADNIE wzorem już działającej ścieżki `unitInfoCard.ts`
 * (`buildUnitInfoCardViaEntityCard`, NIETKNIĘTA w tym temacie).
 *
 * DLACZEGO ŻYWA PRZEGLĄDARKA. `mountUnitMiniPreview` renderuje Three.js/WebGL do
 * `<canvas>` — jedyny sposób sprawdzenia realnego podglądu (nie tylko że kod WOŁA
 * funkcję) to zbudować kartę w prawdziwym silniku (Playwright/Chromium, ten sam
 * wzorzec co `zelazo-*-real-render-test.cjs`/`unit-info-card-badges-real-render-test.cjs`)
 * i sprawdzić realny `<canvas class="unit-mini-canvas">` w DOM medalionu.
 *
 * SEKCJE:
 *  (A) entityCards/renderer.ts, case 'unit' (`buildEntityCardData('unit', id)`) —
 *      GENERYCZNA ścieżka wołana m.in. przez link krzyżowy z innej karty (kryterium 2)
 *      — REALNY render w przeglądarce, bez stubowania `unitMiniPreview.ts`.
 *  (B) unitInfoCard.ts (`buildUnitInfoCard`, ścieżka listy armii) — NIETKNIĘTA w tym
 *      temacie — regresja zero: ten sam żywy test co przed zmianą nadal przechodzi
 *      (kryterium 3), w TYM SAMYM środowisku co (A) dla bezpośredniej parytetu.
 *  (C) Pozostałe 4 kinds (building/technology/improvement/wonder) przez
 *      `buildEntityCardData` — medalion pozostaje `{ kind: 'icon' }`, BEZ ZMIAN
 *      (kryterium 4).
 *  (D) cityPanel.ts::buildUnitDetailCardViaEntityCard (karta rekrutacji, kryterium 1)
 *      — `cityPanel.ts` jest zbyt ciężki do bezpiecznego zbundlowania w izolacji
 *      (potwierdzone empirycznie: `import.meta.glob`/`.svg?raw` w łańcuchu audio/
 *      portretów, precedens `building-detail-card-entitycard-migration-test.cjs` §C,
 *      `unit-detail-card-entitycard-migration-test.cjs` §B) — więc literał obiektu
 *      `medallion: {...}` jest wycięty (dopasowanie nawiasów, NIE ręcznie przepisany)
 *      z ŻYWEGO `cityPanel.ts` i URUCHOMIONY w prawdziwej przeglądarce z prawdziwymi
 *      `unitAdapter`/`renderEntityCard`/`mountUnitMiniPreview`/`defaultOwnerColor` —
 *      dowód, że DOKŁADNIE ten kod (bajt w bajt z pliku źródłowego) montuje realny
 *      `<canvas>`. Sekcja mutacyjna (usunięcie override'u) musi złapać regresję na
 *      czerwono, wzorem `unit-detail-card-entitycard-migration-test.cjs`.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (dispatch §"reguła przeciw samooszukiwaniu"): jeśli
 * WebGL jest niedostępny w headless Chromium tego środowiska, test akceptuje PARYTET
 * fallbacku tekstowego (ten sam fallback co na już działającej karcie listy armii, w
 * TYM SAMYM środowisku) zamiast realnego obrazu 3D — i JAWNIE loguje, który przypadek
 * zaszedł (`renderMode`).
 *
 * Usage (z gra/): node tools/unit-card-3d-preview-coverage-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[unit-card-3d-preview-coverage-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'unit-card-3d-coverage-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'unit-card-3d-coverage-scienceOwlIcon-stub.ts');
const ENTRY_MAIN = path.resolve(__dirname, '.unit-card-3d-coverage-entry.ts');
const BUNDLE_MAIN = path.resolve(__dirname, '.unit-card-3d-coverage-bundle.js');
const ENTRY_CITY = path.resolve(__dirname, '.unit-card-3d-coverage-city-entry.ts');
const BUNDLE_CITY = path.resolve(__dirname, '.unit-card-3d-coverage-city-bundle.js');
const CITY_PANEL_TS = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const firstUnit = units.find((u) => u && u.Jednostka);
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const wonders = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'wonders.json'), 'utf8'));
const improvements = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'));
const techJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

/** Wycina literał `medallion: { ... }` (dopasowanie nawiasów klamrowych) z ciała
 * funkcji `buildUnitDetailCardViaEntityCard` w ŻYWYM `cityPanel.ts`. Zwraca `null`
 * gdy override zniknął (użyte przez sekcję mutacyjną do wykrycia regresji). */
function extractMedallionLiteral(cityPanelSrc) {
  const fnStart = cityPanelSrc.indexOf('function buildUnitDetailCardViaEntityCard(');
  if (fnStart === -1) return null;
  const fnEnd = cityPanelSrc.indexOf('\n/** Publiczna sygnatura BEZ ZMIAN.', fnStart);
  if (fnEnd === -1) return null;
  const fnSrc = cityPanelSrc.slice(fnStart, fnEnd);
  const medStart = fnSrc.indexOf('medallion: {');
  if (medStart === -1) return null;
  let depth = 0;
  let i = medStart + 'medallion: '.length; // start at the opening "{"
  const openIdx = i;
  for (; i < fnSrc.length; i++) {
    if (fnSrc[i] === '{') depth++;
    else if (fnSrc[i] === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  if (depth !== 0) return null;
  return { literal: fnSrc.slice(openIdx, i), fnSrc };
}

const stubPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[unit-card-3d-preview-coverage-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  if (!firstUnit) {
    console.error('[unit-card-3d-preview-coverage-test] brak jednostek w units.json');
    process.exit(1);
  }

  // === Bundle 1: renderer.ts (A, C) + unitInfoCard.ts (B) — bez stubowania unitMiniPreview ===
  fs.writeFileSync(
    ENTRY_MAIN,
    [
      "export { buildEntityCardData } from '../src/ui/entityCards/renderer.ts';",
      "export { renderEntityCard } from '../src/ui/entityCards/renderer.ts';",
      "export { unitToSlug, technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
      "export { buildUnitInfoCard, ensureUnitInfoCardStyles } from '../src/ui/unitInfoCard.ts';",
      '',
    ].join('\n'),
    'utf8',
  );
  await esbuild.build({
    entryPoints: [ENTRY_MAIN],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: '__COVERAGE',
    target: 'es2020',
    outfile: BUNDLE_MAIN,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [stubPlugin],
    logLevel: 'silent',
  });

  // === Bundle 2: literał medallion wycięty z cityPanel.ts + realne zależności (D) ===
  const cityPanelSrcOriginal = fs.readFileSync(CITY_PANEL_TS, 'utf8');
  const extracted = extractMedallionLiteral(cityPanelSrcOriginal);
  check('cityPanel.ts: literał `medallion: {...}` znaleziony w buildUnitDetailCardViaEntityCard (dopasowanie nawiasów)', !!extracted, extracted);
  check('cityPanel.ts: buildUnitDetailCardViaEntityCard nadal woła unitAdapter(u, {}) (dane BEZ zmian, tylko medalion nadpisany)',
    !!extracted && extracted.fnSrc.includes('unitAdapter(u, {})'));
  check('cityPanel.ts: buildUnitDetailCardViaEntityCard nadal woła renderEntityCard(cardData) (nie built bezpośrednio — nadpisanie faktycznie użyte)',
    !!extracted && extracted.fnSrc.includes('renderEntityCard(cardData)'));

  if (extracted) {
    fs.writeFileSync(
      ENTRY_CITY,
      [
        "import { unitAdapter } from '../src/ui/entityCards/unitAdapter.ts';",
        "import { renderEntityCard } from '../src/ui/entityCards/renderer.ts';",
        "import { mountUnitMiniPreview, defaultOwnerColor } from '../src/ui/unitMiniPreview.ts';",
        '',
        '// Literał wycięty bajt-w-bajt z cityPanel.ts::buildUnitDetailCardViaEntityCard —',
        '// NIE ręcznie przepisany (patrz extractMedallionLiteral w tym pliku testowym).',
        'window.__buildCityUnitCard = function (u) {',
        '  const built = unitAdapter(u, {});',
        '  const cardData = {',
        '    ...built,',
        `    medallion: ${extracted.literal},`,
        '  };',
        '  return renderEntityCard(cardData);',
        '};',
        '',
      ].join('\n'),
      'utf8',
    );
    await esbuild.build({
      entryPoints: [ENTRY_CITY],
      bundle: true,
      platform: 'browser',
      format: 'iife',
      target: 'es2020',
      outfile: BUNDLE_CITY,
      absWorkingDir: GRA,
      loader: { '.ts': 'ts' },
      plugins: [stubPlugin],
      logLevel: 'silent',
    });
  }

  const browser = await launchBrowser();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: fs.readFileSync(BUNDLE_MAIN, 'utf8') });
  if (extracted) await page.addScriptTag({ content: fs.readFileSync(BUNDLE_CITY, 'utf8') });

  // ---------------------------------------------------------------------------------
  // (A) entityCards/renderer.ts, case 'unit' — generyczna ścieżka (linki krzyżowe)
  // ---------------------------------------------------------------------------------
  console.log('\n-- (A) entityCards/renderer.ts::buildEntityCardData("unit", ...) — realny render --');
  const resA = await page.evaluate(({ unitName }) => {
    const C = window.__COVERAGE;
    const id = C.unitToSlug(unitName);
    const data = C.buildEntityCardData('unit', id, {});
    if (!data) return { error: 'no-data' };
    const el = C.renderEntityCard(data);
    document.getElementById('root').appendChild(el);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          medallionKind: data.medallion.kind,
          hasCanvas: !!el.querySelector('.entity-card-medallion canvas.unit-mini-canvas'),
          hasFallback: !!el.querySelector('.entity-card-medallion .unit-mini-fallback'),
          fallbackText: el.querySelector('.entity-card-medallion .unit-mini-fallback')?.textContent ?? null,
        });
      }, 500);
    });
  }, { unitName: firstUnit.Jednostka });
  check('(A) brak błędów konsoli/pageerror', consoleErrors.length === 0, consoleErrors);
  check('(A) data.medallion.kind === "unit3d" (nadpisany, nie domyślna ikona)', resA.medallionKind === 'unit3d', resA.medallionKind);
  const rendModeA = resA.hasCanvas ? 'canvas-3d' : (resA.hasFallback ? 'fallback-text' : 'brak');
  console.log('[(A) renderMode]', rendModeA, resA.fallbackText ? `("${resA.fallbackText}")` : '');
  check('(A) medalion faktycznie coś zamontował: realny <canvas> (WebGL) LUB fallback tekstowy (parytet środowiska, reguła przeciw samooszukiwaniu)',
    resA.hasCanvas || resA.hasFallback, resA);

  // ---------------------------------------------------------------------------------
  // (B) unitInfoCard.ts — ścieżka listy armii, NIETKNIĘTA — zero regresu
  // ---------------------------------------------------------------------------------
  console.log('\n-- (B) unitInfoCard.ts::buildUnitInfoCard (lista armii, nietknięta) — parytet --');
  const resB = await page.evaluate(({ unitName, units }) => {
    const C = window.__COVERAGE;
    C.ensureUnitInfoCardStyles();
    const u = units.find((x) => x.Jednostka === unitName);
    const card = C.buildUnitInfoCard(u, {}, {});
    document.body.appendChild(card);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          unit3dHook: card.dataset.unit3dHook,
          hasCanvas: !!card.querySelector('.entity-card-medallion canvas.unit-mini-canvas'),
          hasFallback: !!card.querySelector('.entity-card-medallion .unit-mini-fallback'),
        });
      }, 500);
    });
  }, { unitName: firstUnit.Jednostka, units });
  check('(B) dataset.unit3dHook === "buildUnitModel" (marker karty listy armii niezmieniony)', resB.unit3dHook === 'buildUnitModel', resB.unit3dHook);
  const rendModeB = resB.hasCanvas ? 'canvas-3d' : (resB.hasFallback ? 'fallback-text' : 'brak');
  console.log('[(B) renderMode]', rendModeB);
  check('(B) karta listy armii nadal montuje realny <canvas> LUB fallback tekstowy — zero regresu', resB.hasCanvas || resB.hasFallback, resB);
  check('(B)+(A) PARYTET środowiska: oba call-site\'y dają ten sam typ wyniku w tym samym środowisku (canvas<->canvas albo fallback<->fallback)',
    resA.hasCanvas === resB.hasCanvas && resA.hasFallback === resB.hasFallback,
    { A: rendModeA, B: rendModeB });

  // ---------------------------------------------------------------------------------
  // (C) Pozostałe 4 kinds — medalion BEZ zmian (nadal 'icon')
  // ---------------------------------------------------------------------------------
  console.log('\n-- (C) building/technology/improvement/wonder — medalion niezmieniony ("icon") --');
  const firstBuildingId = buildings.find((b) => b && b.id)?.id;
  const firstImprovementId = Object.keys(improvements).find((k) => k !== '_meta');
  const firstTechName = techJson.technologie[0]['Technologia'];
  const firstWonderId = wonders.cuda.find((w) => w && w.id)?.id;

  const resC = await page.evaluate(({ firstBuildingId, firstImprovementId, firstTechName, firstWonderId }) => {
    const C = window.__COVERAGE;
    const techId = C.technologyIdFromName(firstTechName);
    return {
      building: C.buildEntityCardData('building', firstBuildingId, {})?.medallion?.kind ?? 'NO-DATA',
      improvement: C.buildEntityCardData('improvement', firstImprovementId, {})?.medallion?.kind ?? 'NO-DATA',
      technology: C.buildEntityCardData('technology', techId, {})?.medallion?.kind ?? 'NO-DATA',
      wonder: C.buildEntityCardData('wonder', firstWonderId, {})?.medallion?.kind ?? 'NO-DATA',
    };
  }, { firstBuildingId, firstImprovementId, firstTechName, firstWonderId });
  check('(C) building: medallion.kind === "icon" (bez zmian)', resC.building === 'icon', resC.building);
  check('(C) improvement: medallion.kind === "icon" (bez zmian)', resC.improvement === 'icon', resC.improvement);
  check('(C) wonder: medallion.kind === "icon" (bez zmian)', resC.wonder === 'icon', resC.wonder);
  check('(C) technology: medallion.kind === "icon" (bez zmian)', resC.technology === 'icon', resC.technology);

  // ---------------------------------------------------------------------------------
  // (D) cityPanel.ts::buildUnitDetailCardViaEntityCard — karta rekrutacji, kryterium 1
  // ---------------------------------------------------------------------------------
  console.log('\n-- (D) cityPanel.ts::buildUnitDetailCardViaEntityCard (panel rekrutacji miasta) — realny render literału wyciętego z żywego pliku --');
  if (extracted) {
    const resD = await page.evaluate(({ unitName, units }) => {
      const u = units.find((x) => x.Jednostka === unitName);
      const card = window.__buildCityUnitCard(u);
      document.body.appendChild(card);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            hasCanvas: !!card.querySelector('.entity-card-medallion canvas.unit-mini-canvas'),
            hasFallback: !!card.querySelector('.entity-card-medallion .unit-mini-fallback'),
          });
        }, 500);
      });
    }, { unitName: firstUnit.Jednostka, units });
    const rendModeD = resD.hasCanvas ? 'canvas-3d' : (resD.hasFallback ? 'fallback-text' : 'brak');
    console.log('[(D) renderMode]', rendModeD);
    check('(D) karta rekrutacji (literał z cityPanel.ts) montuje realny <canvas> LUB fallback tekstowy', resD.hasCanvas || resD.hasFallback, resD);
    check('(D)+(B) PARYTET środowiska: karta rekrutacji daje ten sam typ wyniku co karta listy armii',
      resD.hasCanvas === resB.hasCanvas && resD.hasFallback === resB.hasFallback,
      { D: rendModeD, B: rendModeB });
  } else {
    fail++;
    console.log('FAIL: (D) literał medallion nie znaleziony w cityPanel.ts — nie można zweryfikować kryterium 1');
  }

  await browser.close();

  // ---------------------------------------------------------------------------------
  // (E) Mutacja: usunięcie override'u medalionu z cityPanel.ts MUSI złapać regresję
  // ---------------------------------------------------------------------------------
  if (!process.argv.includes('--self-check-skip-mutation')) {
    console.log('\n-- (E) Mutacja: cofnięcie nadpisania medalionu w cityPanel.ts (musi złapać czerwono) --');
    const backup = cityPanelSrcOriginal;
    const mutated = backup.replace(
      extracted ? `medallion: ${extracted.literal},\n  };\n  const card = renderEntityCard(cardData) as HTMLDivElement;` : '###NIE-ZNALEZIONO###',
      'sections: built.sections, // MUTOWANE — nadpisanie medalionu usunięte\n  };\n  const card = renderEntityCard(cardData) as HTMLDivElement;',
    );
    check('(E) mutacja faktycznie zmieniła źródło (kotwica zamiany istnieje)', mutated !== backup);
    if (mutated !== backup) {
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
      check('(E) mutacja (override medalionu usunięty) złapana czerwono przez sekcję (D) tego samego testu', mutantFailed);
      check('(E) plik cityPanel.ts przywrócony do stanu oryginalnego po mutacji', fs.readFileSync(CITY_PANEL_TS, 'utf8') === backup);
    }
  }

  // Sprzątanie plików tymczasowych.
  for (const f of [ENTRY_MAIN, BUNDLE_MAIN, ENTRY_CITY, BUNDLE_CITY]) {
    try { fs.unlinkSync(f); } catch (_e) { /* noop */ }
  }

  console.log('');
  console.log(`[unit-card-3d-preview-coverage-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[unit-card-3d-preview-coverage-test] BŁĄD:', e);
  process.exit(1);
});
