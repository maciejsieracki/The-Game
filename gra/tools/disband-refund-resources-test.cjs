'use strict';
/**
 * disband-refund-resources-test.cjs -- standalone Node test dla
 * R-WEB-DISBAND-REFUND-RESOURCES-Q1: przy ROZWIĄZANIU jednostki gracza wraca 100%
 * surowców zużytych przy werbunku (ślad `stockPaid`) do puli państwa.
 *
 * Run from gra/:  node tools/disband-refund-resources-test.cjs
 *
 * Pokrywa:
 *   A. Zwrot = 100% kosztu z units.json (drewno, brąz, koń) -- round-trip
 *      deduct (werbunek) -> refund (rozwiązanie) przywraca sumę civ-wide.
 *   B. Jednostka bez surowca (Osadnik) / brak śladu (undefined, {}) -> zero zwrotu.
 *   C. Wpisy niedodatnie / niefinityjne są pomijane (brak ujemnego zwrotu).
 *   D. Pieniądz NIE wraca: moduł zwrotu nie dotyka skarbca; w main.ts blok
 *      disbandPlayerUnit nie wywołuje setOwnerTreasury.
 *   E. Hint: w disbandPlayerUnit dopisany „zwrot surowców” z nazwami etykiet (bez id).
 *   F. Regresja: refundManpowerToEmpire nadal wywoływany w disbandPlayerUnit.
 *   G. Parytet: cancelRecruitmentPurchase (zwrot anulowanej rekrutacji) bez zmian.
 *
 * Wzorowany na tools/unit-stock-cost-test.cjs (ten sam sposób bundlowania esbuild).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[disband-refund-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.disband-refund-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.disband-refund-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  unitStockCost,
  disbandStockRefund,
  stockPaidOf,
  disbandStockRefundCredit,
  formatDisbandStockRefundHint,
  ownerResourceStockAll,
  deductBuildingStockCostAcrossCities,
  creditOwnerResourceStock,
  stockResourceLabel,
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
  console.error('[disband-refund-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const units = require('../data/units.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  assert(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

const MAIN_SRC = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');

function findDef(pred) { return units.find(pred); }
function fnBody(src, header) {
  const start = src.indexOf(header);
  if (start < 0) return null;
  // Bierzemy blok od nagłówka do następnej deklaracji `function ` na tym samym poziomie wcięcia.
  const indent = /^\s*/.exec(src.slice(src.lastIndexOf('\n', start) + 1))[0];
  const rest = src.slice(start + header.length);
  const re = new RegExp('\\n' + indent + '(?:/\\*\\*|function |// -{5,})');
  const m = re.exec(rest);
  return src.slice(start, m ? start + header.length + m.index : src.length);
}

// ===========================================================================
// A. Zwrot = 100% kosztu z units.json (round-trip werbunek -> rozwiązanie)
// ===========================================================================
console.log('\n-- A. Zwrot 100% kosztu (drewno, brąz, koń) --');
{
  const wojownik = findDef(u => u.Jednostka === 'Wojownik');     // Surowiec: Drewno
  const wlocznik = findDef(u => u.Jednostka === 'Włócznik');     // Surowiec: Brąz
  const mount    = findDef(u => u.Typ === 'Mount' && u.Jednostka !== 'Rydwan (woły)'); // +5 Koni
  assert(wojownik && wlocznik && mount, 'fixture: jednostki z units.json');

  for (const [label, def, key] of [['Wojownik', wojownik, 'drewno'], ['Włócznik', wlocznik, 'braz']]) {
    const paid = M.unitStockCost(def);
    assert((paid[key] ?? 0) > 0, `${label}: koszt zawiera ${key}`);
    deepEq(M.disbandStockRefund(paid), paid, `${label}: zwrot = 100% zapłaconego kosztu`);

    // round-trip na puli państwa: werbunek odejmuje, rozwiązanie wraca do tej samej sumy
    const cities = [
      { id: 'a', ownerId: 0, surowce: { [key]: 40 } },
      { id: 'b', ownerId: 0, surowce: { [key]: 10 } },
    ];
    const before = M.ownerResourceStockAll(cities, 0);
    M.deductBuildingStockCostAcrossCities(cities, 0, paid);
    assert(M.ownerResourceStockAll(cities, 0)[key] === before[key] - paid[key], `${label}: werbunek zdejmuje koszt`);
    for (const [k, amt] of Object.entries(M.disbandStockRefund(paid))) {
      M.creditOwnerResourceStock(cities, 0, k, amt);
    }
    deepEq(M.ownerResourceStockAll(cities, 0), before, `${label}: rozwiązanie przywraca pulę dokładnie`);
  }

  const paidMount = M.unitStockCost(mount);
  assert((paidMount.kon ?? 0) >= 25, `Mount ${mount.Jednostka}: koszt zawiera kon (>=25 bazowe)`);
  deepEq(M.disbandStockRefund(paidMount), paidMount, `Mount: zwrot konia = 100% (kon + surowiec z units.json)`);

  // Etykieta PL, nie surowe id
  eq(M.stockResourceLabel('braz'), 'Brąz', 'etykieta braz -> Brąz');
  eq(M.stockResourceLabel('kon'), 'Koń', 'etykieta kon -> Koń');
  eq(M.stockResourceLabel('drewno'), 'Drewno', 'etykieta drewno -> Drewno');
}

// ===========================================================================
// B. Brak surowca / brak śladu -> zero zwrotu
// ===========================================================================
console.log('\n-- B. Jednostka bez surowca / brak śladu --');
{
  const osadnik = findDef(u => u.Jednostka === 'Osadnik');
  if (osadnik) {
    deepEq(M.unitStockCost(osadnik), {}, 'Osadnik: brak kosztu surowcowego');
  }
  deepEq(M.disbandStockRefund(undefined), {}, 'brak pola stockPaid (undefined) -> {}');
  deepEq(M.disbandStockRefund(null), {}, 'stockPaid null -> {}');
  deepEq(M.disbandStockRefund({}), {}, 'stockPaid {} -> {}');
}

// ===========================================================================
// C. Wpisy niedodatnie / niefinityjne pomijane
// ===========================================================================
console.log('\n-- C. Filtrowanie wpisów --');
{
  deepEq(
    M.disbandStockRefund({ drewno: 5, braz: 0, kon: -3, kamien: NaN, glina: Infinity, zelazo: 2 }),
    { drewno: 5, zelazo: 2 },
    'tylko dodatnie, skończone wpisy wracają',
  );
}

// ===========================================================================
// D. Pieniądz nie wraca (źródło)
// ===========================================================================
console.log('\n-- D. Brak zwrotu pieniędzy --');
{
  const disbandSrc = fnBody(MAIN_SRC, 'function disbandPlayerUnit(unitId: string): boolean {');
  assert(disbandSrc !== null, 'disbandPlayerUnit znaleziony w main.ts');
  if (disbandSrc) {
    assert(!/setOwnerTreasury\(/.test(disbandSrc), 'disbandPlayerUnit nie zmienia skarbca (brak zwrotu złota)');
    assert(/disbandStockRefundCredit\(cities, 0, u, stockRefundCap\)/.test(disbandSrc),
      'disbandPlayerUnit zwraca surowce z śladu jednostki przez disbandStockRefundCredit (cap)');
    assert(/refundManpowerToEmpire\(cities, 0, ep, mpRefund/.test(disbandSrc), 'F. regresja: zwrot Manpower zachowany');
    assert(/zwrot surowców/.test(disbandSrc), 'E. hint zawiera „zwrot surowców”');
    assert(/formatDisbandStockRefundHint\(stockRefundCredited\)/.test(disbandSrc), 'E. hint składany przez formatDisbandStockRefundHint');
  }
  assert(/stockPaid: recStockPaid/.test(MAIN_SRC) && /const recStockPaid = unitStockCost\(def\)/.test(MAIN_SRC),
    'ślad stockPaid zapisywany przy ukończeniu rekrutacji (ta sama unitStockCost)');
  const cancelSrc = fnBody(MAIN_SRC, 'function cancelRecruitmentPurchase(');
  assert(cancelSrc && /creditOwnerResourceStock\(cities, ownerId, key, amt\)/.test(cancelSrc),
    'G. parytet: cancelRecruitmentPurchase nadal zwraca surowiec bez zmian');
}

// ===========================================================================
// H. Zachowanie ścieżki zwrotu (czyste funkcje, którymi woła disbandPlayerUnit)
// ===========================================================================
console.log('\n-- H. Zachowanie: zwrot na puli państwa, cap, hint, brak zwrotu złota --');
{
  // H1. Pełny zwrot do puli państwa (dwa miasta, dwa surowce), bez capu
  const citiesA = () => [
    { id: 'a', ownerId: 0, surowce: { drewno: 10 } },
    { id: 'b', ownerId: 0, surowce: { braz: 1 } },
    { id: 'x', ownerId: 1, surowce: { drewno: 99 } }, // obca cywilizacja: nie rusza się
  ];
  const unitH1 = { id: 'u1', ownerId: 0, typeId: 'T', stockPaid: { drewno: 5, braz: 3 } };
  const c1 = citiesA();
  const got1 = M.disbandStockRefundCredit(c1, 0, unitH1);
  deepEq(got1, { drewno: 5, braz: 3 }, 'H1: zwrócone ilości = 100% śladu');
  eq(M.ownerResourceStockAll(c1, 0).drewno, 15, 'H1: pula państwa drewno 10 -> 15');
  eq(M.ownerResourceStockAll(c1, 0).braz, 4, 'H1: pula państwa brąz 1 -> 4');
  eq(c1[2].surowce.drewno, 99, 'H1: magazyn obcego właściciela nietknięty');

  // H2. Cap magazynu: nadwyżka przepada, zwrot = faktycznie dopisane
  const c2 = [{ id: 'a', ownerId: 0, surowce: { drewno: 38 } }];
  const got2 = M.disbandStockRefundCredit(c2, 0, { stockPaid: { drewno: 5 } }, 40);
  deepEq(got2, { drewno: 2 }, 'H2: cap 40 przy 38 -> dopisane tylko 2');
  eq(M.ownerResourceStockAll(c2, 0).drewno, 40, 'H2: pula nie przekracza capu');

  // H3. Pełny magazyn -> zero dopisanych, pusty wynik (hint nie pokazuje zwrotu)
  const c3 = [{ id: 'a', ownerId: 0, surowce: { drewno: 40 } }];
  deepEq(M.disbandStockRefundCredit(c3, 0, { stockPaid: { drewno: 5 } }, 40), {}, 'H3: pełny magazyn -> brak zwrotu');
  eq(M.formatDisbandStockRefundHint({}), '', 'H3: pusty zwrot -> pusty fragment hintu');

  // H4. Brak śladu / jednostka bez surowca -> zero zmian w puli
  const c4 = citiesA();
  const before4 = M.ownerResourceStockAll(c4, 0);
  deepEq(M.disbandStockRefundCredit(c4, 0, { id: 'u2' }), {}, 'H4: brak stockPaid -> {}');
  deepEq(M.disbandStockRefundCredit(c4, 0, { stockPaid: {} }), {}, 'H4: pusty stockPaid -> {}');
  deepEq(M.ownerResourceStockAll(c4, 0), before4, 'H4: pula bez zmian');

  // H5. Odczyt śladu: stockPaidOf zwraca dokładnie zapisany obiekt; null/undefined bezpiecznie
  eq(M.stockPaidOf(unitH1), unitH1.stockPaid, 'H5: stockPaidOf czyta ślad z obiektu');
  eq(M.stockPaidOf(null), undefined, 'H5: stockPaidOf(null) -> undefined');
  eq(M.stockPaidOf({}), undefined, 'H5: stockPaidOf bez pola -> undefined');

  // H6. Hint: etykiety PL, bez surowych id, kolejność jak w zwrocie
  eq(M.formatDisbandStockRefundHint({ drewno: 5, braz: 3 }), '+5 Drewno, +3 Brąz', 'H6: hint = „+5 Drewno, +3 Brąz”');
  eq(M.formatDisbandStockRefundHint({ kon: 25 }), '+25 Koń', 'H6: hint dla konia używa etykiety');
  assert(!/drewno|braz|kon\b/.test(M.formatDisbandStockRefundHint({ drewno: 5, braz: 3, kon: 25 })),
    'H6: hint nie zawiera surowych id');

  // H7. Pieniądz nie wraca: wynik i zapis dotyczą wyłącznie surowców (brak pól złota w obiektach)
  const c7 = citiesA();
  const got7 = M.disbandStockRefundCredit(c7, 0, { stockPaid: { drewno: 5, zloto: 0, kamien: -2 } });
  deepEq(got7, { drewno: 5 }, 'H7: zloto/ujemne pominięte, brak pieniędzy w wyniku');
  assert(c7.every(c => c.surowce.zloto === undefined), 'H7: zwrot nie zapisuje złota w magazynie');
}

console.log(`\n${passed} passed, ${failed} failed`);

// Sprzątanie plików pośrednich
for (const f of [ENTRY_FILE, BUNDLE_FILE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }

if (failed > 0) process.exit(1);
