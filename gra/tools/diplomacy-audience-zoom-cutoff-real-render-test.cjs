'use strict';
/**
 * diplomacy-audience-zoom-cutoff-real-render-test.cjs
 *
 * TEMAT: P-UI-ZOOM-PRZEGLADARKI-PANELE-UCIETE-Q1.
 *
 * ZGŁOSZENIE (właściciel): „Kiedy gracz zaznaczy, że jego monitor ma być powiększony,
 * na przykład ze 100% do 125%, to niestety górna i dolna część nie jest widoczna i
 * strona sama się nie skaluje" — dotyczy panelu audiencji dyplomatycznej.
 *
 * KROK 1 (RECON, przed jakąkolwiek zmianą kodu) — sprawdzono ŻYWO w headless Chromium
 * TRZY mechanizmy zoomu na syntetycznej stronie z DOKŁADNIE tym samym CSS co
 * `.civ-diplo-aud`/`.civ-diplo-aud-box` sprzed poprawki:
 *   (a) zoom przeglądarki: `document.documentElement.style.zoom='1.25'`     → REPRODUKUJE
 *   (b) system/DPI: CDP `Emulation.setDeviceMetricsOverride`/`setPageScaleFactor` → NIE reprodukuje
 *       (te komendy skalują RENDER, ale `window.innerHeight` i jednostki `vh` przeliczają się
 *       spójnie razem z nim — brak rozjazdu, panel mieści się tak samo jak przy 100%).
 *   (c) wewnętrzny zoom UI gry (hud.ts, `body{transform:scale(z)}`)          → REPRODUKUJE
 * Mechanizm (a) — natywny zoom przeglądarki — reprodukuje NIEZALEŻNIE od hud.ts, więc
 * ALLOWLISTA nie jest zawężona do „jedynego reprodukowalnego mechanizmu = hud.ts" (dispatch
 * §REGUŁA PRZECIW SAMOOSZUKIWANIU) — hud.ts pozostaje NIETKNIĘTY, zgodnie z zakazem.
 *
 * PRZYCZYNA (potwierdzona pomiarem `getBoundingClientRect` vs `window.innerHeight`):
 * `.civ-diplo-aud{display:flex;align-items:center}` to "unsafe" centrowanie flex — gdy
 * `.civ-diplo-aud-box` (max-height:94vh) jest wyższy niż faktycznie dostępna wysokość
 * (rozjazd `vh` pod zoomem), nadmiar jest obcinany SYMETRYCZNIE u góry i u dołu, bez żadnej
 * ścieżki scrolla do obciętej treści — sam wewnętrzny `overflow:auto` na boxie nie pomaga,
 * bo to backdrop (`.civ-diplo-aud`) przycina box, nie odwrotnie.
 *
 * FIX (diplomacyAudience.ts, WYŁĄCZNIE CSS `.civ-diplo-aud`/`.civ-diplo-aud-box`):
 *   `.civ-diplo-aud`: `align-items:center` → `align-items:flex-start` + `overflow-y:auto`.
 *   `.civ-diplo-aud-box`: dodane `margin:auto 0` — "bezpieczne" centrowanie (auto-marginesy
 *   nigdy nie schodzą poniżej 0), więc gdy jest miejsce box wygląda TAK SAMO jak przed
 *   poprawką (wyśrodkowany), a gdy nie ma miejsca — przykleja się do góry i nadmiar jest
 *   osiągalny scrollem backdropu (`overflow-y:auto`). main.ts NIETKNIĘTY — brak potrzeby.
 *
 * DOWÓD w tym pliku, real Chromium (nie jsdom — layout flex/vh/scroll wymaga silnika CSS):
 *   (A) PRZED (mutacja w locie, cofnięcie fixu): przy zoomie (a) i (c) górna LUB dolna
 *       krawędź `.civ-diplo-aud-box` wykracza poza `[0, innerHeight]` — kontrola negatywna.
 *   (B) PO (kod bieżący): przy TYCH SAMYCH zoomach `scrollTo(0,0)` i `scrollTo(0,scrollHeight)`
 *       na `.civ-diplo-aud` faktycznie pokazują odpowiednio górę (nagłówek) i dół (przycisk
 *       zamknięcia) treści wewnątrz `[0, innerHeight]` — nie tylko reguła CSS, zmierzony DOM.
 *   (C) mechanizm (b) (CDP DPI/scale) jako kontrola: bez fixu i tak się mieści (brak regresu
 *       wymagany, ale nic tu nie testujemy destrukcyjnie — pomijamy, patrz RECON wyżej).
 *
 * Usage (z gra/): node tools/diplomacy-audience-zoom-cutoff-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[diplomacy-audience-zoom-cutoff-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.dza-stubs');
const ENTRY = path.resolve(__dirname, '.dza-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.dza-bundle-po.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.dza-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIPLO_AUD = path.resolve(GRA, 'src', 'ui', 'diplomacyAudience.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const stubs = {
  music: path.resolve(STUB_DIR, 'music-stub.ts'),
  diploUiSkin: path.resolve(STUB_DIR, 'diplouiskin-stub.ts'),
  negotiationModal: path.resolve(STUB_DIR, 'negotiationmodal-stub.ts'),
  tradeBasket: path.resolve(STUB_DIR, 'tradebasket-stub.ts'),
  leaderPortraits: path.resolve(STUB_DIR, 'leaderportraits-stub.ts'),
  civBrandDisplay: path.resolve(STUB_DIR, 'civbranddisplay-stub.ts'),
  brandAssets: path.resolve(STUB_DIR, 'brandassets-stub.ts'),
};

function writeStubs() {
  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(stubs.music, [
    "export function startDiplomacyMusic() {}",
    "export function stopDiplomacyMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.diploUiSkin, [
    "export function civLeaderMedallionHtmlById() { return ''; }",
    "export function dipBrandIconHtml() { return ''; }",
    "export function dipCapitalLocateBtnHtml() { return ''; }",
    "export const DIPLO_1E_SHARED_CSS = '';",
    "export function ensureDiploBrandScope() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.negotiationModal, [
    "export function actionNeedsNegotiation() { return false; }",
    "export function showNegotiationModal() {}",
    "export function proposalActionIdFromPayload() { return undefined; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.tradeBasket, [
    "export function actionUsesTradeBasket() { return false; }",
    "export function getTradeBasketMode() { return 'trade'; }",
    "export function showTradeBasketModal() {}",
    "export function hideTradeBasketModal() {}",
    "export function openQuickDealBasket() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.leaderPortraits, [
    "export function civCardDisplayName(label) { return label; }",
    "export function leaderName() { return null; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.civBrandDisplay, "export function civBrandLineForKey() { return ''; }\n", 'utf8');
  fs.writeFileSync(stubs.brandAssets, [
    "export function brandIconSvg() { return ''; }",
    "export function mapResourceIconSvg() { return ''; }",
  ].join('\n'), 'utf8');
}

function cleanupStubs() {
  for (const f of Object.values(stubs).concat([ENTRY, BUNDLE_PO, BUNDLE_PRZED])) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
  try { fs.rmdirSync(STUB_DIR); } catch (_) { /* ok */ }
}

/** Cofnięcie fixu W LOCIE (tylko dla bundla PRZED) — nie dotyka plików w repo. */
const mutation = { applied: 0 };
const revertFixPlugin = {
  name: 'revert-zoom-fix',
  setup(build) {
    build.onLoad({ filter: /diplomacyAudience\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_AUD) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      let out = src.replace(
        "display:flex;align-items:flex-start;justify-content:center;padding:14px;",
        "display:flex;align-items:center;justify-content:center;padding:14px;",
      );
      if (out !== src) mutation.applied++;
      const out2 = out.replace(/\n\s*overflow-y:auto;\n\s*font:14px 'Segoe UI'/, "\n  font:14px 'Segoe UI'");
      if (out2 !== out) mutation.applied++;
      out = out2;
      const out3 = out.replace(
        "max-height:94vh;overflow:auto;position:relative;\n  margin:auto 0;\n",
        "max-height:94vh;overflow:auto;position:relative;\n",
      );
      if (out3 !== out) mutation.applied++;
      out = out3;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins: [
      ...(mutate ? [revertFixPlugin] : []),
      {
        name: 'stub-diplomacy-audience-deps',
        setup(build) {
          build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubs.music }));
          build.onResolve({ filter: /diploUiSkin$/ }, () => ({ path: stubs.diploUiSkin }));
          build.onResolve({ filter: /diplomacyNegotiationModal$/ }, () => ({ path: stubs.negotiationModal }));
          build.onResolve({ filter: /diplomacyTradeBasket$/ }, () => ({ path: stubs.tradeBasket }));
          build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: stubs.leaderPortraits }));
          build.onResolve({ filter: /civBrandDisplay$/ }, () => ({ path: stubs.civBrandDisplay }));
          build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: stubs.brandAssets }));
        },
      },
    ],
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[diplomacy-audience-zoom-cutoff-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Otwiera audiencję z realistycznym stanem, po czym dokłada widoczny filler bezpośrednio
 * do `.civ-diplo-aud-box` — realny content (traktaty/akcje) ma WŁASNY scroll wewnętrzny
 * (`.da-col{max-height:400px}`), więc nie zawsze podciąga box pod `max-height:94vh`. Filler
 * gwarantuje, że box realnie osiąga swój limit `94vh` (dokładnie ten przypadek, w którym
 * rozjazd `vh` pod zoomem staje się widoczny) — struktura DOM/CSS boxa (to, co naprawia ten
 * temat) pozostaje w 100% produktem prawdziwego `showDiplomacyAudience`/`render()`. */
async function openAudienceWithFiller(page) {
  await page.evaluate(() => {
    window.showDiplomacyAudience({
      ownerId: 1,
      getState: () => ({
        playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Rozmowca', otherCivName: 'Grecja',
        zaufanie: 50, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
        actions: Array.from({ length: 12 }, (_, i) => ({ id: String(i), label: 'Akcja ' + i, enabled: true })),
        activeTreaties: Array.from({ length: 20 }, (_, i) => ({ label: 'Traktat ' + i, detail: 'Szczegoly ' + i })),
        pendingNegotiations: [],
      }),
      onAction: () => {}, onBack: () => {},
    });
    const box = document.querySelector('.civ-diplo-aud-box');
    const filler = document.createElement('div');
    filler.className = 'zoom-test-filler';
    filler.style.height = '1600px';
    filler.style.background = 'linear-gradient(#222,#333)';
    filler.textContent = 'ZOOM-TEST-FILLER';
    box.appendChild(filler);
  });
}

async function measureCutoff(page) {
  return page.evaluate(() => {
    const box = document.querySelector('.civ-diplo-aud-box');
    const r = box.getBoundingClientRect();
    return {
      innerHeight: window.innerHeight,
      top: r.top, bottom: r.bottom, height: r.height,
      topCut: r.top < -0.5,
      bottomCut: r.bottom > window.innerHeight + 0.5,
    };
  });
}

async function checkReach(page) {
  return page.evaluate(() => {
    const aud = document.querySelector('.civ-diplo-aud');
    const box = document.querySelector('.civ-diplo-aud-box');
    const head = box.querySelector('.civ-diplo-aud-head h2');
    const closeArea = box.lastElementChild; // ostatni element = najniższa treść boxa
    aud.scrollTo(0, 0);
    box.scrollTo(0, 0);
    const headTop = head ? head.getBoundingClientRect().top : null;
    const topReachable = headTop !== null && headTop >= -0.5 && headTop < window.innerHeight;
    aud.scrollTo(0, aud.scrollHeight);
    box.scrollTo(0, box.scrollHeight);
    const bottomRect = closeArea.getBoundingClientRect();
    const bottomReachable = bottomRect.bottom <= window.innerHeight + 0.5 && bottomRect.bottom > 0;
    return { topReachable, bottomReachable, headTop, bottomRect: { bottom: bottomRect.bottom }, innerHeight: window.innerHeight };
  });
}

async function applyBrowserZoom(page, z) {
  await page.evaluate((z) => { document.documentElement.style.zoom = String(z); }, z);
}
async function resetBrowserZoom(page) {
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
}
async function applyUiZoom(page, z) {
  await page.evaluate((z) => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('civ-ui-zoom-active');
    root.style.setProperty('--civ-ui-zoom', String(z));
    body.style.width = `${100 / z}vw`;
    body.style.height = `${100 / z}vh`;
    body.style.transform = `scale(${z})`;
    body.style.transformOrigin = 'top left';
    body.style.overflow = 'hidden';
    window.dispatchEvent(new Event('resize'));
  }, z);
}
async function resetUiZoom(page) {
  await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('civ-ui-zoom-active');
    root.style.removeProperty('--civ-ui-zoom');
    body.style.width = '';
    body.style.height = '';
    body.style.transform = '';
    body.style.transformOrigin = '';
    body.style.overflow = '';
  });
}

async function main() {
  writeStubs();
  fs.writeFileSync(ENTRY, [
    "import { showDiplomacyAudience } from '../src/ui/diplomacyAudience.ts';",
    'window.showDiplomacyAudience = showDiplomacyAudience;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_PRZED, true);
  check('(0) mutacja PRZED faktycznie cofnela WSZYSTKIE 3 fragmenty fixu (test nie jest pusty)',
    mutation.applied === 3, mutation.applied);
  if (mutation.applied !== 3) {
    console.log('\nPRZERWANE: nie udalo sie odtworzyc stanu sprzed poprawki — kod sie przesunal, popraw wzorce w revertFixPlugin.');
    cleanupStubs();
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  try {
    // ===== (A) PRZED poprawka: kontrola negatywna — dowod ze problem realnie istnieje =====
    console.log('\n--- (A) PRZED poprawka (mutacja: cofniety fix) ---');
    await page.setContent(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#0b0d12;height:100%;width:100%;overflow:hidden;}'
      + '</style></head><body></body></html>',
    );
    await page.addScriptTag({ path: BUNDLE_PRZED });
    await openAudienceWithFiller(page);

    const baseline = await measureCutoff(page);
    check('(A0) PRZED, bez zoomu: box mieści się (baza porównawcza — brak regresu przy 100%)',
      !baseline.topCut && !baseline.bottomCut, baseline);

    await applyBrowserZoom(page, 1.25);
    const przedBrowserZoom = await measureCutoff(page);
    check('(A1) PRZED + zoom przegladarki 125%: gorna LUB dolna krawedz boxa WYKRACZA poza viewport (reprodukcja realnego uciecia)',
      przedBrowserZoom.topCut || przedBrowserZoom.bottomCut, przedBrowserZoom);
    await resetBrowserZoom(page);

    await applyUiZoom(page, 1.25);
    const przedUiZoom = await measureCutoff(page);
    check('(A2) PRZED + wewnetrzny zoom UI gry 125%: gorna LUB dolna krawedz boxa WYKRACZA poza viewport (reprodukcja realnego uciecia)',
      przedUiZoom.topCut || przedUiZoom.bottomCut, przedUiZoom);
    await resetUiZoom(page);

    // ===== (B) PO poprawce: ta sama tresc, te same zoomy — cala tresc osiagalna =====
    console.log('\n--- (B) PO poprawce (kod biezacy) ---');
    await page.setContent(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#0b0d12;height:100%;width:100%;overflow:hidden;}'
      + '</style></head><body></body></html>',
    );
    await page.addScriptTag({ path: BUNDLE_PO });
    await page.evaluate(() => {
      window.showDiplomacyAudience({
        ownerId: 1,
        getState: () => ({
          playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Rozmowca', otherCivName: 'Grecja',
          zaufanie: 50, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
          actions: Array.from({ length: 12 }, (_, i) => ({ id: String(i), label: 'Akcja ' + i, enabled: true })),
          activeTreaties: Array.from({ length: 20 }, (_, i) => ({ label: 'Traktat ' + i, detail: 'Szczegoly ' + i })),
          pendingNegotiations: [],
        }),
        onAction: () => {}, onBack: () => {},
      });
    });

    const poBaseline = await measureCutoff(page);
    check('(B0) PO, bez zoomu: box mieści się (brak regresu przy 100%)',
      !poBaseline.topCut && !poBaseline.bottomCut, poBaseline);

    await applyBrowserZoom(page, 1.25);
    const poBrowserZoomReach = await checkReach(page);
    check('(B1) PO + zoom przegladarki 125%: scrollTo(0,0) faktycznie pokazuje NAGLOWEK boxa w viewport',
      poBrowserZoomReach.topReachable, poBrowserZoomReach);
    check('(B2) PO + zoom przegladarki 125%: scrollTo(0,scrollHeight) faktycznie pokazuje DOL boxa w viewport',
      poBrowserZoomReach.bottomReachable, poBrowserZoomReach);
    await resetBrowserZoom(page);

    await applyUiZoom(page, 1.25);
    const poUiZoomReach = await checkReach(page);
    check('(B3) PO + wewnetrzny zoom UI gry 125%: scrollTo(0,0) faktycznie pokazuje NAGLOWEK boxa w viewport',
      poUiZoomReach.topReachable, poUiZoomReach);
    check('(B4) PO + wewnetrzny zoom UI gry 125%: scrollTo(0,scrollHeight) faktycznie pokazuje DOL boxa w viewport',
      poUiZoomReach.bottomReachable, poUiZoomReach);
    await resetUiZoom(page);

    // ekstremalny zoom UI gry (max 1.5, hud.ts UI_ZOOM_MAX) — brzeg zakresu
    await applyUiZoom(page, 1.5);
    const poUiZoomMaxReach = await checkReach(page);
    check('(B5) PO + wewnetrzny zoom UI gry 150% (UI_ZOOM_MAX): gora i dol nadal osiagalne',
      poUiZoomMaxReach.topReachable && poUiZoomMaxReach.bottomReachable, poUiZoomMaxReach);
    await resetUiZoom(page);

    check('(E0) zero bledow konsoli/JS podczas calego przebiegu', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close();
  }

  cleanupStubs();

  console.log('\ndiplomacy-audience-zoom-cutoff-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); cleanupStubs(); process.exit(1); });
