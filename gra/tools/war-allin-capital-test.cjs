'use strict';
/**
 * war-allin-capital-test.cjs -- R-WEB-WAR-ALLIN-CAPITAL-Q1 (TYMCZASOWA zasada wojny).
 * Uruchom z gra/:  node tools/war-allin-capital-test.cjs
 *
 * Headless: PRAWDZIWE decideAITurn / decideBarbarianMoves / planWarAllInCapital + zastepczy
 * silnik krokowy (war-allin-capital-harness.cjs). main.ts nie jest uruchamialny headless --
 * jego okablowanie pokrywaja tylko testy statyczne (sekcja 9) i smoke przegladarkowy.
 * Baza do porownania flagi OFF: drzewo origin/main (git archive) -- jesli niedostepne, sekcja 6 SKIP.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const H = require('./war-allin-capital-harness.cjs');
const S = require('./war-allin-capital-scenarios.cjs');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const E = H.loadEngine(null, 'test');
const dist = E.hexDistance;
const TURNS = 90;
const run = (name, flag, extra = {}) => {
  const st = S[name]();
  const stats = H.simulate(st, { engine: E, flag, fog: true, turns: TURNS, ...extra });
  return { st, stats, hash: H.stateHash(st) };
};

// ---------------------------------------------------------------------------
// Referencje (R-WEB-AI-MOVE-RANGE-Q1 r3, HEAD po zmianie zasiegu ruchu).
const REF_AI_OFF_BATTLES = 3;
const REF_OFF = {
  aiVsAi: 'd7316c5be9bffe39', aiVsPlayer: '83f07f345643f6fb', barbarians: 'c07e60985cb8a2ab', noLandPath: '69d49bd592471e58',
};
// Baza origin/main fcd86933 = PRZED zmiana zasiegu ruchu (tylko wprowadzenie reguly wojny).
// Na tej bazie sekcja 6 byla juz czerwona (6a, 6b x4, 6c) -- zob. dyspozycje/autobot/runs/R-WEB-AI-MOVE-RANGE-Q1/.
const REF_BASE_PRE_RANGE = {
  aiVsAi: '49f36d28989cf940', aiVsPlayer: '22a63c096e698720', barbarians: '65542d56510bcef9', noLandPath: '176b6b39e9773451',
};

console.log('\n--- 1: AI<->AI, PRZED (flaga OFF) vs PO (flaga ON) ---');
const aiOff = run('aiVsAi', false);
const aiOn = run('aiVsAi', true);
// R-WEB-AI-MOVE-RANGE-Q1 r3: AI idzie pelnym zasiegiem takze przy fladze OFF (zamierzona zmiana),
// wiec PRZED ma bitwy. Referencja zmierzona na HEAD (nie 0 jak przy 1 heksie).
eq(aiOff.stats.battles, REF_AI_OFF_BATTLES, `1a PRZED: bitwy = referencja ${REF_AI_OFF_BATTLES} (pelny zasieg AI, R-WEB-AI-MOVE-RANGE-Q1)`);
eq(aiOff.stats.captures, 0, '1b PRZED: zero przejec miast');
assert(aiOn.stats.battles > 0, `1c PO: dochodzi do bitew (${aiOn.stats.battles})`);
assert(aiOn.stats.captures > 0, `1d PO: dochodzi do przejec stolic/miast (${aiOn.stats.captures})`);
eq(aiOn.stats.cmdsForForeignUnits, 0, '1e PO: AI nie wydaje komend cudzym jednostkom');

// Pierwsza tura: KAZDA jednostka bojowa dostaje dokladnie jeden ruch w strone stolicy wroga.
{
  const st = S.aiVsAi();
  E.setWarAllInCapitalOverride(true);
  for (const owner of [1, 2]) {
    const targets = [{ ownerId: 3 - owner, cityId: owner === 1 ? 'c2a' : 'c1a', q: owner === 1 ? 34 : 5, r: 10 }];
    const cmds = E.decideAITurn(owner, st.units, st.cities, st.map, H.DATA, {
      canEngageOwner: (t) => t === 3 - owner, currentTurn: 1, visibleHexes: new Set(), warAllIn: { targets },
    });
    const mil = st.units.filter(u => u.ownerId === owner && !E.isCivilianUnit(u));
    let toward = 0;
    let multi = 0;
    for (const u of mil) {
      const mv = cmds.filter(c => c.type === 'move' && c.unitId === u.id);
      if (mv.length > 1) multi++;
      if (mv.length === 1) {
        const before = dist(u.q, u.r, targets[0].q, targets[0].r);
        const after = dist(mv[0].toQ, mv[0].toR, targets[0].q, targets[0].r);
        // marsz na stolice ALBO dolaczenie do grupy (rendezvous) -- w kazdym razie ruch bojowy
        if (after < before || mv[0].targetCityId === targets[0].cityId) toward++;
      }
    }
    eq(multi, 0, `1f owner ${owner}: zadna jednostka nie dostaje 2 ruchow`);
    eq(mil.length, 8, `1g owner ${owner}: 8 jednostek bojowych`);
    // Zbiorka: wieksza grupa swiadomie CZEKA na doganiajace ja male grupy (sekcja 10), wiec w
    // pierwszej turze nie kazda jednostka sie rusza -- ale kazdy wydany ruch jest ku stolicy/grupie.
    const movers = mil.filter(u => cmds.some(c => c.type === 'move' && c.unitId === u.id)).length;
    eq(toward, movers, `1h owner ${owner}: kazdy wydany ruch zmierza ku stolicy/grupie (${toward}/${movers})`);
    assert(movers >= 2, `1h2 owner ${owner}: doganiajace grupy ruszaja od 1. tury (${movers})`);
  }
}

// Laczenie w grupy: liczba grup (lancuch <=3 hex) maleje, cala armia zmierza do stolicy.
{
  const clusters = (st, owner) => {
    const us = st.units.filter(u => u.ownerId === owner && !E.isCivilianUnit(u) && u.hp > 0);
    const seen = new Set();
    let n = 0;
    for (const u of us) {
      if (seen.has(u.id)) continue;
      n++;
      const stack = [u];
      seen.add(u.id);
      while (stack.length) {
        const x = stack.pop();
        for (const y of us) if (!seen.has(y.id) && dist(x.q, x.r, y.q, y.r) <= 3) { seen.add(y.id); stack.push(y); }
      }
    }
    return n;
  };
  const st = S.aiVsAi();
  const initial = clusters(st, 1);
  let atTurn8 = null;
  H.simulate(st, { engine: E, flag: true, fog: true, turns: 8, onTurn: (t, s) => { if (t === 8) atTurn8 = clusters(s, 1); } });
  assert(initial >= 3, `1i start: armia AI 1 rozproszona (${initial} grup)`);
  assert(atTurn8 !== null && atTurn8 < initial, `1j po 8 turach mniej grup niz na starcie (${initial} -> ${atTurn8})`);
}

{
  // Bezczynnosc ograniczona: w 20 turach >= 70% jednostko-tur to ruch (zbiorka trwa kilka tur).
  const st = S.aiVsAi();
  const s20 = H.simulate(st, { engine: E, flag: true, fog: true, turns: 20 });
  assert(s20.cmdMoves >= 0.7 * 16 * 20, `1k w 20 turach >=70% jednostko-tur to ruch (${s20.cmdMoves}/${16 * 20})`);
}

// ---------------------------------------------------------------------------
console.log('\n--- 2: AI -> GRACZ; gracz bez automatycznych rozkazow; zmiana stolicy ---');
const plOff = run('aiVsPlayer', false);
const plOn = run('aiVsPlayer', true);
eq(plOff.stats.captures, 0, '2a PRZED: AI nie zdobywa miast gracza');
assert(plOn.stats.captures >= 2, `2b PO: AI zdobywa stolice gracza i (po zmianie stolicy) kolejne miasto (${plOn.stats.captures})`);
{
  const log = plOn.stats.log;
  const iA = log.indexOf('captured c0a by 1');
  const iB = log.indexOf('captured c0b by 1');
  assert(iA >= 0 && iB > iA, `2c stolica c0a zdobyta przed c0b (przekierowanie na nowa stolice): ${log.join(' | ')}`);
}
eq(plOn.stats.humanUnitMoves, 0, '2d gracz: zero komend ruchu/ataku dla jego jednostek');
eq(plOn.stats.cmdsForForeignUnits, 0, '2e AI nie wydaje komend jednostkom gracza');
{
  const st0 = S.aiVsPlayer();
  const E1 = E;
  E1.setWarAllInCapitalOverride(true);
  const cmds = E1.decideAITurn(1, st0.units, st0.cities, st0.map, H.DATA, {
    canEngageOwner: (t) => t === 0, currentTurn: 1, visibleHexes: new Set(),
    warAllIn: { targets: [{ ownerId: 0, cityId: 'c0a', q: 34, r: 10 }] },
  });
  const playerIds = new Set(st0.units.filter(u => u.ownerId === 0).map(u => u.id));
  assert(!cmds.some(c => c.unitId !== undefined && playerIds.has(c.unitId)), '2f decideAITurn: zadna komenda nie dotyczy jednostek gracza');
}
{
  const pu0 = S.aiVsPlayer().units.filter(u => u.ownerId === 0).map(u => `${u.id}@${u.q},${u.r}`).join(';');
  const pu1 = plOn.st.units.filter(u => u.ownerId === 0 && u.hp > 0).map(u => `${u.id}@${u.q},${u.r}`).join(';');
  // gracz moze stracic jednostki w bitwach, ale zywe nie zmieniaja pozycji
  const alive = pu1.split(';').filter(Boolean);
  assert(alive.every(x => pu0.includes(x)), '2g jednostki gracza zachowaly pozycje startowe');
}

// ---------------------------------------------------------------------------
console.log('\n--- 3: barbarzyncy -> NAJBLIZSZA stolica ---');
const bOff = run('barbarians', false);
const bOn = run('barbarians', true);
eq(bOff.stats.captures, 0, '3a PRZED: barbarzyncy stoja (poza zasiegiem aggro) -- zero przejec');
assert(bOn.stats.captures > 0, `3b PO: barbarzyncy dochodza do stolic (${bOn.stats.captures})`);
{
  // Barbarzynca przy NIE-stolicy c1b (7,6): stara logika gonilaby c1b; nowa idzie na stolice c1a (5,10),
  // choc stolica gracza c0a (34,10) jest daleko.
  const st = S.barbarians();
  st.units = [{ id: 'zb', ownerId: -1, typeId: 'Wojownik', category: 'miecznik', q: 9, r: 3, ruch: 2, ruchLeft: 2, hp: 3 },
    { id: 'p0', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 33, r: 10, ruch: 2, ruchLeft: 2, hp: 3 }];
  E.setWarAllInCapitalOverride(true);
  const targets = [
    { ownerId: 1, cityId: 'c1a', q: 5, r: 10 },
    { ownerId: 0, cityId: 'c0a', q: 34, r: 10 },
  ];
  const barb = st.units.filter(u => u.ownerId === -1);
  const cmds = E.decideBarbarianMoves(barb, st.units.filter(u => u.ownerId !== -1), st.cities, [], st.map,
    E.FALLBACK_BARB_PARAMS, () => true, 'normal', 1, { targets });
  const mv = cmds.find(c => c.type === 'move' && c.unitId === 'zb');
  assert(mv !== undefined, '3c barbarzynca dostaje ruch');
  if (mv) {
    assert(dist(mv.toQ, mv.toR, 5, 10) < dist(9, 3, 5, 10), '3d krok zmniejsza dystans do NAJBLIZSZEJ stolicy c1a');
  }
  // Wojna tylko z owner 0 (engage) => cel = stolica gracza, mimo ze stolica c1a jest bliżej.
  const cmds2 = E.decideBarbarianMoves(barb, st.units.filter(u => u.ownerId !== -1), st.cities, [], st.map,
    E.FALLBACK_BARB_PARAMS, (t) => t === 0, 'normal', 1, { targets });
  const mv2 = cmds2.find(c => c.type === 'move' && c.unitId === 'zb');
  assert(mv2 !== undefined && dist(mv2.toQ, mv2.toR, 34, 10) < dist(9, 3, 34, 10),
    '3e wojna tylko z graczem: cel = stolica gracza');
  // Stolica nie bedaca "pierwszym miastem": ownera 1 przenosi stolice do c1b -> cel c1b (7,6).
  const targets3 = [{ ownerId: 1, cityId: 'c1b', q: 7, r: 6 }, { ownerId: 0, cityId: 'c0a', q: 34, r: 10 }];
  const cmds3 = E.decideBarbarianMoves(barb, st.units.filter(u => u.ownerId !== -1), st.cities, [], st.map,
    E.FALLBACK_BARB_PARAMS, () => true, 'normal', 1, { targets: targets3 });
  const mv3 = cmds3.find(c => c.type === 'move' && c.unitId === 'zb');
  assert(mv3 !== undefined && dist(mv3.toQ, mv3.toR, 7, 6) < dist(9, 3, 7, 6), '3f zmiana stolicy -> przekierowanie na nowa stolice');
  // Garnizon w WLASNYM miescie barbarzynskim zostaje.
  const stG = S.barbarians();
  stG.cities.push({ id: 'bc', ownerId: -1, q: 20, r: 10, name: 'bc', population: 3 });
  const garr = { id: 'gar', ownerId: -1, typeId: 'Wojownik', category: 'miecznik', q: 20, r: 10, ruch: 2, ruchLeft: 2, hp: 3 };
  const cmdsG = E.decideBarbarianMoves([garr], [], stG.cities, [], stG.map, E.FALLBACK_BARB_PARAMS, () => true, 'normal', 1, { targets });
  assert(!cmdsG.some(c => c.unitId === 'gar' && c.type === 'move' && c.toQ < 20), '3g garnizon we wlasnym miescie barbarzynskim nie wychodzi na marsz');
}

// ---------------------------------------------------------------------------
console.log('\n--- 4: brak sciezki ladowej (morze) -- bez zawieszenia, jednostki zostaja ---');
{
  const t0 = Date.now();
  const nl = run('noLandPath', true, { turns: TURNS });
  assert(Date.now() - t0 < 20000, `4a symulacja konczy sie szybko (${Date.now() - t0} ms)`);
  eq(nl.stats.captures, 0, '4b zero przejec przez morze');
  // Po ustabilizowaniu nie ma ruchu w nieskonczonosc (brak oscylacji): ruchy w ostatnich 10 turach.
  const st = S.noLandPath();
  let movesBefore = 0;
  let movesLast10 = 0;
  H.simulate(st, { engine: E, flag: true, fog: true, turns: 30, onTurn: (t, _s, ss) => {
    if (t === 20) movesBefore = ss.cmdMoves;
    if (t === 30) movesLast10 = ss.cmdMoves - movesBefore;
  } });
  eq(movesLast10, 0, '4c po ustabilizowaniu jednostki bez sciezki stoja (brak oscylacji w turach 21-30)');
}

// ---------------------------------------------------------------------------
console.log('\n--- 5: przeciwnik wyeliminowany (brak miast) => dotychczasowe zachowanie ---');
{
  const mk = () => { const s = S.aiVsAi(); s.cities = s.cities.filter(c => c.ownerId === 1); return s; };
  const stOn = mk();
  const stOff = mk();
  E.setWarAllInCapitalOverride(true);
  const common = { canEngageOwner: (t) => t === 2, currentTurn: 1, visibleHexes: new Set() };
  const a = E.decideAITurn(1, stOn.units, stOn.cities, stOn.map, H.DATA, { ...common, warAllIn: { targets: [] } });
  E.setWarAllInCapitalOverride(false);
  const b = E.decideAITurn(1, stOff.units, stOff.cities, stOff.map, H.DATA, { ...common });
  eq(JSON.stringify(a), JSON.stringify(b), '5a puste targets == komendy dotychczasowe');
}

// ---------------------------------------------------------------------------
console.log('\n--- 6: flaga OFF == baza origin/main (hash stanu po TURNS turach) ---');
let baseEngine = null;
try {
  const dir = fs.mkdtempSync(path.join(path.resolve(__dirname, '..'), '.tmp-war-allin-base-'));
  const repoRoot = path.resolve(__dirname, '..', '..');
  const ref = process.env.WAR_ALLIN_BASE_REF || 'fcd86933';
  const tar = execFileSync('git', ['-C', repoRoot, 'archive', ref, 'gra/src', 'gra/data'], { maxBuffer: 1 << 30 });
  fs.writeFileSync(path.join(dir, 'b.tar'), tar);
  execFileSync('tar', ['-xf', path.join(dir, 'b.tar'), '-C', dir]);
  baseEngine = H.loadEngine(path.join(dir, 'gra', 'src'), 'base');
  baseEngine._dir = dir;
} catch (e) {
  console.log('  SKIP sekcji 6 (brak bazy):', String(e.message || e).slice(0, 120));
}
if (baseEngine) {
  // Baza fcd86933 zawiera modul (regula wojny 230fd53b); test 6a byl pisany dla bazy sprzed wojny.
  eq(baseEngine.hasModule, true, '6a baza (fcd86933) zawiera modul warAllInCapital');
  for (const name of ['aiVsAi', 'aiVsPlayer', 'barbarians', 'noLandPath']) {
    const stB = S[name]();
    H.simulate(stB, { engine: baseEngine, flag: null, fog: true, turns: TURNS });
    const off = run(name, false);
    console.log(`  [INFO] ${name}: baza pre-zasieg=${H.stateHash(stB)} OFF=${off.hash} (roznica = zamierzona zmiana zasiegu)`);
    eq(off.hash, REF_OFF[name], `6b ${name}: flaga OFF == referencja ${REF_OFF[name]}`);
    eq(H.stateHash(stB), REF_BASE_PRE_RANGE[name], `6b0 ${name}: baza fcd86933 == zapisana referencja bazy`);
  }
  const on = run('aiVsAi', true);
  assert(on.hash !== H.stateHash((() => { const s = S.aiVsAi(); H.simulate(s, { engine: baseEngine, flag: null, fog: true, turns: TURNS }); return s; })()),
    '6c flaga ON zmienia wynik wzgledem bazy (test nie jest trywialny)');
}

// ---------------------------------------------------------------------------
console.log('\n--- 7: determinizm przy fladze ON (2 przebiegi) ---');
for (const name of ['aiVsAi', 'aiVsPlayer', 'barbarians']) {
  eq(run(name, true).hash, run(name, true).hash, `7 ${name}: ten sam hash w 2 przebiegach`);
}

// ---------------------------------------------------------------------------
console.log('\n--- 8: planWarAllInCapital -- grupowanie / rendezvous ---');
{
  const planRaw = E.planWarAllInCapital;
  const map = S.aiVsAi().map;
  const P = (units, targets, nav, opts) => planRaw(units, targets, nav || { map, blocked: new Set() }, opts);
  const target = { ownerId: 2, cityId: 'T', q: 35, r: 10 };
  // Duza grupa (4) w (10,10), mala (1) w (10,17) -- dystans 7 <= 8 => rendezvous do duzej.
  const big = [0, 1, 2, 3].map(i => ({ id: `b${i}`, q: 10 + (i % 2), r: 10 + (i >> 1) }));
  const small = { id: 'z', q: 10, r: 17 };
  const plan = P([...big, small], [target]);
  const oz = plan.orders.find(o => o.unitId === 'z');
  eq(oz.mode, 'rendezvous', '8a mala grupa blisko duzej => rendezvous');
  assert(oz.step.r < 17, '8b rendezvous: krok w strone duzej grupy (r maleje)');
  eq(plan.orders.filter(o => o.mode === 'capital').length, 0, '8c duza grupa CZEKA, az mala ja dogoni (zbiorka)');
  eq(plan.held.length, big.length, '8c2 czekajaca grupa jest w held (nie w noPath)');
  eq(plan.orders.length + plan.held.length + plan.noPath.length, big.length + 1, '8d kazda jednostka ma rozkaz albo jawny powod postoju');
  eq(plan.noPath.length, 0, '8d1 noPath puste (zaden "brak ladu")');
  const alone = P(big, [target]);
  eq(alone.orders.length, big.length, '8d1b bez doganiajacych: cala grupa maszeruje');
  assert(alone.orders.every(o => dist(o.step.q, o.step.r, 35, 10) <
    dist(big.find(b => b.id === o.unitId).q, big.find(b => b.id === o.unitId).r, 35, 10)),
  '8d2 kazdy krok na stolice zmniejsza dystans do niej');
  // R-AI-KAMPANIA-MARSZ-REKRUTACJA-Q1: after the fixed five-turn muster, the already gathered
  // main force must start attacking while a separated straggler closes in. Ordinary all-in
  // wars keep their existing rendezvous wait; only the General campaign enables this option.
  const mainForce = [0, 1, 2, 3].map(i => ({ ...big[i], ruchLeft: 2 }));
  const approaching = { id: 'approaching', q: 10, r: 17, ruchLeft: 2 };
  const campaignPlan = P([...mainForce, approaching], [target], undefined,
    { marchMainGroupWhileRendezvous: true });
  eq(campaignPlan.orders.filter(o => mainForce.some(u => u.id === o.unitId) && o.mode === 'capital').length,
    mainForce.length, '8d3 kampania wodza: zebrany glowny stack maszeruje na stolice w 6. turze mimo doganiacza');
  eq(campaignPlan.orders.find(o => o.unitId === approaching.id)?.mode, 'rendezvous',
    '8d4 doganiacz nadal zmierza do glownej grupy');
  eq(campaignPlan.held.length, 0, '8d5 opcja kampanii nie blokuje glownego stacku przez doganiacza');
  // Daleko (> MERGE_RADIUS): kazdy na stolice.
  const bigN = big.map(b => ({ ...b, r: b.r - 8 }));
  const far = P([...bigN, { id: 'z', q: 10, r: 19 }], [target]);
  eq(far.orders.find(o => o.unitId === 'z').mode, 'capital', '8e grupa dalej niz MERGE_RADIUS => bezposrednio na stolice');
  // Dwa cele: grupa idzie do NAJBLIZSZEGO.
  const t2 = { ownerId: 3, cityId: 'N', q: 10, r: 0 };
  const two = P(big, [target, t2]);
  assert(two.orders.every(o => o.targetCityId === 'N'), '8f cel = najblizsza stolica z kilku');
  // Blisko stolicy nie ma rendezvous.
  const near = P([{ id: 'n1', q: 30, r: 10 }, { id: 'n3', q: 31, r: 10 }, { id: 'n4', q: 30, r: 11 }, { id: 'n2', q: 36, r: 7 }], [target]);
  eq(near.orders.find(o => o.unitId === 'n2').mode, 'capital', '8g blisko stolicy (<=3): natarcie, nie zbiorka');
  const notNear = P([{ id: 'n1', q: 30, r: 10 }, { id: 'n3', q: 31, r: 10 }, { id: 'n4', q: 30, r: 11 }, { id: 'n2', q: 36, r: 5 }], [target]);
  eq(notNear.orders.find(o => o.unitId === 'n2').mode, 'rendezvous', '8g2 kontrola: dalej od stolicy (>3) ta sama grupa dolacza');
  // Brak sciezki (morze) => noPath, bez wyjatku.
  const seaMap = S.noLandPath().map;
  const nopath = P(big, [target], { map: seaMap, blocked: new Set() });
  eq(nopath.noPath.length, 4, '8h brak sciezki ladowej: wszystkie w noPath');
  eq(nopath.orders.length, 0, '8h2 brak sciezki: zero rozkazow');
  // Przeszkoda (zajety heks) jest omijana -- krok nie wchodzi na zablokowany heks.
  const blk = P([{ id: 'x', q: 10, r: 10 }], [target], { map, blocked: new Set(['11,10', '11,9', '10,11']) });
  assert(blk.orders.length === 1 && !['11,10', '11,9', '10,11'].includes(`${blk.orders[0].step.q},${blk.orders[0].step.r}`),
    '8h3 krok omija zablokowane heksy');
  // 8j: progi z gra/data/war-allin-params.json -- test GRANICZNY wyprowadzony z eksportowanych stalych
  // (zmiana wartosci w JSON przesuwa granice, test nadal ma sens; zero literalow z balansu).
  {
    const L = E.WAR_ALLIN_LINK_RADIUS, M = E.WAR_ALLIN_MERGE_RADIUS, N = E.WAR_ALLIN_NO_MERGE_NEAR_CAPITAL;
    assert([L, M, N].every(Number.isInteger) && L >= 1 && M > L && N >= 1, '8j stale z JSON to calkowite dodatnie, MERGE > LINK');
    const head = { id: 'a', q: 20, r: 10 };
    const linked = P([head, { id: 'b', q: 20 - L, r: 10 }], [target]);
    eq(JSON.stringify(linked.groupsByTarget.T), JSON.stringify([2]), '8j1 dystans == LINK_RADIUS: jedna grupa');
    const unlinked = P([head, { id: 'b', q: 20 - L - 1, r: 10 }], [target]);
    eq(JSON.stringify(unlinked.groupsByTarget.T), JSON.stringify([1, 1]), '8j2 dystans == LINK_RADIUS+1: dwie grupy');
    const mAt = P([head, { id: 'b', q: 20 - M, r: 10 }], [target]);
    eq(mAt.orders.find(o => o.unitId === 'b').mode, 'rendezvous', '8j3 dystans == MERGE_RADIUS: rendezvous');
    const mOut = P([head, { id: 'b', q: 20 - M - 1, r: 10 }], [target]);
    eq(mOut.orders.find(o => o.unitId === 'b').mode, 'capital', '8j4 dystans == MERGE_RADIUS+1: bezposrednio na stolice');
    const headPair = [{ id: 'h1', q: 30, r: 10 }, { id: 'h2', q: 31, r: 10 }];
    const nAt = P([...headPair, { id: 'n', q: 35, r: 10 - N }], [target]);
    eq(nAt.orders.find(o => o.unitId === 'n').mode, 'capital', '8j5 dystans do stolicy == NO_MERGE_NEAR_CAPITAL: natarcie');
    const nOut = P([...headPair, { id: 'n', q: 35, r: 10 - N - 1 }], [target]);
    eq(nOut.orders.find(o => o.unitId === 'n').mode, 'rendezvous', '8j6 dystans do stolicy == NO_MERGE+1: zbiorka');
  }
  // Kolejnosc wejscia nie zmienia wyniku (determinizm).
  const a = P([...big, small], [target]);
  const b = P([small, ...[...big].reverse()], [target]);
  eq(JSON.stringify(a.orders.sort((x, y) => (x.unitId < y.unitId ? -1 : 1))),
    JSON.stringify(b.orders.sort((x, y) => (x.unitId < y.unitId ? -1 : 1))), '8i wynik niezalezny od kolejnosci wejscia');
}

// ---------------------------------------------------------------------------
console.log('\n--- 10: realne scalanie grup, gesta grupa, brak krokow wstecz i dubli ---');
{
  const map = H.makeMap(60, 30);
  /** Wykonuje plan jak silnik: kolejnosc rozkazow, zajety heks = ruch nieudany; wejscie na stolice = koniec jednostki. */
  const execute = (groups, cap, turns) => {
    const units = [];
    groups.forEach((g, gi) => g.forEach(([q, r], i) => units.push(H.mkUnit(`g${gi}_${i}`, 1, q, r))));
    const targets = [{ ownerId: 2, cityId: 'T', q: cap[0], r: cap[1] }];
    const m = { back: 0, dups: 0, noPath: 0, failed: 0, unaccounted: 0, mergedAt: null, spreadAtEnd: null, timeline: [] };
    for (let t = 1; t <= turns; t++) {
      const occupied = new Set(units.map(u => `${u.q},${u.r}`));
      const plan = E.planWarAllInCapital(units, targets, { map, blocked: new Set(), occupied });
      m.noPath += plan.noPath.length;
      m.unaccounted += units.length - (plan.orders.length + plan.held.length + plan.noPath.length);
      const seen = new Set();
      for (const o of plan.orders) {
        const u = units.find(x => x.id === o.unitId);
        const k = `${o.step.q},${o.step.r}`;
        if (seen.has(k)) m.dups++;
        seen.add(k);
        if (dist(o.step.q, o.step.r, cap[0], cap[1]) > dist(u.q, u.r, cap[0], cap[1])) m.back++;
        if (units.some(v => v !== u && v.q === o.step.q && v.r === o.step.r)) { m.failed++; continue; }
        if (o.step.q === cap[0] && o.step.r === cap[1]) { units.splice(units.indexOf(u), 1); continue; }
        u.q = o.step.q; u.r = o.step.r;
      }
      let mx = 0;
      for (const a of units) for (const b of units) mx = Math.max(mx, dist(a.q, a.r, b.q, b.r));
      if (m.mergedAt === null && mx <= 5) m.mergedAt = t;
      m.spreadAtEnd = mx;
      m.timeline.push(mx);
    }
    return m;
  };
  const lead = [[10, 10], [11, 10], [10, 11], [11, 11]];
  const lat = execute([lead, [[10, 17]]], [50, 10], 30);
  assert(lat.mergedAt !== null && lat.mergedAt <= 8, `10a grupa z boku (odstep 7) scala sie w <=8 tur (${lat.mergedAt})`);
  assert(lat.spreadAtEnd <= 5, `10b armia nie plynie strumieniem: rozstaw po 30 turach <=5 (${lat.spreadAtEnd})`);
  const beh = execute([[[20, 10], [21, 10], [20, 11], [21, 11]], [[11, 10]]], [50, 10], 40);
  assert(beh.mergedAt !== null && beh.mergedAt <= 12, `10c grupa 9 hexow z tylu dogania (odstep > dawny stały) w <=12 tur (${beh.mergedAt})`);
  assert(beh.spreadAtEnd <= 5, `10d po dogonieniu rozstaw <=5 (${beh.spreadAtEnd})`);
  const dense = execute([[[10, 8], [11, 8], [10, 9], [11, 9], [12, 8], [12, 9], [9, 9], [9, 10], [10, 10], [11, 10]]], [34, 10], 30);
  eq(dense.noPath, 0, '10e gesta grupa 10: zero noPath ("otoczona" != "brak ladu")');
  eq(dense.back, 0, '10f gesta grupa: zero krokow od stolicy');
  eq(dense.dups, 0, '10g gesta grupa: zero dwoch jednostek na tym samym heksie docelowym');
  eq(dense.failed, 0, '10h gesta grupa: kazdy rozkaz wykonalny w kolejnosci planu (zero nalozen)');
  eq(dense.unaccounted, 0, '10i kazda jednostka ma rozkaz albo jawny powod postoju');
  for (const [nm, r] of [['lat', lat], ['beh', beh]]) {
    eq(r.back + r.dups + r.failed + r.noPath, 0, `10j ${nm}: zero krokow wstecz/dubli/nalozen/noPath`);
  }
  // Morze: noPath (nie held) -- rozroznienie "brak ladu" od "otoczona".
  const sea = E.planWarAllInCapital([{ id: 's', q: 10, r: 10 }], [{ ownerId: 2, cityId: 'T', q: 35, r: 10 }],
    { map: S.noLandPath().map, blocked: new Set(), occupied: new Set(['10,10']) });
  assert(sea.noPath.includes('s') && !sea.held.includes('s'), '10k brak ladu => noPath, nie held');
  // Otoczona wlasnymi jednostkami: held, nie noPath.
  const ring = [[10, 10], [11, 10], [9, 10], [10, 9], [10, 11], [11, 9], [9, 11]];
  const ringUnits = ring.map(([q, r], i) => ({ id: `r${i}`, q, r }));
  const ringPlan = E.planWarAllInCapital([ringUnits[0]], [{ ownerId: 2, cityId: 'T', q: 35, r: 10 }],
    { map, blocked: new Set(), occupied: new Set(ring.map(([q, r]) => `${q},${r}`)) });
  assert(ringPlan.held.includes('r0') && ringPlan.noPath.length === 0 && ringPlan.orders.length === 0,
    '10l otoczona wlasnymi: held, bez kroku wstecz');
}

// ---------------------------------------------------------------------------
console.log('\n--- 9: okablowanie main.ts (testy statyczne) ---');
{
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  eq((main.match(/warAllInContextFor\(/g) || []).length, 3, '9a warAllInContextFor: definicja + AI + barbarzyncy');
  assert(/warAllIn:\s*typCityCopyOwners\.has\(ownerId\)/.test(main), '9b kopie obronne miast-panstw bez warAllIn');
  assert(/warAllInContextFor\(BARBARIAN_OWNER_ID, barbCanEngageOwner\)/.test(main), '9c barbarzyncy: ten sam canEngageOwner (wojna)');
  assert(/if \(!isWarAllInCapitalEnabled\(\)\) return undefined;/.test(main), '9d flaga OFF => brak kontekstu');
  const mod = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'warAllInCapital.ts'), 'utf8');
  assert(!/Math\.random/.test(mod), '9e modul bez Math.random');
  const aiSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'ai.ts'), 'utf8');
  assert(/ctx\.allowSea === true \|\| u\.embarked !== true/.test(aiSrc)
    && /u\.seaRaider !== true/.test(aiSrc),
  '9g AI: embarked do kampanii morskiej tylko przy allowSea, seaRaider wykluczone');
  assert(/WAR_ALLIN_CAPITAL_ENABLED = true/.test(mod), '9f flaga jawna w module');
  // 9h: stale balansowe w gra/data/war-allin-params.json, nie jako literaly w kodzie.
  assert(!/export const WAR_ALLIN_(LINK_RADIUS|MERGE_RADIUS|NO_MERGE_NEAR_CAPITAL)[^=]*=\s*\d/.test(mod), '9h stale WAR_ALLIN_* bez literalow liczbowych w kodzie');
  const prm = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'war-allin-params.json'), 'utf8'));
  for (const k of ['link_radius', 'merge_radius', 'no_merge_near_capital']) {
    assert(Number.isInteger(prm[k] && prm[k].wartosc) && prm[k].wartosc > 0, `9i war-allin-params.json: ${k}.wartosc to dodatnia liczba calkowita`);
  }
  assert(/warAllInParamsRaw\.link_radius\.wartosc/.test(mod) && /warAllInParamsRaw\.merge_radius\.wartosc/.test(mod) && /warAllInParamsRaw\.no_merge_near_capital\.wartosc/.test(mod), '9j modul czyta wszystkie 3 stale z JSON');
}

// ---------------------------------------------------------------------------
H.cleanup(E);
if (baseEngine) { H.cleanup(baseEngine); try { fs.rmSync(baseEngine._dir, { recursive: true, force: true }); } catch (_) { /* ok */ } }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
