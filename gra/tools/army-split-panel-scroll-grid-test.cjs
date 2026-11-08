'use strict';
/**
 * army-split-panel-scroll-grid-test.cjs
 *
 * TEMAT: R-WEB-ARMY-SPLIT-PANEL-SCROLL-GRID-BRAND-Q1
 *
 * Prawdziwy render panelu „Rozdziel armię" w Chromium (>= 40 jednostek).
 * Buduje DWA pakiety: PRZED (git show HEAD~ lub ARMY_SPLIT_PRE_REF, domyslnie
 * origin/main) i PO (aktualny plik). Scenariusze:
 *  1. klik jednostki na dole listy NIE zmienia scrollTop (PRZED: wraca do 0),
 *  2. siatka 3 kolumny x 5 widocznych rzedow na 1280 px,
 *  3. 2 kolumny na 500/360 px, 1 kolumna na 340 px, brak poziomego przewijania na 360 px,
 *  4. klawiatura: strzalki (±1, ±kolumny) i spacja zaznacza,
 *  5. logika podzialu bez zmian: te same wyniki PRZED i PO (zaznaczenia/odmowy/cel),
 *  6. zrzuty PRZED/PO (1280 i 360) -> dowody/ (<= 1 MB).
 * Uzycie: node tools/army-split-panel-scroll-grid-test.cjs [--pre-only|--post-only] [--shots <dir>]
 * Kod wyjscia != 0 gdy PO nie przechodzi. PRZED ma byc CZERWONE (raport: RED-PRE).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const UI_DIR = path.resolve(GRA, 'src', 'ui');
const PANEL_REL = 'gra/src/ui/armySplitPanel.ts';
const PRE_REF = process.env.ARMY_SPLIT_PRE_REF || 'origin/main';
const TMP = fs.mkdtempSync(path.join(process.env.ARMY_SPLIT_TMP || os.tmpdir(), 'army-split-grid-'));
const args = process.argv.slice(2);
const shotsDir = args.includes('--shots') ? path.resolve(args[args.indexOf('--shots') + 1]) : null;
const only = args.includes('--pre-only') ? 'pre' : args.includes('--post-only') ? 'post' : null;

const BRAND_STUB = path.join(TMP, 'brandAssets-stub.ts');
fs.writeFileSync(BRAND_STUB, 'export function unitIconSvg(){return \'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>\';}\n');

async function bundle(source, outName) {
  const out = path.join(TMP, outName);
  await esbuild.build({
    stdin: {
      contents: source + '\n;(window).__asp = { showArmySplitPanel, hideArmySplitPanel, isArmySplitPanelOpen };\n',
      resolveDir: UI_DIR, sourcefile: 'armySplitPanel.ts', loader: 'ts',
    },
    bundle: true, format: 'iife', platform: 'browser', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'stub', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); } }],
  });
  return fs.readFileSync(out, 'utf8');
}

let pass = 0; let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); } else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const N = 45;
const UNITS = Array.from({ length: N }, (_, i) => ({ id: 'u' + i, name: 'Wojownik ' + (i + 1), icon: '' }));
const DESTS = [{ q: 1, r: 2, label: '(1,2)' }, { q: 3, r: 4, label: 'W mieście (ten heks)' }];

async function open(page, label) {
  await page.evaluate(({ units, dests }) => {
    window.__calls = { split: [], cancel: 0 };
    window.__asp.showArmySplitPanel({
      hexLabel: '(153,49)', units, destHexes: dests,
      onSplit: (ids, q, r) => window.__calls.split.push({ ids, q, r }),
      onCancel: () => { window.__calls.cancel++; },
    });
  }, { units: UNITS, dests: DESTS });
}

const LIST = '.civ-asp-units';
const SELECTED_JS = () => [...document.querySelectorAll('[data-uid]')].filter(i => i.checked).map(i => i.getAttribute('data-uid'));

async function runSuite(browser, label, js) {
  const res = {};
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><html><body style="margin:0;background:#080a12"></body></html>');
  await page.addScriptTag({ content: js });

  // 1. scroll
  await open(page, label);
  await page.evaluate((sel) => { const l = document.querySelector(sel); l.scrollTop = l.scrollHeight; }, LIST);
  const before = await page.evaluate((sel) => document.querySelector(sel).scrollTop, LIST);
  await page.locator('[data-uid="u41"]').locator('xpath=..').click();
  const after = await page.evaluate((sel) => document.querySelector(sel).scrollTop, LIST);
  res.scroll = { before, after };
  res.selectedAfterClick = await page.evaluate(SELECTED_JS);
  // drugi klik (odznaczenie) tez nie resetuje
  await page.locator('[data-uid="u41"]').locator('xpath=..').click();
  res.scrollAfterSecond = await page.evaluate((sel) => document.querySelector(sel).scrollTop, LIST);

  // 2. siatka 1280
  await page.evaluate((sel) => { document.querySelector(sel).scrollTop = 0; }, LIST);
  res.grid1280 = await page.evaluate((sel) => {
    const l = document.querySelector(sel); const lr = l.getBoundingClientRect();
    const cols = getComputedStyle(l).gridTemplateColumns.split(' ').length;
    const tiles = [...l.querySelectorAll('.civ-asp-u')];
    const full = tiles.filter(t => { const r = t.getBoundingClientRect(); return r.top >= lr.top - 0.5 && r.bottom <= lr.bottom + 0.5; });
    const tops = new Set(full.map(t => Math.round(t.getBoundingClientRect().top)));
    const lefts = new Set(full.map(t => Math.round(t.getBoundingClientRect().left)));
    return { cols, fullVisible: full.length, rows: tops.size, distinctLefts: lefts.size, scrollable: l.scrollHeight > l.clientHeight + 1 };
  }, LIST);
  if (shotsDir) { fs.mkdirSync(shotsDir, { recursive: true }); await page.screenshot({ path: path.join(shotsDir, label + '-1280.png') }); }

  // 4. klawiatura
  await page.evaluate(() => document.querySelector('[data-uid="u0"]').focus());
  const idxOf = () => page.evaluate(() => [...document.querySelectorAll('[data-uid]')].indexOf(document.activeElement));
  await page.keyboard.press('ArrowRight'); const k1 = await idxOf();
  await page.keyboard.press('ArrowDown'); const k2 = await idxOf();
  await page.keyboard.press('ArrowLeft'); const k3 = await idxOf();
  await page.keyboard.press('ArrowUp'); const k4 = await idxOf();
  await page.keyboard.press('End'); const k5 = await idxOf();
  await page.keyboard.press('Home'); const k6 = await idxOf();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  const selBefore = await page.evaluate(SELECTED_JS);
  await page.keyboard.press('Space');
  const selAfter = await page.evaluate(SELECTED_JS);
  res.kb = { k1, k2, k3, k4, k5, k6, toggled: selAfter.filter(x => !selBefore.includes(x)) };
  res.tabStops = await page.evaluate(() => [...document.querySelectorAll('[data-uid]')].filter(i => i.tabIndex === 0).length);
  await open(page, label); // swiezy panel: logika nie zalezy od krokow klawiaturowych

  // 5. logika (parytet PRE/POST)
  const logic = {};
  const clickGo = async () => { await page.locator('[data-go]').click({ force: true }); return page.evaluate(() => JSON.stringify(window.__calls.split)); };
  const selectOnly = async (ids) => {
    const cur = await page.evaluate(SELECTED_JS);
    for (const id of cur) if (!ids.includes(id)) await page.locator('[data-uid="' + id + '"]').locator('xpath=..').click();
    for (const id of ids) if (!cur.includes(id)) await page.locator('[data-uid="' + id + '"]').locator('xpath=..').click();
  };
  logic.initial = await page.evaluate(SELECTED_JS);
  await selectOnly([]); logic.noneGo = await clickGo();
  await selectOnly(UNITS.map(u => u.id)); logic.allGo = await clickGo();
  await selectOnly(['u3', 'u7', 'u40']);
  await page.locator('[data-dq="3"]').click();
  logic.openAfterBlocked = await page.evaluate(() => window.__asp.isArmySplitPanelOpen());
  logic.goOk = await clickGo();
  logic.closedAfterSplit = !(await page.evaluate(() => window.__asp.isArmySplitPanelOpen()));
  await open(page, label);
  await page.locator('[data-cancel]').click();
  logic.cancelCalls = await page.evaluate(() => window.__calls.cancel);
  res.logic = logic;
  await page.evaluate(() => window.__asp.hideArmySplitPanel());
  await ctx.close();

  // 3. wasko
  res.narrow = {};
  for (const w of [500, 360, 340]) {
    const c2 = await browser.newContext({ viewport: { width: w, height: 640 } });
    const p2 = await c2.newPage();
    await p2.setContent('<!doctype html><html><body style="margin:0;background:#080a12"></body></html>');
    await p2.addScriptTag({ content: js });
    await open(p2, label);
    res.narrow[w] = await p2.evaluate((sel) => {
      const l = document.querySelector(sel); const b = document.querySelector('.civ-asp').getBoundingClientRect();
      return {
        cols: getComputedStyle(l).gridTemplateColumns.split(' ').length,
        docOverflowX: document.documentElement.scrollWidth > window.innerWidth,
        listOverflowX: l.scrollWidth > l.clientWidth + 1,
        panelInside: b.left >= -0.5 && b.right <= window.innerWidth + 0.5,
      };
    }, LIST);
    if (shotsDir && w === 360) await p2.screenshot({ path: path.join(shotsDir, label + '-360.png') });
    await c2.close();
  }
  return res;
}

(async () => {
  const postSrc = fs.readFileSync(path.join(UI_DIR, 'armySplitPanel.ts'), 'utf8');
  const preSrc = execFileSync('git', ['show', PRE_REF + ':' + PANEL_REL], { encoding: 'utf8', maxBuffer: 1 << 24 });
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] }).catch(() => chromium.launch({ headless: true }));
  const out = {};
  if (only !== 'post') out.pre = await runSuite(browser, 'PRZED', await bundle(preSrc, 'pre.js'));
  if (only !== 'pre') out.post = await runSuite(browser, 'PO', await bundle(postSrc, 'post.js'));
  await browser.close();

  const verdict = (r, tag) => {
    check(tag + ': klik na dole listy nie zmienia scrollTop', r.scroll.before > 0 && r.scroll.after === r.scroll.before, r.scroll);
    check(tag + ': odznaczenie tez nie resetuje scrollTop', r.scrollAfterSecond === r.scroll.before, r.scrollAfterSecond);
    check(tag + ': klik zaznaczyl jednostke', r.selectedAfterClick.includes('u41'), r.selectedAfterClick);
    check(tag + ': siatka 3 kolumny na 1280', r.grid1280.cols === 3 && r.grid1280.distinctLefts === 3, r.grid1280);
    check(tag + ': 5 widocznych rzedow (15 kafli) i dalej przewijanie', r.grid1280.rows === 5 && r.grid1280.fullVisible === 15 && r.grid1280.scrollable, r.grid1280);
    check(tag + ': 2 kolumny na 500 i 360 px', r.narrow[500].cols === 2 && r.narrow[360].cols === 2, [r.narrow[500], r.narrow[360]]);
    check(tag + ': 1 kolumna na 340 px', r.narrow[340].cols === 1, r.narrow[340]);
    check(tag + ': brak poziomego przewijania na 360 px', !r.narrow[360].docOverflowX && !r.narrow[360].listOverflowX && r.narrow[360].panelInside, r.narrow[360]);
    check(tag + ': strzalki ±1/±kolumny/Home/End', r.kb.k1 === 1 && r.kb.k2 === 4 && r.kb.k3 === 3 && r.kb.k4 === 0 && r.kb.k5 === N - 1 && r.kb.k6 === 0, r.kb);
    check(tag + ': spacja zaznacza fokusowana jednostke', r.kb.toggled.length === 1 && r.kb.toggled[0] === 'u2', r.kb);
    check(tag + ': roving tabindex (1 punkt tab w siatce)', r.tabStops === 1, r.tabStops);
  };
  if (out.post) verdict(out.post, 'PO');
  if (out.pre) {
    const r = out.pre;
    // PRZED musi byc czerwone na scrollu (dowod nietautologicznosci).
    check('PRZED: scrollTop wraca do 0 po kliku (RED-PRE)', r.scroll.before > 0 && r.scroll.after === 0, r.scroll);
    check('PRZED: brak siatki 3x5 (RED-PRE)', !(r.grid1280.cols === 3 && r.grid1280.rows === 5), r.grid1280);
  }
  if (out.pre && out.post) {
    check('logika podzialu identyczna PRZED i PO', JSON.stringify(out.pre.logic) === JSON.stringify(out.post.logic), { pre: out.pre.logic, post: out.post.logic });
  }
  if (out.post) {
    const L = out.post.logic;
    check('logika: domyslnie zaznaczona ostatnia jednostka', JSON.stringify(L.initial) === JSON.stringify(['u44']), L.initial);
    check('logika: 0 zaznaczonych i wszystkie zaznaczone -> brak onSplit', L.noneGo === '[]' && L.allGo === '[]' && L.openAfterBlocked, L);
    check('logika: 3 jednostki + cel (3,4) -> onSplit', JSON.parse(L.goOk).length === 1 && JSON.parse(L.goOk)[0].q === 3 && JSON.parse(L.goOk)[0].r === 4 && JSON.parse(L.goOk)[0].ids.length === 3 && L.closedAfterSplit, L);
    check('logika: Anuluj wola onCancel', L.cancelCalls === 1, L);
  }
  console.log('\n' + pass + ' PASS / ' + fail + ' FAIL');
  fs.rmSync(TMP, { recursive: true, force: true });
  // PRZED-only: FAIL na zielonych kontrolach PO nie dotyczy; w trybie --pre-only kod wyjscia 0 gdy RED potwierdzony.
  process.exit(only === 'pre' ? 0 : (fail === 0 ? 0 : 1));
})().catch((e) => { console.error(e); process.exit(2); });
