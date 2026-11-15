'use strict';
/**
 * default-labor-split-test.cjs — R-WEB-SETTINGS-DEFAULT-LABOR-SPLIT-50-50-Q1.
 *
 * Decyzja właściciela (2026-11-14): domyślny podział Pracy nowej gry = Ulepszenia (pula)
 * 50% / Budynki 50% (dawniej 70/30). Jedna prawda: gra/data/econ-params.json
 * (suwak_praca_budynki_domyslnie) -> buildEconParams -> DEFAULT_PODZIAL_PRACY
 * (game/cities.ts) -> freshOwnerDefaultPodzialPracy (game/empire-city-defaults.ts).
 *
 * Sprawdza:
 *   1. nowa gra: wartość domyślna (JSON, buildEconParams, DEFAULT, fresh owner default) = 50;
 *   2. nowe miasto bez override dziedziczy wartość globalną (50);
 *   3. zmiana globalna nadal propaguje się przez resolver (sanity mechanizmu);
 *   4. stary zapis zachowuje SWOJĄ wartość (70 zostaje 70, zapisany default nie jest
 *      nadpisywany przez nową wartość 50; miasto z inną wartością dostaje override=true).
 *
 * Uruchom z gra/: node tools/default-labor-split-test.cjs
 * Pure logic + dane JSON -- bez DOM, bez przeglądarki.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[default-labor-split-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.default-labor-split-entry.ts');
const BUNDLE = path.resolve(__dirname, '.default-labor-split-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  resolveCityPodzialPracy,
  migratePodzialPracyOnLoad,
  freshOwnerDefaultPodzialPracy,
} from '../src/game/empire-city-defaults';
export {
  DEFAULT_PODZIAL_PRACY,
  clampPodzialPracyBudynkiPercent,
} from '../src/game/cities';
export { buildEconParams } from '../src/game/turn-economy';
export { loadGameData } from '../src/data/loader';
`,
  'utf8',
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
    loader: { '.json': 'json' },
  });
} catch (e) {
  console.error('[default-labor-split-test] esbuild failed:', e.message);
  try { fs.unlinkSync(ENTRY); } catch (_) { /* best-effort */ }
  process.exit(1);
}

const M = require(BUNDLE);
try { fs.unlinkSync(ENTRY); } catch (_) { /* best-effort */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* best-effort */ }

let pass = 0;
let fail = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; console.log(`  PASS: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name}${detail !== undefined ? ` (got ${detail})` : ''}`); }
}

const EXPECTED = 50;

console.log('\n-- 1. Nowa gra: wartość domyślna podziału Pracy = 50% budynki / 50% pula --');
{
  const econJson = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'econ-params.json'), 'utf8'));
  const jsonRow = (econJson.ekonomia_miasta || {}).suwak_praca_budynki_domyslnie || {};
  ok(jsonRow.easy === EXPECTED && jsonRow.normal === EXPECTED && jsonRow.hard === EXPECTED,
    'econ-params.json: suwak_praca_budynki_domyslnie = 50 na easy/normal/hard', JSON.stringify(jsonRow));

  const data = M.loadGameData();
  for (const diff of ['easy', 'normal', 'hard']) {
    const params = M.buildEconParams(data, diff);
    ok(params.suwaakPracaBudynki === EXPECTED,
      `buildEconParams(${diff}).suwaakPracaBudynki = 50`, params.suwaakPracaBudynki);
  }
  ok(M.DEFAULT_PODZIAL_PRACY.procentBudynki === EXPECTED,
    'DEFAULT_PODZIAL_PRACY.procentBudynki = 50', M.DEFAULT_PODZIAL_PRACY.procentBudynki);
  ok(M.freshOwnerDefaultPodzialPracy().procentBudynki === EXPECTED,
    'freshOwnerDefaultPodzialPracy() (nowy owner gracza) = 50',
    M.freshOwnerDefaultPodzialPracy().procentBudynki);
  ok(M.clampPodzialPracyBudynkiPercent(undefined) === EXPECTED,
    'clamp(undefined) zwraca domyślne 50 (miejsce jednej prawdy)',
    M.clampPodzialPracyBudynkiPercent(undefined));
}

console.log('\n-- 2. Nowe miasto bez override dziedziczy wartość globalną --');
{
  const fresh = M.freshOwnerDefaultPodzialPracy();
  const newCity = { podzialPracy: undefined, podzialPracyOverride: false, ownerId: 0 };
  const eff = M.resolveCityPodzialPracy(newCity, fresh);
  ok(eff.procentBudynki === EXPECTED, 'nowe miasto (bez override) -> 50', eff.procentBudynki);
}

console.log('\n-- 3. Zmiana globalna nadal propaguje się przez resolver (sanity) --');
{
  const eff = M.resolveCityPodzialPracy({ podzialPracy: undefined, podzialPracyOverride: false, ownerId: 0 },
    { procentBudynki: 60 });
  ok(eff.procentBudynki === 60, 'globalna 60 -> miasto bez override = 60', eff.procentBudynki);
  const local = M.resolveCityPodzialPracy({ podzialPracy: { procentBudynki: 80 }, podzialPracyOverride: true, ownerId: 0 },
    { procentBudynki: 60 });
  ok(local.procentBudynki === 80, 'miasto z override 80 nie zmienia się przy globalnej 60', local.procentBudynki);
}

console.log('\n-- 4. Stary zapis zachowuje swoją wartość (bez migracji do nowego 50) --');
{
  // 4a. Zapis z zapisanym defaultem 70 i miastem 70 (override=false zapisany): nic się nie zmienia.
  const defaults4a = new Map();
  const city4a = { id: 'a', ownerId: 0, podzialPracy: { procentBudynki: 70 }, podzialPracyOverride: false };
  M.migratePodzialPracyOnLoad([city4a], defaults4a, [[0, { procentBudynki: 70 }]]);
  ok(defaults4a.get(0) && defaults4a.get(0).procentBudynki === 70,
    '4a: zapisany default 70 zachowany (nie nadpisany przez nowe 50)',
    defaults4a.get(0) && defaults4a.get(0).procentBudynki);
  ok(city4a.podzialPracy.procentBudynki === 70 && city4a.podzialPracyOverride === false,
    '4a: miasto 70 zostaje 70 bez override', `${city4a.podzialPracy.procentBudynki}/${city4a.podzialPracyOverride}`);

  // 4b. Zapis z defaultem 70 i miastem 60 z override=true: miasto zachowuje 60 jako lokalne.
  const defaults4b = new Map();
  const city4b = { id: 'b', ownerId: 0, podzialPracy: { procentBudynki: 60 }, podzialPracyOverride: true };
  M.migratePodzialPracyOnLoad([city4b], defaults4b, [[0, { procentBudynki: 70 }]]);
  ok(city4b.podzialPracy.procentBudynki === 60 && city4b.podzialPracyOverride === true,
    '4b: miasto 60 z override=true zachowuje 60 (nie zmienione na 50)',
    `${city4b.podzialPracy.procentBudynki}/${city4b.podzialPracyOverride}`);
  ok(M.resolveCityPodzialPracy(city4b, defaults4b.get(0)).procentBudynki === 60,
    '4b: resolver zwraca lokalne 60 przy globalnej 70');

  // 4c. Stary format bez zapisanych defaultów: miasto 70 (jedyne) -> default 70, miasto
  // podąża za nim i NIE zmienia się na nowe 50.
  const defaults4c = new Map();
  const city4c = { id: 'c', ownerId: 0, podzialPracy: { procentBudynki: 70 }, podzialPracyOverride: undefined };
  M.migratePodzialPracyOnLoad([city4c], defaults4c, undefined);
  ok(defaults4c.get(0) && defaults4c.get(0).procentBudynki === 70,
    '4c: stary zapis bez defaultów -- default imperium wyliczony z zapisu = 70 (nie 50)',
    defaults4c.get(0) && defaults4c.get(0).procentBudynki);
  ok(M.resolveCityPodzialPracy(city4c, defaults4c.get(0)).procentBudynki === 70,
    '4c: miasto ze starego zapisu nadal daje 70 (nie zmienione na 50)',
    M.resolveCityPodzialPracy(city4c, defaults4c.get(0)).procentBudynki);
}

console.log(`\n=== default-labor-split-test: ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
