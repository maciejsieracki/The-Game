'use strict';
/**
 * map-controls-behind-panels-live-test.cjs — R-WEB-UI-TOOLBAR-ZOOM-BEHIND-EXPANDED-PANELS-Q1.
 * Żywy Chromium (Vite build + file://): otwiera panele rozwijane i dla każdej kontrolki mapy
 * (toolbar ikon, zoom/pełny ekran, minimapa) zachodzącej na panel sprawdza elementFromPoint:
 * pod punktem musi być PANEL, nie kontrolka; po zamknięciu — kontrolka na wierzchu.
 * Run (z gra/): node tools/map-controls-behind-panels-live-test.cjs [--shots <dir>] [--width 860] [--out <prebuilt>]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const SHOTS = arg('--shots', '');
const WIDTH = Number(arg('--width', '860'));
const PREBUILT = arg('--out', '');
const OUT_DIR = PREBUILT || path.join(os.tmpdir(), `civ-mapctl-${process.pid}`);
process.on('exit', () => { if (!PREBUILT) { try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* best-effort */ } } });
const log = (m) => console.log('[map-controls-behind-panels] ' + m);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const CONTROLS = [
  { name: 'toolbar-ikony', sel: '.civ-map-toolbar .tb' },
  { name: 'zoom-dock', sel: '.civ-hud-util-dock .b-zoom, .civ-hud-util-dock .civ-hud-zoom-pct, .civ-hud-util-dock .b-util-toggle' },
  { name: 'minimapa', sel: '.civ-minimap-wrap .civ-minimap-hud, .civ-minimap-wrap .civ-minimap-tools button' },
];
const PANELS = [
  { name: 'dyplomacja', open: "document.querySelector('.civ-map-toolbar [data-act=diplo]')?.click()", root: '.civ-diplo-list-hud' },
  { name: 'miasta', open: "document.querySelector('.civ-map-toolbar [data-act=cities]')?.click()", root: '.civ-side-list-hud' },
  { name: 'nauka', open: "document.querySelector('.civ-map-toolbar [data-act=science]')?.click()", root: '.civ-science-hub-hud' },
  { name: 'armia', open: "document.querySelector('.civ-map-toolbar [data-act=army]')?.click()", root: '.civ-side-list-hud' },
  { name: 'budowa', open: "document.querySelector('.civ-map-toolbar [data-act=build]')?.click()", root: '.civ-build-panel' },
  { name: 'civpedia', open: "document.querySelector('.civ-hud [data-act=wiki]')?.click()", root: '.civ-wiki-hub' },
  { name: 'imperium', open: "document.querySelector('.civ-hud [data-act=power]')?.click()", root: '.civ-emp-panel, .civ-emp-ov, .civ-pow-ov' },
  { name: 'rekrutacja-imperium', open: "document.querySelector('.civ-hud [data-act=empire-recruit]')?.click()", root: '#civ-empire-recruit-panel' },
];

async function launch(chromium) {
  try { return await chromium.launch({ headless: true }); } catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}

const MEASURE = ({ controls, rootSel }) => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 2 && r.height > 2 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const roots = Array.from(document.querySelectorAll(rootSel)).filter(vis);
  const out = { panelOpen: roots.length > 0, rows: [] };
  for (const c of controls) {
    for (const el of Array.from(document.querySelectorAll(c.sel)).filter(vis)) {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2; const y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      const inPanel = roots.some((p) => { const pr = p.getBoundingClientRect(); return x >= pr.left && x <= pr.right && y >= pr.top && y <= pr.bottom; });
      out.rows.push({
        control: c.name, label: String(el.dataset.act || el.className || '').slice(0, 30), overlaps: inPanel,
        topIsControl: !!top && (el === top || el.contains(top)), topIsPanel: !!top && roots.some((p) => p.contains(top)),
      });
    }
  }
  return out;
};

(async () => {
  if (!PREBUILT) {
    log('vite build...');
    execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe', maxBuffer: 1 << 28 });
  }
  const { chromium } = require('playwright');
  const browser = await launch(chromium);
  const failures = []; const table = [];
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: 700 } });
    const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto('file://' + path.join(OUT_DIR, 'index.html') + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2));
    const t0 = Date.now();
    for (;;) {
      const st = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
      if (st.awaitingFirstPlayerCity) break;
      if (Date.now() - t0 > 300000) throw new Error('timeout generowania świata');
      await wait(500);
    }
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
    await wait(800);
    await page.waitForSelector('.civ-map-toolbar', { timeout: 30000 });
    await page.waitForFunction(() => { const o = document.querySelector('.civ-map-load-overlay'); return !o || getComputedStyle(o).display === 'none' || o.getBoundingClientRect().width < 2; }, undefined, { timeout: 240000 });
    await wait(500);
    const base = await page.evaluate(MEASURE, { controls: CONTROLS, rootSel: '.__none__' });
    const cnt = {}; base.rows.forEach((r) => { cnt[r.control] = (cnt[r.control] || 0) + 1; });
    for (const c of CONTROLS) if (!cnt[c.name]) failures.push(`kontrolka '${c.name}' nie znaleziona w DOM`);
    log('kontrolki: ' + JSON.stringify(cnt));
    for (const p of PANELS) {
      await page.evaluate(p.open); await wait(500);
      const m = await page.evaluate(MEASURE, { controls: CONTROLS, rootSel: p.root });
      if (!m.panelOpen) { table.push(`${p.name} | - | panel się nie otworzył (N/A)`); await page.keyboard.press('Escape'); await wait(200); continue; }
      const overl = m.rows.filter((r) => r.overlaps);
      for (const c of CONTROLS) {
        const rs = overl.filter((r) => r.control === c.name);
        if (!rs.length) { table.push(`${p.name} | ${c.name} | brak nakładania`); continue; }
        const bad = rs.filter((r) => !r.topIsPanel || r.topIsControl);
        table.push(`${p.name} | ${c.name} | nakłada się ${rs.length}, panel pod punktem ${rs.length - bad.length}/${rs.length} -> ${bad.length ? 'FAIL' : 'OK'}`);
        if (bad.length) failures.push(`${p.name}: ${c.name} nad panelem (${bad.map((b) => b.label).join(',')})`);
      }
      if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, p.name + '.png') }); }
      await page.keyboard.press('Escape'); await wait(250);
      let still = await page.evaluate(MEASURE, { controls: [], rootSel: p.root });
      if (still.panelOpen) { await page.evaluate(p.open); await wait(350); still = await page.evaluate(MEASURE, { controls: [], rootSel: p.root }); }
      if (!still.panelOpen) {
        const after = await page.evaluate(MEASURE, { controls: CONTROLS, rootSel: '.__none__' });
        const notCtl = after.rows.filter((r) => !r.topIsControl);
        if (notCtl.length) failures.push(`${p.name}: po zamknięciu kontrolki nie na wierzchu (${notCtl.map((b) => b.label).join(',')})`);
      }
    }
    if (errs.length) log('pageerror: ' + errs.slice(0, 3).join(' | '));
  } finally { await browser.close().catch(() => {}); }
  console.log('\npanel | kontrolka | wynik\n' + table.join('\n'));
  if (!table.some((t) => /nakłada się/.test(t))) failures.push('żaden panel nie nakładał się na kontrolki — test nic nie dowodzi (zmień --width)');
  if (failures.length) { console.log('\nFAIL:\n - ' + failures.join('\n - ')); process.exit(1); }
  console.log('\nPASS');
})().catch((e) => { console.error(e); process.exit(2); });
