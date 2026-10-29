#!/usr/bin/env node
/**
 * run-k08c-wiring.mjs — TEST WYKONANIA wiringu K08C (`src/controller/k08cWiring.ts`), P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1,
 * runda 2 (odpowiedź na zarzut: wiring bez testu wykonania i bez mutacji; `getUnitDef` po złym polu).
 *
 * Co jest sprawdzane (każdy check = wykonanie PRAWDZIWEGO kodu wiringu, nie sprawdzenie wywoływalności):
 *   C1  getUnitDef po polu `Jednostka` na PRAWDZIWYCH danych `gra/data/units.json` z pinu (pin `data/loader.ts:430`);
 *   C2  podzialSources: kolejność hook > zapis > parametr silnika (pin :1022-1033);
 *   C3  zapis (`podzialPracy`) wygrywa z parametrem silnika;
 *   C4  parametr silnika gdy brak hooka i zapisu (dane obecne);
 *   C5  dane null => domyślny podział 70 (pin `DEFAULT_PODZIAL_PRACY`, `game/cities.ts:443`);
 *   C6  granice podziału 50..100 (zaokrąglenie i obcięcie);
 *   C7  cityPracaSplit: splitPraca dostaje udział pct/100 i pctPuli = 100 − pctBudynki;
 *   C8  services z parametru przesłaniają atrapy (stubbed bez nich);
 *   C9  atrapy K08C-Z5: pusta lista => poprawna odpowiedź; niepusta => rzut (nie cicha zła wartość);
 *   C10 lista `stubbed` = dokładnie atrapy bez services;
 *   C11 resolveEmpireSnap: snapshot z silnika (K04C-Z6), bez silnika => {zloto};
 *   C12 szóstka delegatów K08C_K06B_NAMES wywoływalna po wiringu.
 *
 * Dane: wyłącznie z katalogu pinu (`--pin-dir`), poza repo. Bundling esbuild (jak `run-k08c-owned-purchase-pin.mjs`).
 * Mutacje: `mutate-k08c-wiring.mjs` podaje podmieniony plik wiringu przez `--wiring <plik>` (w tym samym katalogu).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08c-wiring.mjs --pin-dir <PIN_DIR> [--wiring <plik.ts>] [--tmp-dir <katalog>]
 * EXIT 0 <=> wszystkie checki OK; 1 <=> >=1 FAIL; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k08c-wiring.mjs --pin-dir <PIN_DIR> [--wiring <plik.ts>] [--tmp-dir <katalog>]');
  process.exit(2);
}
const WIRING = resolve(argOf('--wiring') ?? join(V2_ROOT, 'src/controller/k08cWiring.ts'));
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08c-wiring-'));
const results = [];
const check = (id, desc, ok) => results.push({ id, desc, ok: ok === true });
/** Wywołanie kodu pod testem: wyjątek = wynik `undefined` (FAIL checku, nie błąd harnessu). */
const safeCall = (f) => { try { return f(); } catch { return undefined; } };

let exitCode = 0;
try {
  const units = JSON.parse(readFileSync(join(resolve(PIN_DIR), 'gra/data/units.json'), 'utf8'));
  const pinCitiesLines = readFileSync(join(resolve(PIN_DIR), 'gra/src/game/cities.ts'), 'utf8').split(/\r?\n/);
  const boundsOk = pinCitiesLines[455] === 'export const MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = 50;'
    && pinCitiesLines[456] === 'export const MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = 100;';
  check('pin.bounds.cities', 'pin game/cities.ts:456-457 = MIN 50 / MAX 100 (cytowane w K08C-Z5)', boundsOk);

  // ─── bundle ─────────────────────────────────────────────────────────────────────────────────────────────────────
  const dataFile = join(TMP, 'units.json');
  writeFileSync(dataFile, JSON.stringify(units));
  const entry = join(TMP, 'entry.js');
  // Katalog statyczny instalowany w OSOBNYM module ładowanym pierwszym (ESM: importy są hoistowane).
  const setup = join(TMP, 'setup.js');
  writeFileSync(setup, [
    `import { installStaticCatalog } from ${JSON.stringify(join(V2_ROOT, 'src/controller/staticCatalog.ts'))};`,
    `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(V2_ROOT, 'src/controller/mockCatalog.ts'))};`,
    'installStaticCatalog(MOCK_STATIC_CATALOG);',
    '',
  ].join('\n'));
  writeFileSync(entry, [
    `import ${JSON.stringify(setup)};`,
    `import { installK08cWiring, K08C_K06B_NAMES, K08C_PODZIAL_PRACY_BOUNDS } from ${JSON.stringify(WIRING)};`,
    `import { dep } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k06b-deps.ts'))};`,
    `import { readPodzialPracy, cityPracaSplit } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08c-deps.ts'))};`,
    `import { getUnitDef, sumOwnedBuildingsUpkeep, groupBuiltBuildingIds, appendRecruitMilitaryResourceStrip, purchasableUnits, sortByUnitPowerDescending } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08b-deps.ts'))};`,
    `import unitsData from ${JSON.stringify(dataFile)};`,
    'export { installK08cWiring, K08C_K06B_NAMES, K08C_PODZIAL_PRACY_BOUNDS, dep, readPodzialPracy, cityPracaSplit, getUnitDef, sumOwnedBuildingsUpkeep, groupBuiltBuildingIds, appendRecruitMilitaryResourceStrip, purchasableUnits, sortByUnitPowerDescending, unitsData };',
    '',
  ].join('\n'));
  const out = join(TMP, 'bundle.mjs');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: out,
    logLevel: 'silent',
    plugins: [{
      name: 'raw-and-glob',
      setup(b) {
        b.onResolve({ filter: /\?raw$/ }, (a) => ({
          path: resolve(dirname(a.importer), a.path.replace(/\?raw$/, '')),
          namespace: 'raw',
        }));
        b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({
          contents: `export default ${JSON.stringify(readFileSync(a.path, 'utf8'))};`,
          loader: 'js',
        }));
        b.onLoad({ filter: /\.ts$/ }, (a) => {
          if (!a.path.startsWith(join(V2_ROOT, 'src') + '/')) return undefined;
          const src = readFileSync(a.path, 'utf8');
          if (!src.includes('import.meta.glob(')) return undefined;
          return { contents: src.split('import.meta.glob(').join('((..._g) => ({}))('), loader: 'ts' };
        });
      },
    }],
  });

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  const M = await import(pathToFileURL(out).href);

  // ─── hosty testowe (wejścia wstrzykiwane; wiring nie liczy reguł) ─────────────────────────────────────────────────
  const makeHost = (over = {}) => {
    const calls = { splitPraca: [] };
    const host = {
      rerender: () => undefined,
      cfg: { getTreasury: () => 123, getBuiltBuildingIds: () => [], getCities: () => [] },
      getPodzialPracy: undefined,
      engineSuwaakPracaBudynki: (data) => (data ? 60 : null),
      splitPraca: (praca, frac) => {
        calls.splitPraca.push([praca, frac]);
        const doBudynkow = Math.round(praca * frac);
        return { total: praca, doBudynkow, doPuli: praca - doBudynkow };
      },
      computeView: () => null,
      readPodzialHandlu: () => ({ procentNauka: 0, procentLuksus: 0 }),
      isMeCity: (o) => o === 0,
      adjustHandelSplit: (s) => s,
      freshWealthState: () => ({ poziom: 0 }),
      stockResourceLabel: (k) => k,
      getEmpireHud: undefined,
      rules: {},
      ...over,
    };
    return { host, calls };
  };
  const city = { id: 7, ownerId: 0, name: 'A' };
  const data = { buildings: [], units: M.unitsData, econParams: {} };
  const throws = (fn) => { try { fn(); return false; } catch (e) { return String(e && e.message).includes('K08C-Z5'); } };

  // C1 getUnitDef po `Jednostka` na prawdziwych danych.
  M.installK08cWiring(makeHost().host);
  const probe = M.unitsData[5];
  const gu = M.getUnitDef(data, probe.Jednostka);
  check('C1.getUnitDef.byJednostka', `getUnitDef(data, "${probe.Jednostka}") zwraca jednostkę o tym Jednostka`,
    gu !== undefined && gu.Jednostka === probe.Jednostka);
  check('C1.getUnitDef.unknown', 'getUnitDef dla nieznanej nazwy = undefined', M.getUnitDef(data, 'Nie ma takiej jednostki') === undefined);
  check('C1.getUnitDef.nullData', 'getUnitDef(null, id) = undefined (bez rzutu)', M.getUnitDef(null, probe.Jednostka) === undefined);

  // C2-C4 kolejność źródeł podziału pracy.
  M.installK08cWiring(makeHost({ getPodzialPracy: () => ({ procentBudynki: 70 }) }).host);
  const cityStored = { ...city, podzialPracy: { procentBudynki: 90 } };
  check('C2.hookWins', 'hook (70) wygrywa z zapisem (90) i silnikiem (60)', M.readPodzialPracy(cityStored, data).procentBudynki === 70);
  M.installK08cWiring(makeHost().host);
  check('C3.storedWins', 'zapis (90) wygrywa z silnikiem (60) bez hooka', M.readPodzialPracy(cityStored, data).procentBudynki === 90);
  check('C4.engine', 'brak hooka i zapisu => parametr silnika (60)', M.readPodzialPracy(city, data).procentBudynki === 60);
  // C5 dane null => silnik zwraca null => domyślny 70.
  check('C5.nullDataDefault', 'dane null => domyślny podział 70', M.readPodzialPracy(city, null).procentBudynki === 70);

  // C6 granice 50..100 (zaokrąglenie, obcięcie).
  const engineAt = (v) => { M.installK08cWiring(makeHost({ engineSuwaakPracaBudynki: () => v }).host); return M.readPodzialPracy(city, data).procentBudynki; };
  check('C6.clampHigh', 'silnik 120 => 100', engineAt(120) === 100);
  check('C6.clampLow', 'silnik 10 => 50', engineAt(10) === 50);
  check('C6.round', 'silnik 75.4 => 75', engineAt(75.4) === 75);

  // C7 cityPracaSplit: udział pct/100, pctPuli = 100 - pctBudynki.
  const { host: h7, calls: c7 } = makeHost({ getPodzialPracy: () => ({ procentBudynki: 80 }) });
  M.installK08cWiring(h7);
  const split7 = M.cityPracaSplit(city, { praca: 200 }, data);
  check('C7.fraction', 'splitPraca(200, 0.8) (pct/100)', c7.splitPraca.length === 1 && c7.splitPraca[0][0] === 200 && c7.splitPraca[0][1] === 0.8);
  check('C7.pct', 'pctBudynki=80, pctPuli=20, total=200', split7.pctBudynki === 80 && split7.pctPuli === 20 && split7.total === 200);

  // C8 services przesłaniają atrapy.
  let spyCalls = 0;
  const st = M.installK08cWiring(makeHost().host, { sumOwnedBuildingsUpkeep: () => { spyCalls += 1; return 42; } });
  let c8Ok = false;
  try { c8Ok = M.sumOwnedBuildingsUpkeep(['x'], data, city) === 42 && spyCalls === 1; } catch { c8Ok = false; }
  check('C8.serviceUsed', 'service sumOwnedBuildingsUpkeep wywołany (wynik 42)', c8Ok);
  check('C8.notStubbed', 'przesłonięta usługa nie jest w stubbed', !st.stubbed.includes('sumOwnedBuildingsUpkeep'));

  // C9 atrapy K08C-Z5.
  M.installK08cWiring(makeHost().host);
  check('C9.sumEmpty', 'sumOwnedBuildingsUpkeep([]) = 0 (bez reguł)', M.sumOwnedBuildingsUpkeep([], data, city) === 0);
  check('C9.sumNonEmptyThrows', 'sumOwnedBuildingsUpkeep(["x"]) rzuca K08C-Z5 (nie cicha wartość)', throws(() => M.sumOwnedBuildingsUpkeep(['x'], data, city)));
  check('C9.groupEmpty', 'groupBuiltBuildingIds([]) = []', Array.isArray(M.groupBuiltBuildingIds([], [])) && M.groupBuiltBuildingIds([], []).length === 0);
  check('C9.groupNonEmptyThrows', 'groupBuiltBuildingIds(["x"]) rzuca K08C-Z5', throws(() => M.groupBuiltBuildingIds(['x'], [])));
  check('C9.sortEmpty', 'sortByUnitPowerDescending([], k) = []', Array.isArray(M.sortByUnitPowerDescending([], () => 0)) && M.sortByUnitPowerDescending([], () => 0).length === 0);
  check('C9.sortNonEmptyThrows', 'sortByUnitPowerDescending([1], k) rzuca K08C-Z5', throws(() => M.sortByUnitPowerDescending([1], () => 0)));
  check('C9.stripEmpty', 'appendRecruitMilitaryResourceStrip(...,[]) = no-op', M.appendRecruitMilitaryResourceStrip({}, city, data, []) === undefined);
  check('C9.stripNonEmptyThrows', 'appendRecruitMilitaryResourceStrip(...,[1]) rzuca K08C-Z5', throws(() => M.appendRecruitMilitaryResourceStrip({}, city, data, [1])));
  check('C9.purchasableEmpty', 'purchasableUnits(...) = [] (cicha atrapa, tabela długu)', Array.isArray(M.purchasableUnits(city, data, [], {})) && M.purchasableUnits(city, data, [], {}).length === 0);

  // C10 stubbed = dokładnie pięć atrap bez services.
  const stNo = M.installK08cWiring(makeHost().host);
  check('C10.stubbed', 'stubbed = 5 atrap regułowych', JSON.stringify([...stNo.stubbed].sort()) === JSON.stringify([
    'appendRecruitMilitaryResourceStrip', 'groupBuiltBuildingIds', 'purchasableUnits', 'sortByUnitPowerDescending', 'sumOwnedBuildingsUpkeep',
  ]));

  // C11 resolveEmpireSnap (K04C-Z6).
  M.installK08cWiring(makeHost({ getEmpireHud: () => ({ pracaRate: 9 }) }).host);
  const snapEng = safeCall(() => M.dep('resolveEmpireSnap')(city, null, data));
  check('C11.engineSnap', 'resolveEmpireSnap => snapshot silnika (pracaRate 9)', snapEng && snapEng.pracaRate === 9);
  M.installK08cWiring(makeHost().host);
  const snapNo = safeCall(() => M.dep('resolveEmpireSnap')(city, null, data));
  check('C11.noEngine', 'bez silnika => {zloto: skarb 123}', snapNo && snapNo.zloto === 123 && Object.keys(snapNo).length === 1);

  // C12 delegaty K08C_K06B_NAMES wywoływalne.
  M.installK08cWiring(makeHost().host);
  const callable = M.K08C_K06B_NAMES.map((n) => { try { return typeof M.dep(n) === 'function'; } catch { return false; } });
  check('C12.depsCallable', `wszystkie ${M.K08C_K06B_NAMES.length} delegaty K06B wywoływalne`, callable.every(Boolean));

  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.desc}`);
  console.log(`\nk08c-wiring: ${results.length - fails.length}/${results.length} zgodnych`);
  exitCode = fails.length === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
