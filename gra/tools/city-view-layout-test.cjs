'use strict';
/**
 * city-view-layout-test.cjs
 * TEMAT: R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1.
 *
 * Chromium (prawdziwy showCityPanel + prawdziwy CSS), widok miasta, 4 rozdzielczości:
 * 1920x1080, 2000x831, 1366x768, 1280x720; dwa zestawy wartości:
 *   normal  — wartości zbliżone do gry (2-3 cyfry),
 *   big     — wartości 6-7-cyfrowe (skrajne; najgorszy przypadek szerokości żetonów).
 * Kryteria (na każdą kombinację):
 *   L1  żetony lewego banera (Praca · Żywność · Skarbiec) w JEDNEJ linii poziomej,
 *   L2  żetony prawego banera (Nauka · Kultura · Religia) w JEDNEJ linii poziomej,
 *   L3  każdy żeton mieści się w swoim banerze i w oknie (bez ucięcia),
 *   L4  baner lewy/prawy nie nachodzi na plakietkę miasta (nazwę) w środku,
 *   P1  boczne panele (.civ-ux-left, .civ-ux-right) zaczynają się tuż pod dolną krawędzią
 *       górnych bloków: top >= dół banera (bez nachodzenia) i top <= dół banera + 16 px,
 *   P2  panele boczne nie nachodzą prostokątem na żaden górny blok,
 *   P3  panele boczne nie wychodzą poza dół okna,
 *   G1  brak poziomego przewijania strony (scrollWidth <= clientWidth),
 *   G2  brak błędów strony.
 *
 * Użycie (z gra/):
 *   node tools/city-view-layout-test.cjs                 — zielony na poprawce (oczekiwane PASS),
 *   node tools/city-view-layout-test.cjs --mutant        — cofa poprawkę do stanu bazy
 *                                                          (zawijanie żetonów, brak skali, cap 1480 px);
 *                                                          oczekiwane FAIL (kod wyjścia 1 = dowód mutacyjny),
 *   --shots=<katalog>                                    — zrzuty 4 rozmiarow (normal).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const FRAME_TS = path.resolve(GRA, 'src/ui/cityUxFrame.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'city-view-layout-'));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MUTANT = process.argv.includes('--mutant');
const SHOTS = (process.argv.find((a) => a.startsWith('--shots=')) || '').slice(8) || null;
const esbuild = require(path.resolve(GRA, 'node_modules/esbuild'));
const { chromium } = require(path.resolve(GRA, 'node_modules/playwright'));

const SIZES = [[1920, 1080], [2000, 831], [1600, 900], [1366, 768], [1280, 720]];
const FIXTURES = ['normal', 'big'];
const SIDE_GAP_MAX_PX = 16;
/** Jedna linia żetonów kończy się ok. 59 px; panele boczne mają startować najwyżej ok. 8 px pod nią (limit z zapasem). */
const SIDE_TOP_MAX_PX = 72;
/** Przy zawijaniu żetonów do dwóch linii (wąskie okno, R-WEB-UI-CITY-VIEW-CHIPS-READABLE-MIN-12PX-Q1) dolna krawędź banera jest niżej; limit z zapasem. */
const SIDE_TOP_MAX_2ROW_PX = 92;

let pass = 0; let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail))); }
}

/** Mutant = bez zawijania do 2 linii: żetony kurczą się poniżej 12 px zamiast zawijać (stan sprzed poprawki). */
function patchOrThrow(src, from, to, label) {
  if (!src.includes(from)) throw new Error('mutant: nie znaleziono fragmentu (' + label + ')');
  return src.replace(from, to);
}

function plugin() {
  return {
    name: 'city-view-layout',
    setup(build) {
      build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(path.dirname(a.importer), a.path.slice(0, -4)), namespace: 'raw' }));
      build.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
      build.onLoad({ filter: /\.ts$/ }, (a) => {
        let src = fs.readFileSync(a.path, 'utf8');
        let changed = false;
        if (src.includes('import.meta.glob')) {
          src = 'const __g = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__g');
          changed = true;
        }
        const abs = path.resolve(a.path);
        if (MUTANT && abs === FRAME_TS) {
          src = patchOrThrow(src, '  top.classList.add(TOP_CHIP_WRAP_CLASS);', '', 'brak zawijania do 2 linii');
          changed = true;
        }
        return changed ? { contents: src, loader: 'ts', resolveDir: path.dirname(a.path) } : null;
      });
    },
  };
}

function fixtureScript(big) {
  const emp = big
    ? 'getEmpireHud: () => ({ pracaRate: 123456, pracaPool: 9876543, pracaUpkeep: 120, zywnoscRate: -98765, zywnoscReserve: 45678, zlotoRate: 234567, zloto: 3456789, naukaRate: 54321, nauka: 987654, kulturaRate: 3210, kultura: 456789, religionRate: 1234, religionStock: 98765 }), getTreasury: () => 3456789,'
    : 'getTreasury: () => 12,';
  return `(() => {
  const cityA = { id: 'city-a', ownerId: 0, q: 0, r: 0, name: 'Olimpia', population: 6 };
  const map = { szerokoscQ: 8, wysokoscR: 8, seed: 42, riverPaths: [], hexes: { '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak' } } };
  window.__configureCityPanel({ getCities: () => [cityA], getUnitsAt: () => [], getBuiltBuildingIds: () => [], getWorkedTiles: () => [],
    getProduction: () => ({ kolejka: [], postep: 0 }), getEpoch: () => 1, getTurn: () => 1, onSwitchCity: () => {}, ${emp}
    getCapitalCityId: () => 'city-stolica-inna', onSetCapital: () => {}, isMe: (o) => o === 0,
    getCityAdministratorState: () => ({ hired: false, working: false, hireCost: 25, upkeep: 2, blockReasonText: null, options: [] }), onHireAdministrator: () => {} });
  window.__openCity = () => window.__showCityPanel(cityA, map, () => {});
})();`;
}

const MEASURE = () => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  const vis = (el) => !!el && el.getClientRects().length > 0;
  const flank = (sel) => document.querySelector('.civ-ux-top ' + sel);
  const out = {};
  for (const [k, sel] of [['L', '.civ-v-w3-chips-left'], ['R', '.civ-v-w3-chips-right']]) {
    const f = flank(sel);
    const chips = f ? Array.from(f.querySelectorAll('.civ-v-w3-chip')) : [];
    out[k] = {
      flank: f && vis(f) ? r(f) : null,
      rows: new Set(chips.map((c) => Math.round(c.getBoundingClientRect().top))).size,
      chips: chips.map((c) => r(c)),
    };
  }
  const city = document.querySelector('.civ-v-w3-city-badge');
  out.city = vis(city) ? r(city) : null;
  const lp = document.querySelector('.civ-ux-left');
  const rp = document.querySelector('.civ-ux-right');
  out.leftPanel = vis(lp) ? r(lp) : null;
  out.rightPanel = vis(rp) ? r(rp) : null;
  const topEl = document.querySelector('.civ-ux-top');
  const firstChip = document.querySelector('.civ-ux-top .civ-v-w3-chip');
  out.chipFontPx = firstChip ? parseFloat(getComputedStyle(firstChip).fontSize) : null;
  out.chipScale = topEl ? topEl.style.getPropertyValue('--civ-top-chip-scale') : '';
  out.cityScale = topEl ? topEl.style.getPropertyValue('--civ-top-city-scale') : '';
  out.leftOverflowY = lp ? getComputedStyle(lp).overflowY : null;
  out.docSW = document.documentElement.scrollWidth;
  out.vw = document.documentElement.clientWidth;
  out.vh = window.innerHeight;
  return out;
};

async function main() {
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, `import { configureCityPanel, showCityPanel } from ${JSON.stringify(CITY_TS)};
window.__configureCityPanel = configureCityPanel; window.__showCityPanel = showCityPanel;\n`);
  const out = path.join(TMP, 'bundle.js');
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: out, absWorkingDir: GRA, plugins: [plugin()], logLevel: 'silent' });
  const bundle = fs.readFileSync(out, 'utf8');
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (e) { browser = await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }

  for (const fx of FIXTURES) {
    for (const [w, h] of SIZES) {
      const tag = `${w}x${h}/${fx}`;
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
      await page.setContent('<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#080c12;color:#eee}</style></head><body></body></html>');
      await page.addScriptTag({ content: bundle });
      await page.addScriptTag({ content: fixtureScript(fx === 'big') });
      await page.evaluate(() => window.__openCity());
      await page.waitForTimeout(200);
      const m = await page.evaluate(MEASURE);

      check(`${tag}: lewy baner (Praca · Żywność · Skarbiec) najwyżej w 2 liniach`, m.L.chips.length === 3 && m.L.rows >= 1 && m.L.rows <= 2, { rows: m.L.rows, n: m.L.chips.length });
      check(`${tag}: prawy baner (Nauka · Kultura · Religia) najwyżej w 2 liniach`, m.R.chips.length === 3 && m.R.rows >= 1 && m.R.rows <= 2, { rows: m.R.rows, n: m.R.chips.length });
      if (w >= 1600) {
        check(`${tag}: szerokie okno — obie strony banera w jednej linii (bez regresji)`, m.L.rows === 1 && m.R.rows === 1, { L: m.L.rows, R: m.R.rows });
      }
      check(`${tag}: żetony nie mniejsze niż 12 px (czytelność)`, m.chipFontPx !== null && m.chipFontPx >= 12 - 0.05, { px: m.chipFontPx });
      const inside = (c, f) => c.l >= f.l - 0.5 && c.r <= f.r + 0.5;
      const winOk = (c) => c.l >= -0.5 && c.r <= m.vw + 0.5;
      check(`${tag}: żetony mieszczą się w swoim banerze i w oknie`,
        !!m.L.flank && !!m.R.flank && m.L.chips.every((c) => inside(c, m.L.flank) && winOk(c)) && m.R.chips.every((c) => inside(c, m.R.flank) && winOk(c)),
        { L: m.L.flank, R: m.R.flank, Lchips: m.L.chips.map((c) => [Math.round(c.l), Math.round(c.r)]), Rchips: m.R.chips.map((c) => [Math.round(c.l), Math.round(c.r)]), city: m.city });
      if (m.city && m.L.flank && m.R.flank) {
        check(`${tag}: banery nie nachodzą na plakietkę miasta`, m.L.flank.r <= m.city.l + 0.5 && m.R.flank.l >= m.city.r - 0.5, { L: m.L.flank.r, R: m.R.flank.l, city: [m.city.l, m.city.r] });
      } else {
        check(`${tag}: plakietka miasta i banery widoczne`, false, { city: m.city, L: !!m.L.flank, R: !!m.R.flank });
      }

      const topBottom = Math.max(m.L.flank ? m.L.flank.b : 0, m.R.flank ? m.R.flank.b : 0, m.city ? m.city.b : 0);
      for (const [pk, p] of [['panel-lewy', m.leftPanel], ['panel-prawy', m.rightPanel]]) {
        if (!p) { check(`${tag}: ${pk} widoczny`, false); continue; }
        check(`${tag}: ${pk} zaczyna się tuż pod górnymi blokami (${p.t.toFixed(1)} vs dół ${topBottom.toFixed(1)})`,
          p.t >= topBottom - 0.5 && p.t <= topBottom + SIDE_GAP_MAX_PX, { top: p.t, topBottom });
        const sideLimit = (m.L.rows === 2 || m.R.rows === 2) ? SIDE_TOP_MAX_2ROW_PX : SIDE_TOP_MAX_PX;
        check(`${tag}: ${pk} tak wysoko jak się da (top ${p.t.toFixed(1)} <= ${sideLimit} px)`, p.t <= sideLimit, { top: p.t });
        const hits = [m.L.flank, m.R.flank, m.city].filter(Boolean).some((b) => p.l < b.r && p.r > b.l && p.t < b.b && p.b > b.t);
        check(`${tag}: ${pk} nie nachodzi na górne bloki`, !hits, { panel: p });
        check(`${tag}: ${pk} nie wychodzi poza dół okna`, p.b <= m.vh + 0.5, { bottom: p.b, vh: m.vh });
      }
      check(`${tag}: panel lewy ma przewijanie wewnętrzne (computed overflow-y auto)`,
        m.leftOverflowY === 'auto' || m.leftOverflowY === 'scroll') ;
      check(`${tag}: brak poziomego przewijania strony`, m.docSW <= m.vw + 0.5, { docSW: m.docSW, vw: m.vw });
      console.log(`INFO ${tag}: zeton ${m.chipFontPx !== null ? m.chipFontPx.toFixed(1) : 'brak'} px, skala zetonow ${m.chipScale || '1'}, skala plakietki ${m.cityScale || '1'}, lewy top ${m.leftPanel ? m.leftPanel.t.toFixed(1) : '-'}, prawy top ${m.rightPanel ? m.rightPanel.t.toFixed(1) : '-'}`);
      check(`${tag}: brak błędów strony`, errs.length === 0, errs);
      if (SHOTS) {
        fs.mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({ path: path.join(SHOTS, `city-view-${MUTANT ? 'base' : 'after'}-${fx}-${w}x${h}.png`) });
      }
      await page.close();
    }
  }
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  const label = MUTANT ? 'MUTANT (stan bazy; oczekiwane FAIL)' : 'POPRAWKA (oczekiwane PASS)';
  console.log(`\nWYNIK ${label}: PASS=${pass} FAIL=${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
