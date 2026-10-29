#!/usr/bin/env node
/**
 * run-k05b-dto.mjs — harness producenta DTO `panelInputs.k05a` (P5-8 K05B, runda 2, ZADANIE 1 dispatchu).
 *
 * Sprawdza `src/controller/cityPanelK05a.ts` (mapper + atrapa MOCK) względem OCZEKIWANEGO DTO wpisanego ręcznie tutaj
 * (niezależnie od kodu mappera), oraz integrację z `setK05aFromDto` (`src/ui/cityPanel/k05a-fundament.ts`): wartości
 * z DTO muszą być widoczne przez delegatory K05A, a pola nieobecne w DTO muszą dawać wynik silnika (fallback).
 *
 * Mutacje mappera: zmienna środowiskowa K05B_MUTANT='{"file":"cityPanelK05a.ts","from":"...","to":"..."}' (plugin esbuild,
 * bez zmian na dysku); patrz `mutate-k05b-dto.mjs`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/run-k05b-dto.mjs
 * EXIT 0 <=> wszystkie sprawdzenia OK; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundle } from './build.mjs';

const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const DTO_ABS = join(V2_ROOT, 'src/controller/cityPanelK05a.ts');
const K05A_ABS = join(V2_ROOT, 'src/ui/cityPanel/k05a-fundament.ts');
const UI_PARAMS_ABS = join(V2_ROOT, 'src/ui/uiParams.ts');
const MUT = process.env.K05B_MUTANT ? JSON.parse(process.env.K05B_MUTANT) : null;

/** Oczekiwane DTO (wpisane ręcznie z atrapy: raw → DTO; niezależne od kodu mappera). */
const EXPECTED = {
  empireRekruciTotalByOwner: { 0: 14 },
  manpowerBiezacyByCity: { 1: 30 },
  manpowerCostByUnit: { phalanx: 6, lucznik: 4 },
  techPrereqChainByTech: { Rolnictwo: ['Pismo', 'Rolnictwo'] },
  unitStockCostById: { lucznik: { drewno: 2 } },
  stockResourceLabelByKey: { drewno: 'Drewno' },
};

/** Porównanie strukturalne (klucze bez nadmiarowych pól; `undefined` = brak klucza). */
function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).filter((k) => a[k] !== undefined).sort();
  const kb = Object.keys(b).filter((k) => b[k] !== undefined).sort();
  if (ka.join('|') !== kb.join('|')) return false;
  return ka.every((k) => deepEq(a[k], b[k]));
}

const uiParamsStub = {
  name: 'uiparams-stub',
  setup(b) {
    b.onResolve({ filter: /(^|\/)uiParams$/ }, (a) => ({ path: a.path, namespace: 'uistub' }));
    b.onLoad({ filter: /.*/, namespace: 'uistub' }, () => ({ contents: 'export const UI_PARAMS = {};', loader: 'js' }));
  },
};
const mutantPlugin = {
  name: 'k05b-dto-mutant',
  setup(b) {
    if (!MUT) return;
    b.onLoad({ filter: /cityPanelK05a\.ts$/ }, (a) => {
      if (!a.path.endsWith(MUT.file)) return undefined;
      const src = readFileSync(a.path, 'utf8');
      const n = src.split(MUT.from).length - 1;
      if (n !== 1) throw new Error(`mutant: oczekiwano 1 trafienia, jest ${n}: ${MUT.from}`);
      return { contents: src.replace(MUT.from, MUT.to), loader: 'ts' };
    });
  },
};

const tmp = mkdtempSync(join(tmpdir(), 'k05b-dto-'));
let exitCode = 0;
try {
  const entry = join(tmp, 'entry.ts');
  // Dwa wejścia (wejście + moduł K05A), by bundler zachował nazwy plików wejściowych.
  writeFileSync(entry, `export * from ${JSON.stringify(DTO_ABS)};\n`);
  const out = join(tmp, 'out');
  await bundle([entry, K05A_ABS], out, { extraPlugins: [uiParamsStub, mutantPlugin] });
  const walk = (d) => {
    const fs = [];
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) fs.push(...walk(p));
      else fs.push(p);
    }
    return fs;
  };
  const dtoJs = walk(out).find((p) => p.endsWith('/cityPanelK05a.js') || p.endsWith('/entry.js'));
  const k05aJs = walk(out).find((p) => p.endsWith('/k05a-fundament.js'));
  if (!dtoJs || !k05aJs) throw new Error('brak bundla: ' + walk(out).join(', '));
  const D = await import(pathToFileURL(dtoJs).href);
  const K = await import(pathToFileURL(k05aJs).href);

  const checks = [];
  const check = (name, ok) => checks.push({ name, ok: !!ok });

  const mapped = D.mapCityPanelK05aDto(D.MOCK_CITY_PANEL_K05A_RAW);
  check('mapper(MOCK) = oczekiwane DTO', deepEq(mapped, EXPECTED));
  check('mockCityPanelK05aInputs() = oczekiwane DTO', deepEq(D.mockCityPanelK05aInputs(), EXPECTED));
  check('mapper nie współdzieli obiektów z wejściem', mapped.manpowerCostByUnit !== D.MOCK_CITY_PANEL_K05A_RAW.manpowerCost);
  check('brak pola w wejściu = brak pola w DTO', D.mapCityPanelK05aDto({}).empireRekruciTotalByOwner === undefined);

  // Integracja z setK05aFromDto: silnik zwraca wartości inne niż DTO, więc widać, które źródło obowiązuje.
  const rulesEngine = {
    civManpowerMaxMult: () => 1,
    unitManpowerCostForType: () => 777,
    ownerSurowcePoolFor: () => ({}),
    stockResourceLabel: (k) => `ENGINE:${k}`,
    unitStockCost: () => ({ engine: 1 }),
    canAffordUnitRecruitStock: () => false,
    missingStockFor: () => ({}),
    unitResourceUpkeep: () => ({}),
    isUnitRecruitStockChipMissing: () => false,
    techPrereqChain: () => ['ENGINE'],
  };
  const cfgEngine = {
    getEmpireRekruciTotal: () => 999,
    getManpowerSnapshot: () => ({ manpowerBiezacy: 111 }),
    getEpoch: () => 2,
    getCivBonusy: () => [],
  };
  const city0 = { id: 1, ownerId: 0, q: 0, r: 0 };
  const city9 = { id: 9, ownerId: 9, q: 0, r: 0 };
  K.setK05aFromDto(mapped, { cfg: cfgEngine, rules: rulesEngine });
  check('empireRekruciTotal: właściciel z DTO = 14', K.empireRekruciTotal(city0) === 14);
  check('empireRekruciTotal: właściciel spoza DTO = silnik 999', K.empireRekruciTotal(city9) === 999);
  check('recruitManpowerCost: typ z DTO = 6', K.recruitManpowerCost(city0, 'phalanx') === 6);
  check('recruitManpowerCost: typ spoza DTO = silnik 777', K.recruitManpowerCost(city0, 'brak') === 777);
  check('unitStockCost: typ z DTO = {drewno:2}', deepEq(K.unitStockCost({ id: 'lucznik' }), { drewno: 2 }));
  check('unitStockCost: typ spoza DTO = silnik', deepEq(K.unitStockCost({ id: 'phalanx' }), { engine: 1 }));
  check('stockResourceLabel: klucz z DTO = Drewno', K.stockResourceLabel('drewno') === 'Drewno');
  check('stockResourceLabel: klucz spoza DTO = silnik', K.stockResourceLabel('kamien') === 'ENGINE:kamien');
  check('techPrereqChain: technologia z DTO', deepEq(K.techPrereqChain({}, 'Rolnictwo'), ['Pismo', 'Rolnictwo']));
  check('techPrereqChain: technologia spoza DTO = silnik', deepEq(K.techPrereqChain({}, 'X'), ['ENGINE']));

  // Fallback do migawki miasta (manpowerBiezacyByCity) przy braku puli imperium w silniku.
  K.setK05aFromDto(mapped, { cfg: { ...cfgEngine, getEmpireRekruciTotal: () => undefined }, rules: rulesEngine });
  // Miasto 1 (DTO: manpowerBiezacyByCity[1] = 30) należy do właściciela 9, którego pula imperium nie jest w DTO i w silniku.
  check('empireRekruciTotal: brak puli imperium -> pula miasta z DTO = 30', K.empireRekruciTotal({ id: 1, ownerId: 9, q: 0, r: 0 }) === 30);
  check('empireRekruciTotal: miasto spoza DTO -> migawka silnika 111', K.empireRekruciTotal({ id: 7, ownerId: 9, q: 0, r: 0 }) === 111);

  let bad = 0;
  for (const c of checks) {
    if (!c.ok) bad++;
    console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}`);
  }
  console.log(`DTO K05A: sprawdzeń ${checks.length}, błędów ${bad}`);
  exitCode = bad === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD HARNESSU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
