'use strict';
/**
 * empire-recruit-panel-no-inner-scroll-test.cjs — R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1
 *
 * Prawdziwy Chromium + prawdziwy moduł (esbuild): panel „Rekrutacja — cała cywilizacja”
 * (ui/empireRecruitPanel.ts) z 30 typami jednostek. Wymagania właściciela:
 *  - lista jednostek NIE ma wewnętrznego paska przewijania (overflow-y visible, scrollHeight == clientHeight),
 *    wszystkie pozycje mają pełną wysokość i są w DOM;
 *  - jedyne przewijanie to zewnętrzne (cały panel), przewijanie dochodzi do ostatniej pozycji;
 *  - przyciski „Rekrutuj wszystkie” (góra) pozostają widoczne przy przewijaniu (sticky);
 *  - brak poziomego przewijania, także na wąskim ekranie (telefon 360 px);
 *  - liczniki domyślnie 0; przycisk „+” na ostatniej pozycji działa po przewinięciu.
 * Mutant: EMPIRE_RECRUIT_UI_MUTANT=inner-scroll -> przywraca wewnętrzny scroll listy -> test musi FAIL.
 * Usage (z gra/): PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium node tools/empire-recruit-panel-no-inner-scroll-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) { console.error('playwright missing'); process.exit(1); }

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.empire-no-inner-scroll-entry.ts');
const OUTFILE = path.resolve(__dirname, '.empire-no-inner-scroll-bundle.js');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium';
const MUT = process.env.EMPIRE_RECRUIT_UI_MUTANT || '';
const N_TYPES = 30;

const plugins = [{
  name: 'mutants',
  setup(build) {
    build.onLoad({ filter: /empireRecruitPanel\.ts$/ }, args => {
      let source = fs.readFileSync(args.path, 'utf8');
      if (MUT === 'inner-scroll') {
        const m = source.replace('#${ROOT_ID} .erp-list{flex:none;padding:4px 8px 8px;}',
          '#${ROOT_ID} .erp-list{overflow-y:auto;max-height:160px;padding:4px 8px 8px;}');
        if (m === source) throw new Error('mutant not applied');
        source = m;
      }
      return { contents: source, loader: 'ts' };
    });
  },
}];

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { toggleEmpireRecruitPanel, resetEmpireRecruitPanelSession, getEmpireRecruitDraft } from '../src/ui/empireRecruitPanel.ts';",
    'window.__api = { toggleEmpireRecruitPanel, resetEmpireRecruitPanelSession, getEmpireRecruitDraft };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, plugins, logLevel: 'silent',
  });
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const errors = [];
  try {
    const open = async (viewport) => {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.setContent('<body style="background:#223;margin:0"></body>');
      await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
      await page.evaluate((n) => {
        const types = Array.from({ length: n }, (_, i) => ({ id: 'U' + i, label: 'Jednostka testowa ' + (i + 1) + (i % 4 === 0 ? ' z bardzo długą nazwą, która musi się zawinąć w wąskim panelu' : ''), koszt: 10 + i }));
        window.__api.toggleEmpireRecruitPanel({
          getRows: () => types.map((t, i) => ({ id: t.id, label: t.label, koszt: t.koszt, capableCities: i % 7 === 6 ? 0 : 2, totalCities: 3, queued: i % 3, blockedReason: 'Brak miasta' })),
          onOrder: (id, qty) => ({ message: 'Zamówiono ' + qty, changed: true, accepted: qty }),
        });
      }, N_TYPES);
      return page;
    };

    // ---- szerokie okno (900×560) ----
    let page = await open({ width: 900, height: 560 });
    const metrics = () => page.evaluate(() => {
      const root = document.getElementById('civ-empire-recruit-panel');
      const list = root.querySelector('.erp-list');
      const rows = [...list.querySelectorAll('[data-unit]')];
      const lr = list.getBoundingClientRect();
      const last = rows[rows.length - 1].getBoundingClientRect();
      return {
        rootOverflowY: getComputedStyle(root).overflowY,
        listOverflowY: getComputedStyle(list).overflowY,
        listScrollH: list.scrollHeight, listClientH: list.clientHeight,
        listRowsH: rows.reduce((s, r) => s + r.getBoundingClientRect().height, 0),
        listH: lr.height, rowCount: rows.length,
        rootScrollH: root.scrollHeight, rootClientH: root.clientHeight,
        rootScrollW: root.scrollWidth, rootClientW: root.clientWidth,
        docScrollW: document.documentElement.scrollWidth, winW: window.innerWidth,
        lastRowBottomInList: last.bottom <= lr.bottom + 1,
      };
    });
    let m = await metrics();
    check('lista: brak wewnętrznego przewijania (overflow-y visible/unset)', m.listOverflowY === 'visible', m.listOverflowY);
    check('lista: scrollHeight == clientHeight (brak suwaka listy)', m.listScrollH <= m.listClientH + 1, { s: m.listScrollH, c: m.listClientH });
    check('lista: wysokość listy >= suma wysokości wierszy (pełna lista)', m.listH >= m.listRowsH - 1, { listH: m.listH, rows: m.listRowsH });
    check(`lista: wszystkie ${N_TYPES} pozycji w DOM`, m.rowCount === N_TYPES, m.rowCount);
    check('zewnętrzny panel przewijalny (overflow-y auto)', m.rootOverflowY === 'auto', m.rootOverflowY);
    check('zewnętrzny panel: treść wyższa niż okno (jest co przewijać)', m.rootScrollH > m.rootClientH + 50, { s: m.rootScrollH, c: m.rootClientH });
    check('brak poziomego przewijania panelu (szerokie okno)', m.rootScrollW <= m.rootClientW + 1, { s: m.rootScrollW, c: m.rootClientW });

    // przewijanie całego panelu do końca: ostatnia pozycja widoczna, przycisk „Rekrutuj wszystkie” u góry nadal widoczny
    await page.evaluate(() => { document.getElementById('civ-empire-recruit-panel').scrollTop = 1e6; });
    const endState = await page.evaluate(() => {
      const root = document.getElementById('civ-empire-recruit-panel');
      const rr = root.getBoundingClientRect();
      const lastRow = [...root.querySelectorAll('[data-unit]')].pop().getBoundingClientRect();
      const topBtn = root.querySelector('.erp-stick [data-erp="go-all"]').getBoundingClientRect();
      return { lastVisible: lastRow.top >= rr.top && lastRow.bottom <= rr.bottom + 1, topBtnVisible: topBtn.top >= rr.top - 1 && topBtn.bottom <= rr.bottom + 1, scrollTop: root.scrollTop };
    });
    check('po przewinięciu panelu: ostatnia pozycja widoczna', endState.lastVisible, endState);
    check('po przewinięciu panelu: „Rekrutuj wszystkie” (góra) nadal widoczne (sticky)', endState.topBtnVisible, endState);

    // „+” na ostatniej pozycji po przewinięciu działa; liczniki domyślnie 0 przed kliknięciem
    const lastId = 'U' + (N_TYPES - 1);
    const dflt = await page.evaluate(() => window.__api.getEmpireRecruitDraft('U29'));
    check('liczniki domyślnie 0', dflt === 0, dflt);
    await page.locator(`#civ-empire-recruit-panel [data-unit="${lastId}"] [data-erp="inc"]`).click();
    check('„+” na ostatniej pozycji po przewinięciu zwiększa licznik do 1', await page.evaluate((id) => window.__api.getEmpireRecruitDraft(id), lastId) === 1);
    await page.close();

    // ---- wąski ekran telefonu (360×640): zawijanie, bez poziomego scrolla ----
    page = await open({ width: 360, height: 640 });
    m = await metrics();
    check('wąski ekran: lista bez wewnętrznego przewijania', m.listOverflowY === 'visible' && m.listScrollH <= m.listClientH + 1, { o: m.listOverflowY, s: m.listScrollH, c: m.listClientH });
    check('wąski ekran: brak poziomego przewijania panelu', m.rootScrollW <= m.rootClientW + 1, { s: m.rootScrollW, c: m.rootClientW });
    check('wąski ekran: brak poziomego przewijania dokumentu', m.docScrollW <= m.winW + 1, { d: m.docScrollW, w: m.winW });
    check('wąski ekran: wszystkie pozycje w DOM', m.rowCount === N_TYPES, m.rowCount);
    await page.close();

    // ---- zamknięcie i reset (bez zmian zachowania) ----
    page = await open({ width: 900, height: 560 });
    await page.evaluate(() => window.__api.resetEmpireRecruitPanelSession());
    check('reset sesji zamyka panel', await page.evaluate(() => !document.getElementById('civ-empire-recruit-panel')));
    await page.close();

    check('brak błędów konsoli/strony', errors.length === 0, errors);
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
    try { fs.unlinkSync(OUTFILE); } catch (e) { /* ignore */ }
  }
  console.log(`\nempire-recruit-panel-no-inner-scroll-test: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
