'use strict';
/**
 * empire-army-city-recruit-no-inner-scroll-test.cjs -- R-WEB-UI-EMPIRE-RECRUIT-PANEL-NO-INNER-SCROLL-Q1.
 * Prawdziwy Chromium + PRAWDZIWY cityPanel.ts: ścieżka, którą widzi właściciel w zbiorczym panelu
 * imperium/armii: empireDetailPanel -> mountCityRecruitmentCardsForArmy(cityId, host) ->
 * renderPurchasableUnits(..., { w4, noInnerScroll }). Sekcje miast („Rzym”, „kolejka: N”)
 * montują tę samą listę jednostek.
 * Wymaganie: lista jednostek pod miastem NIE ma wewnętrznego suwaka (brak max-height,
 * overflow-y visible, scrollHeight == clientHeight, wszystkie wiersze w pełnej wysokości).
 * Mutant: CITY_RECRUIT_UI_MUTANT=inner-scroll -> przywraca visibleRows (LIST_SCROLL_VISIBLE_CATALOG)
 * w mountCityRecruitmentCardsForArmy -> test musi FAIL.
 * Zakres: tylko ścieżka zbiorcza (noInnerScroll). Panel pojedynczego miasta NIE jest tu testowany.
 *
 * Usage (z gra/): node tools/empire-army-city-recruit-no-inner-scroll-test.cjs
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
const ENTRY = path.join(__dirname, '.empire-army-city-recruit-no-inner-scroll-entry.ts');
const OUTDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'empire-army-city-noscroll-'));
const OUTFILE = path.join(OUTDIR, 'bundle.js');
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium';
const MUT = process.env.CITY_RECRUIT_UI_MUTANT || '';

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
const mutantPlugin = {
  name: 'mutants',
  setup(b) {
    b.onLoad({ filter: /cityPanel\.ts$/ }, async a => {
      let src = await fs.promises.readFile(a.path, 'utf8');
      if (MUT === 'inner-scroll') {
        const from = 'renderPurchasableUnits(host, city, data, { w4: true, noInnerScroll: true });';
        if (!src.includes(from)) throw new Error('mutant not applied');
        src = src.replace(from, 'renderPurchasableUnits(host, city, data, { w4: true, visibleRows: LIST_SCROLL_VISIBLE_CATALOG });');
      }
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
    "import { configureCityPanel, mountCityRecruitmentCardsForArmy } from '../src/ui/cityPanel.ts';",
    "import { UNIT_RECRUIT_CARD_CSS } from '../src/ui/unitRecruitCard.ts';",
    "import unitsJson from '../data/units.json';",
    "import buildingsJson from '../data/buildings.json';",
    'window.__api = { configureCityPanel, mountCityRecruitmentCardsForArmy, UNIT_RECRUIT_CARD_CSS, units: unitsJson, buildings: buildingsJson };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [stubPlugin, globPlugin, rawPlugin, mutantPlugin], logLevel: 'silent',
  });

  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const results = {};
  try {
    for (const width of [900, 360]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(String(e)));
      const empSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'empireDetailPanel.ts'), 'utf8').split('\n');
      const i0 = empSrc.findIndex(l => l.startsWith('.civ-emp-mass-city-recruit-list.civ-cs{'));
      const i1 = empSrc.findIndex(l => l.startsWith('.civ-emp-mass-rally{'));
      if (i0 < 0 || i1 <= i0) throw new Error('nie znaleziono CSS hosta w empireDetailPanel.ts');
      const empCss = empSrc.slice(i0, i1).join('\n') + '\n' + empSrc.filter(l => /^\.civ-emp-mass-(city|empty)/.test(l)).join('\n');
      await page.setContent('<!doctype html><html><body style="margin:0;padding:0 16px;background:#1b1712;font:13px system-ui;color:#e8ebf0"><div id="host" style="width:' + (width - 32) + 'px"></div></body></html>');
      await page.addStyleTag({ content: empCss });
      await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
      if (await page.evaluate(() => !window.__api)) throw new Error('bundle bez __api: ' + pageErrors.slice(0, 2).join(' | '));

      await page.evaluate(() => {
        const A = window.__api;
        const mk = (id, name) => ({ id, name, q: 0, r: 0, ownerId: 0, population: 3, surowce: { drewno: 50, kamien: 50, zywnosc: 50, zelazo: 50 } });
        const st = { treasury: 100000, cities: [mk('A', 'Rzym')] };
        const data = { units: A.units, buildings: A.buildings, civs: [], tech: [] };
        const css = document.createElement('style'); css.textContent = A.UNIT_RECRUIT_CARD_CSS; document.head.appendChild(css);
        A.configureCityPanel({
          data,
          getTreasury: () => st.treasury,
          getCities: () => st.cities,
          getEpoch: () => 3,
          getUnlockedTechs: () => [...new Set(A.units.map(u => u.Tech).filter(Boolean))],
          getEmpireRekruciTotal: () => 4000,
          getBuiltBuildingIds: () => A.buildings.map(b => b.id),
          getEmpireBuiltIds: () => A.buildings.map(b => b.id),
          getProduction: () => ({ rekrutacja: [], postep: 0 }),
          setProduction: () => {},
          onChange: () => {},
          onPurchaseUnit: () => true,
          onCancelRecruitment: () => {},
        });
        window.__st = st;
        const host = document.getElementById('host');
        const box = document.createElement('div'); box.dataset.mountFor = 'A';
        host.appendChild(box);
        A.mountCityRecruitmentCardsForArmy('A', box);
      });

      const m = await page.evaluate(() => {
        const box = document.querySelector('[data-mount-for="A"]');
        const list = box.querySelector('.list-scroll, .unit-recruit-list-full');
        if (!list) return { found: false };
        const cs = getComputedStyle(list);
        const kids = [...list.children];
        const lr = list.getBoundingClientRect();
        const sumH = kids.reduce((s, k) => s + k.getBoundingClientRect().height, 0);
        return {
          found: true,
          cls: list.className,
          overflowY: cs.overflowY,
          maxHeight: cs.maxHeight,
          scrollH: list.scrollHeight,
          clientH: list.clientHeight,
          listH: lr.height,
          sumH,
          rows: kids.length,
          text: list.innerText.slice(0, 160),
          boxText: box.innerText.slice(0, 300),
          docScrollW: document.documentElement.scrollWidth,
          winW: window.innerWidth,
        };
      });
      results[width] = m;
      check(`[${width}px] lista jednostek miasta jest w panelu imperium (mountCityRecruitmentCardsForArmy)`, m.found, m);
      if (!m.found) continue;
      check(`[${width}px] precondition: więcej pozycji niż limit wewnętrznego suwaka (>8)`, m.rows > 8, m.rows);
      check(`[${width}px] brak wewnętrznego przewijania listy (overflow-y visible)`, m.overflowY === 'visible', m.overflowY);
      check(`[${width}px] brak max-height na liście`, m.maxHeight === 'none', m.maxHeight);
      check(`[${width}px] scrollHeight == clientHeight (brak suwaka listy)`, m.scrollH <= m.clientH + 1, { s: m.scrollH, c: m.clientH });
      check(`[${width}px] wysokość listy >= suma wysokości wierszy (pełna lista)`, m.listH >= m.sumH - 1, { listH: m.listH, sum: m.sumH });
      check(`[${width}px] brak poziomego przewijania strony`, m.docScrollW <= m.winW + 1, { s: m.docScrollW, w: m.winW });
      check(`[${width}px] błędy strony: brak`, pageErrors.length === 0, pageErrors.slice(0, 3));
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`RESULTS: ${JSON.stringify(results)}`);
  console.log(`SUMMARY: ${pass} PASS / ${fail} FAIL`);
  if (fail > 0) process.exitCode = 1;
  try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(ENTRY, { force: true }); } catch {}
}

main().catch(e => { console.error('[empire-army-city-recruit-no-inner-scroll-test] ERROR', e); process.exitCode = 1; });
