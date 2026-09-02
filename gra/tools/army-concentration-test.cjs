'use strict';

/* Independent contract + mutation tests for R-ARMIA-KONCENTRACJA-AI-BARB-Q1. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.army-concentration-entry.ts');
const bundle = path.resolve(__dirname, '.army-concentration-bundle.cjs');
fs.writeFileSync(entry, `
export {
  ARMY_CONCENTRATION_MIN_UNITS, ARMY_CONCENTRATION_RADIUS, ARMY_FRONT_SEPARATION_RADIUS,
  isEligibleForArmyConcentration, planArmyConcentration,
  clusterUnitsByProximity, planArmyFrontMerge,
} from '../src/game/army-concentration';
export { decideAITurn, countThreatFronts, AI_FRONT_DETECTION_VICINITY_HEX } from '../src/game/ai';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const C = require(bundle);
let passed = 0;
let failed = 0;
function ok(value, message) { if (value) passed++; else { failed++; console.error('FAIL:', message); } }
function unit(id, q, r, extra = {}) {
  return { id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...extra };
}

ok(C.ARMY_CONCENTRATION_MIN_UNITS === 3, 'contract: minimum is exactly 3');
ok(C.ARMY_CONCENTRATION_RADIUS === 4, 'contract: radius is exactly 4');

// Contract: 3 within radius 4 qualifies; 3 just outside do not.
const near = [unit('a', 0, 0), unit('b', 4, 0), unit('c', 0, 4)];
const nearPlan = C.planArmyConcentration(1, near);
ok(nearPlan !== null, '3 qualifying units within radius 4 start concentration');
ok(nearPlan && nearPlan.unitIds.length === 3, 'plan uses the actual three-unit roster');
const outside = [unit('a', 0, 0), unit('b', 5, 0), unit('c', 0, 5)];
ok(C.planArmyConcentration(1, outside) === null, '3 units outside radius 4 do not qualify');

// Contract exclusions: civilian, garrison, embarked, besieged, naval raider,
// and native naval combat units never count toward the threshold.
for (const [label, extra] of [
  ['scout', { typeId: 'Zwiadowca', category: 'zwiadowca' }],
  ['civilian', { typeId: 'Osadnik', category: 'osadnik' }],
  ['garrison', { inGarnizon: true }],
  ['embarked', { embarked: true }],
  ['besieged', { oblegaCityId: 'city-1' }],
  ['sea raider', { seaRaider: true }],
  ['native naval', { category: 'galera' }],
]) {
  const candidate = unit('x', 0, 0, extra);
  ok(!C.isEligibleForArmyConcentration(candidate, 1), 'exclusion: ' + label);
  ok(C.planArmyConcentration(1, [candidate, unit('b', 1, 0), unit('c', 0, 1)]) === null,
    'exclusion: ' + label + ' cannot satisfy threshold');
}

// Mutation guard: a unit with no movement is not an active rally candidate;
// changing `ruchLeft > 0` to `>= 0` would fail this assertion.
const exhausted = [unit('a', 0, 0, { ruchLeft: 0 }), unit('b', 1, 0), unit('c', 0, 1)];
ok(C.planArmyConcentration(1, exhausted) === null, 'mutation guard: exhausted unit excluded');

// Determinism and actual-stack gate: the winning point is stable, and a
// physically gathered roster emits no rally movement/deferment.
const tie = [unit('z', 0, 0), unit('a', 1, 0), unit('m', 0, 1)];
const tiePlan = C.planArmyConcentration(1, tie);
ok(tiePlan && tiePlan.rallyPoint.q === 0 && tiePlan.rallyPoint.r === 0,
  'deterministic tie-break chooses lowest q/r anchor');
ok(tiePlan && tiePlan.deferredUnitIds.length === 3, 'spread roster is deferred until physical stack');
const gathered = [unit('a', 2, 2), unit('b', 2, 2), unit('c', 2, 2)];
const gatheredPlan = C.planArmyConcentration(1, gathered);
ok(gatheredPlan && gatheredPlan.moveUnitIds.length === 0, 'physical stack needs no rally move');
ok(gatheredPlan && gatheredPlan.deferredUnitIds.length === 0, 'physical stack is allowed to continue');

// Owner isolation: another owner never joins the roster.
const foreign = unit('foreign', 1, 0, { ownerId: 2 });
ok(C.planArmyConcentration(1, [unit('a', 0, 0), unit('b', 1, 0), foreign]) === null,
  'owner-agnostic planner does not mix owners');

// Integration contract: the real AI planner emits only pathfinding moves for
// the dispersed group and does not emit an attack/ordinary march for those
// units in the same decision pass. This catches a mutation that wires the
// pure planner but forgets the AI turn gate.
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak',
      ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const aiUnits = [unit('ai-a', 1, 1), unit('ai-b', 5, 1), unit('ai-c', 1, 5)];
const aiCommands = C.decideAITurn(
  1, aiUnits, [], makeMap(8, 8),
  { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} },
  { civType: 'grecy' },
);
const aiMoveIds = new Set(aiCommands.filter(c => c.type === 'move').map(c => c.unitId));
ok(aiMoveIds.has('ai-b') && aiMoveIds.has('ai-c') && !aiMoveIds.has('ai-a'),
  'integration: dispersed units move toward one deterministic rally point');
ok(aiCommands.filter(c => c.type === 'attack').length === 0,
  'integration: deferred concentration units do not attack before physical stack');

// ---------------------------------------------------------------------------
// R-AI-KONCENTRACJA-ARMII-WIELE-KLASTROW-Q1 (GOAL pkt 1-2): rozpoznawanie
// frontów zagrożenia + łączenie oddalonych klastrów. Kontrakt jednostek
// clusterUnitsByProximity/planArmyFrontMerge/countThreatFronts poniżej, potem
// ŻYWA symulacja wielu tur silnika AI (decideAITurn wołane po kolei, komendy
// 'move' faktycznie stosowane do pozycji jednostek, ruchLeft resetowany na
// początku każdej tury) — zgodnie z REGUŁĄ PRZECIW SAMOOSZUKIWANIU w dispatchu:
// zakaz uznania kryterium za spełnione na podstawie samego czytania kodu.
// ---------------------------------------------------------------------------

// Contract: clusterUnitsByProximity is connected-components under "within
// radius", not a strict single-anchor-radius group — a chain longer than the
// radius still forms one cluster if consecutive members are close enough.
{
  const chain = [unit('a', 0, 0), unit('b', 4, 0), unit('c', 8, 0)]; // a-b<=4, b-c<=4, a-c=8>4
  const clusters = C.clusterUnitsByProximity(chain, C.ARMY_CONCENTRATION_RADIUS);
  ok(clusters.length === 1 && clusters[0].length === 3,
    'clusterUnitsByProximity: transitive chain (a-b, b-c within radius) forms ONE cluster of 3, not 2');
  const split = [unit('a', 0, 0), unit('b', 9, 0)]; // 9 > 4, no edge
  const splitClusters = C.clusterUnitsByProximity(split, C.ARMY_CONCENTRATION_RADIUS);
  ok(splitClusters.length === 2, 'clusterUnitsByProximity: units beyond radius with no bridge form separate clusters');
}

// Contract: planArmyFrontMerge does nothing when already at/below target.
{
  const twoClusters = [unit('a', 0, 0), unit('b', 1, 0), unit('c', 20, 20)];
  const atTarget = C.planArmyFrontMerge(1, twoClusters, { targetClusterCount: 2 });
  ok(atTarget === null, 'planArmyFrontMerge: 2 actual clusters, target 2 -> no merge (null)');
  const belowTarget = C.planArmyFrontMerge(1, twoClusters, { targetClusterCount: 3 });
  ok(belowTarget === null, 'planArmyFrontMerge: 2 actual clusters, target 3 (more slack than clusters) -> no merge');
}

// Contract: excess cluster marches toward the biggest kept anchor, not just any.
{
  const big = [unit('b1', 0, 0), unit('b2', 1, 0), unit('b3', 0, 1)]; // size 3 at ~(0,0)
  const small = [unit('s1', 30, 0)]; // size 1, far away
  const plan = C.planArmyFrontMerge(1, [...big, ...small], { targetClusterCount: 1 });
  ok(plan !== null, 'planArmyFrontMerge: 2 clusters (size 3 vs 1), target 1 -> merge plan produced');
  ok(plan && plan.moveOrders.length === 1 && plan.moveOrders[0].unitId === 's1',
    'planArmyFrontMerge: only the smaller (excess) cluster gets a march order, the bigger anchor stays put');
  ok(plan && plan.deferredUnitIds.length === 1 && plan.deferredUnitIds[0] === 's1',
    'planArmyFrontMerge: excess unit is deferred (skips ordinary combat/march logic this turn)');
  ok(plan && plan.moveOrders[0].towardQ === 0 && plan.moveOrders[0].towardR === 0,
    'planArmyFrontMerge: excess unit marches toward the bigger anchor\'s centroid, not an arbitrary point');
}

// Contract: a preferred anchor (e.g. this turn's planArmyConcentration pick)
// outweighs a same-size movable cluster and pulls the OTHER excess toward it.
{
  const clusterA = [unit('a1', 0, 0), unit('a2', 1, 0)]; // size 2
  const clusterB = [unit('b1', 40, 0), unit('b2', 41, 0)]; // size 2, far away
  const plan = C.planArmyFrontMerge(1, [...clusterA, ...clusterB], {
    targetClusterCount: 1,
    preferredAnchors: [{ q: 100, r: 100, weight: 10 }], // outweighs both movable clusters
  });
  ok(plan !== null, 'planArmyFrontMerge: preferred anchor present, 2 movable clusters, target 1 -> merge plan');
  ok(plan && plan.moveOrders.every(o => o.towardQ === 100 && o.towardR === 100),
    'planArmyFrontMerge: with a heavier preferred anchor, BOTH movable clusters march toward it, not toward each other');
  ok(plan && plan.moveOrders.length === 4, 'planArmyFrontMerge: all 4 units from both excess clusters get march orders');
}

// Contract: countThreatFronts groups engageable enemy units near own
// territory/army; distinct clusters count as distinct fronts.
{
  const myCities = [];
  const myUnits = [unit('home', 0, 0)];
  const oneFrontEnemies = [unit('e1', 3, 0, { ownerId: 2 }), unit('e2', 4, 0, { ownerId: 2 })];
  ok(C.countThreatFronts(oneFrontEnemies, myCities, myUnits, { szerokoscQ: 100, wysokoscR: 100 }) === 1,
    'countThreatFronts: one nearby enemy cluster -> 1 front');
  const twoFrontEnemies = [
    unit('e1', 3, 0, { ownerId: 2 }), unit('e2', 4, 0, { ownerId: 2 }),
    unit('e3', -3, 6, { ownerId: 2 }), unit('e4', -4, 6, { ownerId: 2 }),
  ];
  ok(C.countThreatFronts(twoFrontEnemies, myCities, myUnits, { szerokoscQ: 100, wysokoscR: 100 }) === 2,
    'countThreatFronts: two enemy clusters far apart from each other -> 2 fronts');
  const farAwayEnemies = [unit('e1', 90, 90, { ownerId: 2 }), unit('e2', 91, 90, { ownerId: 2 })];
  ok(C.countThreatFronts(farAwayEnemies, myCities, myUnits, { szerokoscQ: 100, wysokoscR: 100 }) === 0,
    'countThreatFronts: enemy cluster far outside detection vicinity -> 0 fronts (treated as "no real threat")');
  ok(C.countThreatFronts([], myCities, myUnits, { szerokoscQ: 100, wysokoscR: 100 }) === 0,
    'countThreatFronts: no enemy units at all -> 0 fronts');
}

// ---------------------------------------------------------------------------
// Live multi-turn simulation harness — reused by all three scenarios below.
// Mirrors the engine contract: decideAITurn returns commands, the CALLER
// applies them (this harness applies only 'move', one step per unit per
// turn — exactly what firstStep() computes), then movement resets for the
// next turn. No hand math substitutes for this: every measurement below
// comes from actually running decideAITurn N times.
// ---------------------------------------------------------------------------
function bigMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak',
      ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const testData = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };

function runTurns(myUnits, cities, map, nTurns) {
  const history = [];
  for (let t = 0; t < nTurns; t++) {
    for (const u of myUnits) u.ruchLeft = u.ruch;
    const allUnits = [...myUnits, ...(cities.enemyUnits ?? [])];
    const cmds = C.decideAITurn(1, allUnits, cities.list ?? [], map, testData, { civType: 'grecy' });
    for (const cmd of cmds) {
      if (cmd.type !== 'move') continue;
      const u = myUnits.find(x => x.id === cmd.unitId);
      if (u === undefined) continue; // enemy/other-owner unit, not moved by this harness
      u.q = cmd.toQ;
      u.r = cmd.toR;
    }
    const maxCluster = Math.max(...C.clusterUnitsByProximity(myUnits, C.ARMY_CONCENTRATION_RADIUS).map(g => g.length));
    history.push(maxCluster);
  }
  return history;
}

// ---------------------------------------------------------------------------
// SCENARIO 1 (kryterium końca 1): 3 małe, ODDALONE (>4 heksy między sobą)
// grupy po 2 jednostki, BRAK zagrożenia w polu (0 frontów) -> PO kilku turach
// jednostki realnie zbliżają się / łączą (rosnąca max liczba AI na wspólnym
// heksie/w promieniu koncentracji tura 1 -> tura N), bez regresji zachowania
// pojedynczego klastra (sprawdzone osobno wyżej i w istniejących testach).
// ---------------------------------------------------------------------------
{
  const scenario1Units = [
    unit('g1a', 0, 0), unit('g1b', 1, 0),
    unit('g2a', 20, 0), unit('g2b', 21, 0),
    unit('g3a', 0, 20), unit('g3b', 1, 20),
  ];
  // 16 tur: przy starcie ~20 heksów między grupami i ruch=2/turę, faktyczna
  // (żywo zmierzona) zbieżność do jednego klastra kończy się na turze 15 —
  // patrz przebieg zmierzony w tym pliku; 16 daje 1 turę zapasu, nie jest
  // dobrane "pod odpowiedź".
  const history = runTurns(scenario1Units, { list: [], enemyUnits: [] }, bigMap(40, 40), 16);
  ok(history[0] === 2, 'scenario 1 (3 rozdrobnione grupy, 0 frontów), tura 1: max klaster = 2 (grupy startowe, jeszcze rozdrobnione)');
  ok(history[history.length - 1] > history[0],
    `scenario 1, żywa symulacja 16 tur: max klaster ROSNĄCY od tury 1 (${history[0]}) do tury 16 (${history[history.length - 1]}) — jednostki realnie się zbliżają/łączą`);
  ok(history[history.length - 1] >= 6,
    `scenario 1: po 16 turach WSZYSTKIE 6 jednostek trafia do jednego klastra (dostano max=${history[history.length - 1]}) — trzy oddalone grupy łączą się w jedną dużą armię, zgodnie z GOAL pkt 1 ("brak zagrożenia -> dąż do JEDNEJ dużej armii")`);
  let monotonic = true;
  for (let i = 1; i < history.length; i++) if (history[i] < history[i - 1]) monotonic = false;
  ok(monotonic, `scenario 1: max klaster nigdy nie MALEJE między turami (przebieg: ${history.join(',')}) — koncentracja nie rozprasza już zebranych jednostek`);
}

// ---------------------------------------------------------------------------
// SCENARIO 2 (kryterium końca 2): DWA wyraźnie odrębne fronty zagrożenia
// (wrogie jednostki w dwóch odległych miejscach) -> AI utrzymuje/tworzy DWIE
// osobne grupy odpowiadające na oba fronty, NIE łączy ich sztucznie w jedną.
// Weryfikuje, że GOAL pkt 1 realnie OGRANICZA łączenie z GOAL pkt 2 — bez
// tego testu punkt 2 mógłby "działać" tylko dlatego, że nic go nie hamuje.
// ---------------------------------------------------------------------------
{
  const scenario2Units = [
    unit('n1a', 0, 0), unit('n1b', 1, 0), // klaster przy froncie 1
    unit('n2a', 0, 40), unit('n2b', 1, 40), // klaster przy froncie 2, daleko od 1. (dystans ~40 >> radius)
  ];
  const enemyFront1 = [unit('ef1a', 4, 0, { ownerId: 2 }), unit('ef1b', 5, 0, { ownerId: 2 })];
  const enemyFront2 = [unit('ef2a', 4, 40, { ownerId: 2 }), unit('ef2b', 5, 40, { ownerId: 2 })];
  const map2 = bigMap(50, 50);
  const allEnemies = [...enemyFront1, ...enemyFront2];
  // Własna pętla (nie wspólny runTurns) — potrzebujemy PRZYNALEŻNOŚCI jednostek
  // do klastra w każdej turze, nie tylko jego rozmiaru. Uwaga metodologiczna:
  // jednostki n1* zaczynają w zasięgu ataku frontu 1 i naturalnie WCHODZĄ w
  // walkę z ef1* (istniejąca, niezmieniana logika "zaangażuj wroga" w ai.ts) —
  // to legalnie rozsuwa n1a/n1b na turę, NIE jest to regresja koncentracji.
  // Właściwy niezmiennik kryterium 2 to: żaden klaster w CAŁEJ symulacji nie
  // miesza jednostek frontu 1 z jednostkami frontu 2 (front-merge nie ciągnie
  // przez fronty), zweryfikowane niżej po nazwie jednostki (prefiks n1/n2).
  let everCrossFrontCluster = false;
  const clusterSizeHistory = [];
  for (let t = 0; t < 10; t++) {
    for (const u of scenario2Units) u.ruchLeft = u.ruch;
    const allUnits = [...scenario2Units, ...allEnemies];
    const cmds = C.decideAITurn(1, allUnits, [], map2, testData, { civType: 'grecy' });
    for (const cmd of cmds) {
      if (cmd.type !== 'move') continue;
      const u = scenario2Units.find(x => x.id === cmd.unitId);
      if (u === undefined) continue;
      u.q = cmd.toQ; u.r = cmd.toR;
    }
    const clusters = C.clusterUnitsByProximity(scenario2Units, C.ARMY_CONCENTRATION_RADIUS);
    clusterSizeHistory.push(Math.max(...clusters.map(g => g.length)));
    for (const group of clusters) {
      const hasFront1 = group.some(u => u.id.startsWith('n1'));
      const hasFront2 = group.some(u => u.id.startsWith('n2'));
      if (hasFront1 && hasFront2) everCrossFrontCluster = true;
    }
  }
  ok(!everCrossFrontCluster,
    `scenario 2, żywa symulacja 10 tur, DWA fronty: ŻADEN klaster nigdy nie łączy jednostek frontu 1 (n1*) z frontem 2 (n2*) (przebieg maks. rozmiaru klastra: ${clusterSizeHistory.join(',')}) — front-merge nie ciągnie przez fronty mimo istnienia >2 faktycznych klastrów w trakcie walki`);
  ok(scenario2Units.find(u => u.id === 'n1a').r < 10 && scenario2Units.find(u => u.id === 'n2a').r > 30,
    'scenario 2: po 10 turach obie grupy nadal przy SWOICH frontach (front 1 blisko r=0, front 2 blisko r=40) — żadna nie została odciągnięta w stronę drugiej');
}

// ---------------------------------------------------------------------------
// SCENARIO 3 (kryterium końca 3): żywy dowód braku regresji — obrona miasta
// pod bezpośrednim atakiem (homeDefenderAssignments) działa identycznie jak
// dziś: obrońca NIE zostaje odciągnięty do zbiórki/łączenia kosztem obrony.
// ---------------------------------------------------------------------------
{
  const city = { id: 'city-1', ownerId: 1, q: 10, r: 10, name: 'Test', population: 5 };
  // Trzy jednostki oddalonych "sojuszników" gdzie indziej na mapie (dają >=3
  // klastry, żeby front-merge miało w ogóle co robić), plus jedna jednostka
  // TUŻ PRZY mieście, obok wroga sąsiadującego bezpośrednio z miastem
  // (dystans 1 -> homeDefenseThreat niezależnie od formuły promienia).
  const defender = unit('defender', 11, 10); // adjacent to city (10,10)
  const enemyAtGate = unit('raider', 12, 10, { ownerId: 2 }); // adjacent to city, further than attack range from defender
  const farAllies = [
    unit('far1', 0, 0), unit('far2', 1, 0),
    unit('far3', 0, 30), unit('far4', 1, 30),
  ];
  const myUnits = [defender, ...farAllies];
  const allUnits = [...myUnits, enemyAtGate];
  for (const u of myUnits) u.ruchLeft = u.ruch;
  const cmds = C.decideAITurn(1, allUnits, [city], bigMap(40, 40), testData, { civType: 'grecy' });
  const defenderCmd = cmds.find(c => c.unitId === 'defender');
  ok(defenderCmd !== undefined, 'scenario 3: defender obok bezpośredniego zagrożenia miasta dostaje polecenie tej tury (nie zostaje bez rozkazu)');
  ok(defenderCmd !== undefined && !(defenderCmd.type === 'move' && (defenderCmd.toQ !== 12 || defenderCmd.toR !== 10) && defenderCmd.toQ !== undefined && Math.abs(defenderCmd.toQ - 10) + Math.abs(defenderCmd.toR - 10) > 3),
    'scenario 3: defender NIE dostaje polecenia marszu w stronę odległego klastra sojuszników (nie jest odciągnięty od obrony miasta przez front-merge/koncentrację)');
  const farMoveIds = new Set(cmds.filter(c => c.type === 'move').map(c => c.unitId));
  ok(!farMoveIds.has('defender') || (() => {
    const d = defenderCmd;
    return d.type === 'attack' || (Math.abs(d.toQ - 11) <= 1 && Math.abs(d.toR - 10) <= 1);
  })(),
    'scenario 3: jeśli defender dostaje ruch, to lokalny (w stronę zagrożenia przy mieście), nie odległy marsz koncentracji/front-merge');
}

console.log(`army-concentration-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
process.exit(failed === 0 ? 0 : 1);
