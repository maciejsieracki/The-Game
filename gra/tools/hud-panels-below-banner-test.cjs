'use strict';
/**
 * hud-panels-below-banner-test.cjs -- R-WEB-HUD-PANELS-BELOW-BANNER-Q1
 * Run (z gra/): node tools/hud-panels-below-banner-test.cjs [--shots <katalog>] [--prefix przed|po] [--json <plik>]
 * Prawdziwy showHud() + prawdziwy arkusz paneli list (sideListHud.css) + panel na wspolnej stalej SIDE_PANEL_TOP
 * (Dyplomacja/Badania/Civpedia/picker) w Chromium. Asercja: dol lewego banera <= top KAZDEGO panelu bocznego
 * (1920/1366/1024/640; zestawy 2/3/12/12/0, 12 345 +1 234, 123 456 +12 345, deficyt), panel nigdy wyzej niz 104,
 * tryb 1-liniowy = przesuniecie 0, panel miesci sie w oknie, brak skoku przy zmianie liczb.
 * Mutacja: przywrocenie sidePanelLayout.ts z bazy (top:104px) MUSI czerwienic test.
 */
const REPORT_ONLY = false;
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const argOf = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const PREFIX = argOf('--prefix') || 'po';
const JSON_OUT = argOf('--json');
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const HUD_TS = process.env.HUD_TS || path.join(GRA, 'src/ui/hud.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-panels-below-'));

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
(window as any).__set = (s: any) => { cur = s; (H as any).updateHud(); };
import { ensureSideListHudStyles, SIDE_LIST_ROOT_CLASS } from ${JSON.stringify(path.join(GRA, 'src/ui/sideListHud.css'))};
import { SIDE_PANEL_TOP } from ${JSON.stringify(path.join(GRA, 'src/ui/sidePanelLayout'))};
(window as any).__panels = () => {
  ensureSideListHudStyles();
  const mk = (cls: string, style: string, label: string) => { const d = document.createElement('div'); d.className = cls; d.style.cssText = style; d.textContent = label; document.body.appendChild(d); return d; };
  // 1) prawdziwy arkusz paneli list (Miasta/Wojsko) 2) wspolna stala SIDE_PANEL_TOP uzywana przez Dyplomacje/Badania/Civpedia/picker
  mk(SIDE_LIST_ROOT_CLASS + ' open', '', 'PANEL LISTY (Miasta/Wojsko)');
  mk('probe-shared-top', 'position:fixed;left:420px;bottom:60px;width:300px;z-index:311;background:rgba(20,30,50,.95);color:#e8e0c8;top:' + SIDE_PANEL_TOP, 'PANEL (Dyplomacja/Badania/Civpedia: SIDE_PANEL_TOP)');
};`);
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
  const shell = document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell');
  const panels = [...document.querySelectorAll('.civ-side-list-hud, .probe-shared-top')].map((p) => ({ cls: p.className, ...R(p) }));
  const tb = document.querySelector('.civ-map-toolbar');
  return { vh: document.documentElement.clientHeight, left: R(shell), panels, toolbarTop: tb ? tb.getBoundingClientRect().top : null,
    fallback: !!document.querySelector('.hud-left-fallback'), varTop: document.documentElement.style.getPropertyValue('--civ-hud-toolbar-top') };
};

async function main() {
  const js = path.join(TMP, 'bundle.js');
  await bundle(HUD_TS, js);
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const res = {};
  try {
    for (const w of WIDTHS) {
      for (const [name, st] of Object.entries(STATES)) {
        const page = await br.newPage({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1 });
        await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1a1d24"></body>');
        await page.addScriptTag({ path: js });
        await page.evaluate((s) => window.__show(s), st);
        await page.evaluate(() => window.__panels());
        await settle(page);
        const m = await page.evaluate(MEASURE);
        res[w + '/' + name] = m;
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${PREFIX}-${w}-${name}.png`), clip: { x: 0, y: 0, width: w, height: 420 } });
        if (name === 'male' && m.fallback === false) {
          // zmiana liczb w trakcie gry: panel nie moze skakac, gdy tryb banera sie nie zmienia
          await page.evaluate((s) => window.__set(s), { ...st, ...left(34, 9, 7) });
          await settle(page);
          const m2 = await page.evaluate(MEASURE);
          res[w + '/male-stable'] = { a: m, b: m2 };
        }
        await page.close();
      }
    }
  } finally { await br.close(); }
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(res));

  for (const w of WIDTHS) {
    console.log(`-- ${w}px`);
    for (const name of Object.keys(STATES)) {
      const m = res[w + '/' + name];
      ok(m.panels.length === 2, `${w}/${name}: zmontowano 2 panele`, m.panels.length);
      for (const p of m.panels) {
        const tag = p.cls.split(' ')[0];
        ok(m.left.b <= p.y + 0.5, `${w}/${name}: ${tag} top (${Math.round(p.y)}) >= dol lewego banera (${Math.round(m.left.b)})`);
        ok(p.y >= 104 - 0.5, `${w}/${name}: ${tag} nigdy wyzej niz 104 px (${Math.round(p.y)})`);
        ok(p.b <= m.vh + 0.5 && p.h > 100, `${w}/${name}: ${tag} miesci sie w oknie i ma wysokosc (${Math.round(p.h)})`);
        if (!m.fallback) ok(Math.abs(p.y - 104) < 0.5, `${w}/${name}: ${tag} tryb 1-liniowy: przesuniecie 0 (top ${Math.round(p.y)})`);
      }
    }
    const s = res[w + '/male-stable'];
    if (s) ok(s.a.panels.every((p, i) => Math.abs(p.y - s.b.panels[i].y) < 0.5 && Math.abs(p.h - s.b.panels[i].h) < 0.5), `${w}: panele bez skoku przy zmianie liczb w tym samym trybie`);
  }
  console.log(`\n${fails === 0 ? 'PASS' : 'FAIL'}: hud-panels-below-banner-test (${passes} ok, ${fails} fail)`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
