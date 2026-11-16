'use strict';
/**
 * ai-upkeep-wiring-test.cjs — R-WEB-AI-ARMY-UPKEEP-Q2: test okablowania bramki zapasu
 * w src/main.ts (źródłowy, bez uruchamiania silnika gry).
 *
 * Sprawdza:
 *   (W1) flaga AI_UPKEEP_RUNWAY_GATE.wlaczone = true (WŁĄCZONA decyzją właściciela 2026-11-16);
 *   (W2) call site bramki jest w wantsPurchase (rekrutacja AI), przed shouldAIPurchaseUnit;
 *   (W3) mapa aiFoodTickNetByOwner jest zapisywana w ticku ekonomii;
 *   (W4) mapa aiFoodTickNetByOwner jest czyszczona w tych samych miejscach co aiGoldIncomeByOwner.
 *
 * Run from gra/:  node tools/ai-upkeep-wiring-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN = path.resolve(GRA, 'src', 'main.ts');
const PARAMS = path.resolve(GRA, 'data', 'ai-upkeep-params.json');

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name}`); }
}

const src = fs.readFileSync(MAIN, 'utf8');
const params = JSON.parse(fs.readFileSync(PARAMS, 'utf8'));

check('W1 flaga AI_UPKEEP_RUNWAY_GATE.wlaczone = true (WLACZONA 2026-11-16)',
  params.AI_UPKEEP_RUNWAY_GATE && params.AI_UPKEEP_RUNWAY_GATE.wlaczone === true);

const callIdx = src.indexOf('aiUpkeepRunwayAllows(ownerId, candId, item.koszt)');
const purchaseIdx = src.indexOf('const wantsPurchase = !aiNnsHoldOwners.has(ownerId)');
const shouldIdx = src.indexOf('shouldAIPurchaseUnit({', purchaseIdx);
check('W2 call site bramki w wantsPurchase przed shouldAIPurchaseUnit',
  callIdx > purchaseIdx && purchaseIdx >= 0 && callIdx < shouldIdx && shouldIdx > purchaseIdx);

check('W3 aiFoodTickNetByOwner.set w ticku ekonomii (obok aiGoldIncomeByOwner.set)',
  /aiGoldIncomeByOwner\.set\(oid, aiEcon\.pieniadz\);[\s\S]{0,400}aiFoodTickNetByOwner\.set\(oid,/.test(src));

const countClear = (name) => (src.match(new RegExp(`${name}\\.clear\\(\\);`, 'g')) || []).length;
const goldClears = countClear('aiGoldIncomeByOwner');
const foodClears = countClear('aiFoodTickNetByOwner');
check(`W4 aiFoodTickNetByOwner.clear() w tych samych miejscach co aiGoldIncomeByOwner.clear() (${foodClears}/${goldClears})`,
  goldClears > 0 && foodClears === goldClears);

console.log('');
console.log(`RESULT ai-upkeep-wiring-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
