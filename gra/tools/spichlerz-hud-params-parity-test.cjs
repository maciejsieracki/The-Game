'use strict';
/**
 * spichlerz-hud-params-parity-test.cjs — R-WEB-SPICHLERZ-HUD-PARAMS-Q1.
 * Podgląd HUD (panel miasta) zużycia Spichlerza = te same parametry co silnik (advanceCityEconomy).
 *  1) parytet: dla easy/normal/hard i danych 10/40/60 podgląd (dryRun + loadSpichlerzDrainParams, tak jak cityPanel.ts)
 *     zgadza się z realną wypłatą w advanceCityEconomy dla magazynu val-1 / val / val+1 / 25 (Ceramika I/II, Sól II).
 *  2) mutacja: podgląd z fallbackiem 25 (stare zachowanie) ROZJEŻDŻA się z silnikiem -> asercje wykrywają regres.
 *  3) wiring źródła: oba wywołania w cityPanel.ts podają loadSpichlerzDrainParams(data.econParams, difficulty),
 *     a defaulty parametrów w building-resource-gate.ts zniknęły (wymagany parametr).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const TAG = `spichlerz-hud-params-parity-${process.pid}`;
const ENTRY = path.join(__dirname, `.${TAG}-entry.ts`);
const BUNDLE = path.join(__dirname, `.${TAG}-bundle.cjs`);
fs.writeFileSync(ENTRY, `
export { advanceCityEconomy } from '../src/game/turn-economy';
export {
  paySpichlerzDrainForCity,
  loadSpichlerzDrainParams,
  resolveOwnedBuildingInactiveStatus,
  SPICHLERZ_DRAIN_FALLBACK_PER_TURN,
} from '../src/game/building-resource-gate';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
});
const M = require(BUNDLE);
const D = f => JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', f), 'utf8'));
const DATA_BASE = {
  civs: D('civs.json'), econParams: D('econ-params.json'), societyParams: D('society-params.json'),
  buildings: D('buildings.json'), units: D('units.json'), tech: D('tech.json'),
};
const DIFFS = ['easy', 'normal', 'hard'];
const KEYS = ['budynek_spichlerz_zuzywa_ceramika', 'budynek_spichlerz_ii_zuzywa_ceramika', 'budynek_spichlerz_ii_zuzywa_sol'];
const VAL = { easy: 10, normal: 40, hard: 60 };
const P25 = { ceramikaI: 25, ceramikaII: 25, solII: 25 };

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }
const clone = o => JSON.parse(JSON.stringify(o));
function econAll(diff) {
  const e = clone(DATA_BASE.econParams);
  for (const k of KEYS) e.budynki[k][diff] = VAL[diff];
  return e;
}
function city(cer, sol) {
  return { id: 'A', ownerId: 0, q: 0, r: 0, name: 'A', population: 1, magazynZywnosci: 10, surowce: { ceramika: cer, sol } };
}
// Silnik: realna tura; zwraca czy ceramika / sól zostały wypłacone (spadek stanu).
function engine(builtIds, cer, sol, diff, econ) {
  const cities = [city(cer, sol)];
  const data = { ...DATA_BASE, econParams: econ };
  M.advanceCityEconomy(cities, { hexes: {} }, data, diff, [], new Map(), new Map([['A', builtIds]]));
  const c = cities[0].surowce;
  return { cerPaid: (c.ceramika ?? 0) < cer, solPaid: (c.sol ?? 0) < sol };
}
// Podgląd HUD: dokładnie to, co robi cityPanel.ts (dryRun + params z econ-params wg trudności).
function preview(builtIds, cer, sol, diff, econ, paramsOverride) {
  const params = paramsOverride ?? M.loadSpichlerzDrainParams(econ, diff);
  const cities = [city(cer, sol)];
  const d = M.paySpichlerzDrainForCity(cities, 0, builtIds, true, params);
  const st = M.resolveOwnedBuildingInactiveStatus(builtIds.includes('spichlerz_ii') ? 'spichlerz_ii' : 'spichlerz', {
    builtIds, allCities: cities, ownerId: 0, runtimeActiveBuiltIds: [], empireStock: cities[0].surowce, drainParams: params,
  });
  return { cerPaid: d.ceramikaPaid, solPaid: d.solPaid, missing: st.missingLabels };
}

console.log('[1] parytet podgląd HUD <-> advanceCityEconomy (dane 10/40/60 wg trudności)');
for (const d of DIFFS) {
  const econ = econAll(d);
  const v = VAL[d];
  for (const built of [['spichlerz'], ['spichlerz_ii']]) {
    for (const stock of [v - 1, v, v + 1, 25]) {
      const e = engine(built, stock, stock, d, econ);
      const p = preview(built, stock, stock, d, econ);
      const tag = `${d} ${built[0]} magazyn ${stock} (próg ${v})`;
      ok(p.cerPaid === e.cerPaid, `${tag}: Ceramika podgląd=${p.cerPaid} silnik=${e.cerPaid}`);
      if (built[0] === 'spichlerz_ii') ok(p.solPaid === e.solPaid, `${tag}: Sól podgląd=${p.solPaid} silnik=${e.solPaid}`);
      ok(p.missing.includes('Ceramika') === !e.cerPaid, `${tag}: tooltip nieaktywności zgodny z silnikiem`);
    }
  }
}

console.log('[2] mutacja: podgląd z fallbackiem 25 rozjeżdża się z silnikiem (test wykrywa regres)');
{
  let diverged = 0;
  for (const d of DIFFS) {
    const econ = econAll(d);
    const v = VAL[d];
    for (const stock of [v - 1, v, v + 1, 25]) {
      const e = engine(['spichlerz'], stock, 0, d, econ);
      const mut = preview(['spichlerz'], stock, 0, d, econ, P25);
      if (mut.cerPaid !== e.cerPaid) diverged++;
    }
  }
  ok(diverged >= 3, `mutacja (podgląd 25): rozjazd z silnikiem w ${diverged} przypadkach (>=3)`);
}

console.log('[3] wiring źródła: cityPanel.ts i brak defaultów');
{
  const panel = fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
  const gate = fs.readFileSync(path.resolve(GRA, 'src', 'game', 'building-resource-gate.ts'), 'utf8');
  const loads = panel.match(/loadSpichlerzDrainParams\(\s*data\.econParams as unknown as RawConverterParamsJson,\s*cfg\.difficulty \?\? 'normal'/g) || [];
  ok(loads.length === 2, `cityPanel.ts: 2 wywołania loadSpichlerzDrainParams(data.econParams, cfg.difficulty) (got ${loads.length})`);
  ok(/paySpichlerzDrainForCity\(\s*allCities,[^;]*?loadSpichlerzDrainParams/.test(panel.replace(/\/\/[^\n]*/g, '')),
    'cityPanel.ts: paySpichlerzDrainForCity dostaje params z loadSpichlerzDrainParams');
  ok(/drainParams: loadSpichlerzDrainParams\(/.test(panel), 'cityPanel.ts: resolveOwnedBuildingInactiveStatus dostaje drainParams');
  ok(!/params: SpichlerzDrainParams = /.test(gate) && !/SPICHLERZ_DRAIN_DEFAULT_PARAMS/.test(gate),
    'building-resource-gate.ts: brak defaultu params / SPICHLERZ_DRAIN_DEFAULT_PARAMS');
  ok(/drainParams: SpichlerzDrainParams;/.test(gate) && !/drainParams\?: SpichlerzDrainParams/.test(gate),
    'building-resource-gate.ts: drainParams w resolveOwnedBuildingInactiveStatus wymagany');
}

console.log(`spichlerz-hud-params-parity-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exitCode = fail ? 1 : 0;
