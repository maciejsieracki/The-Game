'use strict';
// R-WEB-UI-ARMY-SPLIT-HEX-HONEYCOMB-Q1: 7 komórek panelu "Rozdziel armię" = identyczne heksy,
// jednakowe odległości środków sąsiadów i jednakowa szczelina na 12 stykach (±0,5 px).
// Uruchom: CHROMIUM_PATH=... node tools/army-split-hex-honeycomb-test.cjs [--shots dir] [--table]
// --mutate: podstawia stare procenty pozycji (test MUSI wtedy czerwienieć).
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));
const UI_DIR = path.resolve(__dirname, '..', 'src', 'ui');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'army-split-honeycomb-'));
const STUB = path.join(TMP, 'brandAssets.ts');
const OUT = path.join(TMP, 'panel.cjs');
const argv = process.argv;
const shotArg = argv.indexOf('--shots');
const SHOTS = shotArg >= 0 ? path.resolve(argv[shotArg + 1]) : null;
const MUTATE = argv.includes('--mutate');
const TABLE = argv.includes('--table');
const TOL = 0.5;
fs.writeFileSync(STUB, 'export function unitIconSvg(){return "<svg></svg>";}');
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name + (detail ? ' — ' + JSON.stringify(detail) : '')); }
}
let source = fs.readFileSync(path.join(UI_DIR, 'armySplitPanel.ts'), 'utf8')
  + '\n;(window).__asp={showArmySplitPanel,hideArmySplitPanel};';
if (MUTATE) { // stare, ręcznie dobrane procenty pozycji (sprzed zmiany)
  const rep = (a, b) => { if (!source.includes(a)) throw new Error('mutacja: brak ' + a); source = source.replace(a, b); };
  rep('left:${HEX_X[2]}%;top:${HEX_Y[1]}%}.civ-asp-cell.NE{left:${HEX_X[1.5]}%;top:${HEX_Y[0]}%}.civ-asp-cell.NW{left:${HEX_X[0.5]}%;top:${HEX_Y[0]}%}',
    'left:67.1%;top:30.8%}.civ-asp-cell.NE{left:51.2%;top:3.6%}.civ-asp-cell.NW{left:19.4%;top:3.6%}');
  rep('left:${HEX_X[0]}%;top:${HEX_Y[1]}%}.civ-asp-cell.SW{left:${HEX_X[0.5]}%;top:${HEX_Y[2]}%}.civ-asp-cell.SE{left:${HEX_X[1.5]}%;top:${HEX_Y[2]}%}',
    'left:3.5%;top:30.8%}.civ-asp-cell.SW{left:19.4%;top:58%}.civ-asp-cell.SE{left:51.2%;top:58%}');
  rep('left:${HEX_X[1]}%;top:${HEX_Y[1]}%;z-index:2', 'left:35.3%;top:30.8%;z-index:2');
}
const NEI = [['E', 1, 0], ['NE', 1, -1], ['NW', 0, -1], ['W', -1, 0], ['SW', -1, 1], ['SE', 0, 1]];
// 6 par ze środkiem + 6 par obwodowych (W-NW, NW-NE, NE-E, E-SE, SE-SW, SW-W)
const PAIRS = [['ARMIA', 'NW'], ['ARMIA', 'NE'], ['ARMIA', 'W'], ['ARMIA', 'E'], ['ARMIA', 'SW'], ['ARMIA', 'SE'],
  ['W', 'NW'], ['NW', 'NE'], ['NE', 'E'], ['E', 'SE'], ['SE', 'SW'], ['SW', 'W']];
async function main() {
  await esbuild.build({ stdin: { contents: source, resolveDir: UI_DIR, sourcefile: 'armySplitPanel.ts', loader: 'ts' },
    bundle: true, platform: 'browser', format: 'iife', outfile: OUT, logLevel: 'silent',
    plugins: [{ name: 'brand-stub', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB })); } }] });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.setContent('<!doctype html><html><head></head><body style="margin:0;background:#080a12"></body></html>');
  await page.addScriptTag({ path: OUT });
  const neighbors = NEI.map(([direction, dq, dr]) => ({ q: 10 + dq, r: 5 + dr, direction, terrain: 'Łąka', available: true }));
  const dests = neighbors.map(n => ({ q: n.q, r: n.r, label: `(${n.q},${n.r})` }));
  dests.push({ q: 10, r: 5, label: 'W mieście (ten heks)' });
  const open = (subset) => page.evaluate(({ neighbors, dests, subset }) => {
    const cells = neighbors.map(n => subset && !subset.includes(n.direction) ? { ...n, available: false, reason: 'Teren nieprzejezdny' } : n);
    window.__asp.showArmySplitPanel({ hexLabel: '(10,5)', units: [{ id: 'u1', name: 'Wojownik' }, { id: 'u2', name: 'Łucznik' }],
      neighbors: cells, destHexes: dests, onSplit() {}, onCancel() {} });
  }, { neighbors, dests, subset });
  const measure = (w) => page.evaluate((w) => {
    const map = document.querySelector('.civ-asp-map');
    map.style.width = w + 'px'; // wymuszona szerokość kontenera
    const R = {};
    for (const el of document.querySelectorAll('.civ-asp-cell')) {
      const key = el.classList.contains('center') ? 'ARMIA' : [...el.classList].find(c => /^(NW|NE|W|E|SW|SE)$/.test(c));
      const r = el.getBoundingClientRect();
      R[key] = { w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    }
    const m = map.getBoundingClientRect();
    return { R, mapW: m.width, mapH: m.height };
  }, w);
  const range = (a) => Math.max(...a) - Math.min(...a);
  for (const [label, subset] of [['6 dostepnych', null], ['3 dostepne (NW,E,SW)', ['NW', 'E', 'SW']]]) {
    for (const w of [340, 300, 260]) {
      await open(subset);
      const { R, mapW, mapH } = await measure(w);
      const keys = Object.keys(R);
      const ws = keys.map(k => R[k].w), hs = keys.map(k => R[k].h);
      const dists = [], gaps = [];
      for (const [a, b] of PAIRS) {
        const d = Math.hypot(R[a].cx - R[b].cx, R[a].cy - R[b].cy);
        dists.push(d); gaps.push(d - R[a].w); // regularny heks pointy-top: szczelina = odleglosc srodkow - szerokosc (2*apothem)
      }
      if (TABLE) {
        console.log(`--- ${label}, kontener ${w}px (zmierzony ${mapW.toFixed(2)}x${mapH.toFixed(2)})`);
        console.log('komorka  w       h       cx      cy');
        for (const k of keys) console.log(k.padEnd(8), R[k].w.toFixed(2).padStart(7), R[k].h.toFixed(2).padStart(7), R[k].cx.toFixed(2).padStart(7), R[k].cy.toFixed(2).padStart(7));
        PAIRS.forEach(([a, b], i) => console.log(`${a}-${b}`.padEnd(10), 'dist', dists[i].toFixed(2), 'szczelina', gaps[i].toFixed(2)));
      }
      const tag = `${label} @${w}px`;
      check(`${tag}: 7 komorek`, keys.length === 7, keys);
      check(`${tag}: rozmiary rowne +-${TOL}px (zakres w=${range(ws).toFixed(2)}, h=${range(hs).toFixed(2)})`, range(ws) <= TOL && range(hs) <= TOL);
      check(`${tag}: proporcja h/w = 2/sqrt3 (regularny polygon)`, Math.abs(hs[0] - ws[0] * 2 / Math.sqrt(3)) <= TOL, { w: ws[0], h: hs[0] });
      check(`${tag}: 12 odleglosci srodkow rownych +-${TOL}px (zakres ${range(dists).toFixed(2)})`, range(dists) <= TOL, dists);
      check(`${tag}: 12 szczelin rownych +-${TOL}px (zakres ${range(gaps).toFixed(2)}) i dodatnich`, range(gaps) <= TOL && Math.min(...gaps) > 0, gaps);
      if (SHOTS && !MUTATE && ((!subset && w === 340) || (subset && w === 260))) {
        fs.mkdirSync(SHOTS, { recursive: true });
        await page.locator('.civ-asp-map').screenshot({ path: path.join(SHOTS, `after-map-${w}px-${subset ? 'subset' : 'all'}.png`) });
      }
    }
  }
  // zrzuty calego panelu przy 340 i 280 px szerokosci viewportu
  if (SHOTS && !MUTATE) {
    for (const vw of [340, 280]) {
      const p2 = await browser.newPage({ viewport: { width: vw, height: 900 } });
      await p2.setContent('<!doctype html><html><head></head><body style="margin:0;background:#080a12"></body></html>');
      await p2.addScriptTag({ path: OUT });
      await p2.evaluate(({ neighbors, dests }) => window.__asp.showArmySplitPanel({ hexLabel: '(10,5)',
        units: [{ id: 'u1', name: 'Wojownik' }, { id: 'u2', name: 'Łucznik' }], neighbors, destHexes: dests, onSplit() {}, onCancel() {} }), { neighbors, dests });
      await p2.screenshot({ path: path.join(SHOTS, `${process.env.SHOT_PREFIX || 'after'}-panel-${vw}px.png`) });
      await p2.close();
    }
  }
  await browser.close();
  console.log(`\narmy-split-hex-honeycomb-test${MUTATE ? ' [MUTACJA]' : ''}: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
