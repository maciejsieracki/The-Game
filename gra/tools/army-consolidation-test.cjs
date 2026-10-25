'use strict';

/* Testy jednostkowe + wiring dla R-WEB-ARMY-CONSOLIDATION-Q1 (runda 2).
 * Czyste funkcje z gra/src/game/army-consolidation.ts; wiring sprawdzany w ai.ts/main.ts/test-hook.ts.
 * Mutacje (usuniecie wyboru stolicy, sortowania, wykluczen, wiringu) -> czerwien: patrz README-sim-harness.md. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.army-consolidation-entry.ts');
const bundle = path.resolve(__dirname, '.army-consolidation-bundle.cjs');
fs.writeFileSync(entry, `
export {
  ARMY_CONSOLIDATION_PARAMS, setArmyConsolidationOverride, isArmyConsolidationEnabled,
  pickConsolidationHub, planCapitalConsolidation, partitionArmiesForWars,
} from '../src/game/army-consolidation';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const C = require(bundle);
const SRC = path.resolve(__dirname, '..', 'src');
let passed = 0;
let failed = 0;
function ok(value, message) { if (value) passed++; else { failed++; console.error('FAIL:', message); } }
function unit(id, q, r, extra = {}) {
  return { id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...extra };
}

// 1. Flaga: domyslnie OFF (zachowanie bazy), nadpisanie testowe dziala i wraca.
ok(C.ARMY_CONSOLIDATION_PARAMS.enabled === false, 'flag: JSON default is OFF');
ok(C.isArmyConsolidationEnabled() === false, 'flag: effective default is OFF');
C.setArmyConsolidationOverride(true);
ok(C.isArmyConsolidationEnabled() === true, 'flag: override ON');
C.setArmyConsolidationOverride(null);
ok(C.isArmyConsolidationEnabled() === false, 'flag: override null restores JSON');

// 2. Punkt zbiorki: stolica wygrywa z najwiekszym miastem; brak stolicy -> najludniejsze; remis -> nizsze id.
const cities = [
  { id: 'c1', ownerId: 1, q: 0, r: 0, population: 5 },
  { id: 'c2', ownerId: 1, q: 10, r: 0, population: 12 },
  { id: 'c3', ownerId: 1, q: 0, r: 10, population: 12 },
  { id: 'x9', ownerId: 2, q: 5, r: 5, population: 99 },
];
const capHub = C.pickConsolidationHub(1, cities, 'c1');
ok(capHub && capHub.cityId === 'c1' && capHub.q === 0, 'hub: capital preferred over larger city (mutation: ignore capital -> red)');
const fbHub = C.pickConsolidationHub(1, cities, null);
ok(fbHub && fbHub.cityId === 'c2', 'hub: no capital -> most populous own city, tie -> lower id');
ok(C.pickConsolidationHub(1, cities, 'x9') && C.pickConsolidationHub(1, cities, 'x9').cityId === 'c2', 'hub: capital owned by another owner is ignored');
ok(C.pickConsolidationHub(3, cities, 'c1') === null, 'hub: owner without cities -> null');
ok(C.pickConsolidationHub(1, cities, null, false) === null, 'hub: fallback disabled + no capital -> null');

// 3. Plan zbiorki: wykluczenia, garnizon, zaangazowanie, zwiadowcy, wyczerpany ruch, rozdzial move/gathered.
const hub = { cityId: 'c1', q: 0, r: 0 };
const roster = [
  unit('a', 0, 0),                 // juz w stolicy -> gathered
  unit('b', 3, 1),                 // move
  unit('c', 6, 2),                 // move
  unit('d', 1, 1, { inGarnizon: true }),       // wykluczona (garnizon)
  unit('e', 2, 2, { embarked: true }),         // wykluczona (na statku)
  unit('f', 2, 3, { ruchLeft: 0 }),            // wykluczona (ruch wyczerpany)
  unit('g', 4, 4),                 // wykluczona przez excluded (obronca domu)
  unit('h', 5, 5, { oblegaCityId: 'x' }),      // wykluczona (oblężenie)
  unit('i', 0, 2, { ownerId: 2 }),             // inny wlasciciel
  unit('j', 1, 0, { category: 'galera' }),     // galera -> wykluczona
];
const plan = C.planCapitalConsolidation(1, roster, hub, { excludedUnitIds: new Set(['g']) });
ok(plan !== null, 'plan: non-null with >= minArmyUnits eligible units');
ok(plan && JSON.stringify(plan.gatheredUnitIds) === '["a"]', 'plan: unit already at hub is gathered (got ' + (plan && JSON.stringify(plan.gatheredUnitIds)) + ')');
ok(plan && JSON.stringify(plan.moveUnitIds) === '["b","c"]', 'plan: other eligible units move to hub (got ' + (plan && JSON.stringify(plan.moveUnitIds)) + ')');
ok(plan && plan.hub.cityId === 'c1', 'plan: hub carried through');

// Mutation guard: removing the `excludedUnitIds` filter would add 'g' to moveUnitIds -> red.
ok(plan && !plan.moveUnitIds.includes('g') && !plan.gatheredUnitIds.includes('g'), 'plan: excluded unit never appears (mutation: drop exclusion -> red)');
ok(plan && !plan.moveUnitIds.includes('d') && !plan.gatheredUnitIds.includes('d'), 'plan: garrison never moved (mutation: drop inGarnizon gate -> red)');

// Below threshold -> null (baseline path).
ok(C.planCapitalConsolidation(1, [unit('p', 0, 0)], hub) === null, 'plan: single unit below minArmyUnits=2 -> null');
ok(C.planCapitalConsolidation(1, [unit('p', 0, 0), unit('q', 1, 0)], hub) !== null, 'plan: two units reach minArmyUnits=2');

// Determinism: same units in shuffled order -> identical plan.
const shuffled = [...roster].reverse();
const plan2 = C.planCapitalConsolidation(1, shuffled, hub, { excludedUnitIds: new Set(['g']) });
ok(JSON.stringify(plan) === JSON.stringify(plan2), 'determinism: input order does not change plan');

// 4. Podzial na armie = liczba wojen.
const field = [
  { id: 'u1', q: 0, r: 0, power: 5 }, { id: 'u2', q: 1, r: 0, power: 5 },
  { id: 'u3', q: 2, r: 0, power: 3 }, { id: 'u4', q: 3, r: 0, power: 3 },
  { id: 'u5', q: 4, r: 0, power: 2 }, { id: 'u6', q: 5, r: 0, power: 1 },
];
const two = C.partitionArmiesForWars(field, 2);
ok(two.length === 2, 'partition: 2 wars -> 2 armies (mutation: ignore warCount -> red)');
ok(two.reduce((n, g) => n + g.length, 0) === 6 && new Set(two.flat()).size === 6, 'partition: each unit in exactly one army');
const sums = two.map(g => g.reduce((s, id) => s + field.find(u => u.id === id).power, 0));
ok(Math.abs(sums[0] - sums[1]) <= 1, 'partition: strength balanced (sums ' + sums.join('/') + ')');
ok(C.partitionArmiesForWars(field, 0).length === 1, 'partition: 0 wars -> one army (min 1)');
ok(C.partitionArmiesForWars(field, 9).length === 6, 'partition: more wars than units -> capped at unit count');
ok(C.partitionArmiesForWars([], 3).length === 0, 'partition: no units -> no armies');
ok(JSON.stringify(C.partitionArmiesForWars(field, 2)) === JSON.stringify(C.partitionArmiesForWars([...field].reverse(), 2)), 'partition: deterministic');

// 5. Wiring: ai.ts, main.ts i test-hook.ts musza czytac nowe pola (mutacja wiringu -> czerwien).
const aiSrc = fs.readFileSync(path.join(SRC, 'game', 'ai.ts'), 'utf8');
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const hookSrc = fs.readFileSync(path.join(SRC, 'game', 'test-hook.ts'), 'utf8');
ok(/const consolidationPlan = \(\(\) =>/.test(aiSrc) && /isArmyConsolidationEnabled\(\)/.test(aiSrc), 'wiring: ai.ts builds consolidationPlan behind flag');
ok(/pickConsolidationHub\(playerId, myCities, opts\.capitalCityId\)/.test(aiSrc), 'wiring: ai.ts uses capitalCityId for hub');
ok(/consolidationPlan === null\s*\n?\s*&& \(\)|consolidationPlan === null && !\(forcedWarAttack/.test(aiSrc), 'wiring: front-merge disabled when consolidation active');
ok(/capitalCityId: capitalCityIdForOwner\(ownerId\)/.test(mainSrc), 'wiring: main.ts passes capitalCityId');
ok(/warOpponentCount: \[\.\.\.new Set/.test(mainSrc), 'wiring: main.ts passes warOpponentCount');
ok(/armyConsolidation: setArmyConsolidationOverride/.test(hookSrc), 'wiring: test-hook exposes armyConsolidation flag');

C.setArmyConsolidationOverride(null);
try { fs.unlinkSync(entry); } catch (e) { /* ignore */ }
console.log(`army-consolidation-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
