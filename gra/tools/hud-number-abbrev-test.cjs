'use strict';
/**
 * hud-number-abbrev-test.cjs -- R-WEB-HUD-NUMBER-ABBREV-Q1
 * Run: cd gra && node tools/hud-number-abbrev-test.cjs
 *
 * Czesc 1: tabela przypadkow granicznych formatCompactNumber / formatCompactSigned /
 *          formatFullNumber / exactCompactNote (src/ui/formatCompactNumber.ts).
 * Czesc 2: statyczne wiring-asercje (pasek zasobow hud.ts uzywa wspolnej funkcji, chip ma
 *          `exact` w title+aria-label, brak lokalnych duplikatow formatera).
 * Czesc 3: render prawdziwego renderBarD1B + chip6cHtml w Chromium -> tekst chipow ze zrzutu.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'hud-abbrev-'));
let fails = 0;
function ok(c, m) { if (c) console.log('  ok  ' + m); else { fails++; console.log('  FAIL ' + m); } }
function eq(a, b, m) { ok(a === b, m + ' -> ' + JSON.stringify(a) + (a === b ? '' : ' (oczekiwano ' + JSON.stringify(b) + ')')); }

const entry = path.join(OUT, 'entry.ts');
fs.writeFileSync(entry, `export * from ${JSON.stringify(path.join(GRA, 'src/ui/formatCompactNumber.ts'))};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(OUT, 'f.cjs'), logLevel: 'silent' });
const F = require(path.join(OUT, 'f.cjs'));

console.log('[1] formatCompactNumber');
const N = [
  [0, '0'], [5, '5'], [999, '999'], [1000, '1k'], [1049, '1k'], [1050, '1,1k'], [1200, '1,2k'],
  [1250, '1,3k'], [3042, '3k'], [20860, '20,9k'], [99949, '99,9k'], [99950, '100k'],
  [204, '204'], [999499, '999,5k'], [999500, '999,5k'], [999949, '999,9k'], [999950, '1M'],
  [1250000, '1,3M'], [1200000, '1,2M'], [1000000, '1M'], [999950000, '1B'],
  [-999, '-999'], [-1200, '-1,2k'], [-1000, '-1k'], [-20860, '-20,9k'], [-999950, '-1M'],
  [12.5, '12,5'], [999.96, '1k'], [0.04, '0'],
  [NaN, '0'], [Infinity, '0'], [-Infinity, '0'], [undefined, '0'], [null, '0'],
];
for (const [i, e] of N) eq(F.formatCompactNumber(i), e, 'compact(' + i + ')');

console.log('[2] formatCompactSigned');
const S = [
  [0, '0'], [7, '+7'], [-7, '−7'], [999, '+999'], [1257, '+1,3k'], [1348, '+1,3k'], [1248, '+1,2k'],
  [1431, '+1,4k'], [-1200, '−1,2k'], [1000, '+1k'], [999950, '+1M'], [NaN, '0'], [undefined, '0'],
];
for (const [i, e] of S) eq(F.formatCompactSigned(i), e, 'signed(' + i + ')');

console.log('[3] formatFullNumber / exactCompactNote');
eq(F.formatFullNumber(20860), '20 860', 'full(20860)');
eq(F.formatFullNumber(204), '204', 'full(204)');
eq(F.formatFullNumber(-1234567), '−1 234 567', 'full(-1234567)');
eq(F.formatFullNumber(NaN), '0', 'full(NaN)');
eq(F.exactCompactNote(204, 5), '', 'note bez skrotu = pusta');
eq(F.exactCompactNote(20860, 1257), 'Dokładnie: 20 860 (+1 257)', 'note z wartoscia i przyrostem');
eq(F.exactCompactNote(204, 1348), 'Dokładnie: 204 (+1 348)', 'note: tylko przyrost skrocony');

console.log('[4] wiring statyczny');
const hud = fs.readFileSync(path.join(GRA, 'src/ui/hud.ts'), 'utf8');
const chip = fs.readFileSync(path.join(GRA, 'src/ui/hudChip6c.ts'), 'utf8');
ok(/from '\.\/formatCompactNumber'/.test(hud), 'hud.ts importuje wspolny formatter');
ok(/\.\.\.cn\(s\.bogactwo,/.test(hud) && /\.\.\.cn\(s\.praca,/.test(hud) && /\.\.\.cn\(Math\.floor\(s\.nauka\)/.test(hud), 'Skarbiec/Praca/Nauka przez cn()');
ok(/aria-label/.test(chip) && /opts\.exact/.test(chip), 'hudChip6c: exact -> title + aria-label');
ok(!/toFixed\(1\)[^\n]*'k'/.test(hud), 'brak lokalnego formatera k w hud.ts');
const basket = fs.readFileSync(path.join(GRA, 'src/ui/diplomacyTradeBasket.ts'), 'utf8');
ok(/formatCompactNumber\(Math\.trunc\(n\)\)/.test(basket), 'diplomacyTradeBasket deleguje do wspolnego formattera');

// Plugin zgodny z vite (?raw, import.meta.glob) -- ten sam wzorzec co hud-zetony-ekonomia-brutto-live-test.cjs.
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw-file' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    build.onLoad({ filter: /\.ts$/ }, (a) => {
      const src = fs.readFileSync(a.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return { contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'), loader: 'ts', resolveDir: path.dirname(a.path) };
    });
  },
};
console.log('[5] Chromium: prawdziwy renderBarD1B');
(async () => {
  let chromium;
  try { ({ chromium } = require('playwright-core')); } catch (_) { try { ({ chromium } = require('playwright')); } catch (_2) {} }
  if (!chromium) { console.log('  SKIP brak playwright (NIE_ZMIERZONO)'); return; }
  const e2 = path.join(OUT, 'ui.ts');
  fs.writeFileSync(e2, `
import { renderBarD1B, ensureStyles } from ${JSON.stringify(path.join(GRA, 'src/ui/hud.ts'))};
(window as any).__render = (s: any) => renderBarD1B(s);
(window as any).__styles = () => ensureStyles();
`);
  await esbuild.build({ entryPoints: [e2], bundle: true, platform: 'browser', format: 'iife', outfile: path.join(OUT, 'ui.js'), logLevel: 'silent', loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' }, plugins: [viteCompatPlugin] });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
  const state = {
    bogactwo: 204, bogactwoRate: 1348, bogactwoWplywyBrutto: 1348, praca: 3042, pracaRate: 1248, pracaUpkeep: 0,
    zywnoscLabel: '20860', zywnoscRate: 1257, nauka: 2448.7, naukaRate: 1431, kultura: 12, kulturaRate: 3,
    osiedla: 4, ludnosc: 33, ludnoscRate: 1, religionStock: 0, religionRate: 0, armyUnitsOnMap: 2, rekrutEkw: 5,
    epoka: 'Brąz', epokaPostep: 0.2, zloto: 204, zlotoRate: 1348, handelIncome: 0, osiedlaMax: 6, tura: 42, power: 100,
  };
  const widths = process.argv.includes('--w') ? [Number(process.argv[process.argv.indexOf('--w') + 1])] : [360, 1920];
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: 400 } });
    await page.setContent('<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;color:#eee}</style><div id="r"></div>');
    page.on('pageerror', (e) => console.log('  pageerror: ' + e.message));
    await page.addScriptTag({ path: path.join(OUT, 'ui.js') });
    const res = await page.evaluate((st) => {
      window.__styles();
      const root = document.getElementById('r');
      root.innerHTML = '<div class="civ-hud" style="position:relative;display:block">' + window.__render(st) + '</div>';
      const measure = () => {
        let maxRight = 0;
        root.querySelectorAll('.civ-hud-chip').forEach((c) => { maxRight = Math.max(maxRight, c.getBoundingClientRect().right); });
        const row = root.querySelector('.civ-hud-banner-left');
        return { maxRight: Math.round(maxRight), rowW: Math.round(row ? row.getBoundingClientRect().width : 0), sw: document.documentElement.scrollWidth };
      };
      const out = {};
      root.querySelectorAll('.civ-hud-chip').forEach((c) => {
        const l = c.querySelector('.civ-hud-chip-lbl'); if (!l) return;
        out[l.textContent] = {
          val: c.querySelector('.civ-hud-chip-val').textContent,
          rate: (c.querySelector('.civ-hud-chip-rate') || {}).textContent || '',
          title: c.getAttribute('title') || '', aria: c.getAttribute('aria-label') || '',
        };
      });
      window.__measure = measure;
      return { out, po: measure() };
    }, state);
    const shot = async (tag) => { if (process.env.SHOT) await page.screenshot({ path: path.join(process.env.SHOT, `${tag}-${w}.png`), clip: { x: 0, y: 0, width: Math.min(w, 1920), height: 160 } }); };
    await shot('po');
    res.przed = await page.evaluate(() => {
      const root = document.getElementById('r');
      // PRZED (symulacja starego formatu): pelne liczby w tych samych chipach.
      const raw = { Skarbiec: ['204', '+1348'], Praca: ['3042', '+1248'], Spichlerz: ['20860', '+1257'], Nauka: ['2448', '+1431'] };
      root.querySelectorAll('.civ-hud-chip').forEach((c) => {
        const l = c.querySelector('.civ-hud-chip-lbl'); const r = l && raw[l.textContent]; if (!r) return;
        c.querySelector('.civ-hud-chip-val').textContent = r[0];
        const rt = c.querySelector('.civ-hud-chip-rate'); if (rt) rt.textContent = r[1];
      });
      return window.__measure();
    });
    await shot('przed');
    if (w === 1920) {
      const o = res.out;
      eq(o['Skarbiec'].val, '204', 'Skarbiec wartosc'); eq(o['Skarbiec'].rate, '+1,3k', 'Skarbiec przyrost');
      eq(o['Praca'].val, '3k', 'Praca wartosc'); eq(o['Praca'].rate, '+1,2k', 'Praca przyrost');
      eq(o['Spichlerz'].val, '20,9k', 'Spichlerz wartosc'); eq(o['Spichlerz'].rate, '+1,3k', 'Spichlerz przyrost');
      eq(o['Nauka'].val, '2,4k', 'Nauka wartosc'); eq(o['Nauka'].rate, '+1,4k', 'Nauka przyrost');
      ok(o['Spichlerz'].title.includes('Dokładnie: 20 860 (+1 257)'), 'Spichlerz title ma pelna wartosc');
      ok(o['Spichlerz'].aria.includes('20 860'), 'Spichlerz aria-label ma pelna wartosc');
      eq(o['Kultura'].val, '12', 'Kultura <1000 bez zmian');
    }
    console.log(`  info ${w}px: PO maxRight=${res.po.maxRight} rowW=${res.po.rowW} sw=${res.po.sw} | PRZED maxRight=${res.przed.maxRight} rowW=${res.przed.rowW} sw=${res.przed.sw}`);
    ok(res.po.maxRight <= res.przed.maxRight && res.po.rowW <= res.przed.rowW, `uklad ${w}px: skrocone liczby nie poszerzaja paska wzgledem pelnych`);
    await page.close();
  }
  await browser.close();
})().catch((e) => { fails++; console.log('  FAIL wyjatek: ' + (e && e.stack || e)); }).finally(() => {
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (_) {}
  console.log(fails ? `\nFAIL (${fails})` : '\nOK: hud-number-abbrev-test');
  process.exit(fails ? 1 : 0);
});
