'use strict';
/**
 * hud-topbar-layout-a-test.cjs -- R-WEB-HUD-TOPBAR-LAYOUT-A-Q1
 * Run (z gra/): node tools/hud-topbar-layout-a-test.cjs [--shots <katalog>] [--prefix przed|po] [--report-only] [--json <plik>]
 * Env: HUD_TS (domyslnie biezacy gra/src/ui/hud.ts; do PRZED: kopia hud.ts z bazy w gra/src/ui/), CHROMIUM, HUD_WIDTHS.
 *
 * PRAWDZIWY showHud() (pasek D1B, prawy klaster z przyciskami Rekrutacja/Civpedia/Menu, medalion Mocy)
 * + prawdziwy CSS w Chromium headless; bundle esbuild do katalogu tymczasowego. Okna 1920/1366/1024/640,
 * zestawy wartosci: male / srednie / duze / deficyt
 * (lewy baner 12 | 20 000 | 2 345 678 | 20 000 z ujemnym netto; prawy 2,3,12,12,0 | 12 345 +1 234 | 123 456 +12 345).
 *   L1 plusy (brutto/netto) >= 0,68 x rozmiar liczby sumarycznej (kazdy zeton, kazde okno)
 *   L2 lewy baner: 1 linia albo fallback 2x3; zero ucietych zetonow, brak poziomego scrolla strony,
 *      brak nakladania zetonow, brak zachodzenia na medalion Mocy
 *   L3 staly uklad: w ramach tego samego trybu pozycje zetonow nie zmieniaja sie z wartoscia
 *   R1 prawy baner: WSZYSTKIE chipy w jednej linii (jedna wartosc `top`) przy 1920/1366/1024 (przy 640 tez: ikona nie schodzi)
 *   R2 prawy baner: brak ucietych chipow (scrollWidth <= clientWidth) przy 1920/1366/1024
 *   R3 prawy baner nie zachodzi na medalion Mocy, lewy baner ani przyciski prawego klastra; miesci sie w oknie
 * Mutacja: HUD_TS=<kopia bazy> MUSI czerwienic L1 i R1.
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
};
const WIDTHS = process.env.HUD_WIDTHS ? process.env.HUD_WIDTHS.split(',').map(Number) : [1920, 1366, 1024, 640];

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
      lbl: c.querySelector('.civ-hud-chip-lbl').textContent, ...R(c),
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
      ok(r.ratio >= 0.68, `${w}/${n}: L1 plusy >= 0,68 x liczba (min ${r.ratio})`);
      const row1 = m.cells.filter((c) => Math.round(c.y) === Math.round(m.cells[0].y)).length;
      ok(r.fallback ? (r.rowsL === 2 && row1 === 3) : r.rowsL === 1, `${w}/${n}: L2 tryb ${r.fallback ? 'fallback 2x3' : '1 linia'} spojny z rzedami (${r.rowsL})`);
      ok(r.clipped.length === 0 && r.overlap === 0 && !r.docOverflow && !r.leftOverPower, `${w}/${n}: L2 lewy baner bez ucietych/nakladania/scrolla/zachodzenia na Moc`, r);
      ok(m.leftGrid.scroll <= m.leftGrid.client + 0.5, `${w}/${n}: L2 grid scrollWidth <= clientWidth`, m.leftGrid);
      ok(r.rTopsN === 1 && !r.iconOut, `${w}/${n}: R1 wszystkie chipy prawego banera w jednej linii, ikony w chipach`, m.rchips.map((c) => [c.txt, c.y]));
      if (w >= 1024) ok(!r.rClipped, `${w}/${n}: R2 prawy baner bez uciec (scrollWidth<=clientWidth)`, [r.rScroll, r.rClient]);
      ok(m.leftShell.b <= m.tbTop + 0.5, `${w}/${n}: L2 dol lewego banera (${Math.round(m.leftShell.b)}) nie wchodzi w pasek narzedzi (top ${Math.round(m.tbTop)})`);
      ok(m.rightShell.b <= 104.5, `${w}/${n}: R3 dol prawego banera (${Math.round(m.rightShell.b)}) nie wchodzi w panel boczny (104)`);
      ok(!r.rOverPower && !r.rOverLeft && !r.rOverBtn && !r.rOffscreen, `${w}/${n}: R3 prawy baner bez nakladania i w oknie`, r);
    }
    const a = res[w + '/male']; const b = res[w + '/male2'];
    if (a.fallback === b.fallback) {
      ok(a.cells.every((c, i) => Math.abs(c.x - b.cells[i].x) < 0.5 && Math.abs(c.y - b.cells[i].y) < 0.5 && Math.abs(c.w - b.cells[i].w) < 0.5), `${w}: L3 pozycje zetonow stale przy zmianie liczb w tym samym trybie`);
    }
  }
  console.log(`\n${fails === 0 ? 'PASS' : 'FAIL'}: hud-topbar-layout-a-test (${passes} ok, ${fails} fail)`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
