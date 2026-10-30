'use strict';
/**
 * war-rules-multiwar-test.cjs -- R-WEB-WAR-RULES-MULTIWAR-Q1.
 * Uruchamianie z gra/:  node tools/war-rules-multiwar-test.cjs
 * Mutacje: WRM_SRC_DIR=<kopia gra/src z mutacją> node tools/war-rules-multiwar-test.cjs
 *
 * Testuje PRAWDZIWE moduły: game/war-rules-multiwar.ts (R1/R2/R3, wybór zaangażowania W1,
 * przydział grup W2) oraz game/warAllInCapital.ts (planner: W1 engage, W2 podział armii).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.WRM_SRC_DIR ? path.resolve(process.env.WRM_SRC_DIR) : path.resolve(GRA_ROOT, 'src');
const entry = path.resolve(__dirname, '.war-rules-multiwar-entry.ts');
const bundle = path.resolve(__dirname, '.war-rules-multiwar-bundle.cjs');
const J = (p) => JSON.stringify(path.join(SRC, p));
fs.writeFileSync(entry, `
export * from ${J('game/war-rules-multiwar')};
export { planWarAllInCapital, setWarAllInCapitalOverride } from ${J('game/warAllInCapital')};
export { hexDistance, keyOf } from ${J('units/setup')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  const M = require(bundle);
  const dist = M.hexDistance;

  // ---------------------------------------------------------------- R1
  console.log('--- R1: opóźnienie wojen między cywilizacjami do tury 40 ---');
  eq(M.WAR_RULES_PARAMS.delayInterCivWarsUntilTurn, 40, 'R1a parametr z JSON = 40');
  const gate = (over) => M.evaluateInterCivWarGate({
    turn: 50, attackerEra: 2, attackerWarCount: 0, targetIsPlayer: false, targetEra: 2, targetWarCount: 0, ...over,
  });
  eq(gate({ turn: 39 }), 'delay_r1', 'R1b tura 39 blokuje wojnę');
  eq(gate({ turn: 40 }), 'ok', 'R1c tura 40 dopuszcza wojnę');
  eq(gate({ turn: 0 }), 'delay_r1', 'R1d tura 0 blokuje wojnę');

  // ---------------------------------------------------------------- R2
  console.log('--- R2: Kamień -- najwyżej 1 równoczesna wojna na cywilizację ---');
  eq(gate({ attackerEra: 1, attackerWarCount: 0 }), 'ok', 'R2a Kamień, 0 wojen -> dozwolona');
  eq(gate({ attackerEra: 1, attackerWarCount: 1 }), 'stone_limit_attacker_r2', 'R2b Kamień, już 1 wojna -> blokada napastnika');
  eq(gate({ attackerEra: 1, attackerWarCount: 1, targetIsPlayer: true }), 'stone_limit_attacker_r2', 'R2c Kamień, już 1 wojna -> blokada także wobec gracza');
  eq(gate({ attackerEra: 2, attackerWarCount: 3 }), 'ok', 'R2d Brąz, 3 wojny -> dozwolona (brak limitu)');
  eq(gate({ attackerEra: 1, attackerWarCount: 0, targetEra: 1, targetWarCount: 1 }), 'stone_limit_target_r2', 'R2e cel AI w Kamieniu z 1 wojną nie może zostać zmuszony');
  eq(gate({ attackerEra: 1, attackerWarCount: 0, targetIsPlayer: true, targetEra: 1, targetWarCount: 5 }), 'ok', 'R2f gracz jako cel: jego liczba wojen nie blokuje');
  eq(gate({ attackerEra: 2, attackerWarCount: 0, targetEra: 1, targetWarCount: 1 }), 'stone_limit_target_r2', 'R2g cel w Kamieniu blokuje też, gdy napastnik z Brązu');
  eq(gate({ attackerEra: 2, attackerWarCount: 0, targetEra: 2, targetWarCount: 2 }), 'ok', 'R2h cel z Brązu z 2 wojnami -> dozwolona');
  eq(M.WAR_RULES_PARAMS.maxConcurrentWarsFromBronze, null, 'R2i parametr Brązu = null (bez limitu)');

  // ---------------------------------------------------------------- R3
  console.log('--- R3: jedna wojna epoki na epokę w skali świata ---');
  eq(M.forcedEraTagFromPowod('R-EPOKA-KAMIEN-WYMUSZONA-WOJNA: x'), 'stone', 'R3a tag Kamienia z powodu');
  eq(M.forcedEraTagFromPowod('R-EPOKA-BRAZU-WYMUSZONA-WOJNA: x'), 'bronze', 'R3b tag Brązu z powodu');
  eq(M.forcedEraTagFromPowod('R-EPOKA-ZELAZO-WYMUSZONA-WOJNA: x'), 'iron', 'R3c tag Żelaza z powodu');
  eq(M.forcedEraTagFromPowod('wrogie nastawienie'), null, 'R3d zwykła wojna nie jest wojną epoki');
  eq(M.forcedEraTagFromPowod(undefined), null, 'R3e brak powodu -> null');
  const P1 = { ...M.WAR_RULES_PARAMS, maxEraForcedWarsPerEra: 1 };
  eq(M.canDeclareEraForcedWar('stone', new Map(), P1), true, 'R3f pierwsza wojna Kamienia dozwolona');
  eq(M.canDeclareEraForcedWar('stone', new Map([['stone', 1]]), P1), false, 'R3g druga wojna Kamienia w świecie blokowana (limit 1 na epokę)');
  eq(M.canDeclareEraForcedWar('bronze', new Map([['stone', 1]]), P1), true, 'R3h wojna Brązu niezależna od Kamienia (inna epoka)');
  eq(M.canDeclareEraForcedWar('iron', new Map([['bronze', 1], ['stone', 1]]), P1), true, 'R3i wojna Żelaza dozwolona po Kamieniu i Brązie');
  eq(M.canDeclareEraForcedWar('bronze', new Map([['bronze', 1]]), P1), false, 'R3k druga wojna Brązu blokowana');
  eq(M.canDeclareEraForcedWar('stone', new Map([['stone', 1]]), { ...P1, maxEraForcedWarsPerEra: null }), true, 'R3l null = brak limitu');
  // R-WEB-ERA-WAR-COUNTER-Q1: globalny limit wojen epoki ZNIESIONY (null); zastąpiony licznikiem per cywilizacja.
  eq(M.WAR_RULES_PARAMS.maxEraForcedWarsPerEra, null, 'R3j parametr JSON maxEraForcedWarsPerEra = null (R-WEB-ERA-WAR-COUNTER-Q1, globalny limit zniesiony)');
  eq(M.WAR_RULES_PARAMS.maxEraForcedWarsPerCivPerEra, 1, 'R-WEB-ERA-WAR-COUNTER-Q1 parametr maxEraForcedWarsPerCivPerEra = 1');
  eq(JSON.stringify(M.WAR_RULES_PARAMS.enabledForcedWarEras), '["stone"]', 'R-WEB-ERA-WAR-COUNTER-Q1 enabledForcedWarEras = ["stone"]');
  eq(M.evaluateInterCivWarGate({ turn: 50, attackerEra: 1, attackerWarCount: 1, targetIsPlayer: true, targetEra: 1, targetWarCount: 0 }), 'stone_limit_attacker_r2', 'R2 nadal blokuje AI w Kamieniu z 1 wojną (także wobec gracza)');
  eq(M.evaluateInterCivWarGate({ turn: 50, attackerEra: 2, attackerWarCount: 5, targetIsPlayer: false, targetEra: 2, targetWarCount: 5 }), 'ok', 'R2 od Brązu bez limitu');

  // ---------------------------------------------------------------- W1 (wybór)
  console.log('--- W1: wybór najbliższej wrogiej armii w promieniu ---');
  const anchor = { q: 2, r: 5 };
  eq(M.pickEngagementArmy(anchor, [{ q: 8, r: 5, ownerId: 2 }], dist, 10)?.q, 8, 'W1a wróg w promieniu 6 -> wybrany');
  eq(M.pickEngagementArmy(anchor, [{ q: 14, r: 5, ownerId: 2 }], dist, 10), null, 'W1b wróg w odległości 12 > 10 -> brak (marsz na stolicę)');
  const pick = M.pickEngagementArmy(anchor, [
    { q: 9, r: 5, ownerId: 2 }, { q: 6, r: 5, ownerId: 3 }, { q: 6, r: 5, ownerId: 2 },
  ], dist, 10);
  eq(pick && pick.ownerId, 2, 'W1c najbliższy, remis dystansu -> mniejszy ownerId');

  // ---------------------------------------------------------------- W2 (przydział grup)
  console.log('--- W2: podział armii na grupy wg siły wrogów ---');
  const groups = [{ id: 'A', size: 3 }, { id: 'B', size: 2 }, { id: 'C', size: 1 }];
  const alloc = M.allocateGroupsToEnemies(groups, [{ ownerId: 2, strength: 1 }, { ownerId: 3, strength: 3 }]);
  eq(alloc.get('A'), 3, 'W2a najsilniejszy wróg dostaje największą grupę');
  eq(alloc.get('B'), 2, 'W2b słabszy wróg dostaje min. 1 grupę');
  eq(alloc.get('C'), 3, 'W2c pozostała grupa idzie do wroga z największym deficytem');
  const alloc1 = M.allocateGroupsToEnemies([{ id: 'X', size: 4 }], [{ ownerId: 2, strength: 1 }, { ownerId: 3, strength: 1 }]);
  eq(alloc1.size, 1, 'W2d jedna grupa nie jest dzielona (przydział 1 wpis)');
  eq(M.allocateGroupsToEnemies([], [{ ownerId: 2, strength: 1 }]).size, 0, 'W2e brak grup -> pusty przydział');

  // ---------------------------------------------------------------- planner W1/W2
  console.log('--- planner: W1 (engage) i W2 (podział) ---');
  const W = 24;
  const H = 14;
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  const map = { szerokoscQ: W, wysokoscR: H, hexes, seed: 1, riverPaths: [] };
  const nav = (extra = {}) => ({ map, blocked: new Set(), occupied: new Set(), ...extra });
  const unit = (id, q, r) => ({ id, q, r, ruchLeft: 2 });
  const capital2 = [{ ownerId: 2, cityId: 'cap2', q: 20, r: 6 }];

  // Scenariusz 1: 2 jednostki swojej cywilizacji (2,5)-(2,6), wroga armia w (7,5) (odl. 5).
  const my1 = [unit('u1', 2, 5), unit('u2', 2, 6)];
  const base1 = M.planWarAllInCapital(my1, capital2, nav());
  const engaged1 = M.planWarAllInCapital(my1, capital2, nav(), {
    enemyArmies: [{ q: 7, r: 5, ownerId: 2 }], engageRadius: 10,
  });
  const orderOf = (plan, id) => plan.orders.find(o => o.unitId === id);
  const ordU1Base = orderOf(base1, 'u1');
  const ordU1Eng = orderOf(engaged1, 'u1');
  assert(!!ordU1Eng, 'W1d (engage): jednostka dostaje rozkaz ruchu');
  if (ordU1Eng) {
    eq(dist(ordU1Eng.step.q, ordU1Eng.step.r, 7, 5) < dist(2, 5, 7, 5), true, 'W1e (engage): krok zbliża do wrogiej armii');
  }
  if (ordU1Base) {
    eq(ordU1Base.targetCityId, 'cap2', 'W1f (baza bez opts): marsz na stolicę');
  }
  eq(engaged1.orders.every(o => o.mode === 'engage'), true, 'W1g (engage): tryb rozkazów = engage');

  // Scenariusz 2: wroga armia dokładnie obok -> brak kroku W ZAJĘTY heks, grupa stoi (held).
  const my2 = [unit('u1', 6, 5), unit('u2', 6, 6)];
  const adj = M.planWarAllInCapital(my2, capital2, nav({ occupied: new Set(['7,5']) }), {
    enemyArmies: [{ q: 7, r: 5, ownerId: 2 }], engageRadius: 10,
  });
  eq(adj.orders.some(o => o.step.q === 7 && o.step.r === 5), false, 'W1h kontakt: nikt nie wchodzi na heks wroga');
  assert(adj.held.includes('u1'), 'W1i kontakt: jednostka przy wrogu stoi (held), nie maszeruje dalej na stolicę');

  // Scenariusz 3: wroga armia poza promieniem (odl. 12 > 10) -> identyczne rozkazy jak baza.
  const my3 = [unit('u1', 2, 5), unit('u2', 2, 6)];
  const far = M.planWarAllInCapital(my3, capital2, nav(), { enemyArmies: [{ q: 14, r: 5, ownerId: 2 }], engageRadius: 10 });
  const baseSteps = JSON.stringify(M.planWarAllInCapital(my3, capital2, nav()).orders.map(o => [o.unitId, o.step]));
  eq(JSON.stringify(far.orders.map(o => [o.unitId, o.step])), baseSteps, 'W1j poza promieniem: plan = marsz na stolicę (jak baza)');

  // Scenariusz 4 (W2): dwa wrogie państwa, grupy 3/2/1 -- przydział całych grup wg siły.
  const capitals2 = [
    { ownerId: 2, cityId: 'cap2', q: 20, r: 2 },
    { ownerId: 3, cityId: 'cap3', q: 20, r: 10 },
  ];
  const my4 = [
    unit('a1', 2, 1), unit('a2', 2, 2), unit('a3', 3, 1),   // grupa 3 (przy kolumnie 2-3, r 1-2)
    unit('b1', 2, 8), unit('b2', 2, 9),                      // grupa 2
    unit('c1', 2, 13),                                       // grupa 1
  ];
  const plan4 = M.planWarAllInCapital(my4, capitals2, nav(), {
    enemyStrength: [{ ownerId: 2, strength: 1 }, { ownerId: 3, strength: 3 }],
  });
  const tgtOf = (id) => {
    const o = orderOf(plan4, id);
    return o ? o.targetOwnerId : undefined;
  };
  eq(tgtOf('a1'), 3, 'W2e grupa 3 (najsilniejszy wróg) idzie na cel wroga 3');
  eq(tgtOf('a2'), 3, 'W2f cała grupa 3 w tym samym kierunku');
  eq(tgtOf('b1'), 2, 'W2g grupa 2 idzie na wroga 2 (min. 1 grupa)');
  eq(tgtOf('b2'), 2, 'W2h cała grupa 2 na wroga 2');
  eq(tgtOf('c1'), 3, 'W2i grupa 1 idzie do wroga z większym deficytem (3)');
  // Brak opts -> baza: wszystkie na najbliższą stolicę.
  const plan4base = M.planWarAllInCapital(my4, capitals2, nav());
  eq(new Set(plan4base.orders.map(o => o.targetOwnerId)).size >= 1, true, 'W2j baza bez opts działa');

  // Scenariusz 5: opts puste -> identyczny plan (regresja OFF = baza).
  const plan5 = M.planWarAllInCapital(my4, capitals2, nav(), {});
  eq(JSON.stringify(plan5), JSON.stringify(plan4base), 'W2k pusty opts = plan bazowy (bit-identyczny)');

  // Remis: planner deterministyczny (dwa przebiegi).
  const plan4b = M.planWarAllInCapital(my4, capitals2, nav(), {
    enemyStrength: [{ ownerId: 2, strength: 1 }, { ownerId: 3, strength: 3 }],
  });
  eq(JSON.stringify(plan4b), JSON.stringify(plan4), 'W2l determinizm: dwa przebiegi = ten sam plan');

  // Scenariusz 5 (r6, zarzut Evaluatora 4): grupa przydzielona wrogowi 3 NIE walczy z armią
  // wroga 2 leżącą w promieniu. Wróg 3 ma większą siłę -> grupa (2 jedn.) jest jego.
  const capitals3 = [
    { ownerId: 2, cityId: 'cap2', q: 20, r: 2 },
    { ownerId: 3, cityId: 'cap3', q: 20, r: 10 },
  ];
  const strength5 = [{ ownerId: 2, strength: 1 }, { ownerId: 3, strength: 3 }];
  const my5 = [unit('u1', 2, 5), unit('u2', 2, 6)];
  const cross = M.planWarAllInCapital(my5, capitals3, nav(), {
    enemyArmies: [{ q: 7, r: 5, ownerId: 2 }], engageRadius: 10, enemyStrength: strength5,
  });
  eq(cross.orders.length > 0, true, 'W2m: grupa wydaje rozkazy');
  eq(cross.orders.every(o => o.targetOwnerId === 3), true, 'W2m: grupa celuje tylko w przydzielonego wroga 3');
  eq(cross.orders.some(o => o.mode === 'engage'), false, 'W2m: brak walki z armią wroga 2 (poza przydziałem)');
  // Ta sama konfiguracja z armią wroga 3 w promieniu -> walka z NIĄ (przydzielony wróg).
  const own5 = M.planWarAllInCapital(my5, capitals3, nav(), {
    enemyArmies: [{ q: 7, r: 5, ownerId: 2 }, { q: 7, r: 6, ownerId: 3 }], engageRadius: 10, enemyStrength: strength5,
  });
  eq(own5.orders.some(o => o.mode === 'engage' && o.targetOwnerId === 3), true, 'W2n: walka z armią przydzielonego wroga 3');
  eq(own5.orders.some(o => o.targetOwnerId === 2), false, 'W2n: żaden rozkaz nie celuje w wroga 2');
} catch (e) {
  failed++;
  console.error('EXCEPTION:', e && e.stack ? e.stack : e);
} finally {
  for (const f of [entry, bundle]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
}

console.log(`\nWYNIK: ${passed} OK / ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
