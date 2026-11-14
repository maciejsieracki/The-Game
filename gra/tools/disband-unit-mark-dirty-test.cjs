'use strict';
/**
 * disband-unit-mark-dirty-test.cjs — R-WEB-DISBAND-UNIT-MARK-DIRTY-Q1.
 *
 * Regresja: rozwiązanie jednostki gracza przez realną ścieżkę (`disbandPlayerUnit`, także
 * masowe „Rozwiąż” z zaznaczenia w panelu armii, które woła tę samą funkcję) musi oznaczyć
 * stan miasta jako brudny (`markCityStateDirty()`) PRZED `refreshD1bHud()`. Bez tego prognoza
 * ekonomii (dirty-gated, `refreshLiveEmpireRates`) zostaje stara: tooltip i bramka „Zakończ turę”
 * pokazują deficyt sprzed zwolnienia utrzymania jednostki.
 *
 * Sprawdza (statycznie, na źródle main.ts):
 *  (a) w ciele `disbandPlayerUnit` jest `units.splice(idx, 1)`, po nim `markCityStateDirty()`,
 *      a dopiero po nim `refreshD1bHud()` (kolejność ma znaczenie: HUD czyta cache prognozy),
 *  (b) `disbandSelectedOrPickedUnits` (panel armii) nadal deleguje do `disbandPlayerUnit`
 *      (nie ma osobnej, nieoznaczającej ścieżki usuwania jednostek gracza),
 *  (c) mutacja: bez wywołania `markCityStateDirty()` w ciele test MUSI czerwienieć.
 *
 * Run: node tools/disband-unit-mark-dirty-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

// Wyciąga ciało funkcji od sygnatury do pierwszego domknięcia na wcięciu 4 spacje.
function extractFn(name) {
  const head = src.indexOf('function ' + name + '(');
  if (head < 0) return null;
  const end = src.indexOf('\n    }\n', head);
  return end < 0 ? null : src.slice(head, end + 7);
}

const body = extractFn('disbandPlayerUnit');
ok(body !== null, '(a) funkcja disbandPlayerUnit znaleziona w main.ts');

if (body) {
  const iSplice = body.indexOf('units.splice(idx, 1);');
  const iDirty = body.indexOf('markCityStateDirty();');
  const iHud = body.indexOf('refreshD1bHud();');
  ok(iSplice >= 0, '(a) disbandPlayerUnit usuwa jednostke (units.splice(idx, 1))');
  ok(iDirty >= 0, '(a) disbandPlayerUnit wola markCityStateDirty()');
  ok(iSplice >= 0 && iDirty > iSplice, '(a) markCityStateDirty() wywolane PO units.splice');
  ok(iHud >= 0 && iDirty >= 0 && iDirty < iHud, '(a) markCityStateDirty() wywolane PRZED refreshD1bHud()');
}

const picked = extractFn('disbandSelectedOrPickedUnits');
ok(picked !== null && /disbandPlayerUnit\(/.test(picked), '(b) panel armii (disbandSelectedOrPickedUnits) deleguje do disbandPlayerUnit');

console.log(`disband-unit-mark-dirty-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
