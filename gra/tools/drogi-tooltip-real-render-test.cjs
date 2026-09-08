'use strict';
/**
 * drogi-tooltip-real-render-test.cjs
 *
 * TEMAT: P-DROGI-BUDOWA-WYJASNIENIE-TOOLTIP-Q1.
 *
 * Zgłoszenie właściciela: w trybie budowy drogi gracz nie widział ŻADNEGO wyjaśnienia,
 * dlaczego niektóre heksy są niedozwolone do budowy drogi (`isRoadQualified`,
 * map/improvement-build.ts — reguła świadoma i poprawna, BEZ ZMIAN w tym temacie: droga
 * musi sąsiadować z miastem albo z już istniejącą drogą). Naprawa jest czysto UI —
 * chip hover trybu budowy (`ghostChip`/`syncBuildGhostChipDom`/`setBuildGhostChip` w
 * `src/main.ts`) dostał opcjonalny drugi wiersz z powodem, wypełniany w
 * `handleBuildModeHover` WYŁĄCZNIE dla `activeImprovementKey === 'droga'` gdy heks nie
 * kwalifikuje się (`ok === false`).
 *
 * `main.ts` to monolit zbyt sczepiony z Three.js/canvas, by bootować go w całości pod
 * testem — więc (A) ekstrakcja źródła weryfikuje, że dokładny kod zmiany faktycznie żyje
 * w pliku (marker źródła + treść komunikatu), a (B) te SAME wyekstrahowane funkcje
 * (`syncBuildGhostChipDom`, `setBuildGhostChip`) są wykonywane W PRAWDZIWEJ Chromium na
 * prawdziwym DOM (nie jsdom — precedens `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1`), z tym
 * samym `ghostChip` markupem/CSS co w main.ts, żeby dowieść że tekst faktycznie się
 * renderuje, nie tylko że string istnieje w kodzie źródłowym.
 *
 * Opcjonalny zrzut: --shot <ścieżka.png>.
 * Usage (z gra/): node tools/drogi-tooltip-real-render-test.cjs [--shot out.png]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[drogi-tooltip-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA, 'src', 'main.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const REASON_TEXT = 'Droga musi łączyć się z miastem lub już istniejącą drogą';

const shotArgIdx = process.argv.indexOf('--shot');
const SHOT_PATH = shotArgIdx !== -1 ? process.argv[shotArgIdx + 1] : null;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function extractFn(src, signature) {
  const start = src.indexOf(signature);
  if (start === -1) return null;
  const end = src.indexOf('\n    }\n', start);
  if (end === -1) return null;
  return src.slice(start, end + '\n    }'.length);
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[drogi-tooltip-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');

  // (A) Kontrakt źródła.
  check('main.ts zawiera marker tematu P-DROGI-BUDOWA-WYJASNIENIE-TOOLTIP-Q1',
    src.includes('P-DROGI-BUDOWA-WYJASNIENIE-TOOLTIP-Q1'));
  check('main.ts zawiera treść wyjaśnienia reguły drogi (hover chip + fallback klik)',
    (src.match(new RegExp(REASON_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 2,
    { count: (src.match(new RegExp(REASON_TEXT, 'g')) || []).length });
  check('reason liczony WYŁĄCZNIE dla activeImprovementKey === \'droga\' (nie zmienia innych ulepszeń)',
    /activeImprovementKey === 'droga'\s*\)\s*\n\s*\?\s*'Droga musi/.test(src));
  check('isRoadQualified / warunek case \'droga\' NIE dotknięte (temat czysto UI)',
    !fs.readFileSync(path.join(GRA, 'src', 'map', 'improvement-build.ts'), 'utf8')
      .includes('P-DROGI-BUDOWA-WYJASNIENIE-TOOLTIP-Q1'));

  const syncFnSrcTs = extractFn(src, 'function syncBuildGhostChipDom(): void {');
  const setFnSrcTs = extractFn(src, 'function setBuildGhostChip(');
  check('syncBuildGhostChipDom() wyekstrahowana z main.ts', !!syncFnSrcTs);
  check('setBuildGhostChip() wyekstrahowana z main.ts', !!setFnSrcTs);
  if (!syncFnSrcTs || !setFnSrcTs) { process.exit(1); return; }

  // TS -> JS (usuwa adnotacje typów w sygnaturach), żeby dało się to wykonać jako
  // zwykły JS w przeglądarce — bez przepisywania logiki, esbuild tylko strip-typów.
  const syncFnSrc = esbuild.transformSync(syncFnSrcTs, { loader: 'ts' }).code;
  const setFnSrc = esbuild.transformSync(setFnSrcTs, { loader: 'ts' }).code;

  // (B) Realny DOM w Chromium — te SAME funkcje, ten sam markup `ghostChip`.
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.setContent(
    '<style>*{margin:0;padding:0;box-sizing:border-box;}'
    + 'html,body{width:100%;height:100%;background:#0a1020;}</style>'
    + '<div id="root"></div>',
  );

  // Harness: sam DOM chipu z main.ts (te same style/id) + wyekstrahowane funkcje,
  // wykonane jako prawdziwy JS w prawdziwej przeglądarce (nie reimplementacja ręczna).
  await page.evaluate(({ syncSrc, setSrc }) => {
    let ghostChipHex = null;
    let ghostChipLabel = '';
    let ghostChipValid = false;
    let ghostChipReason = '';
    let chipOverCanvas = true;
    let buildModeOpen = true;

    const ghostChip = document.createElement('div');
    ghostChip.id = 'civ-build-ghost-chip';
    ghostChip.style.cssText = [
      'position:fixed', 'z-index:400', 'display:none', 'pointer-events:none',
      'align-items:center', 'gap:6px', 'padding:6px 10px', 'border-radius:6px',
      'font:12px/1.2 Arial,sans-serif', 'color:#ffe8a0',
      'background:rgba(30,34,50,0.92)', 'border:1px solid rgba(255,212,121,0.75)',
      'box-shadow:0 4px 14px rgba(0,0,0,0.55)',
    ].join(';');
    document.documentElement.appendChild(ghostChip);

    function hexCenterClientPx() { return { x: 300, y: 260 }; }

    // eslint-disable-next-line no-eval
    const syncBuildGhostChipDom = eval('(' + syncSrc.replace('function syncBuildGhostChipDom', 'function') + ')');
    const setBuildGhostChip = eval('(' + setSrc.replace('function setBuildGhostChip', 'function') + ')');

    window.__chip = ghostChip;
    window.__setBuildGhostChip = setBuildGhostChip;
  }, { syncSrc: syncFnSrc, setSrc: setFnSrc });

  // Scenariusz ze zgłoszenia: droga, hex niekwalifikujący się.
  await page.evaluate(() => window.__setBuildGhostChip(4, 2, '🛤', false,
    'Droga musi łączyć się z miastem lub już istniejącą drogą'));
  const invalid = await page.evaluate(() => {
    const c = document.getElementById('civ-build-ghost-chip');
    const cs = getComputedStyle(c);
    return { display: cs.display, text: c.textContent, html: c.innerHTML };
  });
  check('chip widoczny (display=flex) na niekwalifikującym się heksie drogi', invalid.display === 'flex', invalid);
  check('chip pokazuje "Niedozwolone"', invalid.text.includes('Niedozwolone'), invalid.text);
  check('chip pokazuje PEŁNE wyjaśnienie reguły drogi', invalid.text.includes(REASON_TEXT), invalid.text);

  if (SHOT_PATH) {
    fs.mkdirSync(path.dirname(SHOT_PATH), { recursive: true });
    await page.screenshot({ path: SHOT_PATH });
    console.log('[drogi-tooltip-real-render-test] zrzut: ' + SHOT_PATH);
  }

  // Regresja: heks kwalifikujący się -> bez powodu, sam "Kliknij hex" (zachowanie sprzed tematu).
  await page.evaluate(() => window.__setBuildGhostChip(5, 3, '🛤', true, ''));
  const valid = await page.evaluate(() => document.getElementById('civ-build-ghost-chip').textContent);
  check('chip na kwalifikującym się heksie: "Kliknij hex", bez tekstu powodu', valid.includes('Kliknij hex') && !valid.includes('Droga musi'), valid);

  // Regresja: inne ulepszenie (nie droga), niedozwolone, bez reason -> sam "Niedozwolone" (stare zachowanie).
  await page.evaluate(() => window.__setBuildGhostChip(6, 1, '🌾', false, ''));
  const otherInvalid = await page.evaluate(() => document.getElementById('civ-build-ghost-chip').textContent);
  check('chip dla INNEGO ulepszenia (nie droga), niedozwolone: sam "Niedozwolone", bez wyjaśnienia drogi',
    otherInvalid.includes('Niedozwolone') && !otherInvalid.includes('Droga musi'), otherInvalid);

  check('brak błędów konsoli/pageerror', consoleErrors.length === 0, consoleErrors);

  await browser.close();

  console.log('');
  console.log(`[drogi-tooltip-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
