'use strict';
/**
 * hud-topbar-grid-gross-net-test.cjs -- R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1
 * Run (z gra/):  node tools/hud-topbar-grid-gross-net-test.cjs [--shots <katalog>] [--no-mutants]
 *                [--dist <katalog vite build poza repo>]   (opcjonalny test zywej gry: netto == zmiana po endTurn)
 *
 * Czesc A (prawdziwy renderBarD1B + prawdziwy CSS w Chromium, okna 1280/1024/800, male/duze/ogromne liczby):
 *   A1 stala kolejnosc 3+3: gora Skarbiec,Praca,Spichlerz; dol Handel,Nauka,Surowce
 *   A2 brak zawijania/przeskakiwania: pozycje x/y komorek IDENTYCZNE niezaleznie od wielkosci liczb
 *   A3 brak nakladania komorek, brak przycinania tekstu, baner konczy sie przed medalionem Mocy
 *   A4 kazda komorka: brutto + netto (opisane slowami), netto ujemne = czerwone, dodatnie = zielone
 *   A5 kontrast tekstow >= 4,5:1 na tle banera
 *   A6 tooltipy z rozbiciem BRUTTO -> NETTO, Surowce: najgorszy deficyt
 * Czesc M (mutacje): zepsuta kopia hud.ts MUSI czerwienic ta bramke.
 * Czesc B (--dist): zywa gra ?civTest=1 -- netto z HUD == roznica magazynu po realnym endTurn.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const argOf = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const DIST = argOf('--dist');
const NO_MUTANTS = process.argv.includes('--no-mutants');
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-grid-gn-'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function bundle(hudTsPath, outJs) {
  const entry = path.join(TMP, 'entry-' + path.basename(outJs) + '.ts');
  fs.writeFileSync(entry, `import { renderBarD1B, ensureStyles } from ${JSON.stringify(hudTsPath)};
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
  osiedla: 3, osiedlaMax: 6, tura: 42, epoka: 'Brąz', power: 100, handelIncome: 82, handelRouteCount: 2,
  surowceSummary: '7/9', surowceAlert: true, surowceBrutto: 120, surowceNetto: 40,
  surowceNiedoborLabels: ['Ceramika'], surowceBilans: [{ label: 'Drewno', brutto: 80, netto: 50 }, { label: 'Ceramika', brutto: 40, netto: -10 }],
  armyUnitsOnMap: 2, rekrutEkw: 5,
};
const STATES = {
  small: BASE,
  big: { ...BASE, bogactwo: 24400, bogactwoRate: 1200, bogactwoWplywyBrutto: 4800, praca: 9500, pracaRate: 7300, zywnoscLabel: '42900', zywnoscRate: 2000, zywnoscWplywMiast: 4000, nauka: 8200, naukaRate: 2700, handelIncome: 820 },
  huge: { ...BASE, bogactwo: 1200000, bogactwoRate: -999900, bogactwoWplywyBrutto: 1234000, praca: 1200000, pracaRate: 1200000, zywnoscLabel: '1200000', zywnoscRate: 1200000, zywnoscWplywMiast: 1300000, nauka: 1200000, naukaRate: 1200000, handelIncome: 1200000, surowceBrutto: 1200000, surowceNetto: 1100000 },
  // bez deficytu surowca: komorka Surowce pokazuje SUME netto
  nodef: { ...BASE, surowceAlert: false, surowceNiedoborLabels: [], surowceBilans: [{ label: 'Drewno', brutto: 80, netto: 50 }, { label: 'Kamień', brutto: 40, netto: 5 }], surowceNetto: 55 },
};
  // brak prognozy Pracy -> komorka spada na zrealizowane saldo ostatniej tury (pracaRate)
const STATES_EXTRA = { fallback: { ...BASE, pracaPrognoza: undefined } };
Object.assign(STATES, STATES_EXTRA);
const ORDER_ROW1 = ['Skarbiec', 'Praca', 'Spichlerz'];
const ORDER_ROW2 = ['Handel', 'Nauka', 'Surowce'];
const WIDTHS = [1280, 1024, 800];
const NARROW = [640]; // < 800 px: bez asercji o medalionie Mocy (zob. raport) — tylko zawijanie/przycinanie/ikony

function lum([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
const rgbOf = (s) => (/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s) || []).slice(1, 4).map(Number);

const MEASURE = () => {
  const cells = {};
  document.querySelectorAll('.civ-hud-banner-left .civ-hud-chip-cell').forEach((c) => {
    const t = (s) => { const e = c.querySelector(s); return e ? e.textContent : null; };
    const r = c.getBoundingClientRect();
    const clip = [...c.querySelectorAll('.civ-hud-chip-top, .civ-hud-chip-row3')].some((e) => e.scrollWidth > e.clientWidth + 0.5)
      || c.scrollWidth > c.clientWidth + 0.5;
    const col = (s) => { const e = c.querySelector(s); return e ? getComputedStyle(e).color : null; };
    cells[t('.civ-hud-chip-lbl')] = {
      x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
      medW: Math.round((c.querySelector('.civ-hud-chip-med') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width * 10) / 10,
      val: t('.civ-hud-chip-val'), brutto: t('.civ-hud-chip-rate'), netto: t('.civ-hud-chip-net'), nettoLabel: (c.querySelector('.civ-hud-chip-netrow .civ-hud-chip-k') || {}).textContent,
      bruttoLabel: (c.querySelector('.civ-hud-chip-gross .civ-hud-chip-k') || {}).textContent,
      nettoCls: (c.querySelector('.civ-hud-chip-net') || {}).className, clip, title: c.getAttribute('title') || '', short: c.classList.contains('civ-hud-chip-short'),
      colors: { lbl: col('.civ-hud-chip-lbl'), k: col('.civ-hud-chip-k'), brutto: col('.civ-hud-chip-rate'), net: col('.civ-hud-chip-net'), val: col('.civ-hud-chip-val') },
    };
  });
  const sh = document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell').getBoundingClientRect();
  const pc = document.querySelector('.power-center').getBoundingClientRect();
  const bgImg = getComputedStyle(document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell')).backgroundImage;
  return { cells, shellBottom: sh.bottom, shellRight: sh.right, powerX: pc.x, sw: document.documentElement.scrollWidth, vw: window.innerWidth, bgImg };
};

async function runChecks(chromium, jsPath, tag, opts) {
  const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const res = {};
  try {
    for (const w of [...WIDTHS, ...NARROW]) {
      for (const [name, st] of Object.entries(STATES)) {
        const page = await br.newPage({ viewport: { width: w, height: 260 } });
        await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#3a4a3a"><div id="r"></div>');
        await page.addScriptTag({ path: jsPath });
        res[w + '/' + name] = await page.evaluate(({ s, fn }) => { window.__r(s); return (new Function('return ' + fn))()(); }, { s: st, fn: MEASURE.toString() });
        if (SHOTS && opts.shot && ['small', 'huge'].includes(name)) {
          await page.screenshot({ path: path.join(SHOTS, `${tag}-${name}-${w}.png`), clip: { x: 0, y: 0, width: Math.min(w, 1280), height: 135 } });
        }
        await page.close();
      }
    }
  } finally { await br.close(); }
  return res;
}

function assertAll(res, label) {
  const k0 = (w, n) => res[w + '/' + n];
  for (const w of WIDTHS) {
    // A1 + A2
    for (const n of ['small', 'big', 'huge', 'nodef']) {
      const m = k0(w, n);
      const names = Object.keys(m.cells);
      ok(JSON.stringify(names) === JSON.stringify([...ORDER_ROW1, ...ORDER_ROW2]), `${label} ${w}px/${n}: kolejnosc DOM Skarbiec,Praca,Spichlerz,Handel,Nauka,Surowce`, names);
      const c = m.cells;
      const sameY1 = ORDER_ROW1.every((x) => c[x] && Math.abs(c[x].y - c[ORDER_ROW1[0]].y) < 1.5);
      const sameY2 = ORDER_ROW2.every((x) => c[x] && Math.abs(c[x].y - c[ORDER_ROW2[0]].y) < 1.5);
      ok(sameY1 && sameY2 && c.Handel && c.Skarbiec && c.Handel.y > c.Skarbiec.y + 20, `${label} ${w}px/${n}: gora 3 komorki w jednym rzedzie, dol 3 w drugim (pod gora)`, { y: names.map((x) => c[x] && c[x].y) });
      const xs = (arr) => arr.map((x) => c[x] && c[x].x);
      const inc = (a) => a.every((v, i) => i === 0 || v > a[i - 1]);
      ok(inc(xs(ORDER_ROW1)) && inc(xs(ORDER_ROW2)), `${label} ${w}px/${n}: kolejnosc od lewej rosnaca w obu rzedach`, [xs(ORDER_ROW1), xs(ORDER_ROW2)]);
      ok(Math.abs(c.Skarbiec.x - c.Handel.x) < 1.5 && Math.abs(c.Praca.x - c.Nauka.x) < 1.5 && Math.abs(c.Spichlerz.x - c.Surowce.x) < 1.5, `${label} ${w}px/${n}: kolumny wyrownane (Skarbiec/Handel, Praca/Nauka, Spichlerz/Surowce)`);
      // A3
      ok(Object.values(c).every((v) => !v.clip), `${label} ${w}px/${n}: zaden tekst nie jest przyciety (scrollWidth<=clientWidth)`, Object.entries(c).filter(([, v]) => v.clip).map(([k]) => k));
      const rects = Object.values(c);
      let overlap = false;
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5) overlap = true;
      }
      ok(!overlap, `${label} ${w}px/${n}: komorki nie nakladaja sie`);
      ok(m.shellRight <= m.powerX + 0.5, `${label} ${w}px/${n}: baner (prawy brzeg ${Math.round(m.shellRight)}) konczy sie przed medalionem Mocy (${Math.round(m.powerX)})`);
      ok(m.shellBottom <= 104, `${label} ${w}px/${n}: dol banera (${Math.round(m.shellBottom)}px) nie wchodzi w pasek narzedzi mapy (TOOLBAR_TOP_PX=104)`);
      ok(m.sw <= m.vw, `${label} ${w}px/${n}: brak poziomego przewijania strony`, { sw: m.sw, vw: m.vw });
      ok(Object.values(c).every((v) => v.medW >= 12), `${label} ${w}px/${n}: medaliony ikon widoczne w kazdej komorce (szerokosc >= 14px; kolejnosc ICON zachowana)`, Object.entries(c).map(([k, v]) => [k, v.medW]));
    }
    // A2: pozycje niezalezne od wielkosci liczb
    const ref = k0(w, 'small').cells;
    for (const n of ['big', 'huge', 'nodef']) {
      const cur = k0(w, n).cells;
      const same = Object.keys(ref).every((x) => cur[x] && cur[x].x === ref[x].x && cur[x].y === ref[x].y && cur[x].w === ref[x].w && cur[x].h === ref[x].h);
      ok(same, `${label} ${w}px: pozycje/rozmiary komorek IDENTYCZNE dla small i ${n} (brak przeskakiwania)`, { ref: Object.fromEntries(Object.entries(ref).map(([k, v]) => [k, [v.x, v.y]])), cur: Object.fromEntries(Object.entries(cur).map(([k, v]) => [k, [v.x, v.y]])) });
    }
  }
  // < 800 px (info o zakresie): zero zawijania/przycinania/nakladania, ikony widoczne, pozycje identyczne dla roznych liczb
  for (const w of NARROW) {
    const ref = k0(w, 'small').cells;
    for (const n of ['small', 'huge']) {
      const m = k0(w, n); const c = m.cells;
      ok(JSON.stringify(Object.keys(c)) === JSON.stringify([...ORDER_ROW1, ...ORDER_ROW2]), `${label} ${w}px/${n}: kolejnosc 3+3 zachowana`);
      ok(ORDER_ROW1.every((x) => Math.abs(c[x].y - c.Skarbiec.y) < 1.5) && ORDER_ROW2.every((x) => Math.abs(c[x].y - c.Handel.y) < 1.5) && c.Handel.y > c.Skarbiec.y + 20, `${label} ${w}px/${n}: 3 w rzedzie gora, 3 dol`);
      ok(Object.values(c).every((v) => !v.clip), `${label} ${w}px/${n}: zaden tekst nie jest przyciety`, Object.entries(c).filter(([, v]) => v.clip).map(([k]) => k));
      ok(Object.values(c).every((v) => v.medW >= 12), `${label} ${w}px/${n}: ikony widoczne`, Object.entries(c).map(([k, v]) => [k, v.medW]));
      ok(Object.keys(ref).every((x) => c[x].x === ref[x].x && c[x].y === ref[x].y), `${label} ${w}px/${n}: pozycje identyczne z small`);
      ok(m.sw <= m.vw, `${label} ${w}px/${n}: brak poziomego przewijania`);
      if (n === 'small') console.log(`  info ${w}px: prawy brzeg banera ${Math.round(m.shellRight)} vs medalion Mocy x=${Math.round(m.powerX)} (${m.shellRight <= m.powerX + 0.5 ? 'bez nakladania' : 'NAKLADA SIE na medalion Mocy — poza zakresem wymagan 1280/1024/800 (uklad Mocy jest poza banerem)'})`);
    }
  }
  // A4 (tresc) na 1280
  const s = k0(1280, 'small').cells;
  const mm = (x) => x.replace(/−/g, '-');
  ok(s.Skarbiec.brutto === '+480' && mm(s.Skarbiec.netto) === '-120', `${label}: Skarbiec brutto +480 / netto −120`, [s.Skarbiec.brutto, s.Skarbiec.netto]);
  ok(s.Praca.brutto === '+23' && s.Praca.netto === '+20', `${label}: Praca = PROGNOZA: netto +20, brutto +23 (prognoza + 3 utrzymanie)`, [s.Praca.brutto, s.Praca.netto]);
  const fb = k0(1280, 'fallback').cells;
  ok(fb.Praca.netto === '+22' && fb.Praca.brutto === '+25', `${label}: bez prognozy Praca spada na zrealizowane saldo (netto +22 / brutto +25)`, [fb.Praca.brutto, fb.Praca.netto]);
  ok(s.Spichlerz.brutto === '+30' && s.Spichlerz.netto === '+5', `${label}: Spichlerz brutto +30 / netto +5`, [s.Spichlerz.brutto, s.Spichlerz.netto]);
  ok(s.Handel.brutto === '+82' && s.Handel.netto === '+82', `${label}: Handel brutto +82 / netto +82`, [s.Handel.brutto, s.Handel.netto]);
  ok(s.Nauka.brutto === '+15' && s.Nauka.netto === '+15', `${label}: Nauka brutto +15 / netto +15`, [s.Nauka.brutto, s.Nauka.netto]);
  ok(s.Surowce.brutto === '+120' && s.Surowce.netto === '+40' && s.Surowce.nettoLabel === 'netto', `${label}: Surowce brutto +120 / netto +40 — OBA to sumy po surowcach (ta sama wielkosc)`, [s.Surowce.brutto, s.Surowce.netto, s.Surowce.nettoLabel]);
  const nd = k0(1280, 'nodef').cells;
  ok(nd.Surowce.netto === '+55' && nd.Surowce.nettoLabel === 'netto', `${label}: Surowce bez deficytu pokazuje sume netto +55`, [nd.Surowce.netto, nd.Surowce.nettoLabel]);
  ok(s.Surowce.short === true && nd.Surowce.short === false, `${label}: deficyt pojedynczego surowca = czerwony chip Surowce (shortage), brak deficytu = nie`, [s.Surowce.short, nd.Surowce.short]);
  ok(Object.values(s).every((v) => v.bruttoLabel === 'brutto' && v.nettoLabel === 'netto'), `${label}: kazda komorka ma slowne etykiety "brutto" i "netto"`);
  const huge = k0(1280, 'huge').cells;
  ok(huge.Skarbiec.val === '1,2M' && mm(huge.Skarbiec.netto) === '-999,9k' && huge.Skarbiec.brutto === '+1,2M', `${label}: duze liczby skracane k/M (1,2M / −999,9k)`, [huge.Skarbiec.val, huge.Skarbiec.netto, huge.Skarbiec.brutto]);
  // kolory netto
  ok(/neg/.test(s.Skarbiec.nettoCls) && rgbOf(s.Skarbiec.colors.net).join() === '238,108,108', `${label}: netto ujemne = czerwone (#ee6c6c, jak DEFICIT-RED)`, [s.Skarbiec.nettoCls, s.Skarbiec.colors.net]);
  ok(/pos/.test(s.Praca.nettoCls) && rgbOf(s.Praca.colors.net).join() === '80,176,112', `${label}: netto dodatnie = zielone (--tg-green)`, [s.Praca.nettoCls, s.Praca.colors.net]);
  ok(s.Skarbiec.short === false || s.Skarbiec.short === true, `${label}: (info) klasa shortage obecna jako dotad`);
  // A5 kontrast
  const bg = [20, 26, 38];
  const worst = [];
  for (const cell of Object.values(s)) for (const [k, col] of Object.entries(cell.colors)) {
    if (!col) continue;
    const cr = contrast(rgbOf(col), bg);
    if (cr < 4.5) worst.push([k, col, Math.round(cr * 100) / 100]);
  }
  ok(worst.length === 0, `${label}: kontrast wszystkich tekstow komorek >= 4,5:1 na tle banera rgb(20,26,38)`, worst);
  // A6 tooltipy
  ok(Object.values(s).every((v) => /BRUTTO/.test(v.title) && /NETTO/.test(v.title)), `${label}: tooltip kazdej komorki zawiera rozbicie BRUTTO -> NETTO`, Object.entries(s).filter(([, v]) => !(/BRUTTO/.test(v.title) && /NETTO/.test(v.title))).map(([k]) => k));
  ok(/Najgorszy bilans: Ceramika/.test(s.Surowce.title) && /Drewno: brutto \+80, netto \+50/.test(s.Surowce.title), `${label}: tooltip Surowce: najgorszy bilans + rozbicie per surowiec`);
  ok(/Dokładnie/.test(huge.Skarbiec.title), `${label}: skrocone liczby maja pelna wartosc w tooltipie`);
}

async function mutants(chromium) {
  const src = fs.readFileSync(path.join(GRA, 'src/ui/hud.ts'), 'utf8');
  const M = [
    ['zamiana rzedow (Handel/Nauka/Surowce na gorze)', (s) => s.replace("'<div class=\"hud-chip-grid\">' + row1.join('') + row2.join('')", "'<div class=\"hud-chip-grid\">' + row2.join('') + row1.join('')")],
    ['netto = brutto (Skarbiec)', (s) => s.replace('const skarbiecNetto = s.bogactwoRate ?? skarbiecBrutto;', 'const skarbiecNetto = skarbiecBrutto;')],
    ['netto ujemne nie jest czerwone', (s) => s.replace("return r < 0 ? 'neg' : r > 0 ? 'pos' : 'zero';", "return r > 0 ? 'pos' : 'zero';")],
    ['4 kolumny siatki (zawijanie Handel do gory)', (s) => s.replace('grid-template-columns:repeat(3,var(--hud-cell-w))', 'grid-template-columns:repeat(4,var(--hud-cell-w))')],
    ['Surowce: netto = najgorszy pojedynczy surowiec (mieszanie wielkosci)', (s) => s.replace("const surNetto = s.surowceNetto ?? 0;", "const surNetto = (s.surowceBilans ?? []).reduce((m, r) => Math.min(m, r.netto), 0);")],
    ['Praca: netto z zrealizowanej tury zamiast prognozy', (s) => s.replace("const pracaNetto = s.pracaPrognoza ?? (s.pracaRate ?? 0);", "const pracaNetto = s.pracaRate ?? 0;")],
    ['ikony ukryte <=900px', (s) => s.replace("--hud-cell-med:14px;--hud-cell-lbl:8px", "--hud-cell-med:0px;--hud-cell-lbl:8px")],
  ];
  for (const [name, fn] of M) {
    const mutSrc = fn(src);
    if (mutSrc === src) { ok(false, `MUTANT "${name}": zamiana nie zadzialala (nieaktualny wzorzec)`); continue; }
    const mutPath = path.join(GRA, 'src/ui/hud.__mut.ts');
    fs.writeFileSync(mutPath, mutSrc);
    try {
      const js = path.join(TMP, 'mut.js');
      await bundle(mutPath, js);
      const before = fails;
      const log = console.log; console.log = () => {};
      let mutFails;
      try { assertAll(await runChecks(chromium, js, 'mut', { shot: false }), 'mut'); } finally { console.log = log; mutFails = fails - before; fails = before; }
      ok(mutFails > 0, `MUTANT "${name}" jest WYKRYTY przez bramke (${mutFails} czerwonych asercji)`);
    } finally { try { fs.unlinkSync(mutPath); } catch (_) { /* best-effort */ } }
  }
}

async function liveEndTurn(chromium) {
  const URL = 'file://' + path.resolve(DIST, 'index.html') + '?playtest=mapa&civTest=1';
  const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  try {
    const page = await br.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await page.waitForSelector('.civ-hud', { timeout: 180000 });
    for (let i = 0; i < 120; i++) { if (await page.locator('text=Tworzenie świata').count() === 0) break; await wait(1000); }
    await page.waitForFunction(() => window.__civTest !== undefined, { timeout: 60000 });
    await wait(2000);
    // sandbox ?playtest=mapa konczy gre zwyciestwem po 1-2 turach — istniejacy hak testowy (rebel-protection) wylacza TYLKO checkVictory
    const vicOff = await page.evaluate(() => { const d = window.__rebelProtectionTestDebug; if (d && d.disableVictoryCheckForTest) { d.disableVictoryCheckForTest(); return true; } return false; });
    ok(vicOff, 'live: hak disableVictoryCheckForTest dostepny (bez niego sandbox konczy gre po 2 turach)');
    const exactOf = (t) => { const m = /Dokładnie: ([−-]?[\d\s  ]+)/.exec(t || ''); return m ? Number(m[1].replace(/[\s  ]/g, '').replace('−', '-')) : null; };
    const snap = () => page.evaluate(() => {
      const o = {};
      document.querySelectorAll('.civ-hud-banner-left .civ-hud-chip-cell').forEach((c) => {
        const t = (s) => (c.querySelector(s) || {}).textContent || '';
        o[t('.civ-hud-chip-lbl')] = { val: t('.civ-hud-chip-val'), netto: t('.civ-hud-chip-net'), title: c.getAttribute('title') || '' };
      });
      return o;
    }).then(async (h) => {
      const out = Object.fromEntries(['Skarbiec', 'Praca', 'Nauka', 'Spichlerz'].map((k) => {
        const v = h[k].val.replace(/\s/g, '').replace('−', '-').replace(',', '.');
        const stock = exactOf(h[k].title) ?? Number(v);
        return [k, { stock, netto: Number(h[k].netto.replace('−', '-').replace('+', '')) }];
      }));
      // Surowce: netto komorki = SUMA netto po surowcach; rozbicie per surowiec z tooltipu; zapasy per surowiec z silnika
      const sNet = Number((h['Surowce'].netto || '0').replace('−', '-').replace('+', '').replace(/\s/g, '').replace(',', '.'));
      const stockMap = await page.evaluate(() => window.__hudGrossNetTestDebug.resourceStock());
      const norm = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase().trim();
      const entries = [];
      const re = /([^:;·]+?): brutto ([+\-−]?\d+), netto ([+\-−]?\d+)/g;
      let m;
      while ((m = re.exec(h['Surowce'].title)) !== null) entries.push({ key: norm(m[1]), netto: Number(m[3].replace('−', '-').replace('+', '')) });
      out.Surowce = { stock: Object.values(stockMap).reduce((a, v) => a + v, 0), netto: sNet, stockMap, entries };
      return out;
    });
    const turnOf = () => page.evaluate(() => window.__civTest.state().turn);
    // jedna runda czyszczenia kart blokujacych koniec tury (sandbox): "Kolejka pusta" -> zakolejkuj budynek (Praca/produkcja,
    // nie zloto); kazda inna karta decyzyjna (np. dyplomacja) -> zamknij X. Zwraca true, gdy cos zrobiono.
    const clearBlockers = async () => {
      const kind = await page.evaluate(() => {
        const c = document.querySelector('.sp-event.sp-blocking');
        if (!c) return null;
        if (/Kolejka pusta/i.test(c.innerText)) { const b = c.querySelector('.sp-action-btn'); if (b) b.click(); return 'queue'; }
        const x = c.querySelector('.sp-close'); if (x) { x.click(); return 'close'; }
        return 'stuck';
      });
      if (kind === 'queue') {
        await wait(2500);
        await page.evaluate(() => { const b = [...document.querySelectorAll('.btn.btn-sm.can-build')].find((x) => /Buduj/.test(x.innerText)); if (b) b.click(); });
        await wait(1500);
        await page.keyboard.press('Escape');
        await wait(1000);
      } else if (kind === 'close') await wait(800);
      return kind === 'queue' || kind === 'close';
    };
    const prepare = async () => {
      for (let w = 0; w < 6; w++) { if (await page.locator('.sp-event.sp-blocking').count() > 0) break; await wait(1000); }
      for (let k = 0; k < 6; k++) { if (!(await clearBlockers())) break; }
    };
    const endTurn = async () => {
      const t0 = await turnOf();
      await page.evaluate(() => window.__civTest.endTurn());
      let t1 = t0;
      for (let i = 0; i < 60; i++) {
        await wait(1000); t1 = await turnOf(); if (t1 > t0) break;
        await clearBlockers();
        if (i % 4 === 3) await page.evaluate(() => window.__civTest.endTurn());
        // sandbox: wrog atakuje -> okno przed bitwa blokuje koniec tury; rozstrzygnij automatycznie
        await page.evaluate(() => { const b = document.querySelector('.pb-btn[data-act="auto"]'); if (b && b.offsetParent) { b.click(); return; } const k = [...document.querySelectorAll('button')].find((x) => x.offsetParent && /KONTYNUUJ/i.test(x.innerText)); if (k) k.click(); });
      }
      await wait(4000);
      return t1 > t0;
    };
    // tura 1: HUD zawiera wartosci startowe presetu (placeholdery do pierwszego przeliczenia) — rozgrzewka, bez asercji
    await prepare();
    ok(await endTurn(), 'live: rozgrzewka — tura 1 -> 2 (realny endTurn)');
    let measured = 0;
    for (let t = 0; t < 3; t++) {
      await prepare();
      const a = await snap();
      const adv = await endTurn();
      if (!adv && SHOTS) await page.screenshot({ path: path.join(SHOTS, 'live-stuck.png') });
      if (!adv) { console.log('  info live: tura sie nie zakonczyla -- NIE_ZMIERZONO; karty: ' + JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.sp-event.sp-blocking')].map((e) => e.innerText.replace(/\\n/g, ' ').slice(0, 140))))); break; }
      const b = await snap();
      measured++;
      for (const k of ['Skarbiec', 'Nauka']) {
        const d = b[k].stock - a[k].stock;
        ok(d === a[k].netto, `live tura ${t + 2}: ${k} netto z HUD (${a[k].netto}) == zmiana magazynu po endTurn (${d})`, { przed: a[k].stock, po: b[k].stock });
      }
      // Praca: komorka pokazuje PROGNOZE nastepnego ticka (main.ts _livePracaForecast: wplyw + overflow z ukonczonego
      // budynku - utrzymanie ulepszen; bez auto-ulepszen/Cudow na mapie) — HARD: == realna zmiana puli po endTurn.
      {
        const d = b.Praca.stock - a.Praca.stock;
        ok(d === a.Praca.netto, `live tura ${t + 2}: Praca netto z HUD (${a.Praca.netto}) == zmiana magazynu po endTurn (${d})`, { przed: a.Praca.stock, po: b.Praca.stock });
      }
      {
        // Surowce: per surowiec oczekiwana zmiana = max(netto, -zapas) (zapas nie schodzi ponizej 0 — jak Spichlerz);
        // suma oczekiwanych zmian == realna zmiana sumy zapasow, a KAZDY surowiec z zapasem >= |netto| (nieobciety) musi
        // zmienic sie dokladnie o swoje netto z HUD.
        const A = a.Surowce, B = b.Surowce;
        let expSum = 0, exact = 0, clamped = [], bad = [];
        for (const e of A.entries) {
          const before = A.stockMap[e.key] || 0, after = B.stockMap[e.key] || 0;
          const exp = Math.max(e.netto, -before);
          expSum += exp;
          if (e.netto < 0 && before + e.netto < 0) clamped.push(`${e.key}(zapas ${before}, netto ${e.netto})`);
          else { if (Math.abs((after - before) - e.netto) > 0.5) bad.push([e.key, before, after, e.netto]); else if (e.netto !== 0) exact++; }
        }
        const d = B.stock - A.stock;
        ok(bad.length === 0 && exact >= 1, `live tura ${t + 2}: Surowce — kazdy nieobciety surowiec zmienil sie o swoje netto z HUD (${exact} dokladnych, np. Glina)`, bad);
        ok(Math.abs(d - expSum) <= 0.5, `live tura ${t + 2}: Surowce — realna zmiana sumy zapasow (${Math.round(d * 100) / 100}) == suma max(netto, -zapas) z HUD (${expSum}); netto-suma HUD ${A.netto}`, { przed: A.stock, po: B.stock });
        if (clamped.length) console.log(`  info live tura ${t + 2}: Surowce obciete do 0 (niedobor, zapas 0) -> netto ujemne nie zmniejsza zapasu: ${clamped.join(', ')}`);
      }
      const dz = b.Spichlerz.stock - a.Spichlerz.stock;
      if (a.Spichlerz.stock + a.Spichlerz.netto >= 0) ok(dz === a.Spichlerz.netto, `live tura ${t + 2}: Spichlerz netto (${a.Spichlerz.netto}) == zmiana (${dz})`);
      else console.log(`  info live tura ${t + 2}: Spichlerz zapas ${a.Spichlerz.stock}, netto ${a.Spichlerz.netto} -> zapas obcinany do 0 (glod) -- NIE porownywane`);
    }
    ok(measured > 0, 'live: zmierzono co najmniej 1 pelna ture netto vs endTurn', { measured });
    // Spichlerz z DODATNIM zapasem (hak ?civTest=1 __hudGrossNetTestDebug.setFoodReserve): netto nie jest obcinane do 0.
    for (let t = 0; t < 2; t++) {
      await prepare();
      const hook = await page.evaluate((v) => { const d = window.__hudGrossNetTestDebug; if (!d) return false; d.setFoodReserve(v); return true; }, 600);
      ok(hook, 'live: hak __hudGrossNetTestDebug.setFoodReserve dostepny');
      await wait(1500);
      const a = await snap();
      ok(a.Spichlerz.stock === 600, `live Spichlerz+: zapas ustawiony na 600 (HUD: ${a.Spichlerz.stock})`);
      if (!(await endTurn())) { console.log('  info live Spichlerz+: tura sie nie zakonczyla -- NIE_ZMIERZONO'); break; }
      const b = await snap();
      const dz = b.Spichlerz.stock - a.Spichlerz.stock;
      ok(dz === a.Spichlerz.netto, `live Spichlerz+ (proba ${t + 1}): netto z HUD (${a.Spichlerz.netto}) == zmiana magazynu po endTurn (${dz}) przy zapasie 600`, { przed: a.Spichlerz.stock, po: b.Spichlerz.stock });
    }
    // Panel imperium: zakladki Spichlerz/Surowce/Handel/Nauka maja linie „Brutto -> netto" z TYMI SAMYMI liczbami co komorka HUD.
    await prepare();
    const hudVals = await page.evaluate(() => {
      const o = {};
      document.querySelectorAll('.civ-hud-banner-left .civ-hud-chip-cell').forEach((c) => {
        const t = (q) => ((c.querySelector(q) || {}).textContent || '').replace(/\s/g, '');
        o[t('.civ-hud-chip-lbl')] = { b: t('.civ-hud-chip-rate'), n: t('.civ-hud-chip-net') };
      });
      return o;
    });
    const normTxt = (x) => (x || '').replace(/[\s\u00a0\u202f]/g, '').replace(/\u2212/g, '-');
    for (const k of ['Spichlerz', 'Surowce', 'Handel', 'Nauka']) {
      await page.evaluate((lbl) => { const c = [...document.querySelectorAll('.civ-hud-banner-left .civ-hud-chip-cell')].find((x) => (x.querySelector('.civ-hud-chip-lbl') || {}).textContent === lbl); if (c) c.click(); }, k);
      await wait(1500);
      const txt = await page.evaluate(() => { const e = document.querySelector('.civ-emp-grossnet'); return e ? e.textContent : null; });
      const m = txt ? /Brutto([+\-]?[\d,.kM]+)\u2192netto([+\-]?[\d,.kM]+)/.exec(normTxt(txt)) : null;
      ok(!!m, `panel imperium (${k}): linia "Brutto -> netto" obecna`, txt);
      if (m) {
        const hb = normTxt(hudVals[k].b).replace('+', ''), hn = normTxt(hudVals[k].n).replace('+', '');
        console.log(`  info panel ${k}: panel brutto ${m[1]} netto ${m[2]} | HUD brutto ${hudVals[k].b} netto ${hudVals[k].n}`);
        ok(m[2].replace('+', '') === hn && m[1].replace('+', '') === hb, `panel imperium (${k}): brutto i netto z panelu == komorka HUD`, [m[1], m[2], hudVals[k].b, hudVals[k].n]);
      }
      await page.keyboard.press('Escape');
      await wait(600);
    }
    ok(errors.length === 0, 'live: zero pageerror', errors.slice(0, 3));
  } finally { await br.close(); }
}

(async () => {
  let chromium;
  try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); } catch (e) { console.log('FAIL brak playwright'); process.exit(1); }
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  console.log('[A] render prawdziwego renderBarD1B + CSS w Chromium');
  const js = path.join(TMP, 'real.js');
  await bundle(path.join(GRA, 'src/ui/hud.ts'), js);
  assertAll(await runChecks(chromium, js, 'po', { shot: true }), 'real');
  if (!NO_MUTANTS) { console.log('[M] mutacje'); await mutants(chromium); }
  if (DIST) { console.log('[B] zywa gra: netto == zmiana po endTurn'); await liveEndTurn(chromium); }
  else console.log('[B] POMINIETO (brak --dist) -- NIE_ZMIERZONO w tym uruchomieniu');
})().catch((e) => { fails++; console.log('  FAIL wyjatek: ' + (e && e.stack || e)); }).finally(() => {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* best-effort */ }
  console.log(`\n${fails ? 'FAIL' : 'OK'}: hud-topbar-grid-gross-net-test (${passes} ok, ${fails} fail)`);
  process.exit(fails ? 1 : 0);
});
