'use strict';
/**
 * left-banner-chip-grid-clip-test.cjs -- R-WEB-UI-LEFT-BANNER-CHIP-GRID-TOP-CLIP-Q1.
 * Prawdziwe showHud() + fitHudTopbar() (hud.ts) w Chromium przy 1000×700, 800×600 i 640×480.
 * Asercje: (a) zaden element lewego banera nie ma top < 0, bottom > wysokosc okna, right > szerokosc okna;
 * (b) zadna etykieta/komorka chipa nie jest przycieta (scrollWidth <= clientWidth); (c) brak poziomego
 * scrolla strony; (d) dol powloki banera <= 104 px (panele boczne); (e) przy 1000×700 powloka ma nadal
 * 56 px (tryb nie zmieniony od >= 1000×700).
 * Uzycie: node tools/left-banner-chip-grid-clip-test.cjs [--mutant]
 * --mutant: wylacza blok @media (max-height:699px) w kopii zrodla i MUSI dac FAIL.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const HUD_TS = path.join(GRA, 'src/ui/hud.ts');
const MUTANT = process.argv.includes('--mutant');
const MEDIA_GUARD = '@media (max-height:699px){';
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const CHROME_CANDIDATES = [process.env.CHROMIUM, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/chromium'];
const CHROME = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'left-banner-chip-grid-'));

let pass = 0; let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail === undefined ? '' : ' -- ' + JSON.stringify(detail))); }
}

const viteCompat = {
  name: 'vite-compat',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    b.onLoad({ filter: /\.ts$/ }, (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      let changed = false;
      if (MUTANT && path.resolve(a.path) === HUD_TS) {
        if (!s.includes(MEDIA_GUARD)) throw new Error('mutant: brak bloku ' + MEDIA_GUARD + ' w hud.ts');
        s = s.replace(MEDIA_GUARD, '@media (max-height:0px){'); changed = true;
      }
      if (s.includes('import.meta.glob')) { s = 'const __g=()=>({});\n' + s.replace(/import\.meta\.glob/g, '__g'); changed = true; }
      return changed ? { contents: s, loader: 'ts', resolveDir: path.dirname(a.path) } : null;
    });
  },
};

async function bundle(outJs) {
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, `import * as H from ${JSON.stringify(HUD_TS)};
let cur: any = null;
(window as any).__show = (s: any) => { cur = s; (H as any).showHud({ getState: () => cur, onOpenMenu: () => {}, onOpenWiki: () => {}, onOpenEmpireRecruit: () => {}, onExecutePending: () => {} }); };
`);
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', outfile: outJs, logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' }, plugins: [viteCompat] });
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
const WINDOWS = [[1000, 700], [800, 600], [640, 480]];

const MEASURE = () => {
  const vw = document.documentElement.clientWidth; const vh = window.innerHeight;
  const root = document.querySelector('.civ-hud-banner-left');
  const shell = root && root.querySelector('.civ-hud-banner-shell');
  const R = (e) => { const r = e.getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, w: r.width, h: r.height }; };
  if (!root || !shell) return { missing: true };
  const out = { vw, vh, fallback: root.classList.contains('hud-left-fallback'), shell: R(shell), outside: [], clipped: [], labels: 0, labelClipped: [] };
  for (const e of [root, ...root.querySelectorAll('*')]) {
    if (e.getClientRects().length === 0) continue;
    const r = R(e);
    if (r.t < -0.5 || r.b > vh + 0.5 || r.r > vw + 0.5 || r.l < -0.5) {
      out.outside.push({ cls: String(e.className).split(' ')[0], t: Math.round(r.t), b: Math.round(r.b), r: Math.round(r.r) });
    }
    if (e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') {
      out.clipped.push({ cls: String(e.className).split(' ')[0], sw: e.scrollWidth, cw: e.clientWidth, text: (e.textContent || '').slice(0, 20) });
    }
  }
  for (const l of root.querySelectorAll('.civ-hud-chip-lbl')) {
    out.labels++;
    if (l.scrollWidth > l.clientWidth + 1 || l.getBoundingClientRect().right > l.closest('.civ-hud-chip-cell').getBoundingClientRect().right + 0.5) {
      out.labelClipped.push(l.textContent);
    }
  }
  return out;
};

async function main() {
  const js = path.join(TMP, 'bundle.js');
  await bundle(js);
  const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  try {
    for (const [w, h] of WINDOWS) {
      for (const [name, st] of Object.entries(STATES)) {
        const page = await br.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
        await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1a1d24"></body>');
        await page.addScriptTag({ path: js });
        await page.evaluate((s) => window.__show(s), st);
        await settle(page);
        const m = await page.evaluate(MEASURE);
        const doc = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const tag = `${w}x${h}/${name}`;
        check(`${tag}: baner zmontowany`, !m.missing, m);
        if (m.missing) { await page.close(); continue; }
        check(`${tag}: zaden element lewego banera poza oknem`, m.outside.length === 0, m.outside.slice(0, 4));
        check(`${tag}: brak przyciętej treści w komórkach/etykietach`, m.clipped.length === 0 && m.labelClipped.length === 0,
          { clipped: m.clipped.slice(0, 3), labelClipped: m.labelClipped });
        check(`${tag}: brak poziomego scrolla strony`, doc <= 0.5, { doc });
        check(`${tag}: dol powloki banera <= 104 px (${Math.round(m.shell.b)})`, m.shell.b <= 104.5, m.shell.b);
        if (w === 1000 && h === 700) check(`${tag}: powloka 56 px (tryb >= 1000x700 bez zmian)`, Math.abs(m.shell.h - 56) < 0.5, m.shell.h);
        await page.close();
      }
    }
  } finally { await br.close(); }
  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'}: left-banner-chip-grid-clip-test${MUTANT ? ' (mutant)' : ''} (${pass} ok, ${fail} fail)`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
