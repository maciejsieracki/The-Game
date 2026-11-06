'use strict';
/**
 * hud-topbar-bigger-numbers-real-render-test.cjs -- R-WEB-HUD-TOPBAR-BIGGER-NUMBERS-NO-GAPS-Q1
 * Run (z gra/): node tools/hud-topbar-bigger-numbers-real-render-test.cjs [--shots <katalog>]
 *
 * Prawdziwy renderBarD1B + prawdziwy CSS w Chromium (headless). Dwa bundle w jednym przebiegu:
 *   PRZED = kopia hud.ts z bazy (domyslnie gra/src/ui/hud.__base.ts; generowana z origin/main
 *           przez `git show <baza>:gra/src/ui/hud.ts`, env HUD_BASE)
 *   PO    = biezacy gra/src/ui/hud.ts (env HUD_TS, domyslnie biezacy)
 * Okna 1920/1366/1024/640 px; zestawy liczb: male (12), srednie (3 456), ogromne (2 345 678).
 *   B1 cel 1: font glownej liczby (.civ-hud-chip-val) PO >= 1,25 x PRZED w kazdej komorce
 *   B2 brak przycinania/przepelnienia: scrollWidth <= clientWidth w kazdej komorce; brak poziomego scrolla strony
 *   B3 stały uklad: pozycje x/y/szerokosc komorek i wysokosc banera IDENTYCZNE dla malych i ogromnych liczb
 *   B4 cel 2: przerwa pozioma miedzy glowna liczba a przyrostami (brutto/netto) <= 6 px w kazdej komorce
 *   B5 brutto/netto nadal widoczne w kazdej komorce (dwa elementy przyrostu)
 * Mutacja (cofniecie rozmiaru czcionki = PRZED w PO): HUD_TS=<kopia bazy> MUSI czerwienic B1.
 * Raport: wypisuje tabele przerw (px) i rozmiarow czcionki dla kazdego okna/zestawu.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const argOf = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const HUD_NEW = process.env.HUD_TS || path.join(GRA, 'src/ui/hud.ts');
const HUD_BASE = process.env.HUD_BASE || path.join(GRA, 'src/ui/hud.__base.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-bignum-'));

let fails = 0;
let passes = 0;
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

async function bundle(hudPath, outJs, tag, extraCss) {
  const entry = path.join(TMP, `entry-${tag}.ts`);
  fs.writeFileSync(entry, `import { renderBarD1B, ensureStyles } from ${JSON.stringify(hudPath)};
const EXTRA = ${JSON.stringify(extraCss || '')};
(window as any).__r = (s: any) => { ensureStyles(); if (EXTRA) { const st = document.createElement('style'); st.textContent = EXTRA; document.head.appendChild(st); } document.getElementById('r')!.innerHTML = '<div class="civ-hud">' + renderBarD1B(s) + '</div>'; };`);
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
  armyUnitsOnMap: 2, rekrutEkw: 5,
};
// Zestawy liczb: glowna liczba (bogactwo/praca/zywnosc/nauka/handel/surowce) = 12 / 3 456 / 2 345 678
const numSet = (n) => ({
  ...BASE, bogactwo: n, praca: n, zywnoscLabel: String(n), nauka: n, handelIncome: n > 999 ? Math.round(n / 100) : n, surowceBrutto: n > 999 ? Math.round(n / 100) : n,
  bogactwoRate: -Math.round(n / 3), zywnoscRate: Math.round(n / 4), naukaRate: Math.round(n / 5), pracaRate: Math.round(n / 2), pracaPrognoza: Math.round(n / 2),
  bogactwoWplywyBrutto: n, zywnoscWplywMiast: n, surowceNetto: -Math.round(n / 7),
});
const STATES = { small: numSet(12), mid: numSet(3456), huge: numSet(2345678) };
const ORDER = ['Skarbiec', 'Praca', 'Spichlerz', 'Handel', 'Nauka', 'Surowce'];
const WIDTHS = process.env.HUD_WIDTHS ? process.env.HUD_WIDTHS.split(',').map(Number) : [1920, 1366, 1024, 640];

const MEASURE = () => {
  const out = { cells: {}, banner: null, docSW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth };
  const sb = document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell').getBoundingClientRect();
  out.banner = { x: sb.x, y: sb.y, w: sb.width, h: sb.height, right: sb.right };
  document.querySelectorAll('.civ-hud-banner-left .civ-hud-chip-cell').forEach((c) => {
    const lbl = c.querySelector('.civ-hud-chip-lbl').textContent;
    const r = c.getBoundingClientRect();
    const val = c.querySelector('.civ-hud-chip-val');
    const figs = c.querySelector('.civ-hud-chip-figs');
    const rate = c.querySelector('.civ-hud-chip-rate');
    const net = c.querySelector('.civ-hud-chip-net');
    const vr = val.getBoundingClientRect();
    const fr = figs.getBoundingClientRect();
    const over = [c, ...c.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 0.5 && getComputedStyle(e).display !== 'inline').map((e) => (typeof e.className === 'string' ? e.className : e.tagName));
    out.cells[lbl] = {
      x: r.x, y: r.y, w: r.width,
      fontVal: parseFloat(getComputedStyle(val).fontSize),
      gap: fr.left - vr.right,
      padL: c.querySelector('.civ-hud-chip-med').getBoundingClientRect().left - r.left,
      padR: r.right - c.querySelector('.civ-hud-chip-body').getBoundingClientRect().right,
      hasRate: !!rate, hasNet: !!net,
      rate: rate ? rate.textContent : null, net: net ? net.textContent : null,
      over,
    };
  });
  return out;
};

async function main() {
  if (!fs.existsSync(HUD_BASE)) {
    console.error(`Brak kopii bazy PRZED: ${HUD_BASE}\nWygeneruj: git show 4905bac05:gra/src/ui/hud.ts > gra/src/ui/hud.__base.ts (plik tymczasowy, nie commituj; usun po tescie).`);
    process.exit(2);
  }
  const jsBase = path.join(TMP, 'bundle-base.js');
  const jsNew = path.join(TMP, 'bundle-new.js');
  await bundle(HUD_BASE, jsBase, 'base');
  await bundle(HUD_NEW, jsNew, 'new', (process.env.HUD_EXTRA_CSS_FILE ? fs.readFileSync(process.env.HUD_EXTRA_CSS_FILE, 'utf8') : (process.env.HUD_EXTRA_CSS || '')));
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const res = {};
  try {
    for (const [label, js] of [['before', jsBase], ['after', jsNew]]) {
      for (const w of WIDTHS) {
        for (const [name, st] of Object.entries(STATES)) {
          const page = await br.newPage({ viewport: { width: w, height: 260 } });
          await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1a1d24"><div id="r"></div><div class="power-center" style="position:fixed;left:50%;top:10px;transform:translateX(-50%);min-width:240px;height:60px;background:#222"></div>');
          await page.addScriptTag({ path: js });
          res[label + '/' + w + '/' + name] = await page.evaluate(({ s, fn }) => { window.__r(s); return (new Function('return ' + fn))()(); }, { s: st, fn: MEASURE.toString() });
          if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${label}-${w}-${name}.png`), clip: { x: 0, y: 0, width: w, height: 60 } });
          await page.close();
        }
      }
    }
  } finally { await br.close(); }

  for (const w of WIDTHS) {
    console.log(`-- ${w}px`);
    const small = res['after/' + w + '/small'];
    const bsmall = res['before/' + w + '/small'];
    // B1 cel 1: font +25%
    const ratios = [];
    for (const st of Object.keys(STATES)) {
      const a = res['after/' + w + '/' + st]; const b = res['before/' + w + '/' + st];
      for (const n of ORDER) ratios.push([st, n, +(a.cells[n].fontVal / b.cells[n].fontVal).toFixed(3), b.cells[n].fontVal, a.cells[n].fontVal]);
    }
    const minRatio = Math.min(...ratios.map((r) => r[2]));
    ok(minRatio >= 1.25, `${w}: B1 font glownej liczby >= 1,25x PRZED (min ${minRatio.toFixed(3)})`, ratios.filter((r) => r[2] < 1.25));
    // B2 brak przycinania
    for (const st of Object.keys(STATES)) {
      const m = res['after/' + w + '/' + st];
      const clipped = ORDER.filter((n) => m.cells[n].over.length > 0);
      ok(clipped.length === 0, `${w}/${st}: B2 zero przycinania w komorkach`, clipped.map((n) => [n, m.cells[n].over]));
      ok(m.docSW <= m.vw, `${w}/${st}: B2 brak poziomego scrolla strony`, [m.docSW, m.vw]);
    }
    // B3 stały uklad
    for (const st of ['mid', 'huge']) {
      const m = res['after/' + w + '/' + st];
      const same = ORDER.every((n) => Math.abs(m.cells[n].x - small.cells[n].x) < 0.5 && Math.abs(m.cells[n].y - small.cells[n].y) < 0.5 && Math.abs(m.cells[n].w - small.cells[n].w) < 0.5);
      ok(same, `${w}/${st}: B3 pozycje i szerokosci komorek IDENTYCZNE jak dla 12`, ORDER.map((n) => [m.cells[n].x, m.cells[n].y, m.cells[n].w]));
      ok(Math.abs(m.banner.h - small.banner.h) < 0.5, `${w}/${st}: B3 wysokosc banera stala`, [m.banner.h, small.banner.h]);
    }
    // B4 cel 2 (r3): liczba i przyrosty ZWARTO (przerwa <= 6 px) + grupa wycentrowana (symetria lewo/prawo <= 2 px)
    const gaps = ORDER.map((n) => [n, +small.cells[n].gap.toFixed(1), +res['after/' + w + '/huge'].cells[n].gap.toFixed(1)]);
    const worst = Math.max(...Object.keys(STATES).flatMap((st) => ORDER.map((n) => res['after/' + w + '/' + st].cells[n].gap)));
    ok(worst <= 6, `${w}: B4 przerwa miedzy liczba a przyrostami <= 6 px (max ${worst.toFixed(1)} px)`, gaps);
    const asym = Math.max(...Object.keys(STATES).flatMap((st) => ORDER.map((n) => { const c = res['after/' + w + '/' + st].cells[n]; return Math.abs(c.padL - c.padR); })));
    ok(asym <= 2, `${w}: B4 symetria pustej przestrzeni lewo/prawo w zetonie <= 2 px (max ${asym.toFixed(1)} px)`, ORDER.map((n) => [n, +small.cells[n].padL.toFixed(1), +small.cells[n].padR.toFixed(1)]));
    const huge = res['after/' + w + '/huge'];
    const minSideHuge = Math.min(...ORDER.map((n) => huge.cells[n].padL));
    console.log(`   puste boki zetonu (12): ${ORDER.map((n) => small.cells[n].padL.toFixed(0)).join(' ')} | (2,3M): ${ORDER.map((n) => huge.cells[n].padL.toFixed(0)).join(' ')}  [px na strone; symetryczne]`);
    // przy 1366 i mniej (ogromne liczby wypelniaja najszerszy zeton): puste boki <= 12 px (+3 tolerancji); 1920: baner pelnej szerokosci (N6), tylko raport
    if (w <= 1366) ok(minSideHuge <= 15, `${w}: B4 puste boki najciasniejszego zetonu (2,3M) <= ~12 px (min ${minSideHuge.toFixed(1)})`);
    // B5 brutto/netto widoczne
    ok(ORDER.every((n) => small.cells[n].hasRate && small.cells[n].hasNet), `${w}: B5 kazda komorka ma brutto i netto`);
    console.log(`   PRZED font: ${ORDER.map((n) => bsmall.cells[n].fontVal).join(' ')} | PO font: ${ORDER.map((n) => small.cells[n].fontVal).join(' ')}`);
  }
  console.log(`\n${fails === 0 ? 'PASS' : 'FAIL'}: hud-topbar-bigger-numbers-real-render-test (${passes} ok, ${fails} fail)`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
