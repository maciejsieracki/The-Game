'use strict';
/**
 * citizen-ceramics-panel-shot.cjs -- ZRZUT PANELU IMPERIUM (nie bramka), R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1
 * kryterium (e): panel pokrycia surowcow obywateli w epoce 1 (Kamien) -- stan Z ceramika i stan BEZ ceramiki.
 *
 * Zero zmian w repo: kopiuje zrodla `gra/` do katalogu SCRATCH poza repo, wstawia do KOPII main.ts
 * hak (showPanel / hidePanel / zeroCeramika) i buduje vite. Steruje headless Chromium.
 *
 *   node tools/citizen-ceramics-panel-shot.cjs run <scratchDir> <evidenceDir> <seed>
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MARKER = '(window as any).__cityForestTestDebug = {';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function startGameSource() {
  const t = fs.readFileSync(path.join(__dirname, 'clearing-deficit-live-measure.cjs'), 'utf8');
  const a = t.indexOf('        startGame: (seed');
  const b = t.indexOf('        world: () => ({');
  if (a < 0 || b < 0) throw new Error('nie znaleziono startGame');
  return t.slice(a, b);
}

function hookSource() {
  return String.raw`
    (window as any).__ccPanel = (() => {
      return {
` + startGameSource() + String.raw`
        world: () => ({ turn, awaiting: isAwaitingFirstPlayerCity(), startHex: playerStartHex ? { q: playerStartHex.q, r: playerStartHex.r } : null }),
        found: (q: number, r: number): boolean => tryFoundPlayerCityAt(q, r),
        setEraAll: (era: number) => {
          (window as any).__ccForceEra = era;
          player.era = era;
          const ps: any = playerStateByHuman.get(0); if (ps) ps.era = era;
          for (const k of Array.from(ownerEraByOwner.keys())) ownerEraByOwner.set(k, era);
          return empireEpochForOwner(0);
        },
        fixture: (pop: number, level: number, stockEach: number) => {
          const mine = cities.filter(c => c.ownerId === 0);
          for (const c of mine) { c.population = pop; (c as any).poziomRacji = level; (c as any).autoWyzywienie = false; }
          for (const k of ['drewno', 'glina', 'kamien', 'ceramika', 'cegla']) creditOwnerResourceStock(cities, 0, k, stockEach, 1_000_000);
          const st = empireFoodStates.get(0) ?? freshEmpireFoodState(); st.zapasyPanstwa = 1_000_000; empireFoodStates.set(0, st); _maxSafeRationCache.clear();
          markCityStateDirty();
          return ownerResourceStockAll(cities, 0);
        },
        zeroCeramika: (): number => {
          const n = (ownerResourceStockAll(cities, 0) as any).ceramika || 0;
          deductBuildingStockCostAcrossCities(cities, 0, { ceramika: n });
          markCityStateDirty();
          return n;
        },
        showPanel: (s?: string): boolean => { showEmpireDetailPanel(s); return true; },
        hidePanel: (): boolean => { hideEmpireDetailPanel(); return true; },
      };
    })();
`;
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d); else fs.copyFileSync(s, d);
  }
}

function build(scratch) {
  const g = path.join(scratch, 'gra');
  fs.rmSync(scratch, { recursive: true, force: true });
  fs.mkdirSync(g, { recursive: true });
  copyTree(path.join(GRA_DIR, 'src'), path.join(g, 'src'));
  copyTree(path.join(GRA_DIR, 'data'), path.join(g, 'data'));
  for (const f of ['index.html', 'tsconfig.json', 'vite.config.ts', 'package.json']) fs.copyFileSync(path.join(GRA_DIR, f), path.join(g, f));
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(g, 'node_modules'), 'dir');
  const mainPath = path.join(g, 'src', 'main.ts');
  let txt = fs.readFileSync(mainPath, 'utf8');
  if (txt.split(MARKER).length !== 2) throw new Error('kotwica MARKER nie jest unikalna');
  const idx = txt.indexOf(MARKER);
  const lineStart = txt.lastIndexOf('\n', idx) + 1;
  txt = txt.slice(0, lineStart) + hookSource() + txt.slice(lineStart);
  fs.writeFileSync(mainPath, txt, 'utf8');
  const out = path.join(scratch, 'dist');
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(out)} --emptyOutDir`, { cwd: g, stdio: 'pipe', maxBuffer: 1 << 28 });
  console.log('BUILD_OK ' + path.join(out, 'index.html'));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(chromium) {
  try { return await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] }); }
  catch (e) { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); }
}

async function main(scratch, evidence, seed) {
  fs.mkdirSync(evidence, { recursive: true });
  const { chromium } = require('playwright');
  const browser = await launch(chromium);
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto('file://' + path.join(scratch, 'dist', 'index.html'), { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!(window).__ccPanel, undefined, { timeout: 120000 });
    await page.waitForSelector('.civ-menu', { timeout: 120000 });
    await page.evaluate((s) => window.__ccPanel.startGame(s, 'kontynenty', 3, 4), seed);
    const t0 = Date.now();
    while (Date.now() - t0 < 300000) {
      const w = await page.evaluate(() => window.__ccPanel.world());
      const overlay = await page.evaluate(() => Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null));
      if (!overlay && w.awaiting && w.startHex) break;
      await wait(500);
    }
    const ok = await page.evaluate(() => { const w = window.__ccPanel.world(); return window.__ccPanel.found(w.startHex.q, w.startHex.r); });
    if (!ok) throw new Error('found false');
    await wait(800);
    const era = await page.evaluate(() => window.__ccPanel.setEraAll(1));
    const stockA = await page.evaluate(() => window.__ccPanel.fixture(20, 4, 5000));
    await page.evaluate(() => window.__ccPanel.showPanel());
    await wait(800);
    const grab = async (label) => {
      const texts = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => !['SCRIPT', 'STYLE'].includes(el.tagName) && el.children.length === 0 && el.offsetParent !== null && el.textContent && el.textContent.length < 160 && /bywatel|eramik/i.test(el.textContent)).map(el => el.textContent.trim()).slice(0, 60));
      const cnt = await page.locator('text=/Obywatele:/').count();
      if (cnt > 0) await page.locator('text=/Obywatele:/').first().scrollIntoViewIfNeeded();
      await wait(300);
      const file = path.join(evidence, `panel-kamien-${label}-seed${seed}.png`);
      await page.screenshot({ path: file, fullPage: false });
      return { file, texts, obywatelCount: cnt };
    };
    const withC = await grab('z-ceramika');
    const removed = await page.evaluate(() => window.__ccPanel.zeroCeramika());
    await page.evaluate(() => window.__ccPanel.showPanel());
    await wait(800);
    const noC = await grab('bez-ceramiki');
    const result = { seed, era, stockBeforeZero: { ceramika: stockA.ceramika }, removedCeramika: removed, withCeramika: withC, withoutCeramika: noC, errors: errors.slice(0, 5) };
    const file = path.join(evidence, `panel-kamien-seed${seed}.json`);
    fs.writeFileSync(file, JSON.stringify(result, null, 1));
    console.log('RESULT_FILE=' + file);
    console.log(JSON.stringify({ era, removed, obywatelZ: withC.obywatelCount, obywatelBez: noC.obywatelCount, errors: result.errors }));
  } finally { await browser.close(); }
}

(async () => {
  const [cmd, scratch, evidence, seed] = process.argv.slice(2);
  if (cmd === 'run') { build(scratch); await main(scratch, evidence, Number(seed || 7)); }
  else { console.error('uzycie: run <scratchDir> <evidenceDir> <seed>'); process.exit(2); }
})().catch((e) => { console.error(e); process.exit(1); });
