'use strict';
/**
 * diplo-aggressor-ui-live-test.cjs — R-WEB-WAR-AGGRESSOR-FLAG-Q1 (live Chromium, znacznik UI).
 *
 * Realny headless Chromium na bundle Vite zbudowanym do katalogu tymczasowego poza repo
 * (`vite build --outDir`, bez `npm run build`). Scenariusz:
 *  T1. AI 1 wypowiada wojnę graczowi 0 BEZ casus belli (realne ownerDeclareWarOn):
 *      flaga agresora 1 aktywna do tury T+20; w panelu dyplomacji wiersz AI 1 ma znacznik „Agresor"
 *      z tooltipem „Wypowiedział wojnę bez powodu (do tury N)".
 *  T2. AI 2 dostaje casus belli wobec gracza (odmowa trybutu/ultimatum: zarejestrujCasusBelli 2>0),
 *      potem wypowiada wojnę: BRAK flagi i BRAK znacznika w wierszu AI 2.
 *  C.  Zero pageerror w całym scenariuszu.
 *
 * Zrzut: <evidenceDir>/aggressor-panel.png
 * Usage (z gra/): node tools/diplo-aggressor-ui-live-test.cjs [scratchDirAbs] [evidenceDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-aggressor-live-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-WAR-AGGRESSOR-FLAG-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYER = 0;
const AI_A = 1;
const AI_B = 2;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  console.log('[aggressor-live] vite build do katalogu tymczasowego:', SCRATCH);
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
    () => !!window.__aggressorTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[aggressor-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
    await gotoPlaytestMapa(page);

    console.log('[T1] wojna AI1 -> gracz bez casus belli (realne ownerDeclareWarOn)');
    await page.evaluate(([a, p]) => {
      window.__aggressorTestDebug.contact(a);
      window.__aggressorTestDebug.declareWar(a, p);
    }, [AI_A, PLAYER]);
    const s1 = await page.evaluate(() => window.__aggressorTestDebug.state());
    assert('T1: flaga agresora AI1 zapisana', s1.flags[String(AI_A)] === s1.turn + 20, s1);
    await page.evaluate(() => window.__aggressorTestDebug.openPanel());
    await wait(400);
    const badge1 = await page.locator(`.civ-diplo [data-owner="${AI_A}"] .cd-agresor`);
    assert('T1: znacznik „Agresor" w wierszu AI1', (await badge1.count()) === 1);
    const title1 = (await badge1.count()) === 1 ? await badge1.first().getAttribute('title') : null;
    assert('T1: tooltip „do tury N" zgodny z flagą', title1 === `Wypowiedział wojnę bez powodu (do tury ${s1.turn + 20})`, title1);
    const panel = page.locator('.civ-diplo').first();
    await panel.screenshot({ path: path.join(EVIDENCE, 'aggressor-panel.png') });

    console.log('[T2] casus belli po odmowie -> wojna AI2 bez flagi');
    await page.evaluate(([b, p]) => {
      window.__aggressorTestDebug.contact(b);
      window.__aggressorTestDebug.refusalCasusBelli(b, p);
      window.__aggressorTestDebug.declareWar(b, p);
    }, [AI_B, PLAYER]);
    const s2 = await page.evaluate(() => window.__aggressorTestDebug.state());
    assert('T2: AI2 ma casus belli wobec gracza', s2.casus[`${AI_B}>${PLAYER}`] === s2.turn + 15, s2);
    assert('T2: AI2 wojna z casus belli — brak flagi agresora', s2.flags[String(AI_B)] === undefined, s2);
    await page.evaluate(() => window.__aggressorTestDebug.openPanel());
    await wait(300);
    assert('T2: brak znacznika w wierszu AI2', (await page.locator(`.civ-diplo [data-owner="${AI_B}"] .cd-agresor`).count()) === 0);

    assert('C: zero pageerror/console.error', errors.length === 0, errors.slice(0, 5));
  } finally {
    await browser.close();
  }
  console.log(`aggressor-ui-live-test: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('[aggressor-live] FAIL:', e && e.stack ? e.stack : e); process.exit(1); });
