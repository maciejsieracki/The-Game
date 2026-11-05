'use strict';
/**
 * hud-topbar-no-labels-test.cjs -- R-WEB-HUD-TOPBAR-NO-LABELS-Q1
 * Run (z gra/): node tools/hud-topbar-no-labels-test.cjs
 *
 * Prawdziwy renderBarD1B + prawdziwy CSS w Chromium (headless), szerokosci 1280/1024/800/640:
 *   N1 w banerze (widoczny tekst) NIE ma slow „brutto" / „netto"
 *   N2 kazda komorka: duza liczba calkowita + DWIE liczby przyrostu (brutto, potem netto)
 *   N3 tooltip (title) kazdej komorki wyjasnia BRUTTO i NETTO
 *   N4 uklad staly: pozycje x/y komorek i wysokosc banera IDENTYCZNE dla malych/duzych/ogromnych liczb
 *   N5 zero przycinania i zero nachodzenia: kazdy element w komorce miesci sie (scrollWidth<=clientWidth)
 *   N6 baner zajmuje dostepna szerokosc: prawy brzeg banera <= lewy brzeg medalionu Mocy (min-width 240)
 *      oraz szerokosc >= 90% (50vw - 150 px)
 *   N7 kolory: netto ujemne = czerwone, dodatnie = zielone (tylko na 1280)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-nolabels-'));
const SHOTS = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;

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

async function bundle(outJs) {
  const hudTs = path.join(GRA, 'src/ui/hud.ts');
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, `import { renderBarD1B, ensureStyles } from ${JSON.stringify(hudTs)};
(window as any).__r = (s: any) => { ensureStyles(); document.getElementById('r')!.innerHTML = '<div class="civ-hud">' + renderBarD1B(s) + '</div>'; };`);
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
const STATES = {
  small: BASE,
  big: { ...BASE, bogactwo: 24400, bogactwoRate: 1200, bogactwoWplywyBrutto: 4800, praca: 9500, pracaRate: 7300, pracaPrognoza: 7300, zywnoscRate: 2000, zywnoscWplywMiast: 4000, nauka: 8200, naukaRate: 2700, handelIncome: 820, surowceBrutto: 820, surowceNetto: 700 },
  huge: { ...BASE, bogactwo: 1234567, bogactwoRate: -999999, bogactwoWplywyBrutto: 1234567, praca: 1234567, pracaRate: 1234567, pracaPrognoza: 1234567, zywnoscLabel: '1234567', zywnoscRate: -1234567, zywnoscWplywMiast: 1234567, nauka: 1234567, naukaRate: 1234567, handelIncome: 1234567, surowceBrutto: 1234567, surowceNetto: -1234567, surowceAlert: true, surowceNiedoborLabels: ['Ceramika'] },
};
// maks. szerokosc tekstu: 9 cyfr z separatorami i znakiem (wartosci ponad 999 999 skracane k/M jak w HUD)
STATES.maxw = { ...BASE, bogactwo: 999999999, bogactwoRate: -999900, bogactwoWplywyBrutto: 999999999, praca: 999999999, pracaRate: -999900000, pracaPrognoza: -999900000, zywnoscRate: -999900000, zywnoscWplywMiast: 999999999, nauka: 999999999, naukaRate: -999900000, handelIncome: 999999999, surowceBrutto: 999999999, surowceNetto: -999900000, surowceAlert: true, surowceNiedoborLabels: ['Ceramika'] };
const ORDER = ['Skarbiec', 'Praca', 'Spichlerz', 'Handel', 'Nauka', 'Surowce'];
const WIDTHS = [1280, 1024, 800, 640];

const MEASURE = () => {
  const out = { cells: {}, banner: null, power: null, texts: '' };
  const shell = document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell');
  const sb = shell.getBoundingClientRect();
  out.banner = { x: sb.x, y: sb.y, w: sb.width, h: sb.height, right: sb.right };
  const pc = document.querySelector('.civ-hud .power-center');
  if (pc) { const r = pc.getBoundingClientRect(); out.power = { x: r.x, w: r.width }; }
  out.texts = document.querySelector('.civ-hud-banner-left').innerText;
  document.querySelectorAll('.civ-hud-banner-left .civ-hud-chip-cell').forEach((c) => {
    const lbl = c.querySelector('.civ-hud-chip-lbl').textContent;
    const r = c.getBoundingClientRect();
    const over = [c, ...c.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 0.5 && getComputedStyle(e).display !== 'inline').map((e) => e.className && e.className.baseVal === undefined ? e.className : e.tagName);
    const rateEl = c.querySelector('.civ-hud-chip-rate');
    const netEl = c.querySelector('.civ-hud-chip-net');
    const valEl = c.querySelector('.civ-hud-chip-val');
    // przeskok: prawy brzeg wszystkich dzieci w obrebie komorki
    const kids = [...c.querySelectorAll('.civ-hud-chip-val, .civ-hud-chip-rate, .civ-hud-chip-net, .civ-hud-chip-lbl')].map((e) => e.getBoundingClientRect());
    const maxRight = Math.max(...kids.map((k) => k.right), r.right);
    out.cells[lbl] = {
      x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
      right: Math.round(maxRight * 10) / 10,
      val: valEl ? valEl.textContent : null, rate: rateEl ? rateEl.textContent : null, net: netEl ? netEl.textContent : null,
      rateCls: rateEl ? rateEl.className : null, netCls: netEl ? netEl.className : null,
      title: c.getAttribute('title') || '', over,
      netColor: netEl ? getComputedStyle(netEl).color : null,
    };
  });
  return out;
};

async function main() {
  const jsPath = path.join(TMP, 'hud-bundle.js');
  await bundle(jsPath);
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const res = {};
  try {
    for (const w of WIDTHS) {
      for (const [name, st] of Object.entries(STATES)) {
        const page = await br.newPage({ viewport: { width: w, height: 260 } });
        await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1a1d24"><div id="r"></div><div class="power-center" style="position:fixed;left:50%;top:10px;transform:translateX(-50%);min-width:240px;height:60px;background:#222"></div>');
        await page.addScriptTag({ path: jsPath });
        res[w + '/' + name] = await page.evaluate(({ s, fn }) => { window.__r(s); return (new Function('return ' + fn))()(); }, { s: st, fn: MEASURE.toString() });
        if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `topbar-${name}-${w}.png`), clip: { x: 0, y: 0, width: w, height: 110 } });
        await page.close();
      }
    }
  } finally { await br.close(); }

  for (const w of WIDTHS) {
    const small = res[w + '/small'];
    console.log(`-- ${w}px`);
    ok(!/brutto|netto/i.test(small.texts), `${w}: N1 widoczny tekst banera bez „brutto"/„netto"`, small.texts.slice(0, 200));
    ok(ORDER.every((n) => small.cells[n]), `${w}: N2 6 komorek z etykietami`, Object.keys(small.cells));
    ok(ORDER.every((n) => small.cells[n] && small.cells[n].rate !== null && small.cells[n].net !== null), `${w}: N2 kazda komorka ma dwie liczby przyrostu`);
    ok(ORDER.every((n) => small.cells[n] && /brutto/i.test(small.cells[n].title) && /netto/i.test(small.cells[n].title)), `${w}: N3 tooltip kazdej komorki opisuje BRUTTO i NETTO`);
    for (const st of ["small", "big", "huge", "maxw"]) {
      const m = res[w + '/' + st];
      const sameLayout = ORDER.every((n) => m.cells[n] && small.cells[n] && m.cells[n].x === small.cells[n].x && m.cells[n].y === small.cells[n].y && m.cells[n].w === small.cells[n].w);
      ok(sameLayout, `${w}/${st}: N4 pozycje i szerokosci komorek IDENTYCZNE jak dla malych liczb`, ORDER.map((n) => m.cells[n] && [m.cells[n].x, m.cells[n].y, m.cells[n].w]));
      ok(Math.abs(m.banner.h - small.banner.h) < 0.5, `${w}/${st}: N4 wysokosc banera stala`, [m.banner.h, small.banner.h]);
      const clipped = ORDER.filter((n) => m.cells[n] && m.cells[n].over.length > 0);
      ok(clipped.length === 0, `${w}/${st}: N5 zero przycinania/przepelnienia w komorkach`, clipped.map((n) => [n, m.cells[n].over]));
      const overlap = ORDER.filter((n) => m.cells[n] && m.cells[n].right > m.cells[n].x + m.cells[n].w + 0.5);
      ok(overlap.length === 0, `${w}/${st}: N5 zawartosc miesci sie w komorce (bez wyjscia poza kolumne)`, overlap);
    }
    const hugeM = res[w + '/huge'];
    if (small.power) {
      ok(small.banner.right <= small.power.x - 4, `${w}: N6 baner konczy sie przed medalionem Mocy`, [small.banner.right, small.power.x]);
    }
    const avail = w / 2 - 150;
    ok(small.banner.w >= avail * 0.9, `${w}: N6 baner zajmuje dostepna szerokosc (~${Math.round(avail)} px)`, small.banner.w);
    ok(hugeM.banner.w >= avail * 0.9, `${w}/huge: N6 szerokosc banera stala przy ogromnych liczbach`, hugeM.banner.w);
    if (w === 1280) {
      ok(/rgb\(2[0-9][0-9]|rgb\(2[0-9][0-9], [0-9]{1,2}, [0-9]{1,2}\)/.test(hugeM.cells.Skarbiec.netColor) || hugeM.cells.Skarbiec.netCls.includes('neg'), 'N7 netto ujemne (Skarbiec huge) = klasa neg', hugeM.cells.Skarbiec);
      ok(small.cells.Praca.netCls.includes('pos'), 'N7 netto dodatnie (Praca) = klasa pos', small.cells.Praca.netCls);
    }
  }
  console.log(`\n${fails === 0 ? 'PASS' : 'FAIL'}: hud-topbar-no-labels-test (${passes} ok, ${fails} fail)`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
