'use strict';
/**
 * Focused wiring gate for R-CYWILIZACJE-MACIERZ-ALL-113-WEALTH-R2.
 * Run from gra/: node tools/wealth-civ-matrix-wiring-test.cjs
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const wealthEntry = path.join(__dirname, '.wealth-civ-matrix-entry.ts');
const wealthBundle = path.join(__dirname, '.wealth-civ-matrix-bundle.cjs');
fs.writeFileSync(wealthEntry, `
export {
  FALLBACK_WEALTH_PARAMS,
  applyWealthMatrixProc,
  resolveWealthParamsForCiv,
} from '../src/game/wealth';
export { loadCivMatrix } from '../src/game/civ-matrix';
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [wealthEntry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: wealthBundle, logLevel: 'silent',
  });
  const W = require(wealthBundle);
  const matrix = W.loadCivMatrix();
  assert.strictEqual(matrix.cywilizacje.length, 15, 'macierz musi zawierać 15 cywilizacji');

  for (const row of matrix.cywilizacje) {
    const resolved = W.resolveWealthParamsForCiv(W.FALLBACK_WEALTH_PARAMS, row.ikonaId);
    assert.strictEqual(resolved.capNaEpoke, W.FALLBACK_WEALTH_PARAMS.capNaEpoke,
      `${row.ikonaId}: znana cywilizacja nie może zgubić wartości macierzy`);
    assert.strictEqual(resolved.mnoznikNaPoziom, W.FALLBACK_WEALTH_PARAMS.mnoznikNaPoziom,
      `${row.ikonaId}: znana cywilizacja nie może zgubić wartości macierzy`);
  }

  const neutral = W.resolveWealthParamsForCiv(W.FALLBACK_WEALTH_PARAMS, 'neutral-or-unknown');
  assert.deepStrictEqual(neutral, W.FALLBACK_WEALTH_PARAMS, 'unknown/neutral fallback pozostaje neutralny');
  assert(Math.abs(W.applyWealthMatrixProc(100, 0.10) - 110) < 1e-9, '+10% cap/mnożnik');
  assert(Math.abs(W.applyWealthMatrixProc(100, -0.10) - 90) < 1e-9, '-10% cap/mnożnik');

  const wealthSource = fs.readFileSync(path.join(GRA, 'src/game/wealth.ts'), 'utf8');
  const turnSource = fs.readFileSync(path.join(GRA, 'src/game/turn-economy.ts'), 'utf8');
  const panelSource = fs.readFileSync(path.join(GRA, 'src/ui/cityPanel.ts'), 'utf8');
  const mainSource = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
  assert(wealthSource.includes("civMatrixParam(civKey, 'wealth_cap_proc')"), 'wealth.ts: cap consumer');
  assert(wealthSource.includes("civMatrixParam(civKey, 'wealth_mnoznik_proc')"), 'wealth.ts: mnożnik consumer');
  assert((turnSource.match(/resolveWealthParamsForCiv\(wealthParams, ownerCivKey\)/g) || []).length >= 2,
    'turn-economy.ts: preview i live tick używają owner civKey');
  assert((panelSource.match(/cfg\.getCivKey\?\.\(city\.ownerId\)/g) || []).length >= 2,
    'cityPanel.ts: oba runtime call-sites używają civKey właściciela');
  assert(mainSource.includes('ownerCivMap, orderMultMap'), 'main.ts: live player/AI ownerCivMap trafia do ekonomii');
  // R-CYWILIZACJE-MACIERZ-WIRING-PRODUKCJA-Q1-20260923 integration (orkiestrator, test-only
  // fix): getCivKey w cityPanel runtime context zyskal debug-tracing body
  // (cityPanelCivKeyTrace) z integracji Produkcji -- ciagle woła civKeyForOwnerId(ownerId)
  // i zwraca jego wynik, tylko już nie jako one-liner. Sprawdzamy zachowanie (wywołanie +
  // return), nie dokładny literał tekstu.
  assert(mainSource.includes('getCivKey: (ownerId: number) => {')
    && mainSource.includes('const civKey = civKeyForOwnerId(ownerId);')
    && mainSource.includes('return civKey;'),
    'main.ts: cityPanel runtime context udostępnia civKey');
  console.log('PASS wealth-civ-matrix-wiring-test: 15 civs, unknown/neutral, +/-10%, live/preview/UI parity');
} finally {
  for (const file of [wealthEntry, wealthBundle]) {
    try { fs.unlinkSync(file); } catch {}
  }
}
