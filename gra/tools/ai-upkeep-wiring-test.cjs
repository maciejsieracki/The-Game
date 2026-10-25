'use strict';
/**
 * ai-upkeep-wiring-test.cjs — R-WEB-AI-ARMY-UPKEEP-Q1: strażnik okablowania bramki
 * rekrutacji AI (src/main.ts) bez uruchamiania gry. Sprawdza:
 *   1) bramka jest wołana w OBU miejscach decyzji AI (canAfford jednostki + wantsPurchase),
 *   2) helper aiUpkeepRecruitGate zwraca true dla gracza i przy wyłączonej fladze,
 *   3) bank AI zapisuje saldo złota ostatniej tury (aiLastGoldNetByOwner),
 *   4) flaga domyślnie OFF w module bramki,
 *   5) same-turn (pending utrzymania), podłoga garnizonu, cityState w ownerEcon.
 *   UWAGA: to dopasowanie wzorców w tekście main.ts, NIE dowód zachowania (zachowanie: ai-upkeep-gate-test).
 * Mutacja: usunięcie wywołania z canAfford/wantsPurchase -> test czerwony.
 *
 * Run from gra/:  node tools/ai-upkeep-wiring-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const gate = fs.readFileSync(path.join(GRA, 'src', 'game', 'ai-upkeep-gate.ts'), 'utf8');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }

const calls = main.split('aiUpkeepRecruitGate(').length - 1;
assert(calls >= 3, `aiUpkeepRecruitGate wołana >= 3 razy (definicja + 2 miejsca decyzji), jest ${calls}`);

assert(/return canAffordUnitRecruitFull\(ownerSurowcePoolFor\(ownerId\), unitDef\)\s*&&\s*aiUpkeepRecruitGate\(/.test(main),
  'canAfford jednostki AI zawiera bramkę utrzymania');
assert(/shouldAIPurchaseUnit\(\{[\s\S]*?\}\)\s*&&\s*aiUpkeepRecruitGate\(/.test(main),
  'wantsPurchase (egzekucja zakupu AI) zawiera bramkę utrzymania');
assert(/if \(!isAiUpkeepAwareRecruitmentEnabled\(\) \|\| isHuman\(ownerId\)\) return true;/.test(main),
  'helper: flaga OFF lub gracz -> true');
assert(/aiLastGoldNetByOwner\.set\(oid, aiBalance\?\.saldo \?\? 0\)/.test(main),
  'bank AI zapisuje saldo złota ostatniej tury');
assert(/purchaseRecruitmentUnit\(cmd\.cityId, candId, item\.koszt, ownerId\)\) \{[\s\S]{0,200}aiRecordUpkeepPurchase\(ownerId, candId,/.test(main),
  'po UDANYM zakupie AI zapisywane jest utrzymanie kupionej jednostki (same-turn)');
assert(/aiTurnPendingUpkeepByOwner\.delete\(oid\);/.test(main),
  'saldo tury: utrzymanie kupionych w turze czyszczone przy liczeniu salda AI');
assert(/pendingGoldUpkeep: pend\?\.gold \?\? 0,/.test(main) && /militaryUnits,\s*\n\s*cityCount:/.test(main),
  'bramka dostaje pending utrzymania, militaryUnits i cityCount');
assert(/cityState: isCityStateOwner\(oid\),/.test(main),
  'ownerEcon niesie flagę cityState (metryka AI bez miast-państw)');
assert(/garrisonPerCity/.test(gate) && /'garrison-floor'/.test(gate),
  'podłoga garnizonu obecna w module bramki');
assert(/export const AI_UPKEEP_AWARE_RECRUITMENT_ENABLED = false;/.test(gate),
  'flaga AI_UPKEEP_AWARE_RECRUITMENT_ENABLED domyślnie false');

console.log(`ai-upkeep-wiring-test: ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
