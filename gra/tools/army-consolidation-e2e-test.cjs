'use strict';
/*
 * R-WEB-ARMY-CONSOLIDATION-Q1 -- test end-to-end decideAITurn z flaga ON (zarzut Evaluatora 2).
 * Uruchomienie: node tools/army-consolidation-e2e-test.cjs (z katalogu gra/).
 * Prawdziwe decideAITurn + petla tur z war-allin-capital-harness.cjs (wykonuje ruchy).
 * Sprawdza: w POKOJU jednostki faktycznie dochodza do stolicy (limit na heks) i sie scalaja;
 * w WOJNIE bez celow W flaga ON nie zmienia zachowania; w WOJNIE z celami dwoch wrogow armie
 * dziela sie na dwa marsze (liczba armii = liczba wojen).
 * ARMY_E2E_SRC (opcjonalnie) = katalog src do testu mutacji (kopia z zepsutym ai.ts).
 */
const path = require('path');
const H = require('./war-allin-capital-harness.cjs');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

const srcDir = process.env.ARMY_E2E_SRC ? path.resolve(process.env.ARMY_E2E_SRC) : null;
const E = H.loadEngine(srcDir, 'army-e2e');

// Mapa 24x12, stolica AI 1 = c1a (5,5); drugie miasto c1b (10,5); wrog 2 w (20,5); wrog 3 w (20,9).
function scenarioPeace() {
  const map = H.makeMap(24, 12);
  const units = [];
  const spots = [[2, 3], [3, 4], [2, 5], [3, 2], [4, 3], [1, 4], [2, 6], [4, 5], [6, 3], [7, 4], [8, 5], [6, 6], [3, 6], [5, 2]];
  spots.forEach(([q, r], i) => units.push(H.mkUnit(`w${i}`, 1, q, r)));
  const cities = [H.mkCity('c1a', 1, 5, 5, 8), H.mkCity('c1b', 1, 10, 5, 5), H.mkCity('c2a', 2, 20, 5, 8), H.mkCity('c3a', 3, 20, 9, 8)];
  return { map, units, cities, wars: new Set(), aiOwners: [1], humanOwners: [0], barbs: false };
}

function atHex(st, q, r, owner = 1) {
  return st.units.filter(u => u.ownerId === owner && u.hp > 0 && u.q === q && u.r === r).length;
}

// 1. POKOJ, flaga ON: zbiorka w stolicy. Po 15 turach wszyscy w stolicy albo w miescie zapasowym.
{
  E.setArmyConsolidationOverride(true);
  const st = scenarioPeace();
  H.simulate(st, { engine: E, flag: false, fog: false, turns: 15, consolidation: true });
  const alive = st.units.filter(u => u.ownerId === 1 && u.hp > 0);
  const inRally = alive.filter(u => (u.q === 5 && u.r === 5) || (u.q === 10 && u.r === 5)).length;
  const atCap = atHex(st, 5, 5);
  assert(inRally === alive.length, `E1 POKOJ ON: wszystkie jednostki w stolicy/miescie zapasowym (${inRally}/${alive.length})`);
  assert(atCap === E.ARMY_CONSOLIDATION_MAX_PER_HEX, `E2 POKOJ ON: stolica pelna do limitu ${E.ARMY_CONSOLIDATION_MAX_PER_HEX} (${atCap})`);
  const heksy = new Set(alive.map(u => `${u.q},${u.r}`)).size;
  assert(heksy <= 2, `E3 POKOJ ON: co najwyzej 2 niepuste heksy (${heksy})`);
  E.setArmyConsolidationOverride(null);
}

// 2. POKOJ, flaga OFF (kontrast): ten sam start nie zbiera sie w stolicy w tym samym czasie.
{
  E.setArmyConsolidationOverride(false);
  const st = scenarioPeace();
  H.simulate(st, { engine: E, flag: false, fog: false, turns: 15, consolidation: true });
  const atCap = atHex(st, 5, 5);
  assert(atCap < E.ARMY_CONSOLIDATION_MAX_PER_HEX, `E4 POKOJ OFF: brak pelnej zbiorki w stolicy (${atCap}) -- kontrast`);
  E.setArmyConsolidationOverride(null);
}

// 3. WOJNA bez celow W (warAllIn wylaczone): flaga ON == flaga OFF (zadnej zbiorki w pokoju w wojnie).
{
  const decide = (flag) => {
    E.setArmyConsolidationOverride(flag);
    const st = scenarioPeace();
    st.wars = new Set(['1_2']);
    const opts = { canEngageOwner: (t) => t === 2, currentTurn: 10, visibleHexes: new Set(), capitalCityId: 'c1a', atWarWithCiv: true };
    const cmds = E.decideAITurn(1, st.units, st.cities, st.map, H.DATA, opts);
    E.setArmyConsolidationOverride(null);
    return JSON.stringify(cmds.map(c => [c.type, c.unitId, c.toQ, c.toR, c.targetUnitId]));
  };
  assert(decide(true) === decide(false), 'E5 WOJNA bez W: flaga ON daje te same rozkazy co OFF');
}

// 4. WOJNA z celami W (dwie wojny): armie dziela sie na dwa marsze -> dwie rozne stolice wroga.
{
  E.setArmyConsolidationOverride(true);
  E.setWarAllInCapitalOverride(true);
  const st = scenarioPeace();
  st.wars = new Set(['1_2', '1_3']);
  const targets = [{ ownerId: 2, cityId: 'c2a', q: 20, r: 5 }, { ownerId: 3, cityId: 'c3a', q: 20, r: 9 }];
  const cmds = E.decideAITurn(1, st.units, st.cities, st.map, H.DATA, {
    canEngageOwner: (t) => t === 2 || t === 3, currentTurn: 10, visibleHexes: new Set(),
    warAllIn: { targets }, capitalCityId: 'c1a', atWarWithCiv: true,
  });
  const cities = new Set(cmds.filter(c => c.type === 'move' && c.targetCityId).map(c => c.targetCityId));
  assert(cities.has('c2a') && cities.has('c3a'), `E6 WOJNA 2 wrogow: armie marsza na obie stolice (${[...cities].join(',')})`);
  E.setWarAllInCapitalOverride(null);
  E.setArmyConsolidationOverride(null);
}

console.log(`army-consolidation e2e: ${passed} passed / ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
