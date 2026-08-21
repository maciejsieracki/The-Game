'use strict';
/**
 * tech-discovery-card-real-click-test.cjs
 *
 * TEMAT: R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1.
 *
 * Dlaczego ten test istnieje OBOK `tech-discovery-card-click-test.cjs` (jsdom):
 * prawdziwa przyczyna regresu („Rozpocznij badanie"/„Otwórz drzewo" nie reagują na
 * klik) była CZYSTO wizualna/stackingowa (kontekst nakładania CSS), nie brakiem
 * `addEventListener`. `button.click()`/`dispatchEvent(new MouseEvent(...))` w jsdom
 * WYWOŁUJE handler bezpośrednio na wskazanym elemencie — jsdom nie robi realnego
 * hit-testingu (layout+`elementFromPoint`), więc `tech-discovery-card-click-test.cjs`
 * PRZECHODZI zarówno przed, jak i po naprawie (zweryfikowane ręcznie przy
 * diagnozie) — dokładnie ten sam rodzaj fałszywego zielonego światła co
 * `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`, tylko jeden poziom głębiej.
 *
 * Realna przyczyna (potwierdzona żywym Chromium via Playwright, patrz commit tej
 * naprawy): `#civ-tech-discovery-notice-host .tdn-back` (tło modala) jest
 * `position:fixed` — tworzy własny kontekst stackowania (CSS 2.1 Appendix E,
 * krok 6) niezależnie od z-index. `.entity-card` (karta, sibling tła w DOM) nie
 * miała ŻADNEGO `position` (domyślne `static`) — maluje się we WCZEŚNIEJSZYM
 * kroku (3), czyli POD tłem, mimo że w źródle jest dodana do DOM PO tle. Efekt:
 * `document.elementFromPoint()` na środku przycisku zwracał `.tdn-back`, nie
 * przycisk — realny klik myszy trafiał w listener tła (`close()`), nigdy nie
 * wywołując `onClick` przycisku. Stary, sprzed-T3 `.tdn-card` miał
 * `position:relative` explicite (dlatego tam ten sam wzorzec tło+karta jako
 * siblingi działał). Naprawa: `position:relative` na `#HOST_ID .entity-card`.
 *
 * Ten test odtwarza DOKŁADNIE ten mechanizm w prawdziwej przeglądarce:
 * 1) buduje przez esbuild prawdziwy `src/ui/techDiscoveryNotice.ts` (format iife,
 *    platform browser) — te same stuby ikon co `tech-discovery-card-click-test.cjs`
 *    (Vite-only `import.meta.glob`/`.svg?raw`, nietestowane tu);
 * 2) ładuje bundle do pustej strony w headless Chromium (Playwright, ten sam
 *    wzorzec fallbacku executablePath co `era-change-toast-live-test.cjs` /
 *    `sidepanel-hud-deadzone-test.cjs`);
 * 3) woła `showTechDiscoveryNotice({ kind:'preview', onStartResearch, onOpenTree })`
 *    (dokładnie ścieżka `scienceHubHud.ts:631`), sprawdza `elementFromPoint()` na
 *    środku każdego przycisku ORAZ wykonuje realny `page.mouse.click()` na tych
 *    współrzędnych — weryfikuje że spy FAKTYCZNIE się wywołał.
 *
 * Usage (z gra/): node tools/tech-discovery-card-real-click-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[tech-discovery-card-real-click-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'tech-discovery-click-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'tech-discovery-click-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.tech-discovery-real-click-entry.ts');
const OUTFILE = path.resolve(__dirname, '.tech-discovery-real-click-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const stubIconsPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[tech-discovery-card-real-click-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox'],
    });
  }
}

/** Klika `label`em opisany przycisk stopki karty PRAWDZIWYM kliknięciem myszy
 * (`page.mouse.click` na środku `getBoundingClientRect()`, po realnym hit-teście
 * `elementFromPoint`) — nie `button.click()`/`dispatchEvent` (patrz nagłówek pliku:
 * to jest DOKŁADNIE to, czego nie wykrywa jsdom). Zwraca `{ hitOk, hitTag }`. */
async function realClickActionButton(page, label) {
  return page.evaluate((label) => {
    const host = document.getElementById('civ-tech-discovery-notice-host');
    if (!host) return { error: 'no-host' };
    const btn = Array.from(host.querySelectorAll('.entity-card-actions button'))
      .find((b) => b.textContent === label);
    if (!btn) return { error: 'no-button' };
    const rect = btn.getBoundingClientRect();
    return {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
    };
  }, label).then(async (coords) => {
    if (coords.error) return coords;
    const elAtPoint = await page.evaluate(({ cx, cy }) => {
      const el = document.elementFromPoint(cx, cy);
      return el ? { tag: el.tagName, className: el.className } : null;
    }, coords);
    await page.mouse.click(coords.cx, coords.cy);
    return { hitTag: elAtPoint ? elAtPoint.tag : null, hitClassName: elAtPoint ? elAtPoint.className : null };
  });
}

async function main() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { showTechDiscoveryNotice, hideTechDiscoveryNotice, isTechDiscoveryNoticeOpen } from '../src/ui/techDiscoveryNotice.ts';",
      'window.__showTechDiscoveryNotice = showTechDiscoveryNotice;',
      'window.__hideTechDiscoveryNotice = hideTechDiscoveryNotice;',
      'window.__isTechDiscoveryNoticeOpen = isTechDiscoveryNoticeOpen;',
      '',
    ].join('\n'),
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [stubIconsPlugin],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  try {
    await page.setContent('<!DOCTYPE html><html><head><title>tech-discovery-card-real-click-test</title></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const techData = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
    const techName = techData.technologie[0].Technologia;
    check('fixture: tech.json ma co najmniej 1 technologię do testu', typeof techName === 'string' && techName.length > 0, techName);

    // --- Scenariusz 1: karta z OBOMA akcjami (odblokowana technologia, wzorzec scienceHubHud.ts:631) ---
    console.log(`\n[1] kind:'preview' z onStartResearch + onOpenTree — realny klik "Rozpocznij badanie"`);
    await page.evaluate((techName) => {
      window.__researchCalls = 0;
      window.__treeCalls = 0;
      window.__showTechDiscoveryNotice({
        techName, eraIndex: 1, kind: 'preview',
        onStartResearch: () => { window.__researchCalls++; },
        onOpenTree: () => { window.__treeCalls++; },
      });
    }, techName);

    const isOpen1 = await page.evaluate(() => window.__isTechDiscoveryNoticeOpen());
    check('karta jest otwarta po wywołaniu', isOpen1);

    const researchHit = await realClickActionButton(page, 'Rozpocznij badanie');
    check('przycisk "Rozpocznij badanie" znaleziony w DOM (nie error)', !researchHit.error, researchHit);
    check('elementFromPoint na środku przycisku trafia w SAM PRZYCISK (nie w tło/inny element)',
      researchHit.hitTag === 'BUTTON', researchHit);
    const afterResearchClick = await page.evaluate(() => ({
      researchCalls: window.__researchCalls,
      isOpen: window.__isTechDiscoveryNoticeOpen(),
    }));
    check('realny page.mouse.click() na "Rozpocznij badanie" wywołuje onStartResearch DOKŁADNIE raz',
      afterResearchClick.researchCalls === 1, afterResearchClick);
    check('karta zamyka się po kliknięciu "Rozpocznij badanie"', afterResearchClick.isOpen === false);

    // --- Scenariusz 2: nowe otwarcie, realny klik "Otwórz drzewo" ---------------------------
    console.log(`\n[2] nowe otwarcie karty — realny klik "Otwórz drzewo"`);
    await page.evaluate((techName) => {
      window.__treeCalls = 0;
      window.__showTechDiscoveryNotice({
        techName, eraIndex: 1, kind: 'preview',
        onStartResearch: () => {},
        onOpenTree: () => { window.__treeCalls++; },
      });
    }, techName);
    const treeHit = await realClickActionButton(page, 'Otwórz drzewo');
    check('elementFromPoint na środku "Otwórz drzewo" trafia w SAM PRZYCISK', treeHit.hitTag === 'BUTTON', treeHit);
    const afterTreeClick = await page.evaluate(() => window.__treeCalls);
    check('realny klik na "Otwórz drzewo" wywołuje onOpenTree DOKŁADNIE raz', afterTreeClick === 1, afterTreeClick);
    await page.evaluate(() => window.__hideTechDiscoveryNotice());

    // --- Scenariusz 3: technologia zablokowana (bez onStartResearch, wzorzec scienceHubHud.ts:635) ---
    console.log(`\n[3] kind:'preview' bez onStartResearch (technologia zablokowana) — tylko "Otwórz drzewo"`);
    await page.evaluate((techName) => {
      window.__treeCalls = 0;
      window.__showTechDiscoveryNotice({
        techName, eraIndex: 1, kind: 'preview',
        onStartResearch: undefined,
        onOpenTree: () => { window.__treeCalls++; },
      });
    }, techName);
    const lockedButtons = await page.evaluate(() => {
      const host = document.getElementById('civ-tech-discovery-notice-host');
      return host ? Array.from(host.querySelectorAll('.entity-card-actions button')).map((b) => b.textContent) : null;
    });
    check('bez onStartResearch: stopka renderuje dokładnie 1 przycisk ("Otwórz drzewo")',
      Array.isArray(lockedButtons) && lockedButtons.length === 1 && lockedButtons[0] === 'Otwórz drzewo', lockedButtons);
    const lockedHit = await realClickActionButton(page, 'Otwórz drzewo');
    check('realny klik jedynego przycisku ("Otwórz drzewo") trafia w przycisk i wywołuje spy',
      lockedHit.hitTag === 'BUTTON', lockedHit);
    const afterLockedClick = await page.evaluate(() => window.__treeCalls);
    check('spy onOpenTree wywołany dokładnie raz', afterLockedClick === 1, afterLockedClick);
    await page.evaluate(() => window.__hideTechDiscoveryNotice());

    check('zero błędów konsoli/pageerror w trakcie całego scenariusza', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
  }

  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[tech-discovery-card-real-click-test] błąd:', err);
  process.exit(1);
});
