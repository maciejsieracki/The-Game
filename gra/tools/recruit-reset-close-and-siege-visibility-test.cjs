'use strict';
/**
 * recruit-reset-close-and-siege-visibility-test.cjs -- R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1 (obrona r1).
 * Prawdziwy Chromium + PRAWDZIWE moduły (esbuild):
 *  A) empireDetailPanel: szkice Armii zerowane przy zamknięciu 3 ścieżkami (przycisk Zamknij / Esc / klik w tło),
 *     NIE zerowane gdy hideEmpireDetailPanel jest wołane przy zamkniętym panelu (zarzut 2);
 *  B) siegeMapPanel: lista machin w DOM zawiera tylko machiny zwrócone przez getSiegeEngineOptions;
 *     pusta lista -> brak nagłówka „Zbuduj machinę w oblężeniu” i brak wiersza (zarzuty 3/4).
 * Mutanty: RESET_CLOSE_MUTANT=no-open-guard|no-clear|keep-empty-block -> test musi FAIL.
 * Usage (z gra/): node tools/recruit-reset-close-and-siege-visibility-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch (e) { console.error('playwright missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }

const BRAND_STUB = path.join(__dirname, '.stubs', 'recruit-list-visibility-ui-brandAssets-stub.ts');
const ENTRY = path.join(__dirname, '.recruit-reset-close-siege-entry.ts');
const OUTDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'recruit-reset-close-'));
const OUTFILE = path.join(OUTDIR, 'bundle.js');
const SHOT_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium';
const MUT = process.env.RESET_CLOSE_MUTANT || '';

const stubPlugin = { name: 'stub-brand', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); } };
const globPlugin = {
  name: 'glob-empty',
  setup(b) {
    b.onLoad({ filter: /\/src\/.*\.ts$/ }, async a => {
      const c = await fs.promises.readFile(a.path, 'utf8');
      if (!c.includes('import.meta.glob')) return undefined;
      return { contents: c.replace(/import\.meta\.glob\(/g, '((..._g) => ({}))('), loader: 'ts' };
    });
  },
};
const rawPlugin = {
  name: 'raw',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, a => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, a => ({ contents: 'export default ' + JSON.stringify(fs.readFileSync(a.path, 'utf8')) + ';', loader: 'js' }));
  },
};
function mutate(src, from, to) { if (!src.includes(from)) throw new Error('mutant not applied: ' + from); return src.replace(from, to); }
const srcPlugin = {
  name: 'src-hooks',
  setup(b) {
    b.onLoad({ filter: /cityPanel\.ts$/ }, async a => {
      let src = await fs.promises.readFile(a.path, 'utf8');
      src += '\nexport const __testSetArmyDraft = setArmyRecruitDraft;\n'; // tylko bundle testowy
      return { contents: src, loader: 'ts' };
    });
    b.onLoad({ filter: /empireDetailPanel\.ts$/ }, async a => {
      let src = await fs.promises.readFile(a.path, 'utf8');
      if (MUT === 'no-open-guard') src = mutate(src, 'if (open) clearArmyRecruitDraftsOnPanelClose();', 'clearArmyRecruitDraftsOnPanelClose();');
      if (MUT === 'no-clear') src = mutate(src, 'if (open) clearArmyRecruitDraftsOnPanelClose();', '');
      return { contents: src, loader: 'ts' };
    });
    b.onLoad({ filter: /siegeMapPanel\.ts$/ }, async a => {
      let src = await fs.promises.readFile(a.path, 'utf8');
      if (MUT === 'keep-empty-block') src = mutate(src, "if (!engineOptions.length) box.querySelector('[data-siege-engine-build]')?.remove();", '');
      return { contents: src, loader: 'ts' };
    });
  },
};

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { showEmpireDetailPanel, hideEmpireDetailPanel } from '../src/ui/empireDetailPanel.ts';",
    "import { getArmyRecruitDraftTotal, __testSetArmyDraft } from '../src/ui/cityPanel.ts';",
    "import { showSiegeMapPanel, hideSiegeMapPanel } from '../src/ui/siegeMapPanel.ts';",
    'window.__api = { showEmpireDetailPanel, hideEmpireDetailPanel, getArmyRecruitDraftTotal, setDraft: __testSetArmyDraft, showSiegeMapPanel, hideSiegeMapPanel };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [stubPlugin, globPlugin, rawPlugin, srcPlugin], logLevel: 'silent',
  });

  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    // origin http (nie about:blank), żeby localStorage działał jak w grze
    await page.route('http://civ.test/**', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body style="margin:0;background:#1b1712;color:#e8ebf0;font:13px system-ui"></body></html>' }));
    await page.goto('http://civ.test/');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
    if (await page.evaluate(() => !window.__api)) throw new Error('bundle bez __api: ' + errs.slice(0, 2).join(' | '));
    fs.mkdirSync(SHOT_DIR, { recursive: true });

    // ---- A) ścieżki zamknięcia panelu imperium ----
    const total = () => page.evaluate(() => window.__api.getArmyRecruitDraftTotal());
    const stored = () => page.evaluate(() => localStorage.getItem('civ-army-recruit-drafts-v1'));
    const open = () => page.evaluate(() => window.__api.showEmpireDetailPanel('armia'));
    const isOpen = () => page.evaluate(() => document.querySelector('.civ-emp-panel').classList.contains('open'));
    const seed = () => page.evaluate(() => { window.__api.setDraft('A', 'Wojownik', 5); window.__api.setDraft('B', 'Łucznik', 3); });

    await open(); await seed();
    check('panel otwarty, szkice 8', await isOpen() && await total() === 8);

    await page.locator('.civ-emp-close').click();
    check('Zamknij: panel zamknięty, szkice 0, localStorage pusty', !(await isOpen()) && await total() === 0 && await stored() === null, { total: await total() });

    await open(); await seed();
    await page.keyboard.press('Escape');
    check('Esc: panel zamknięty, szkice 0, localStorage pusty', !(await isOpen()) && await total() === 0 && await stored() === null, { total: await total() });

    await open(); await seed();
    await page.screenshot({ path: path.join(SHOT_DIR, 'close-paths-przed-zamknieciem.png') });
    await page.mouse.click(5, 400);
    check('klik w tło: panel zamknięty, szkice 0, localStorage pusty', !(await isOpen()) && await total() === 0 && await stored() === null, { total: await total() });
    await page.screenshot({ path: path.join(SHOT_DIR, 'close-paths-po-zamknieciu-tlo.png') });

    // zarzut 2: hide przy ZAMKNIĘTYM panelu (jak dismissToolbarSidePanels/closeAll) nie rusza szkiców
    await page.evaluate(() => { window.__api.setDraft('A', 'Wojownik', 6); });
    await page.evaluate(() => { window.__api.hideEmpireDetailPanel(); window.__api.hideEmpireDetailPanel(); });
    check('hide przy zamkniętym panelu NIE zeruje szkiców (6)', await total() === 6, { total: await total() });
    await open();
    await page.evaluate(() => window.__api.showEmpireDetailPanel('moc'));
    await page.evaluate(() => window.__api.showEmpireDetailPanel('armia'));
    check('otwarty panel: przełączanie sekcji nie zeruje szkiców', await total() === 6);
    await page.evaluate(() => window.__api.hideEmpireDetailPanel());
    check('po zamknięciu szkice 0', await total() === 0);

    // ---- B) lista machin w panelu oblężenia ----
    const showSiege = names => page.evaluate(names => {
      const mkOpt = name => ({ unit: { Jednostka: name }, allowed: true, costMoney: 7, costStock: { drewno: 19 }, qualifyingArmyCount: 10, builtThisTurn: 0, quota: 1 });
      const city = { id: 'C1', name: 'Memfis', population: 3, ownerId: 1, garnizon: 2, surowce: { zywnosc: 20 }, q: 0, r: 0 };
      window.__api.showSiegeMapPanel(
        { city, atakujacy: { typeId: 'Wojownik', ownerId: 0 }, oblegajacyOwnerId: 0 },
        { isMe: id => id === 0, onBesiege() {}, onStorm() {}, onRetreat() {}, onBuildSiegeEngine() {}, getSiegeEngineOptions: () => names.map(mkOpt) }, 1);
    }, names);
    const engines = () => page.evaluate(() => ({
      heading: [...document.querySelectorAll('.civ-smp-mach-h')].map(e => e.textContent),
      buttons: [...document.querySelectorAll('.civ-smp-mach-btn')].map(e => e.textContent.split(' · ')[0]),
      block: document.querySelectorAll('[data-siege-engine-build]').length,
    }));
    await showSiege(['Taran']);
    let e = await engines();
    check('jedna odblokowana machina (Taran): nagłówek + tylko przycisk Taran', e.block === 1 && JSON.stringify(e.buttons) === '["Taran"]', e);
    await page.screenshot({ path: path.join(SHOT_DIR, 'siege-panel-tylko-taran.png') });
    await page.evaluate(() => window.__api.hideSiegeMapPanel());
    await showSiege([]);
    e = await engines();
    check('zero odblokowanych machin: brak bloku „Zbuduj machinę”, nagłówka i przycisków', e.block === 0 && e.buttons.length === 0 && !e.heading.includes('Zbuduj machinę w oblężeniu'), e);
    check('panel oblężenia nadal pokazuje akcje (Oblegaj/Szturm/Odwrót)', await page.locator('.civ-smp-act').count() === 3);
    await page.screenshot({ path: path.join(SHOT_DIR, 'siege-panel-bez-machin.png') });
    check('brak błędów strony', errs.length === 0, errs.slice(0, 3));
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
    try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
