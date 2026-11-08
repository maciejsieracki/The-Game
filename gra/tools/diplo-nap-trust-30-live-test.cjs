'use strict';
/**
 * diplo-nap-trust-30-live-test.cjs — R-WEB-DIPLO-NAP-TRUST-30-Q1: dowód w realnym renderze.
 *
 * Realny headless Chromium na prawdziwym bundle Vite (?playtest=mapa). Bundle buduje się
 * do katalogu tymczasowego PODANEGO w argumencie (poza repo); `SKIP_BUILD=1` pomija build.
 *
 *  V1. Relacja 139 (≥ 110) + Zaufanie 29 → w panelu audiencji AI przycisk „Pakt o nieagresji"
 *      (data-aid="2") jest zablokowany, notka zawiera „wymaga Zaufania 30 (masz 29)".
 *  V2. Zaufanie 30 + ta sama Relacja → przycisk dostępny (brak blokady, brak notki Zaufania).
 *  V3. Zrzuty ekranu panelu audiencji (PRZED/PO) zapisane do katalogu dowodów runu.
 *  C.  Zero pageerror / console.error w scenariuszu.
 *
 * Usage (z gra/):
 *   node ./node_modules/vite/bin/vite.js build --outDir <scratchAbs> --emptyOutDir
 *   SKIP_BUILD=1 node tools/diplo-nap-trust-30-live-test.cjs <scratchAbs> [evidenceAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-nap-trust-live-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-DIPLO-NAP-TRUST-30-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYER = 0;
const AI = 1;
const NAP_AID = '2';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) {
    console.log('[nap-trust-live] SKIP_BUILD=1 — używam istniejącego bundle:', SCRATCH);
    return;
  }
  console.log('[nap-trust-live] vite build do katalogu tymczasowego:', SCRATCH);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

/** Odczyt przycisku paktu w panelu audiencji AI (ten sam render co gracz widzi). */
async function readNapButton(page) {
  return page.evaluate((aid) => {
    const b = document.querySelector('.civ-diplo-aud button[data-aid="' + aid + '"]');
    if (!b) return null;
    const note = b.querySelector('.da-note');
    return {
      disabled: b.hasAttribute('disabled'),
      label: (b.querySelector('.da-nm') || {}).textContent || '',
      note: note ? note.textContent : '',
      title: b.getAttribute('title') || '',
    };
  }, NAP_AID);
}

async function openAudienceFresh(page) {
  await page.evaluate((ai) => {
    window.__truceTestDebug.closeAudience();
    window.__truceTestDebug.openAudience(ai);
  }, AI);
  await page.waitForSelector('.civ-diplo-aud', { timeout: 30000 });
  await wait(400);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[nap-trust-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());

    // V1: Relacja 139 (zaufanie 29 + respekt 110), Zaufanie 29 < 30 → zablokowany.
    console.log('V1 UI: Zaufanie 29, Relacja OK → pakt zablokowany');
    // SETUP: słabsza AI (bonus mocy −1e6 → respekt obiektywny gracza ~100), żeby Relacja (zaufanie + respekt) przekraczała 110.
    await page.evaluate(([ai]) => window.__peaceRulesTestDebug.setAiPowerBonusForTest(ai, -1000000), [AI]);
    await page.evaluate(([ai]) => window.__peaceRulesTestDebug.setRelationForBrake(ai, 29, 200), [AI]);
    console.log('      relationTotal po ustawieniu:', await page.evaluate(([ai]) => window.__peaceRulesTestDebug.getRelationTotal(ai), [AI]));
    await openAudienceFresh(page);
    const v1 = await readNapButton(page);
    console.log('      przycisk:', JSON.stringify(v1));
    assert('V1a przycisk „Pakt o nieagresji" istnieje', v1 !== null);
    assert('V1b przycisk zablokowany (disabled)', !!v1 && v1.disabled === true, v1);
    assert('V1c notka wymienia „wymaga Zaufania 30 (masz 29)"',
      !!v1 && /Zaufania 30/.test(v1.note + ' ' + v1.title) && /masz 29/.test(v1.note + ' ' + v1.title), v1);
    await page.locator('.civ-diplo-aud').screenshot({
      path: path.join(EVIDENCE, '01-pakt-zaufanie-29-zablokowany.png'),
    });

    // V2: Zaufanie 30 → dostępny.
    console.log('V2 UI: Zaufanie 30, Relacja OK → pakt dostępny');
    await page.evaluate(([ai]) => window.__peaceRulesTestDebug.setRelationForBrake(ai, 30, 200), [AI]);
    console.log('      relationTotal po ustawieniu:', await page.evaluate(([ai]) => window.__peaceRulesTestDebug.getRelationTotal(ai), [AI]));
    await openAudienceFresh(page);
    const v2 = await readNapButton(page);
    console.log('      przycisk:', JSON.stringify(v2));
    assert('V2a przycisk paktu nie jest zablokowany', !!v2 && v2.disabled === false, v2);
    assert('V2b brak notki o wymaganym Zaufaniu 30', !!v2 && !/Zaufania 30/.test(v2.note + ' ' + v2.title), v2);
    await page.locator('.civ-diplo-aud').screenshot({
      path: path.join(EVIDENCE, '02-pakt-zaufanie-30-dostepny.png'),
    });
  } finally {
    await browser.close();
  }

  assert('C. zero pageerror / console.error', errors.length === 0, errors.slice(0, 5));
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('[nap-trust-live] wyjątek:', e && e.stack || e); process.exit(1); });
