'use strict';
/**
 * ai-purchase-maintenance-reserve-test.cjs -- R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1.
 * Czysty test decyzji zakupu jednostki przez AI z rezerwą utrzymania:
 * skarbiec duży/mały, dochód netto ujemny/dodatni, Easy/Normal/Hard
 * (progi z data/ai-params.json), zgodność wsteczna (brak pól rezerwy = dawna bramka).
 *
 * Run from gra/:  node tools/ai-purchase-maintenance-reserve-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[ai-purchase-maintenance-reserve-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-purchase-maintenance-reserve-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-purchase-maintenance-reserve-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { shouldAIPurchaseUnit, loadAiPurchaseReserveParams } from '../src/game/ai';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE_FILE, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-purchase-maintenance-reserve-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { shouldAIPurchaseUnit, loadAiPurchaseReserveParams } = require(BUNDLE_FILE);
const aiParams = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'ai-params.json'), 'utf8'));
const data = { aiParams };

let passed = 0, failed = 0;
function ok(c, msg) { eq(!!c, true, msg); }
function eq(a, b, msg) {
  if (a === b) passed++; else { failed++; console.error(`FAIL: ${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
}

const easy = loadAiPurchaseReserveParams(data, 1);
const normal = loadAiPurchaseReserveParams(data, 2);
const hard = loadAiPurchaseReserveParams(data, 3);

console.log('\n-- A. Progi z ai-params.json --');
eq(typeof normal.rezerwaTur, 'number', 'Normal rezerwaTur liczba');
eq(normal.rezerwaTur, 10, 'Normal: 10 tur rezerwy (R-WEB-AI-PURCHASE-RESERVE-N10-Q1)');
eq(normal.minDochodNetto, 0, 'Normal: min dochod netto 0');
eq(easy.rezerwaTur, 3, 'Easy: 3 tury rezerwy');
eq(easy.minDochodNetto, 0, 'Easy: min dochod netto 0');
eq(hard.rezerwaTur, 2, 'Hard: 2 tury rezerwy');
eq(hard.minDochodNetto, -2, 'Hard: min dochod netto -2');

// Bazowy przypadek: cena 50, utrzymanie 10/tura, nowa jednostka +1, dochód netto +5.
const mk = (over, reserve) => ({
  treasury: 500, goldCost: 50, hasManpower: true,
  reserve, netIncomePerTurn: 5, upkeepPerTurn: 10, unitUpkeepPerTurn: 1, ...over,
});

console.log('\n-- B. Skarbiec duzy/maly (Normal: N=10, po zakupie wymagane 10*(10+1)=110) --');
eq(shouldAIPurchaseUnit(mk({ treasury: 500 }, normal)), true, 'duzy skarbiec + dochod dodatni -> kupuje');
eq(shouldAIPurchaseUnit(mk({ treasury: 50 + 110 }, normal)), true, 'brzeg: cena + 10 tur utrzymania -> kupuje');
eq(shouldAIPurchaseUnit(mk({ treasury: 50 + 109 }, normal)), false, 'o 1 mniej niz cena + 10 tur -> nie kupuje');
eq(shouldAIPurchaseUnit(mk({ treasury: 50 }, normal)), false, 'stac tylko na cene (bez rezerwy) -> nie kupuje');
eq(shouldAIPurchaseUnit(mk({ treasury: 49 }, normal)), false, 'mniej niz cena -> nie kupuje');

console.log('\n-- C. Dochod netto ujemny/dodatni (Normal: min 0) --');
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: 1 }, normal)), true, 'netto po zakupie = 0 -> kupuje (brzeg)');
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: 0 }, normal)), false, 'netto po zakupie = -1 -> nie kupuje');
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: -5 }, normal)), false, 'dochod ujemny -> nie kupuje');
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: -5, treasury: 100000 }, normal)), false, 'dochod ujemny nie jest kompensowany bogatym skarbcem');
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: 100, unitUpkeepPerTurn: 2, upkeepPerTurn: 0 }, normal)), true, 'zerowe dotychczasowe utrzymanie, wysoki dochod -> kupuje');

console.log('\n-- D. Easy/Normal/Hard --');
// netto po zakupie = -1 (netIncome 0, utrzymanie jednostki 1); skarbiec 500.
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: 0 }, hard)), true, 'Hard toleruje netto -1 (min -2)');
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: 0 }, normal)), false, 'Normal nie toleruje netto -1');
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: 0 }, easy)), false, 'Easy nie toleruje netto -1');
eq(shouldAIPurchaseUnit(mk({ netIncomePerTurn: -2 }, hard)), false, 'Hard: netto po zakupie -3 < -2 -> nie kupuje');
// Skarbiec: Hard N=2 -> po zakupie 2*11=22; Normal N=3 -> 33.
eq(shouldAIPurchaseUnit(mk({ treasury: 50 + 22 }, hard)), true, 'Hard: cena + 2 tury -> kupuje');
eq(shouldAIPurchaseUnit(mk({ treasury: 50 + 22 }, normal)), false, 'Normal: ta sama kwota < cena + 10 tur -> nie kupuje');
eq(shouldAIPurchaseUnit(mk({ treasury: 50 + 33 }, normal)), false, 'Normal: cena + 3 tury (dawna wartosc) -> nie kupuje');

console.log('\n-- E. Bramki dawne zachowane --');
eq(shouldAIPurchaseUnit(mk({ hasManpower: false }, normal)), false, 'brak Manpower -> nie kupuje');
eq(shouldAIPurchaseUnit(mk({ treasury: 0 }, easy)), false, 'pusty skarbiec -> nie kupuje');

console.log('\n-- F. Zgodnosc wsteczna: brak pol rezerwy = dawna bramka (cena + Manpower) --');
eq(shouldAIPurchaseUnit({ treasury: 50, goldCost: 50, hasManpower: true }), true, 'bez rezerwy: treasury == cena -> kupuje');
eq(shouldAIPurchaseUnit({ treasury: 50, goldCost: 50, hasManpower: true, reserve: normal }), true, 'reserve bez danych dochodu -> dawna bramka');
eq(shouldAIPurchaseUnit({ treasury: 49, goldCost: 50, hasManpower: true }), false, 'bez rezerwy: za malo zlota -> nie kupuje');

console.log('\n-- G. Kontrakt zrodlowy: main.ts faktycznie przekazuje dane do reguly (pada na bazie fcaa10300) --');
{
  const mainSrc = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
  const callIdx = mainSrc.indexOf('const wantsPurchase = shouldAIPurchaseUnit({');
  ok(callIdx > 0, 'main.ts: istnieje call site shouldAIPurchaseUnit');
  const callBlock = callIdx > 0 ? mainSrc.slice(callIdx, callIdx + 900) : '';
  ok(/\.\.\.aiPurchaseReserveInputs\(ownerId, candId\)/.test(callBlock), 'call site spreaduje aiPurchaseReserveInputs(ownerId, candId)');
  const fnIdx = mainSrc.indexOf('function aiPurchaseReserveInputs(');
  ok(fnIdx > 0, 'main.ts: zdefiniowano aiPurchaseReserveInputs');
  const fnBlock = fnIdx > 0 ? mainSrc.slice(fnIdx, fnIdx + 2200) : '';
  for (const f of ['reserve:', 'netIncomePerTurn:', 'upkeepPerTurn:', 'unitUpkeepPerTurn:']) {
    ok(fnBlock.includes(f), `aiPurchaseReserveInputs zwraca pole ${f.replace(':', '')}`);
  }
  ok(/loadAiPurchaseReserveParams\(data, aiDiffLevelForOwner\(ownerId\)\)/.test(fnBlock), 'progi per poziom trudnosci ownera (aiDiffLevelForOwner)');
  ok(/previewOwnerUpkeep\(/.test(fnBlock), 'utrzymanie z previewOwnerUpkeep (te same prymitywy co tick/HUD)');
  ok(/aiGoldIncomeByOwner\.set\(oid, aiEcon\.pieniadz\)/.test(mainSrc), 'przychod brutto AI zapisywany w bloku bankowania ticku');
  ok(/import \{[^}]*loadAiPurchaseReserveParams[^}]*\} from '\.\/game\/ai'/.test(mainSrc), 'main.ts importuje loadAiPurchaseReserveParams');
  const econ = fs.readFileSync(path.resolve(GRA, 'data', 'econ-params.json'), 'utf8');
  ok(!/ai_rush_jednostka_(rezerwa_zlota|max_na_ture)/.test(econ), 'martwe klucze ai_rush_jednostka_* usuniete z econ-params.json');
  // Zachowanie na stanie: wejscia jak z aiPurchaseReserveInputs (Normal, przychod 10, utrzymanie 8, jednostka +1).
  const normal = loadAiPurchaseReserveParams(data, 2);
  const inp = { reserve: normal, netIncomePerTurn: 10 - 8, upkeepPerTurn: 8, unitUpkeepPerTurn: 1, hasManpower: true, goldCost: 50 };
  eq(shouldAIPurchaseUnit({ ...inp, treasury: 50 + 90 }), true, 'stan: skarbiec = cena + 10*(8+1) -> kupuje');
  eq(shouldAIPurchaseUnit({ ...inp, treasury: 50 + 89 }), false, 'stan: skarbiec o 1 za maly -> nie kupuje');
  eq(shouldAIPurchaseUnit({ ...inp, treasury: 500, netIncomePerTurn: 0 }), false, 'stan: netto po zakupie < 0 -> nie kupuje mimo duzego skarbca');
}

console.log(`\nai-purchase-maintenance-reserve-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_e) { /* noop */ }
process.exit(failed > 0 ? 1 : 0);
