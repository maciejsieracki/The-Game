// R-WEB-HUD-TOPBAR-LAYOUT-PROTOTYPE-Q1 — render prototypów układu banera HUD (BEZ zmian w gra/).
// Użycie (z korzenia repo, po `npm ci --ignore-scripts` w gra/):
//   node dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-LAYOUT-PROTOTYPE-Q1/render-prototypy.mjs
// Env: GRA (domyślnie <repo>/gra), OUT (domyślnie katalog skryptu), TMPDIR_PROTO (katalog roboczy POZA repo), CHROMIUM.
// Co robi: bundluje PRAWDZIWY gra/src/ui/hud.ts (renderBarD1B + ensureStyles + prawdziwy CSS) esbuildem do katalogu
// tymczasowego POZA repo, ładuje w Chromium, a potem wstrzykuje WYŁĄCZNIE CSS (uklad-*.css) i podmienia teksty wartości.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GRA = process.env.GRA || path.resolve(HERE, '../../../../gra');
const OUT = process.env.OUT || HERE;
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR_PROTO || os.tmpdir(), 'hud-proto-'));
const req = createRequire(path.join(GRA, 'package.json'));
const esbuild = req('esbuild');
const { chromium } = req('playwright');

const NBSP = ' ';
const grp = (n) => String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
const plus = (n) => '+' + grp(n);
const minus = (n) => '−' + grp(n);
// zestawy wartości: val = liczba sumaryczna, g = +brutto, n = netto (tekst), neg = netto ujemne
const SETS = {
  male:    { val: grp(12),      g: plus(3),      n: plus(2),       neg: false },
  '20000': { val: grp(20000),   g: plus(2000),   n: plus(2000),    neg: false },
  duze:    { val: grp(2345678), g: plus(123456), n: plus(98765),   neg: false },
  deficyt: { val: grp(20000),   g: plus(2000),   n: minus(1500),   neg: true },
};
const WIDTHS = [1920, 1366, 1024, 640];
const VARIANTS = ['A', 'B', 'C'];
const css = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');
const VCSS = Object.fromEntries(VARIANTS.map((v) => [v, css('uklad-wspolne.css') + '\n' + css(`uklad-${v}.css`)]));

// --- bundle prawdziwego hud.ts (poza repo) ---
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
const entry = path.join(TMP, 'entry.ts');
const bundleJs = path.join(TMP, 'bundle.js');
fs.writeFileSync(entry, `import { renderBarD1B, ensureStyles } from ${JSON.stringify(path.join(GRA, 'src/ui/hud.ts'))};
(window as any).__r = (s: any) => { ensureStyles(); document.getElementById('r')!.innerHTML = '<div class="civ-hud">' + renderBarD1B(s) + '</div>'; };`);
await esbuild.build({
  entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', outfile: bundleJs, logLevel: 'silent',
  loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' }, plugins: [viteCompat],
});

const STATE = {
  bogactwo: 20000, bogactwoRate: 2000, bogactwoWplywyBrutto: 2000, bogactwoHandel: 82, bogactwoUtrzymanieBudynkow: 400, bogactwoUtrzymanieJednostek: 200,
  praca: 20000, pracaRate: 2000, pracaPrognoza: 2000, pracaUpkeep: 3, pracaAutoUlepszeniaKoszt: 0, pracaCudaKoszt: 0,
  zywnoscLabel: '20000', zywnoscRate: 2000, zywnoscWplywMiast: 2000, zywnoscKosztWojska: 25,
  nauka: 20000, naukaRate: 2000, kultura: 12, kulturaRate: 1, ludnosc: 12, ludnoscRate: 1,
  osiedla: 3, osiedlaMax: 6, tura: 42, epoka: 'Brąz', power: 100, handelIncome: 2000, handelRouteCount: 2,
  surowceSummary: '7/9', surowceAlert: false, surowceBrutto: 2000, surowceNetto: 2000,
  surowceNiedoborLabels: [], surowceBilans: [{ label: 'Drewno', brutto: 80, netto: 50 }, { label: 'Kamień', brutto: 40, netto: 5 }],
  armyUnitsOnMap: 2, rekrutEkw: 5,
};

// --- funkcje wykonywane w stronie ---
const applySet = (set) => {
  document.querySelectorAll('.civ-hud-banner-left .civ-hud-chip-cell').forEach((c) => {
    const lbl = c.querySelector('.civ-hud-chip-lbl');
    if (lbl && !c.getAttribute('title')) c.setAttribute('title', lbl.textContent);
    c.querySelector('.civ-hud-chip-val').textContent = set.val;
    const rate = c.querySelector('.civ-hud-chip-rate');
    const net = c.querySelector('.civ-hud-chip-net');
    rate.textContent = set.g; rate.classList.remove('zero', 'neg'); rate.classList.add('pos');
    net.textContent = set.n; net.classList.remove('zero', 'neg', 'pos'); net.classList.add(set.neg ? 'neg' : 'pos');
  });
};
const measure = () => {
  const hud = document.querySelector('.civ-hud');
  const shell = document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell');
  const grid = shell.querySelector('.hud-chip-grid');
  const sb = shell.getBoundingClientRect();
  const pc = document.querySelector('.power-center');
  const cells = [...grid.querySelectorAll('.civ-hud-chip-cell')];
  const rects = cells.map((c) => c.getBoundingClientRect());
  const cellOverflow = cells.filter((c) => [c, ...c.querySelectorAll('*')].some((e) => e.scrollWidth > e.clientWidth + 0.5 && getComputedStyle(e).display !== 'inline')).length;
  let overlap = 0;
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) overlap++;
  }
  const fv = cells.map((c) => parseFloat(getComputedStyle(c.querySelector('.civ-hud-chip-val')).fontSize));
  const fp = cells.map((c) => parseFloat(getComputedStyle(c.querySelector('.civ-hud-chip-rate')).fontSize));
  const fn = cells.map((c) => parseFloat(getComputedStyle(c.querySelector('.civ-hud-chip-net')).fontSize));
  const rows = new Set(rects.map((r) => Math.round(r.top))).size;
  return {
    fallback: hud.classList.contains('proto-fallback'),
    gridClient: grid.clientWidth, gridScroll: grid.scrollWidth,
    bannerW: sb.width, bannerH: sb.height, bannerRight: sb.right, bannerBottom: sb.bottom,
    powerLeft: pc ? pc.getBoundingClientRect().left : null,
    cellOverflow, overlap, rows,
    docSW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth,
    fontVal: Math.min(...fv), fontPlus: Math.min(...fp, ...fn), ratio: Math.min(...fp.map((p, i) => p / fv[i]), ...fn.map((p, i) => p / fv[i])),
    cellW: Math.min(...rects.map((r) => r.width)),
  };
};

const csv = [['wariant', 'szerokosc_px', 'zestaw', 'tryb', 'miesci_sie_w_1_linii', 'wymagana_szer_1_linii_px', 'dostepna_szer_banera_px', 'zetony_przyciete', 'nakladanie_par', 'rzedy', 'wysokosc_banera_px', 'baner_prawa_krawedz_px', 'moc_lewa_krawedz_px', 'baner_zachodzi_na_moc', 'poziomy_scroll_strony', 'font_liczby_px', 'font_plusow_px', 'plusy_do_liczby', 'plik']];
const scanCsv = [['wariant', 'zestaw', 'szerokosc_px', 'miesci_sie_w_1_linii', 'wymagana_px', 'dostepna_px']];
const summary = {};

const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
const SHOT_H = (m) => Math.ceil(m.bannerBottom + 14);
try {
  for (const v of VARIANTS) {
    for (const [sname, set] of Object.entries(SETS)) {
      for (const w of WIDTHS) {
        const page = await br.newPage({ viewport: { width: w, height: 300 }, deviceScaleFactor: 2 });
        await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1a1d24"><div id="r"></div>');
        await page.addScriptTag({ path: bundleJs });
        await page.evaluate((s) => window.__r(s), STATE);
        await page.addStyleTag({ content: VCSS[v] });
        await page.evaluate(`(${applySet.toString()})(${JSON.stringify(set)})`);
        let m = await page.evaluate(`(${measure.toString()})()`);
        const oneLineVariant = v !== 'B';
        const needW = m.gridScroll, availW = m.gridClient;
        const fits1 = oneLineVariant ? (m.gridScroll <= m.gridClient + 0.5 && m.cellOverflow === 0 && m.rows === 1) : false;
        let mode = v === 'B' ? '2x3' : '1-linia';
        if (oneLineVariant && !fits1) {
          await page.evaluate("document.querySelector('.civ-hud').classList.add('proto-fallback')");
          m = await page.evaluate(`(${measure.toString()})()`);
          mode = 'fallback-2x3';
        }
        const clipped = m.cellOverflow > 0 || m.gridScroll > m.gridClient + 0.5;
        const overMoc = m.powerLeft !== null && m.bannerRight > m.powerLeft + 0.5;
        const file = `zrzut-${v}-${w}-${sname}${mode === 'fallback-2x3' ? '-fallback' : ''}${clipped ? '-PRZYCIETE' : ''}.png`;
        await page.screenshot({ path: path.join(OUT, file), clip: { x: 0, y: 0, width: w, height: Math.min(300, SHOT_H(m)) } });
        csv.push([v, w, sname, mode, oneLineVariant ? (fits1 ? 'tak' : 'nie') : 'n/d', oneLineVariant ? Math.round(needW) : 'n/d', Math.round(availW),
          m.cellOverflow, m.overlap, m.rows, Math.round(m.bannerH), Math.round(m.bannerRight), m.powerLeft === null ? 'NIE_ZMIERZONO' : Math.round(m.powerLeft),
          overMoc ? 'tak' : 'nie', m.docSW > m.vw ? 'tak' : 'nie', m.fontVal, +m.fontPlus.toFixed(2), +m.ratio.toFixed(3), file]);
        summary[`${v}/${w}/${sname}`] = { mode, fits1, clipped, overMoc, ratio: m.ratio };
        await page.close();
      }
      // skan szerokości okna: od kiedy zmieści się w jednej linii (A, C) albo w 2x3 bez przycięcia (B)
      const page = await br.newPage({ viewport: { width: 1000, height: 300 } });
      await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1a1d24"><div id="r"></div>');
      await page.addScriptTag({ path: bundleJs });
      await page.evaluate((s) => window.__r(s), STATE);
      await page.addStyleTag({ content: VCSS[v] });
      await page.evaluate(`(${applySet.toString()})(${JSON.stringify(set)})`);
      for (let w = 640; w <= 3000; w += 20) {
        await page.setViewportSize({ width: w, height: 300 });
        const m = await page.evaluate(`(${measure.toString()})()`);
        const ok = v === 'B' ? (m.cellOverflow === 0 && m.gridScroll <= m.gridClient + 0.5) : (m.gridScroll <= m.gridClient + 0.5 && m.cellOverflow === 0 && m.rows === 1);
        scanCsv.push([v, sname, w, ok ? 'tak' : 'nie', Math.round(m.gridScroll), Math.round(m.gridClient)]);
      }
      await page.close();
    }
  }
} finally { await br.close(); }

fs.writeFileSync(path.join(OUT, 'pomiary.csv'), csv.map((r) => r.join(';')).join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'pomiary-skan-szerokosci.csv'), scanCsv.map((r) => r.join(';')).join('\n') + '\n');

// --- kolaże (HTML z <img>, zrzut Chromium) ---
const collage = async (name, rows) => {
  const maxW = Math.max(...rows.map((r) => r.w));
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0d0f14;color:#e8d88a;font:600 13px system-ui;padding:10px;width:${maxW}px">`
    + rows.map((r) => `<div style="margin:6px 0 2px">${r.cap}</div><img style="display:block;width:${r.w}px;border:1px solid #2a2f3a" src="${r.file}">`).join('') + '</body>';
  const p = path.join(OUT, `_kolaz-tmp-${name}.html`);
  fs.writeFileSync(p, html);
  const page = await br2.newPage({ viewport: { width: maxW + 20, height: 400 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + p);
  await page.waitForLoadState('load');
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
  await page.close();
  fs.unlinkSync(p);
};
const br2 = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
const fileOf = (v, w, s) => {
  const x = summary[`${v}/${w}/${s}`];
  return `zrzut-${v}-${w}-${s}${x.mode === 'fallback-2x3' ? '-fallback' : ''}${x.clipped ? '-PRZYCIETE' : ''}.png`;
};
const capOf = (v, w, s) => {
  const x = summary[`${v}/${w}/${s}`];
  return `${v} · okno ${w} px · wartości 20 000 / +2 000 / +2 000 · tryb: ${x.mode}${x.clipped ? ' · PRZYCIĘTE (nie mieści się)' : ' · mieści się'}`;
};
try {
  for (const v of VARIANTS) await collage(`kolaz-${v}.png`, WIDTHS.map((w) => ({ w, file: fileOf(v, w, '20000'), cap: capOf(v, w, '20000') })));
  await collage('kolaz-porownanie-1366.png', VARIANTS.map((v) => ({ w: 1366, file: fileOf(v, 1366, '20000'), cap: capOf(v, 1366, '20000') })));
} finally { await br2.close(); }
fs.rmSync(TMP, { recursive: true, force: true });
console.log('OK', csv.length - 1, 'wierszy pomiarów');
