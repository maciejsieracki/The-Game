'use strict';
/**
 * unit-stock-cost-test.cjs -- standalone Node test dla JEDNOSTKI-SUROWIEC-01
 * (decyzja Macieja 2026-07-24): jednostki z units.json (`Surowiec` / `Surowiec
 * (ilość)`) konsumuja surowiec z PULI PANSTWA (civ-wide, per owner) -- dokladnie
 * tak samo jak koszt_surowce budynkow (SUROW-CIV-01, building-stock-cost.ts).
 *
 * Run from gra/:  node tools/unit-stock-cost-test.cjs
 *
 * Wzorowany na tools/surow-civ-storage-test.cjs (ten sam sposob budowania
 * bundla esbuild + styl asercji).
 *
 * Pokrywa:
 *   A. unitStockCost -- mapowanie Surowiec/Surowiec (ilosc) -> klucz ASCII
 *      (diakrytyki: 'Brąz'->'braz', 'Żelazo'->'zelazo'), '-'/ilosc<=0 -> {}.
 *   B. Pobor z puli PANSTWA dla jednostki: canAffordBuildingStock +
 *      deductBuildingStockCostAcrossCities dziala identycznie jak dla budynku.
 *   C. PARYTET AI (twarda zasada Macieja): dokladnie ten sam scenariusz
 *      (2 miasta, jeden koszt jednostki) dla ownerId=0 (gracz) i ownerId!=0
 *      (AI) daje IDENTYCZNY wynik -- zero galezi "tylko gracz".
 *   D. Zwrot (creditOwnerResourceStock) przy anulowaniu przywraca sume civ-wide.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[unit-stock-cost-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.unit-stock-cost-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-stock-cost-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  unitStockCost,
  ownerResourceStock, ownerResourceStockAll,
  deductBuildingStockCostAcrossCities, creditOwnerResourceStock,
  canAffordBuildingStock, missingStockFor,
} from '../src/game/building-stock-cost';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[unit-stock-cost-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const units = require('../data/units.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  const sa = JSON.stringify(a, Object.keys(a).sort());
  const sb = JSON.stringify(b, Object.keys(b).sort());
  assert(sa === sb, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

function makeCities(spec) {
  // spec: [{id, ownerId, surowce}]
  return spec.map(s => ({ id: s.id, ownerId: s.ownerId, surowce: { ...s.surowce } }));
}

// ===========================================================================
// A. unitStockCost: mapowanie Surowiec/Surowiec (ilosc) -> klucz ASCII
// ===========================================================================
console.log('\n-- A. unitStockCost: mapowanie diakrytyki -> klucze ASCII (City.surowce) --');
{
  deepEq(
    M.unitStockCost({ Surowiec: 'Brąz', 'Surowiec (ilość)': 2 }),
    { braz: 2 },
    "unitStockCost({Surowiec:'Brąz', ilość:2}) -> {braz:2}",
  );
  deepEq(
    M.unitStockCost({ Surowiec: 'Żelazo', 'Surowiec (ilość)': 3 }),
    { zelazo: 3 },
    "unitStockCost({Surowiec:'Żelazo', ilość:3}) -> {zelazo:3}",
  );
  deepEq(
    M.unitStockCost({ Surowiec: '-', 'Surowiec (ilość)': 0 }),
    {},
    "unitStockCost({Surowiec:'-', ilość:0}) -> {} (brak kosztu)",
  );
  deepEq(M.unitStockCost(null), {}, 'unitStockCost(null) -> {} (odporne na brak danych)');
  deepEq(M.unitStockCost(undefined), {}, 'unitStockCost(undefined) -> {}');
  deepEq(
    M.unitStockCost({ Surowiec: 'Brąz', 'Surowiec (ilość)': 0 }),
    {},
    'unitStockCost: nazwa surowca obecna, ale ilość<=0 -> {} (brak kosztu)',
  );
  deepEq(
    M.unitStockCost({ Surowiec: null, 'Surowiec (ilość)': 2 }),
    {},
    'unitStockCost: Surowiec=null -> {} (brak kosztu, mimo dodatniej ilości)',
  );
  deepEq(
    M.unitStockCost({ Surowiec: '-', 'Surowiec (ilość)': 2 }),
    {},
    "unitStockCost: Surowiec='-' -> {} (myślnik = brak surowca, ignoruj ilość)",
  );

  // Kontrola na prawdziwych danych units.json (jednostki z realnym kosztem Brąz/Żelazo).
  const brazUnit = units.find(u => u.Surowiec === 'Brąz');
  const zelazoUnit = units.find(u => u.Surowiec === 'Żelazo');
  const dashUnit = units.find(u => u.Surowiec === '-');
  assert(!!brazUnit, 'units.json: istnieje co najmniej jedna jednostka z Surowiec=Brąz (fixtura sanity)');
  assert(!!zelazoUnit, 'units.json: istnieje co najmniej jedna jednostka z Surowiec=Żelazo (fixtura sanity)');
  assert(!!dashUnit, "units.json: istnieje co najmniej jedna jednostka z Surowiec='-' (fixtura sanity)");
  if (brazUnit) {
    deepEq(
      M.unitStockCost(brazUnit),
      { braz: brazUnit['Surowiec (ilość)'] },
      `units.json realny rekord Brąz (${brazUnit.Jednostka}): mapuje na klucz 'braz'`,
    );
  }
  if (zelazoUnit) {
    deepEq(
      M.unitStockCost(zelazoUnit),
      { zelazo: zelazoUnit['Surowiec (ilość)'] },
      `units.json realny rekord Żelazo (${zelazoUnit.Jednostka}): mapuje na klucz 'zelazo'`,
    );
  }
  if (dashUnit) {
    deepEq(M.unitStockCost(dashUnit), {}, `units.json realny rekord '-' (${dashUnit.Jednostka}): brak kosztu`);
  }
}

// ===========================================================================
// B. Pobor z puli PANSTWA dla jednostki (afordancja + deduct rozproszony)
// ===========================================================================
console.log('\n-- B. Pobor jednostki z puli PANSTWA (gracz, ownerId=0) --');
{
  const cities = makeCities([
    { id: 'c1', ownerId: 0, surowce: { braz: 3 } },
    { id: 'c2', ownerId: 0, surowce: { braz: 1 } },
  ]);
  // Wlocznik: {Surowiec:'Brąz', ilosc:2} -- suma panstwa = 4, wystarcza.
  const cost = M.unitStockCost({ Surowiec: 'Brąz', 'Surowiec (ilość)': 2 });
  const pool = M.ownerResourceStockAll(cities, 0);
  eq(pool.braz, 4, 'pula panstwa gracza: braz 3+1=4');
  assert(M.canAffordBuildingStock(pool, cost), 'canAffordBuildingStock: pula panstwa (4) pokrywa koszt jednostki (2)');

  M.deductBuildingStockCostAcrossCities(cities, 0, cost);
  const c1 = cities.find(c => c.id === 'c1');
  const c2 = cities.find(c => c.id === 'c2');
  // Bierze NAJPIERW z miasta o najwiekszym zapasie (c1=3) -- 2 z 3 -> c1=1, c2 niezmienione.
  eq(c1.surowce.braz, 1, 'deduct: c1 (najwiekszy zapas 3) oplaca caly koszt (2) -> zostaje 1');
  eq(c2.surowce.braz, 1, 'deduct: c2 niezmienione (koszt pokryty przez c1)');
  eq(M.ownerResourceStock(cities, 0, 'braz'), 2, 'suma panstwa po poborze: 4-2=2');

  // Blokada: koszt przewyzszajacy pule -> canAffordBuildingStock=false, brak pobrania.
  const bigCost = M.unitStockCost({ Surowiec: 'Brąz', 'Surowiec (ilość)': 99 });
  assert(!M.canAffordBuildingStock(M.ownerResourceStockAll(cities, 0), bigCost),
    'canAffordBuildingStock: koszt (99) > pula panstwa (2) -> blokada (false)');
}

// ===========================================================================
// C. PARYTET AI (Maciej 2026-07-24): dokladnie ten sam scenariusz dla
// ownerId!=0 (AI) daje identyczny wynik jak dla gracza (ownerId=0) powyzej.
// ===========================================================================
console.log('\n-- C. PARYTET AI: identyczny scenariusz dla ownerId=0 (gracz) i ownerId=5 (AI) --');
{
  function runScenario(ownerId) {
    const cities = makeCities([
      { id: 'a1', ownerId, surowce: { zelazo: 5 } },
      { id: 'a2', ownerId, surowce: { zelazo: 0 } },
      // "inny" owner w tych samych miastach -- nie powinien wplywac na wynik.
      { id: 'other', ownerId: ownerId === 0 ? 999 : 0, surowce: { zelazo: 1000 } },
    ]);
    const cost = M.unitStockCost({ Surowiec: 'Żelazo', 'Surowiec (ilość)': 3 });
    const poolBefore = M.ownerResourceStockAll(cities, ownerId);
    const affordable = M.canAffordBuildingStock(poolBefore, cost);
    M.deductBuildingStockCostAcrossCities(cities, ownerId, cost);
    const poolAfter = M.ownerResourceStock(cities, ownerId, 'zelazo');
    const otherUntouched = cities.find(c => c.id === 'other').surowce.zelazo;
    return { affordable, poolBefore: poolBefore.zelazo ?? 0, poolAfter, otherUntouched };
  }

  const player = runScenario(0);
  const ai = runScenario(5);

  eq(player.affordable, true, 'gracz (ownerId=0): koszt (3) pokryty przez pule (5) -> affordable');
  eq(ai.affordable, true, 'AI (ownerId=5): koszt (3) pokryty przez pule (5) -> affordable IDENTYCZNIE jak gracz');
  eq(player.poolBefore, ai.poolBefore, 'PARYTET: pula przed poborem identyczna dla gracza i AI (5==5)');
  eq(player.poolAfter, ai.poolAfter, 'PARYTET: pula PO poborze identyczna dla gracza i AI (5-3=2==2)');
  eq(player.poolAfter, 2, 'gracz: pula panstwa po poborze = 5-3=2');
  eq(ai.poolAfter, 2, 'AI: pula panstwa po poborze = 5-3=2 (dokladnie jak gracz)');
  eq(player.otherUntouched, 1000, 'gracz: inny owner (999) nietkniety (1000 bez zmian)');
  eq(ai.otherUntouched, 1000, 'AI: inny owner (0, tu "gracz" w tym scenariuszu) nietkniety (1000 bez zmian)');
}

// ===========================================================================
// D. Zwrot przy anulowaniu (creditOwnerResourceStock) przywraca sume civ-wide
// ===========================================================================
console.log('\n-- D. Zwrot (anulowanie rekrutacji): creditOwnerResourceStock przywraca sume civ-wide --');
{
  const cities = makeCities([
    { id: 'r1', ownerId: 3, surowce: { braz: 2 } },
    { id: 'r2', ownerId: 3, surowce: { braz: 6 } },
  ]);
  const cost = M.unitStockCost({ Surowiec: 'Brąz', 'Surowiec (ilość)': 2 });
  const before = M.ownerResourceStock(cities, 3, 'braz');
  eq(before, 8, 'suma panstwa przed poborem: 2+6=8');

  M.deductBuildingStockCostAcrossCities(cities, 3, cost);
  const afterDeduct = M.ownerResourceStock(cities, 3, 'braz');
  eq(afterDeduct, 6, 'suma panstwa po poborze jednostki (koszt 2): 8-2=6');

  // Anulowanie rekrutacji -- zwrot IDENTYCZNEGO kosztu do puli (bez capPerType, to zwrot).
  for (const [key, amt] of Object.entries(cost)) {
    M.creditOwnerResourceStock(cities, 3, key, amt);
  }
  const afterRefund = M.ownerResourceStock(cities, 3, 'braz');
  eq(afterRefund, before, 'zwrot po anulowaniu: suma panstwa przywrocona dokladnie do stanu sprzed poboru (6+2=8=before)');
}

// --- summary ---------------------------------------------------------------
console.log(`\nunit-stock-cost-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
