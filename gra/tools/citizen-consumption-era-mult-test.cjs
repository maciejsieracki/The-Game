'use strict';
/**
 * citizen-consumption-era-mult-test.cjs -- R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1 (Maciej 2026-11-05).
 * Run from gra/:  node tools/citizen-consumption-era-mult-test.cjs
 *
 * Decyzja: zuzycie przez obywateli rosnie o 50% BAZY co epoke: m(e) = 1 + 0,5 (e - 1)
 * (epoka 1 x1, 2 x1,5, 3 x2, 4 x2,5, 5 x3) -- zywnosc ORAZ surowce, jedna funkcja
 * `citizenConsumptionEraMultiplier` (src/game/citizen-consumption-era.ts).
 *
 * Pokrywa:
 *   A. Mnoznik: epoki 0/1/2/3/4/5/6, NaN, undefined, ulamki, ujemne.
 *   B. Zywnosc: koszt racji = pop x poziom x 2 x m(epoka), Spichlerz nakladany dalej; maks poziom 6 = 12/18/24 na obywatela.
 *   C. Bilans (computeCityFoodBalanceV85) i recomputeCityFoodBalancesInEcon (era z ticka) -- ta sama funkcja.
 *   D. Surowce: stawka = 1,0 x m(epoka), required = floor(pop x stawka) per surowiec (1 / 1,5 / 2 na obywatela).
 *   E. Parytet AI: sygnatury nie przyjmuja ownerId (tylko epoke) -- gracz = AI = panstwo-miasto.
 *   F. Zrodlo UI: etykieta racji w cityPanel.ts liczy stawke z mnoznikiem (bez zaszytych liczb).
 *   G. MUTACJE: usuniecie mnoznika w zywnosci -> FAIL; w surowcach -> FAIL; hardkod w tooltipie -> FAIL.
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[citizen-consumption-era-mult-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.citizen-consumption-era-mult-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.citizen-consumption-era-mult-bundle.cjs');
const POP_FILE = path.resolve(GRA, 'src/game/population-growth-v85.ts');
const UPKEEP_FILE = path.resolve(GRA, 'src/game/citizen-resource-upkeep.ts');
const CITYPANEL_FILE = path.resolve(GRA, 'src/ui/cityPanel.ts');

fs.writeFileSync(ENTRY_FILE, `
export { citizenConsumptionEraMultiplier, formatCitizenConsumptionMult } from '../src/game/citizen-consumption-era';
export { computeCityRationCost, rationFoodCostPerPop } from '../src/game/population-growth-v85';
export { computeCityFoodBalanceV85, recomputeCityFoodBalancesInEcon } from '../src/game/turn-economy';
export { computeCitizenResourceDrain, citizenUpkeepRateForEra } from '../src/game/citizen-resource-upkeep';
`, 'utf8');

/** Buduje bundle; `mutate(filePath, text)` moze zwrocic zmieniony tekst zrodla (mutacje). */
async function buildAsync(mutate) {
  const plugin = {
    name: 'mutate',
    setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const text = fs.readFileSync(args.path, 'utf8');
        const out = mutate ? mutate(args.path, text) : text;
        return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
  await esbuild.build({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.json': 'json' }, outfile: BUNDLE_FILE, absWorkingDir: GRA, logLevel: 'silent',
    plugins: [plugin],
  });
  delete require.cache[BUNDLE_FILE];
  return require(BUNDLE_FILE);
}

/** Zestaw asercji; zwraca liczbe porazek (dla mutantow oczekiwane > 0). */
function runChecks(M, cityPanelText, log) {
  let fails = 0, passes = 0;
  const eq = (a, b, msg) => {
    if (a === b || (Number.isNaN(a) && Number.isNaN(b))) passes++;
    else { fails++; if (log) console.error(`FAIL: ${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
  };
  const ok = (c, msg) => eq(!!c, true, msg);

  // --- A. mnoznik -------------------------------------------------------------------------
  const m = M.citizenConsumptionEraMultiplier;
  eq(m(0), 1, 'A0: epoka 0 -> 1');
  eq(m(1), 1, 'A1: epoka 1 -> 1');
  eq(m(2), 1.5, 'A2: epoka 2 -> 1,5');
  eq(m(3), 2, 'A3: epoka 3 -> 2');
  eq(m(4), 2.5, 'A4: epoka 4 -> 2,5');
  eq(m(5), 3, 'A5: epoka 5 -> 3');
  eq(m(6), 3.5, 'A6: epoka 6 -> 3,5 (wzor, nie tabela)');
  eq(m(NaN), 1, 'A7: NaN -> 1');
  eq(m(undefined), 1, 'A8: undefined -> 1');
  eq(m(null), 1, 'A9: null -> 1');
  eq(m(-3), 1, 'A10: ujemna -> 1');
  eq(m('3'), 1, 'A11: nie-liczba (string) -> 1');
  eq(m(Infinity), 1, 'A12: Infinity -> 1');
  eq(m(2.9), 1.5, 'A13: 2,9 -> floor -> epoka 2');
  eq(M.formatCitizenConsumptionMult(2), '×1,5', 'A14: etykieta x1,5');
  eq(M.formatCitizenConsumptionMult(3), '×2', 'A15: etykieta x2');

  // --- B. zywnosc -------------------------------------------------------------------------
  const params = {};
  for (const [era, mult] of [[1, 1], [2, 1.5], [3, 2], [4, 2.5]]) {
    eq(M.computeCityRationCost(10, 6, params, undefined, era), 10 * 6 * 2 * mult, `B1: era ${era} pop 10 poziom 6`);
    eq(M.computeCityRationCost(1, 6, params, undefined, era) , 12 * mult, `B2: era ${era}: maks na obywatela = ${12 * mult}`);
    eq(M.computeCityRationCost(7, 3.5, params, undefined, era), 7 * 3.5 * 2 * mult, `B3: era ${era} pop 7 poziom 3,5`);
  }
  eq(M.computeCityRationCost(1, 6, params), 12, 'B4: domyslna epoka = 1 (maks 12)');
  eq(M.computeCityRationCost(1, 6, params, undefined, 2), 18, 'B5: epoka 2 maks 18');
  eq(M.computeCityRationCost(1, 6, params, undefined, 3), 24, 'B6: epoka 3 maks 24');
  const granII = { ceramikaActive: false, solActive: false, maSpichlerzPop: true, maSpichlerzIIPop: true };
  const granI = { ceramikaActive: true, solActive: false, maSpichlerzPop: true, maSpichlerzIIPop: false };
  eq(M.computeCityRationCost(10, 4, params, granII, 3), 10 * 4 * 2 * 2 * 0.5, 'B7: epoka 3 + Spichlerz II (x0,5) nakladany dalej');
  eq(M.computeCityRationCost(10, 4, params, granI, 2), 10 * 4 * 2 * 1.5 * 0.75, 'B8: epoka 2 + Spichlerz I z ceramika (x0,75)');
  eq(M.rationFoodCostPerPop(6), 12, 'B9: koszt bazowy na obywatela (epoka 1) = poziom x 2');

  // --- C. bilans i przeliczenie z ticka -----------------------------------------------------
  const city = { id: 'c1', ownerId: 5, population: 10, poziomRacji: 4 };
  const bal = M.computeCityFoodBalanceV85(200, 10, city, params, undefined, 3);
  eq(bal.kosztRacji, 10 * 4 * 2 * 2, 'C1: bilans epoka 3 -> koszt 160');
  eq(bal.bilansLokalny, 200 - 160, 'C2: bilans lokalny = produkcja - koszt');
  const tick = { cityId: 'c1', ownerId: 5, ownerEra: 2, zywnoscBrutto: 200, kosztRacji: 0, bilansLokalny: 0, zywnoscNetto: 0 };
  M.recomputeCityFoodBalancesInEcon([tick], [city], params);
  eq(tick.kosztRacji, 10 * 4 * 2 * 1.5, 'C3: recompute bierze epoke z ticka (epoka 2 -> 120)');
  eq(tick.bilansLokalny, 80, 'C4: recompute bilans 200-120');

  // --- D. surowce ---------------------------------------------------------------------------
  for (const [era, rate, list] of [[1, 1, 2], [2, 1.5, 4], [3, 2, 5]]) {
    eq(M.citizenUpkeepRateForEra(era), rate, `D1: stawka epoki ${era}`);
    const stock = { drewno: 1e6, glina: 1e6, kamien: 1e6, ceramika: 1e6, cegla: 1e6 };
    const d = M.computeCitizenResourceDrain(era, 20, stock);
    eq(d.required.length, list, `D2: era ${era} lista surowcow bez zmian`);
    for (const k of d.required) eq(d.deductions[k], Math.floor(20 * rate), `D3: era ${era} ${k}: floor(20 x ${rate})`);
    eq(d.ratePerCitizen, rate, `D4: era ${era} ratePerCitizen`);
  }
  {
    // pop nieparzysta: floor(7 x 1,5) = 10; niedobor: magazyn 9 -> brakujacy (kara binarna bez zmian)
    const d = M.computeCitizenResourceDrain(2, 7, { drewno: 9, glina: 10, kamien: 10, ceramika: 10 });
    eq(d.deductions.drewno, 9, 'D5: magazyn 9 < 10 -> odjete 9');
    ok(d.missing.includes('drewno') && d.available.includes('glina'), 'D6: kara binarna per surowiec bez zmian');
  }

  // --- E. parytet AI: funkcje nie znaja ownerId -----------------------------------------------
  eq(M.citizenConsumptionEraMultiplier.length, 1, 'E1: mnoznik przyjmuje tylko epoke');
  eq(M.citizenUpkeepRateForEra.length, 1, 'E2: stawka surowcow przyjmuje tylko epoke');
  eq(M.computeCityRationCost(10, 4, params, undefined, 3),
    M.computeCityFoodBalanceV85(0, 10, { poziomRacji: 4 }, params, undefined, 3).kosztRacji,
    'E3: ten sam koszt niezaleznie od sciezki (gracz/AI/panstwo-miasto)');

  // --- F/G. zrodlo UI: etykieta racji z mnoznikiem, bez zaszytych liczb -------------------------
  const fn = (cityPanelText.match(/function wyzwienieSummaryLabel[\s\S]*?\n\}/) || [''])[0];
  ok(fn.length > 0, 'F0: znaleziono wyzwienieSummaryLabel');
  ok(/citizenConsumptionEraMultiplier\(ownerEra\)/.test(fn), 'F1: etykieta pobiera mnoznik z citizenConsumptionEraMultiplier(ownerEra)');
  ok(/rationFoodCostPerPop\(level, params\)\s*\*\s*mult\b/.test(fn), 'F2: koszt = rationFoodCostPerPop x mult (bez zaszytej stawki)');
  ok(/formatCitizenConsumptionMult\(ownerEra\)/.test(fn), 'F3: tekst pokazuje mnoznik epoki z formattera');
  ok(!/\*\s*[0-9]/.test(fn.replace(/\/\/.*$/gm, '')), 'F4: brak mnozenia przez literal w etykiecie');
  return { fails, passes };
}

(async () => {
  const cityPanelText = fs.readFileSync(CITYPANEL_FILE, 'utf8');
  let total = 0;

  // Baseline (kod produkcyjny) -- 0 porazek.
  const base = runChecks(await buildAsync(null), cityPanelText, true);
  console.log(`baseline: ${base.passes} passed, ${base.fails} failed`);
  total += base.fails;

  // Mutacje -- kazda MUSI dac >0 porazek.
  const mutants = [
    {
      name: 'M1: usuniecie mnoznika w zywnosci (computeCityRationCost)',
      mutate: (f, t) => f === POP_FILE ? t.replace(/\n\s*\*\s*citizenConsumptionEraMultiplier\(ownerEra\);/, ';') : t,
      mustChange: POP_FILE,
    },
    {
      name: 'M2: usuniecie mnoznika w surowcach (citizenUpkeepRateForEra)',
      mutate: (f, t) => f === UPKEEP_FILE ? t.replace('CITIZEN_UPKEEP_RATE_PER_CITIZEN * citizenConsumptionEraMultiplier(era)', 'CITIZEN_UPKEEP_RATE_PER_CITIZEN') : t,
      mustChange: UPKEEP_FILE,
    },
  ];
  for (const mu of mutants) {
    let changed = false;
    const M = await buildAsync((f, t) => { const o = mu.mutate(f, t); if (f === mu.mustChange && o !== t) changed = true; return o; });
    const r = runChecks(M, cityPanelText, false);
    const killed = changed && r.fails > 0;
    console.log(`${killed ? 'OK  ' : 'FAIL'} ${mu.name}: zrodlo zmienione=${changed}, porazek=${r.fails}`);
    if (!killed) total++;
  }
  // M3: hardkod stawki w tooltipie (mutacja tekstu zrodla UI).
  {
    const mutated = cityPanelText.replace('rationFoodCostPerPop(level, params) * mult', 'rationFoodCostPerPop(level, params) * 2');
    const changed = mutated !== cityPanelText;
    const r = runChecks(await buildAsync(null), mutated, false);
    const killed = changed && r.fails > 0;
    console.log(`${killed ? 'OK  ' : 'FAIL'} M3: hardkod stawki w tooltipie racji: zrodlo zmienione=${changed}, porazek=${r.fails}`);
    if (!killed) total++;
  }

  // Sprzatanie plikow tymczasowych.
  for (const f of [ENTRY_FILE, BUNDLE_FILE]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } }
  console.log(total === 0 ? '\ncitizen-consumption-era-mult-test: PASS' : `\ncitizen-consumption-era-mult-test: FAIL (${total})`);
  process.exit(total === 0 ? 0 : 1);
})();
