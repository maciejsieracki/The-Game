'use strict';
/**
 * hud-topbar-one-row-test.cjs -- R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1
 * Run (z gra/): node tools/hud-topbar-one-row-test.cjs [--shots <katalog>] [--prefix przed|po] [--json <plik>]
 * Env: HUD_TS (domyslnie biezacy gra/src/ui/hud.ts), CHROMIUM, HUD_WIDTHS (domyslnie 1920,1600,1366,1280).
 * Prawdziwy showHud() + prawdziwy CSS w Chromium; zestawy wartosci jak w hud-topbar-layout-a-test.cjs.
 *   K1 wszystkie 11 zetonow surowcow (6 lewy + 5 prawy) w JEDNEJ linii: srodki monet w pionie, rozstrzal <= 2 px
 *   K2 6 zetonow lewego banera o rownej szerokosci (rozstrzal <= 4 px); brak ucietych zetonow, brak scrolla strony
 *   K3 przyciski prawego klastra pod banerem prawym (gora >= dol banera + 4 px); dol lewego banera + 4 px
 *      nie wchodzi w pasek narzedzi mapy
 *   K4 medalion Mocy nie nachodzi na zaden baner
 *   K5 brak trybu dwoch pieter (.hud-left-fallback) i rowsL == 1 przy 1920/1600/1366/1280 (stany + maxw)
 * Mutacja K6 (reczna): wymuszenie .hud-left-fallback w kopii hud.ts MUSI czerwienic K5.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const argOf = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const PREFIX = argOf('--prefix') || 'po';
const REPORT_ONLY = process.argv.includes('--report-only');
const JSON_OUT = argOf('--json');
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const HUD_TS = process.env.HUD_TS || path.join(GRA, 'src/ui/hud.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-layout-a-'));

let fails = 0; let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}

const viteCompat = {
  name: 'vite-compat',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    b.onLoad({ filter: /\.ts$/ }, (a) => {
      const s = fs.readFileSync(a.path, 'utf8');
      if (!s.includes('import.meta.glob')) return null;
      return { contents: 'const __g=()=>({});\n' + s.replace(/import\.meta\.glob/g, '__g'), loader: 'ts', resolveDir: path.dirname(a.path) };
    });
  },
};

async function bundle(hudPath, outJs) {
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, `import * as H from ${JSON.stringify(hudPath)};
let cur: any = null;
(window as any).__show = (s: any) => { cur = s; (H as any).showHud({ getState: () => cur, onOpenMenu: () => {}, onOpenWiki: () => {}, onOpenEmpireRecruit: () => {}, onExecutePending: () => {} }); };
(window as any).__set = (s: any) => { cur = s; (H as any).updateHud(); };`);
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', outfile: outJs, logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' }, plugins: [viteCompat],
  });
}

const BASE = {
  bogactwo: 999, bogactwoRate: -120, bogactwoWplywyBrutto: 480, bogactwoHandel: 82, bogactwoUtrzymanieBudynkow: 400, bogactwoUtrzymanieJednostek: 200,
  praca: 88, pracaRate: 22, pracaPrognoza: 20, pracaUpkeep: 3, pracaAutoUlepszeniaKoszt: 0, pracaCudaKoszt: 0,
  zywnoscLabel: '999', zywnoscRate: 5, zywnoscWplywMiast: 30, zywnoscKosztWojska: 25,
  nauka: 310, naukaRate: 15, kultura: 12, kulturaRate: 1, ludnosc: 12, ludnoscRate: 1,
  osiedla: 3, osiedlaMax: 6, tura: 42, epoka: 'Brąz', power: 100, handelIncome: 6, handelRouteCount: 2,
  surowceSummary: '7/9', surowceAlert: false, surowceBrutto: 6, surowceNetto: 2,
  surowceNiedoborLabels: [], surowceBilans: [{ label: 'Drewno', brutto: 80, netto: 50 }, { label: 'Kamień', brutto: 40, netto: 5 }],
  armyUnitsOnMap: 2, rekrutEkw: 5, religionStock: 0, religionRate: 0,
};
// lewy baner: v = liczba sumaryczna, g = brutto, n = netto
const left = (v, g, n) => ({
  bogactwo: v, bogactwoWplywyBrutto: g, bogactwoRate: n,
  praca: v, pracaPrognoza: n, pracaUpkeep: g - n, pracaRate: n,
  zywnoscLabel: String(v), zywnoscRate: n, zywnoscWplywMiast: g, nauka: v, naukaRate: n,
  handelIncome: g, surowceBrutto: g, surowceNetto: n,
});
const right = (a, ar, o, or_, p, k, kr, r, rr) => ({
  armyUnitsOnMap: a, rekrutEkw: ar, osiedla: o, ludnoscRate: or_, ludnosc: p, kultura: k, kulturaRate: kr, religionStock: r, religionRate: rr,
});
const STATES = {
  male: { ...BASE, ...left(12, 3, 2), ...right(2, 5, 3, 1, 12, 12, 1, 0, 0) },
  srednie: { ...BASE, ...left(20000, 2000, 2000), ...right(12345, 1234, 12345, 1234, 12345, 12345, 1234, 12345, 1234) },
  duze: { ...BASE, ...left(2345678, 123456, 98765), ...right(123456, 12345, 123456, 12345, 123456, 123456, 12345, 123456, 12345) },
  deficyt: { ...BASE, ...left(20000, 2000, -1500), ...right(2, 5, 3, 1, 12, 12, 1, 0, 0) },
  // maks. szerokosc tekstu (jak w hud-topbar-no-labels-test.cjs): 9 cyfr z separatorami i znakiem
  maxw: { ...BASE, bogactwo: 999999999, bogactwoRate: -999900, bogactwoWplywyBrutto: 999999999, praca: 999999999, pracaRate: -999900000, pracaPrognoza: -999900000, zywnoscRate: -999900000, zywnoscWplywMiast: 999999999, nauka: 999999999, naukaRate: -999900000, handelIncome: 999999999, surowceBrutto: 999999999, surowceNetto: -999900000, surowceAlert: true, surowceNiedoborLabels: ['Ceramika'] },
};
const WIDTHS = process.env.HUD_WIDTHS ? process.env.HUD_WIDTHS.split(',').map(Number) : [1920, 1600, 1366, 1280];

const MEASURE = () => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
  const hud = document.querySelector('.civ-hud');
  const out = { docSW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth };
  const shell = document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell');
  const grid = shell.querySelector('.hud-chip-grid');
  const cells = [...grid.querySelectorAll('.civ-hud-chip-cell')];
  const pc = document.querySelector('.power-center');
  out.power = pc ? R(pc) : null;
  out.leftShell = R(shell);
  out.leftGrid = { client: grid.clientWidth, scroll: grid.scrollWidth };
  out.cells = cells.map((c) => {
    const val = c.querySelector('.civ-hud-chip-val'); const rate = c.querySelector('.civ-hud-chip-rate'); const net = c.querySelector('.civ-hud-chip-net');
    const over = [c, ...c.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 0.5 && getComputedStyle(e).display !== 'inline').map((e) => (typeof e.className === 'string' ? e.className : e.tagName));
    return {
      lbl: c.querySelector('.civ-hud-chip-lbl').textContent, ...R(c), med: R(c.querySelector('.civ-hud-chip-med')),
      fVal: parseFloat(getComputedStyle(val).fontSize), fRate: parseFloat(getComputedStyle(rate).fontSize), fNet: parseFloat(getComputedStyle(net).fontSize),
      over,
    };
  });
  const rb = document.querySelector('.civ-hud-banner-right');
  const row = rb.querySelector('.hud-chip-row');
  out.rightShell = R(rb);
  out.rightRow = { client: row.clientWidth, scroll: row.scrollWidth, shellClient: rb.clientWidth, shellScroll: rb.scrollWidth };
  out.rchips = [...row.querySelectorAll('.civ-hud-chip')].map((c) => {
    const med = c.querySelector('.civ-hud-chip-med');
    return { ...R(c), med: R(med), over: c.scrollWidth > c.clientWidth + 0.5, txt: c.textContent.replace(/\s+/g, ' ').trim() };
  });
  const btns = document.querySelector('.hud-right');
  out.buttons = btns ? R(btns) : null;
  out.fallback = !!hud.querySelector('.hud-left-fallback');
  out.tbTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--civ-hud-toolbar-top')) || 104;
  return out;
};

async function main() {
  const js = path.join(TMP, 'bundle.js');
  await bundle(HUD_TS, js);
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const res = {};
  const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  try {
    for (const w of WIDTHS) {
      for (const [name, st] of Object.entries(STATES)) {
        const page = await br.newPage({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1 });
        await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1a1d24"></body>');
        await page.addScriptTag({ path: js });
        await page.evaluate((s) => window.__show(s), st);
        await settle(page);
        const m = await page.evaluate(MEASURE);
        res[w + '/' + name] = m;
        if (SHOTS) {
          const h = Math.ceil(Math.min(300, Math.max(m.leftShell.b, m.rightShell.b, (m.buttons || { b: 0 }).b) + 14));
          await page.screenshot({ path: path.join(SHOTS, `${PREFIX}-${w}-${name}.png`), clip: { x: 0, y: 0, width: w, height: h } });
        }
        if (name === 'male') {
          await page.evaluate((s) => window.__set(s), { ...st, ...left(34, 9, 7) });
          await settle(page);
          res[w + '/male2'] = await page.evaluate(MEASURE);
        }
        await page.close();
      }
    }
  } finally { await br.close(); }

  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(res));
  const inter = (a, b) => !!(a && b && a.x < b.r - 0.5 && b.x < a.r - 0.5 && a.y < b.b - 0.5 && b.y < a.b - 0.5);
  const rows = [];
  for (const w of WIDTHS) {
    console.log(`-- ${w}px`);
    for (const name of [...Object.keys(STATES), 'male2']) {
      const m = res[w + '/' + name];
      const lTops = new Set(m.cells.map((c) => Math.round(c.y)));
      const rTops = new Set(m.rchips.map((c) => Math.round(c.y)));
      const ratio = Math.min(...m.cells.flatMap((c) => [c.fRate / c.fVal, c.fNet / c.fVal]));
      let overlap = 0;
      for (let i = 0; i < m.cells.length; i++) for (let j = i + 1; j < m.cells.length; j++) if (inter(m.cells[i], m.cells[j])) overlap++;
      const info = {
        w, name, fallback: m.fallback, rowsL: lTops.size, ratio: +ratio.toFixed(3), fVal: m.cells[0].fVal, fPlus: m.cells[0].fRate,
        clipped: m.cells.filter((c) => c.over.length > 0).map((c) => c.lbl), overlap, docOverflow: m.docSW > m.vw,
        leftOverPower: m.power ? m.leftShell.r > m.power.x + 0.5 : false, leftH: Math.round(m.leftShell.h),
        rTopsN: rTops.size, rClipped: m.rchips.some((c) => c.x < m.rightShell.x - 0.5 || c.r > m.rightShell.r + 0.5) || m.rightRow.shellScroll > m.rightRow.shellClient + 0.5,
        rScroll: m.rightRow.scroll, rClient: m.rightRow.client, rShellW: Math.round(m.rightShell.w),
        rOverPower: inter(m.rightShell, m.power), rOverLeft: inter(m.rightShell, m.leftShell), rOverBtn: inter(m.rightShell, m.buttons),
        rOffscreen: m.rightShell.r > m.vw + 0.5 || m.rightShell.x < -0.5,
        iconOut: m.rchips.some((c) => c.med.x < c.x - 0.5 || c.med.r > c.r + 0.5 || c.med.y < c.y - 0.5 || c.med.b > c.b + 0.5),
      };
      rows.push(info);
      console.log('   ' + JSON.stringify(info));
    }
  }
  if (REPORT_ONLY) { console.log('REPORT-ONLY'); process.exit(0); }

  for (const w of WIDTHS) {
    for (const n of Object.keys(STATES)) {
      const r = rows.find((x) => x.w === w && x.name === n); const m = res[w + '/' + n];
      const tops = [...m.cells.map((c) => c.med.y + c.med.h / 2), ...m.rchips.map((c) => c.med.y + c.med.h / 2)];
      const spread = Math.max(...tops) - Math.min(...tops);
      ok(spread <= 2, `${w}/${n}: K1 11 monet surowcow w jednej linii (rozstrzal srodkow w pionie ${spread.toFixed(1)} px)`, tops);
      const widths = m.cells.map((c) => c.w);
      const wSpread = Math.max(...widths) - Math.min(...widths);
      ok(wSpread <= 4, `${w}/${n}: K2 6 zetonow lewego banera o rownej szerokosci (rozstrzal ${wSpread.toFixed(1)} px)`, widths);
      ok(r.clipped.length === 0 && r.overlap === 0 && !r.docOverflow && !r.rClipped, `${w}/${n}: K2 brak ucietych/nakladajacych sie zetonow obu banerow, brak scrolla strony`, r);
      const btnTop = m.buttons ? m.buttons.y : null;
      ok(btnTop !== null && btnTop >= m.rightShell.b + 4, `${w}/${n}: K3 przyciski prawego klastra pod banerem (gora ${btnTop === null ? 'brak' : Math.round(btnTop)} >= dol banera ${Math.round(m.rightShell.b)} + 4)`);
      ok(m.leftShell.b + 4 <= m.tbTop + 0.5, `${w}/${n}: K3 dol lewego banera (${Math.round(m.leftShell.b)}) + 4 px nie wchodzi w pasek narzedzi mapy (top ${Math.round(m.tbTop)})`);
      ok(!r.rOverPower && !r.leftOverPower, `${w}/${n}: K4 medalion Mocy nie nachodzi na baner lewy ani prawy`, r);
      ok(!r.fallback && r.rowsL === 1, `${w}/${n}: K5 brak dwoch pieter (fallback=${r.fallback}, rowsL=${r.rowsL})`);
    }
  }
  console.log(`\n${fails === 0 ? 'PASS' : 'FAIL'}: hud-topbar-one-row-test (${passes} ok, ${fails} fail)`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
