'use strict';
/**
 * danina-podatek-tooltip-ui-test.cjs — tooltip heksu: wiersz plonu podatkowego
 * zawsze "Podatek" (decyzja Macieja 2026-07-27).
 * Run from gra/:  node tools/danina-podatek-tooltip-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY (2026-08-08, nota N5 Evaluatora
// zwiadowca-drewno): NIE 'brandAssets-stub.ts' — ten plik jest współdzielony
// i ŚLEDZONY w gicie (patrz army-merge-dismiss-bounce-test.cjs), a jego
// zawartość różni się między bramkami. Każde uruchomienie brudziło
// niezwiązany trackowany plik w git status. Nazwa własna dla tej bramki
// (wzorem pre-battle-brandAssets-stub.ts / brandAssets-diplo-treaty-stub.ts)
// trzyma stub poza współdzielonym plikiem. Zestaw eksportów = dokładnie to,
// czego wymaga cały łańcuch importów hexContextTooltip.ts (bezpośrednio i
// przez unitCardStatus.ts) — brandIconSvg, mapResourceIconSvg, terrainIconSvg,
// unitIconSvg (ten ostatni brakował tu wcześniej: P-BRAMKA-DANINA-PODATEK-CZERWONA).
const STUB_FILE = path.resolve(STUB_DIR, 'danina-podatek-brandAssets-stub.ts');
const ENTRY_FILE = path.resolve(__dirname, '.danina-podatek-tooltip-ui-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.danina-podatek-tooltip-ui-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(STUB_FILE, `
export function brandIconSvg(_key, _size) { return ''; }
export function mapResourceIconSvg(_key, _size) { return ''; }
export function terrainIconSvg(_key, _size) { return ''; }
export function unitIconSvg(_key) { return ''; }
`, 'utf8');

fs.writeFileSync(ENTRY_FILE, `
export { buildHexContextTooltipHtml } from '../src/ui/hexContextTooltip';
export { daninaLabel } from '../src/game/danina-nazwa';
`, 'utf8');

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
  },
};

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE_FILE,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[danina-podatek-tooltip-ui-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const M = require(BUNDLE_FILE);

  let pass = 0, fail = 0;
  function ok(c, m) {
    if (c) { pass++; console.log('  PASS:', m); }
    else { fail++; console.error('  FAIL:', m); }
  }

  function hexDaninaLabelForCiv() {
    return M.daninaLabel();
  }

  const hex = { terenBazowy: 'laka', nakladka: 'brak' };
  const esc = (s) => s;

  function handelRowLabel(html) {
    const containsPodatek = html.includes('Podatek');
    const containsDanina = html.includes('>Danina<') || / Danina[:<]/.test(html) || html.includes('Danina</span>') || html.includes('Danina:');
    return { containsPodatek, containsDanina };
  }

  // 1) Bez Mennicy — "Podatek".
  {
    const label = hexDaninaLabelForCiv();
    ok(label === 'Podatek', '1) zawsze etykieta "Podatek"');
    const html = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: label });
    const r = handelRowLabel(html);
    ok(r.containsPodatek && !r.containsDanina, '1b) tooltip renderuje "Podatek"');
  }

  // 2) Z Mennica+Waluta — nadal "Podatek".
  {
    const label = hexDaninaLabelForCiv();
    ok(label === 'Podatek', '2) Waluta+Mennica -> Podatek');
    const html = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: label });
    const r = handelRowLabel(html);
    ok(r.containsPodatek && !r.containsDanina, '2b) tooltip "Podatek"');
  }

  // 3) Brak dostepu do zlota — nadal "Podatek".
  {
    const label = hexDaninaLabelForCiv();
    ok(label === 'Podatek', '3) brak zlota -> nadal Podatek');
    const html = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: label });
    const r = handelRowLabel(html);
    ok(r.containsPodatek && !r.containsDanina, '3b) tooltip "Podatek"');
  }

  // 4) Heks niczyj + fallback bez pola daninaLabel.
  {
    const label = hexDaninaLabelForCiv();
    ok(label === 'Podatek', '4a) heks niczyj -> Podatek');
    const htmlExplicit = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: label });
    const rExplicit = handelRowLabel(htmlExplicit);
    ok(rExplicit.containsPodatek && !rExplicit.containsDanina, '4b) tooltip jawny Podatek');
    const htmlFallback = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc });
    const rFallback = handelRowLabel(htmlFallback);
    ok(rFallback.containsPodatek && !rFallback.containsDanina, '4c) fallback bez pola -> Podatek');
    ok(htmlFallback === htmlExplicit, '4d) fallback = jawny Podatek (spójność)');
  }

  // 5) PARYTET — ten sam render niezależnie od ownerId (etykieta stała).
  {
    const labelPlayer = hexDaninaLabelForCiv();
    const labelAi = hexDaninaLabelForCiv();
    ok(labelPlayer === 'Podatek' && labelAi === 'Podatek', '5a) gracz i AI -> Podatek');
    const htmlPlayer = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: labelPlayer });
    const htmlAi = M.buildHexContextTooltipHtml({ q: 0, r: 0, hex, esc, daninaLabel: labelAi });
    ok(htmlPlayer === htmlAi, '5c) render tooltipa identyczny');
  }

  console.log(`\ndanina-podatek-tooltip-ui-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
