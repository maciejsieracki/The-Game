'use strict';
/**
 * hud-resource-deficit-red-test.cjs — R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1
 * Prawdziwy renderBarD1B() + prawdziwe ensureStyles() w headless Chromium; asercje getComputedStyle.
 * Skarbiec / Spichlerz / Surowce: normalny (złoty) -> niedobór (czerwony) -> powrót; kontrast WCAG AA.
 * Run from gra/:  node tools/hud-resource-deficit-red-test.cjs [--shots=<dir>] [--tag=przed|po]
 * Env HUD_TS=<ścieżka> podmienia moduł HUD (mutacje).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require('esbuild');

const GRA_DIR = path.resolve(__dirname, '..');
const HUD_TS = process.env.HUD_TS ? path.resolve(process.env.HUD_TS) : path.join(GRA_DIR, 'src/ui/hud.ts');
const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const SHOTS = args.shots ? path.resolve(args.shots) : null;
const TAG = args.tag || 'po';
const CHROME = '/opt/pw-browsers/chromium';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-hud-short-'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* */ } });

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { console.log('PASS: ' + label); pass++; }
  else { console.log('FAIL: ' + label + (extra ? ' -- ' + JSON.stringify(extra) : '')); fail++; }
}

const BASE = {
  zloto: 500, zlotoRate: 10, praca: 50, pracaRate: 5, zywnoscLabel: '100', zywnoscRate: 4,
  nauka: 100, naukaRate: 3, kultura: 10, kulturaRate: 1, bogactwo: 500, bogactwoRate: 10,
  bogactwoWplywyBrutto: 20, ludnosc: 10, power: 10, osiedla: 2, osiedlaMax: 6, tura: 5, epoka: 'Brąz',
  surowceSummary: '5/5', surowceAlert: false, surowceNiedoborLabels: [],
};
const SCEN = {
  normal: {},
  goldRunway: { bogactwo: 30, bogactwoRate: -10 },          // 3 tury
  goldZero: { bogactwo: 0, bogactwoRate: 0 },               // start gry / floor(+0,6): NIE alarm
  goldZeroNeg: { bogactwo: 0, bogactwoRate: -1 },           // zapas 0 i ubywa: alarm
  goldNegStock: { bogactwo: -5, bogactwoRate: 0 },          // zapas ujemny: alarm
  foodZero: { zywnoscLabel: '0', zywnoscRate: 0 },          // start gry: NIE alarm
  foodZeroNeg: { zywnoscLabel: '0', zywnoscRate: -1 },
  goldFarOk: { bogactwo: 500, bogactwoRate: -10 },          // 50 tur
  goldEdge5: { bogactwo: 50, bogactwoRate: -10 },           // dokładnie 5 tur
  goldEdge6: { bogactwo: 60, bogactwoRate: -10 },           // 6 tur
  foodRunway: { zywnoscLabel: '12', zywnoscRate: -4 },      // 3 tury
  foodFarOk: { zywnoscLabel: '400', zywnoscRate: -4 },
  foodHunger: { zywnoscLabel: '100', zywnoscRate: 4, glodWojska: true },   // sam alert głodu, zapas i bilans OK
  foodUnfed: { zywnoscMiastNiedokarmionych: 2 },
  res1: { surowceAlert: true, surowceSummary: '4/5', surowceNiedoborLabels: ['Żelazo'] },
  resMany: { surowceAlert: true, surowceSummary: '2/5', surowceNiedoborLabels: ['Żelazo', 'Drewno', 'Kamień'] },
  resCapOnly: { surowceAlert: true, surowceSummary: '4/5', surowceNiedoborLabels: [] }, // limit magazynu != niedobór
  all: { bogactwo: 0, bogactwoRate: -3, zywnoscLabel: '0', zywnoscRate: -2, surowceAlert: true, surowceNiedoborLabels: ['Żelazo'] },
};

const viteCompat = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw-file' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    build.onLoad({ filter: /\.ts$/ }, (a) => {
      const src = fs.readFileSync(a.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return { contents: 'const __g = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__g'), loader: 'ts', resolveDir: path.dirname(a.path) };
    });
  },
};

async function build() {
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, `
    import { renderBarD1B, ensureStyles } from ${JSON.stringify(HUD_TS)};
    ensureStyles();
    (window).__scen = ${JSON.stringify(SCEN)};
    (window).__base = ${JSON.stringify(BASE)};
    (window).__render = function (name) {
      const st = Object.assign({}, (window).__base, (window).__scen[name]);
      document.getElementById('root').innerHTML =
        '<div class="civ-hud" style="position:static;display:flex;flex-wrap:wrap;align-items:center;padding:10px 14px;background:linear-gradient(180deg,rgba(20,26,38,.94),rgba(8,10,16,.95))">' + renderBarD1B(st) + '</div>';
    };
  `);
  await esbuild.build({ entryPoints: [entry], bundle: true, outfile: path.join(TMP, 'b.js'), platform: 'browser', format: 'iife',
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' }, plugins: [viteCompat], logLevel: 'error' });
  fs.writeFileSync(path.join(TMP, 'i.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#080a12"><div id="root"></div><script src="b.js"></script></body></html>');
}

function lum([r, g, b]) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
function ratio(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }
function rgb(s) { return (s.match(/\d+/g) || []).slice(0, 3).map(Number); }
const isReddish = (c) => { const [r, g, b] = rgb(c); return r > 150 && g < 120 && b < 120; };
const isGold = (c) => { const [r, g, b] = rgb(c); return r > 200 && g > 190 && b < 160; };

async function main() {
  await build();
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file://' + path.join(TMP, 'i.html'));

  async function colors(name, label) {
    await page.evaluate(n => window.__render(n), name);
    return page.evaluate((lbl) => {
      const chip = [...document.querySelectorAll('.civ-hud-chip')].find(c => c.querySelector('.civ-hud-chip-lbl')?.textContent === lbl);
      if (!chip) return null;
      const g = sel => { const e = chip.querySelector(sel); return e ? getComputedStyle(e).color : null; };
      return { val: g('.civ-hud-chip-val'), lbl: g('.civ-hud-chip-lbl'), rate: g('.civ-hud-chip-rate'), short: chip.classList.contains('civ-hud-chip-short') };
    }, label);
  }
  const BG = [20, 26, 38]; // najjaśniejszy punkt gradientu paska

  for (const [chip, normal, shortList, okList] of [
    ['Skarbiec', 'normal', ['goldRunway', 'goldZeroNeg', 'goldNegStock', 'goldEdge5', 'all'], ['goldZero', 'goldFarOk', 'goldEdge6']],
    ['Spichlerz', 'normal', ['foodRunway', 'foodZeroNeg', 'foodHunger', 'foodUnfed', 'all'], ['foodZero', 'foodFarOk']],
    ['Surowce', 'normal', ['res1', 'resMany', 'all'], ['resCapOnly']],
  ]) {
    const n = await colors(normal, chip);
    check(`${chip}: normalny stan = złoty (val), bez klasy niedoboru`, n && n.short === false && (chip === 'Surowce' || isGold(n.val)), n);
    for (const sc of shortList) {
      const c = await colors(sc, chip);
      const txt = chip === 'Surowce' ? c && c.lbl : c && c.val;
      check(`${chip}: ${sc} -> czerwony`, c && c.short && isReddish(txt) && isReddish(c.lbl), c);
      if (c) check(`${chip}: ${sc} kontrast WCAG AA (margines) >= 5.0 (${ratio(rgb(txt), BG).toFixed(2)})`, ratio(rgb(txt), BG) >= 5.0);
    }
    for (const sc of okList) {
      const c = await colors(sc, chip);
      check(`${chip}: ${sc} -> NIE czerwony (bez niedoboru)`, c && !c.short && !isReddish(c.lbl) && (chip === 'Surowce' || !isReddish(c.val)), c);
    }
    const back = await colors(normal, chip);
    check(`${chip}: powrót do złotego po uzupełnieniu`, back && !back.short && (chip === 'Surowce' || isGold(back.val)), back);
  }
  const g = await colors('goldRunway', 'Spichlerz'); const g2 = await colors('goldRunway', 'Surowce');
  check('izolacja: niedobór złota nie czerwieni Spichlerza/Surowców', g && g2 && !g.short && !g2.short);
  const tt = await page.evaluate(() => { window.__render('res1'); return [...document.querySelectorAll('.civ-hud-chip')].map(c => c.getAttribute('title') || '').join('|'); });
  check('tooltip Surowców wymienia surowiec w niedoborze', tt.includes('Niedobór (czerwony): Żelazo'));
  check('zero błędów JS', errs.length === 0, errs);

  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    for (const [w, h] of [[1280, 720], [360, 640]]) {
      await page.setViewportSize({ width: w, height: h });
      for (const sc of ['normal', 'goldRunway', 'foodRunway', 'res1', 'resMany', 'all']) {
        await page.evaluate(n => window.__render(n), sc);
        await page.screenshot({ path: path.join(SHOTS, `${TAG}-${sc}-${w}x${h}.png`), clip: { x: 0, y: 0, width: w, height: Math.min(h, 240) } });
      }
    }
  }
  await browser.close();
  console.log(`[hud-resource-deficit-red-test] ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
