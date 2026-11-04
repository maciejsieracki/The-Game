'use strict';
/**
 * hud-recruits-abbrev-test.cjs -- R-WEB-HUD-RECRUITS-NUMBER-ABBREV-Q1
 * Run: cd gra && node tools/hud-recruits-abbrev-test.cjs   (SHOT=<dir> [TAG=przed|po] zapisuje zrzut)
 * Etykieta "Rekruci" w HUD (.p-recruit-val) ma uzywac wspolnego formattera k/M
 * (formatCompactNumber), a nie "tys./mln" z manpower.ts; pelna wartosc w title.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'hud-recr-'));
let fails = 0;
function ok(c, m) { if (c) console.log('  ok  ' + m); else { fails++; console.log('  FAIL ' + m); } }
function eq(a, b, m) { ok(a === b, m + ' -> ' + JSON.stringify(a) + (a === b ? '' : ' (oczekiwano ' + JSON.stringify(b) + ')')); }

const hudSrc = fs.readFileSync(path.join(GRA, 'src/ui/hud.ts'), 'utf8');
ok(/from '\.\/formatCompactNumber'/.test(hudSrc), 'hud.ts importuje wspolny formatter');
ok(/formatFullNumber\(recruitNum\)/.test(hudSrc), 'hud.ts: tooltip Rekruci z pelna wartoscia');

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
// etykieta jak w main.ts (formatManpower) -- zrodlo "tys./mln"
const mpEntry = path.join(OUT, 'mp.ts');
fs.writeFileSync(mpEntry, `export { formatManpower } from ${JSON.stringify(path.join(GRA, 'src/game/manpower.ts'))};\n`);
esbuild.buildSync({ entryPoints: [mpEntry], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(OUT, 'mp.cjs'), logLevel: 'silent' });
const { formatManpower } = require(path.join(OUT, 'mp.cjs'));

const CASES = [[999, '999', '999'], [1000, '1k', '1 000'], [12345, '12,3k', '12 345'], [1234567, '1,2M', '1 234 567']];
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
  const base = {
    bogactwo: 204, bogactwoRate: 1, praca: 30, pracaRate: 1, zywnoscLabel: '200', zywnoscRate: 1, nauka: 24, naukaRate: 1,
    kultura: 12, kulturaRate: 3, osiedla: 4, ludnosc: 33, ludnoscRate: 1, religionStock: 0, religionRate: 0,
    armyUnitsOnMap: 2, epoka: 'Brąz', epokaPostep: 0.2, zloto: 204, zlotoRate: 1, handelIncome: 0, osiedlaMax: 6, tura: 42, power: 100,
  };
  const page = await browser.newPage({ viewport: { width: 1920, height: 300 } });
  page.on('pageerror', (e) => console.log('  pageerror: ' + e.message));
  await page.setContent('<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;color:#eee}</style><div id="r"></div>');
  await page.addScriptTag({ path: path.join(OUT, 'ui.js') });
  for (const [n, compact, full] of CASES) {
    const st = { ...base, rekruci: n, rekruciLabel: formatManpower(n), rekrutEkw: Math.floor(n / 50) };
    const res = await page.evaluate((s) => {
      window.__styles();
      const root = document.getElementById('r');
      root.innerHTML = '<div class="civ-hud" style="position:relative;display:block">' + window.__render(s) + '</div>';
      const v = root.querySelector('.p-recruit-val'); const side = root.querySelector('.p-side-left');
      return { txt: v.textContent, title: side.getAttribute('title') || '', w: Math.round(side.getBoundingClientRect().width) };
    }, st);
    const m = /^(.+) \(\d+\)$/.exec(res.txt);
    eq(m && m[1], compact, `Rekruci HUD ${n}`);
    ok(res.title.replace(/\u00a0/g, ' ').includes('Manpower: ' + full + ' '), `title ma pelna wartosc "${full}"`);
    console.log(`  info ${n}: txt=${JSON.stringify(res.txt)} szer=${res.w}px`);
    if (process.env.SHOT && n === 12345) await page.screenshot({ path: path.join(process.env.SHOT, (process.env.TAG || 'po') + '.png'), clip: { x: 760, y: 0, width: 400, height: 120 } });
  }
  await browser.close();
})().catch((e) => { fails++; console.log('  FAIL wyjatek: ' + (e && e.stack || e)); }).finally(() => {
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (_) {}
  console.log(fails ? `\nFAIL (${fails})` : '\nOK: hud-recruits-abbrev-test');
  process.exit(fails ? 1 : 0);
});
