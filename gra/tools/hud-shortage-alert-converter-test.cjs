'use strict';
/**
 * hud-shortage-alert-converter-test.cjs — R-WEB-UI-HUD-SHORTAGE-ALERT-TOOLTIP-Q1.
 *
 * Run from gra/:  node tools/hud-shortage-alert-converter-test.cjs
 *
 * Sprawdza:
 *   A. resourceIsShortage (resource-gross-net.ts, jedno źródło) = netto HUD < 0,
 *      czyli produkcja − zużycie − wejścia konwerterów (nie sama produkcja).
 *   B. Tooltip „Brutto · netto” (hud.ts → surowceChipTitle): wiersz „Wejścia przetwórstwa: −N”
 *      tylko gdy N > 0; bez wejść tekst pozostaje bez tego wiersza.
 *   C. Statyczne: main.ts liczy alert/etykiety/chip przez resourceIsShortage i przekazuje
 *      surowceWejscia do HUD (bez lokalnego wzoru `ratePerTurn < 0`).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-shortage-alert-'));

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}

async function bundle(srcFile, outName) {
  const outFile = path.join(TMP, outName + '.cjs');
  await esbuild.build({
    entryPoints: [srcFile], bundle: true, platform: 'node', format: 'cjs', outfile: outFile, logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json', '.css': 'empty', '.svg': 'text' }, external: [],
    plugins: [{
      name: 'raw-query',
      setup(b) {
        b.onResolve({ filter: /\?raw$/ }, args => ({
          path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'rawtext',
        }));
        b.onLoad({ filter: /.*/, namespace: 'rawtext' }, a => ({
          contents: fs.readFileSync(a.path, 'utf8'), loader: 'text',
        }));
      },
    }],
  });
  return require(outFile);
}

(async () => {
  console.log('== A. resourceIsShortage (jedno źródło netto HUD)');
  const rgn = await bundle(path.join(SRC, 'game', 'resource-gross-net.ts'), 'rgn');
  ok(typeof rgn.resourceIsShortage === 'function', 'resource-gross-net.ts eksportuje resourceIsShortage');
  const isShort = typeof rgn.resourceIsShortage === 'function' ? rgn.resourceIsShortage : () => false;
  ok(isShort({ ratePerTurn: 10, rateProductionPerTurn: 10, rateConverterInputPerTurn: 15 }) === true,
    'produkcja 10, wejścia konwerterów 15 -> niedobór (netto -5), alert MUSI się zapalić');
  ok(isShort({ ratePerTurn: 10, rateProductionPerTurn: 10 }) === false,
    'produkcja 10, bez wejść i zużycia -> brak niedoboru');
  ok(isShort({ ratePerTurn: -3, rateProductionPerTurn: -3 }) === true,
    'ratePerTurn -3 -> niedobór (regresja dotychczasowego alertu)');
  ok(isShort({ ratePerTurn: 10, rateProductionPerTurn: 10, usage: { buildings: 4, citizens: 4, units: 4 } }) === true,
    'produkcja 10, zużycie 12 -> niedobór (netto HUD odejmuje zużycie)');
  ok(isShort({ ratePerTurn: 10, rateProductionPerTurn: 10, rateConverterInputPerTurn: 10 }) === false,
    'wejścia równe produkcji (netto 0) -> brak niedoboru');

  console.log('== B. tooltip „Brutto · netto”: wiersz wejść tylko gdy N > 0');
  const tip = typeof rgn.resourceWejsciaTooltipText === 'function' ? rgn.resourceWejsciaTooltipText : () => null;
  ok(typeof rgn.resourceWejsciaTooltipText === 'function', 'resource-gross-net.ts eksportuje resourceWejsciaTooltipText');
  ok(/^Wejścia przetwórstwa: −15/.test(tip(15) || ''), 'N=15 -> „Wejścia przetwórstwa: −15…”', tip(15));
  ok(tip(0) === null, 'N=0 -> brak wiersza (null)', tip(0));
  ok(tip(undefined) === null, 'N nieobecne -> brak wiersza (null)');
  ok(tip(-4) === null, 'N ujemne -> brak wiersza (null)', tip(-4));

  console.log('== C. statyczne: main.ts/hud.ts używają jednego źródła');
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  ok(/resourceIsShortage\(r\)/.test(main), 'main.ts: niedobór liczony przez resourceIsShortage(r)');
  ok(!/filter\(r => r\.ratePerTurn < 0\)\.map\(r => r\.label\)/.test(main),
    'main.ts: surowceNiedoborLabels nie filtruje po samym ratePerTurn');
  ok(!/r\.ratePerTurn < 0 \|\| r\.stock/.test(main), 'main.ts: resourceAlertCount nie używa samego ratePerTurn < 0');
  ok(/surowceWejscia(:\s*surowceWejscia)?,/.test(main), 'main.ts: przekazuje surowceWejscia do HUD');
  const hudSrc = fs.readFileSync(path.join(SRC, 'ui', 'hud.ts'), 'utf8');
  ok(/surowceWejscia\?:\s*number/.test(hudSrc), 'hud.ts: HudState ma pole surowceWejscia');
  ok(/resourceWejsciaTooltipText\(s\.surowceWejscia\)/.test(hudSrc), 'hud.ts: tooltip korzysta z resourceWejsciaTooltipText');

  console.log('');
  console.log(`RESULT: ${passes} ok, ${fails} FAIL`);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.error(e);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(2);
});
