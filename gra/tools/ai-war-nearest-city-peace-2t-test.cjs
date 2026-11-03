'use strict';
/**
 * ai-war-nearest-city-peace-2t-test.cjs -- R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1.
 * Prawdziwe funkcje silnika (esbuild bundle z gra/src): buildWarCityTargets + planWarAllInCapital + decideAITurn (A),
 * diplomacy-ai-forced-peace (B), aiAutoSiegeAllowed + executeAiCityMove + canAiEnterEmptyEnemyCity (C).
 *
 *   node tools/ai-war-nearest-city-peace-2t-test.cjs             # GREEN po zmianie: exit 0
 *   AI_SRC_DIR=<drzewo src bazy> node tools/ai-war-nearest-city-peace-2t-test.cjs   # RED na bazie (brak modulow)
 *
 * Mutacje: ten sam zestaw asercji uruchamiany na zmutowanych zrodlach (plugin esbuild onLoad) MUSI sie zaczerwienic.
 * Straznik okablowania main.ts (tekstowy): rejestracja prosby, tick, cel najblizszego miasta, auto-oblezenie AI-AI.
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = process.env.AI_SRC_DIR ? path.resolve(process.env.AI_SRC_DIR) : path.resolve(GRA_ROOT, 'src');
const MAIN_TS = path.join(SRC, 'main.ts');

function bundle(tag, mutate) {
  const entry = path.resolve(__dirname, `.aiwnc2t-${tag}-entry.ts`);
  const out = path.resolve(__dirname, `.aiwnc2t-${tag}-bundle.cjs`);
  const J = (p) => JSON.stringify(path.join(SRC, p));
  const has = (p) => fs.existsSync(path.join(SRC, p + '.ts'));
  fs.writeFileSync(entry, [
    `export { decideAITurn } from ${J('game/ai')};`,
    `export { hexDistance, isCivilianUnit, computePath } from ${J('units/setup')};`,
    `export { setWarAllInCapitalOverride, planWarAllInCapital } from ${J('game/warAllInCapital')};`,
    `export { setArmyConsolidationOverride } from ${J('game/army-consolidation')};`,
    `export { executeAiCityMove } from ${J('game/ai-city-capture-executor')};`,
    `export { canAiEnterEmptyEnemyCity } from ${J('game/city-hex-movement')};`,
    has('game/ai-war-target-select') ? `export { buildWarCityTargets, isNearestCityWarPair } from ${J('game/ai-war-target-select')};` : '',
    has('game/diplomacy-ai-forced-peace')
      ? `export * as peace from ${J('game/diplomacy-ai-forced-peace')};` : '',
    `export * as siegeGate from ${J('game/diplomacy-siege-war-gate')};`,
  ].join('\n'), 'utf8');
  const plugins = mutate ? [{
    name: 'mutate',
    setup(b) {
      b.onLoad({ filter: new RegExp(mutate.file.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '$') }, (args) => {
        let src = fs.readFileSync(args.path, 'utf8');
        if (!src.includes(mutate.from)) throw new Error('mutacja nie pasuje: ' + mutate.from);
        src = src.replace(mutate.from, mutate.to);
        return { contents: src, loader: 'ts' };
      });
    },
  }] : [];
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
    absWorkingDir: GRA_ROOT, logLevel: 'silent', plugins });
  delete require.cache[out];
  const E = require(out);
  E._files = [entry, out];
  return E;
}

function cleanup(E) { for (const f of E._files || []) { try { fs.unlinkSync(f); } catch (_) { /* ok */ } } }

// ---- scenariusze ------------------------------------------------------------------------------------------------
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}
const DATA = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }],
  buildings: [{ id: 'koszary', nazwa: 'Koszary' }],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};
const mkUnit = (id, ownerId, q, r) => ({ id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, hp: 3 });
const mkCity = (id, ownerId, q, r, extra = {}) => ({ id, ownerId, q, r, name: id, population: 5, ...extra });

function suite(E) {
  const res = [];
  const t = (name, fn) => {
    try { const v = fn(); res.push({ name, ok: v === true || v === undefined, detail: v === true || v === undefined ? '' : String(v) }); }
    catch (e) { res.push({ name, ok: false, detail: 'WYJATEK: ' + String(e && e.message || e).slice(0, 160) }); }
  };
  const isHuman = (o) => o === 0;
  const isBarb = (o) => o === 99;

  // ---------------- A: cel = najblizsze miasto ----------------
  const targetsFor = (self, enemy, cities, units) => E.buildWarCityTargets({
    selfOwnerId: self, enemyOwnerIds: [enemy], engage: () => true, cities,
    combatUnits: units, isHuman, isBarbarian: isBarb,
    capitalCityIdForOwner: (o) => (cities.filter(c => c.ownerId === o).sort((a, b) => (a.id < b.id ? -1 : 1))[0] || {}).id || null,
  });
  const orderTarget = (self, enemy, cities, units, mine) => {
    E.setWarAllInCapitalOverride(true);
    E.setArmyConsolidationOverride(false);
    const map = makeMap(40, 10);
    const targets = targetsFor(self, enemy, cities, units);
    const all = [...mine, ...units];
    const cmds = E.decideAITurn(self, all, cities, map, DATA, { canEngageOwner: (x) => x === enemy, currentTurn: 60, warAllIn: { targets } });
    const mv = cmds.filter(c => c.type === 'move' && mine.some(u => u.id === c.unitId));
    return { cmds, mv, targets };
  };
  const farCap = (o) => mkCity('a-cap', o, 30, 4);
  const nearCity = (o) => mkCity('z-near', o, 12, 4);

  t('A1 AI->AI: lista celow zawiera WSZYSTKIE miasta wroga (nie tylko stolice)', () => {
    const cities = [mkCity('m1', 1, 0, 4), farCap(2), nearCity(2)];
    const tg = targetsFor(1, 2, cities, []);
    return tg.length === 2 && tg.some(x => x.cityId === 'z-near') || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });
  t('A2 AI->AI: armia maszeruje na NAJBLIZSZE miasto, nie na stolice', () => {
    const cities = [mkCity('m1', 1, 0, 4), farCap(2), nearCity(2)];
    const mine = [mkUnit('u1', 1, 3, 4), mkUnit('u2', 1, 3, 5), mkUnit('u3', 1, 4, 4)];
    const { mv } = orderTarget(1, 2, cities, [], mine);
    if (mv.length === 0) return 'brak komend ruchu';
    const bad = mv.filter(c => c.targetCityId !== 'z-near');
    return bad.length === 0 || 'cel inny niz z-near: ' + JSON.stringify(bad.map(c => c.targetCityId));
  });
  t('A3 stolica jest celem, gdy jest NAJBLIZSZYM miastem', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('a-cap', 2, 10, 4), mkCity('z-far', 2, 30, 4)];
    const mine = [mkUnit('u1', 1, 3, 4), mkUnit('u2', 1, 3, 5)];
    const { mv } = orderTarget(1, 2, cities, [], mine);
    return (mv.length > 0 && mv.every(c => c.targetCityId === 'a-cap')) || 'cele: ' + JSON.stringify(mv.map(c => c.targetCityId));
  });
  t('A4 remis odleglosci: slabiej broniowane, potem nizsze id', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('b-up', 2, 8, 4), mkCity('a-down', 2, 7, 5)];
    // a-down ma 2 obroncow, b-up 0 => b-up (slabiej broniowane) mimo wyzszego id
    const guards = [mkUnit('g1', 2, 7, 5), mkUnit('g2', 2, 7, 5)];
    const p = E.planWarAllInCapital([mkUnit('u1', 1, 4, 4)], targetsFor(1, 2, cities, guards),
      { map: makeMap(40, 10), blocked: new Set(['8,4', '7,5']), occupied: new Set() });
    const first = p.orders[0];
    if (!first || first.targetCityId !== 'b-up') return 'remis przy roznych obroncach: ' + JSON.stringify(first && first.targetCityId);
    // rowni obroncy => nizsze id
    const p2 = E.planWarAllInCapital([mkUnit('u1', 1, 4, 4)], targetsFor(1, 2, cities, []),
      { map: makeMap(40, 10), blocked: new Set(['8,4', '7,5']), occupied: new Set() });
    return p2.orders[0] && p2.orders[0].targetCityId === 'a-down' || 'remis przy rownych obroncach: ' + JSON.stringify(p2.orders[0] && p2.orders[0].targetCityId);
  });
  t('A5 gracz jako cel: tylko stolica (bez zmian)', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('a-cap', 0, 30, 4), mkCity('z-near', 0, 12, 4)];
    const tg = targetsFor(1, 0, cities, []);
    return (tg.length === 1 && tg[0].cityId === 'a-cap') || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });
  t('A6 barbarzynca jako atakujacy: tylko stolica (bez zmian)', () => {
    const cities = [mkCity('m1', 99, 0, 4), mkCity('a-cap', 2, 30, 4), mkCity('z-near', 2, 12, 4)];
    const tg = targetsFor(99, 2, cities, []);
    return (tg.length === 1 && tg[0].cityId === 'a-cap') || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });

  // ---------------- B: pokoj po 2 turach + cena ----------------
  const P = E.peace;
  t('B0 parametr tury_do_pokoju_po_prosbie = 2 (ai-params.json)', () => P && P.AI_PEACE_TURNS_AFTER_REQUEST === 2 || 'wartosc: ' + (P && P.AI_PEACE_TURNS_AFTER_REQUEST));
  const mkReq = (turn) => ({ requesterId: 1, otherId: 2, sinceTurn: turn });
  const gold = (g) => ({ kind: 'zloto', id: 'zloto', amount: g, pn: g });
  const city = (id, pn, forbidden) => ({ kind: 'miasto', id, amount: 1, pn, forbidden });
  const resAsset = (id, pn) => ({ kind: 'surowiec_ilosc', id, amount: 10, pn });
  const REQ_PN = 500;
  const decide = (turnNow, assets, verdict = 'ok', since = 10) => {
    const plan = P.planPeacePayment(REQ_PN, assets);
    return { plan, d: P.decideAiPeaceRequest({ req: mkReq(since), turn: turnNow, requiredPn: REQ_PN, plan, winnerGateVerdict: verdict }) };
  };
  t('B1 licznik: prosba w turze T -> T+1 jeszcze nie wymuszona, T+2 wymuszona', () => {
    const r = mkReq(10);
    return P.isForcedPeaceDue(r, 10) === false && P.isForcedPeaceDue(r, 11) === false && P.isForcedPeaceDue(r, 12) === true || 'licznik';
  });
  t('B2 prosba rejestrowana raz (kolejne prosby nie odnawiaja licznika)', () => {
    const store = new Map();
    const a = P.registerAiPeaceRequest(store, '1_2', 1, 2, 10);
    const b = P.registerAiPeaceRequest(store, '1_2', 1, 2, 11);
    return (a === true && b === false && store.get('1_2').sinceTurn === 10) || 'rejestr';
  });
  t('B3 bilans zwyciezcy: przed zaplata < 0, po pelnej zaplacie >= 0, pokoj przechodzi przed limitem', () => {
    const { d, plan } = decide(10, [gold(700)]);
    return (d.balanceBefore < 0 && d.balanceAfter >= 0 && d.action === 'accept_paid' && plan.histogram.zloto === 1 && plan.coveredPn === REQ_PN)
      || JSON.stringify(d) + JSON.stringify(plan.histogram);
  });
  t('B4 bez zaplaty zwyciezca ODRZUCA przed limitem (T i T+1)', () => {
    const a = decide(10, []).d.action;
    const b = decide(11, []).d.action;
    return (a === 'wait' && b === 'wait') || `T=${a} T+1=${b}`;
  });
  t('B5 po 2 turach pokoj wchodzi bez majatku (platnosc maksymalna mozliwa = 0)', () => {
    const { d, plan } = decide(12, []);
    return (d.action === 'force' && plan.coveredPn === 0 && d.balanceAfter < 0) || JSON.stringify(d);
  });
  t('B6 czesciowa zaplata: przed limitem wait, po limicie force z cala dostepna zaplata', () => {
    const pre = decide(11, [gold(200)]);
    const post = decide(12, [gold(200)]);
    return (pre.d.action === 'wait' && post.d.action === 'force' && post.plan.coveredPn === 200 && post.plan.shortfallPn === 300)
      || JSON.stringify([pre.d.action, post.d.action, post.plan.coveredPn]);
  });
  t('B7 cesja miasta, gdy zloto nie wystarcza; stolica (forbidden) nigdy', () => {
    const { plan } = decide(10, [gold(100), city('capital', 900, true), city('c-small', 300), city('c-big', 800)]);
    const items = plan.items.map(i => i.kind + ':' + i.id).join(',');
    return (plan.histogram.miasto === 1 && !items.includes('capital') && items.includes('miasto:c-small') === false
      ? (items.includes('miasto:c-big') && plan.full) : false) || ('plan: ' + items + ' covered=' + plan.coveredPn);
  });
  t('B8 bramka zwyciezcy "stronger/too_early" wstrzymuje wczesna akceptacje, nie limit', () => {
    const early = decide(10, [gold(700)], 'stronger').d.action;
    const late = decide(12, [gold(700)], 'stronger').d.action;
    return (early === 'wait' && late === 'force') || `${early}/${late}`;
  });
  t('B9 surowce pokrywaja reszte zanim ruszy miasto', () => {
    const { plan } = decide(10, [gold(100), resAsset('zelazo', 450), city('c1', 600)]);
    return (plan.histogram.surowiec_ilosc === 1 && plan.histogram.miasto === 0 && plan.full) || JSON.stringify(plan.histogram);
  });
  t('B10 gracz nie jest zmuszany: para z czlowiekiem nieuprawniona', () => {
    const base = { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: false, atWar: true };
    return P.isForcedPeaceEligiblePair(base) === true
      && P.isForcedPeaceEligiblePair({ ...base, bIsHuman: true }) === false
      && P.isForcedPeaceEligiblePair({ ...base, aIsHuman: true, aIsMajorAi: false }) === false || 'uprawnienie pary';
  });
  t('B11 wojna wymuszona epoki / miasto-panstwo / brak wojny: nieuprawnione', () => {
    const base = { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: false, atWar: true };
    return P.isForcedPeaceEligiblePair({ ...base, forcedEpochWar: true }) === false
      && P.isForcedPeaceEligiblePair({ ...base, bIsMajorAi: false }) === false
      && P.isForcedPeaceEligiblePair({ ...base, atWar: false }) === false || 'wyjatki';
  });

  // ---------------- C: zajmowanie miast AI-AI ----------------
  const G = E.siegeGate;
  t('C1 auto-oblezenie: AI oblega obwarowane miasto INNEJ AI (dotad tylko gracza)', () =>
    G.aiAutoSiegeAllowed(2, 1, isHuman, isBarb) === true || 'AI->AI zablokowane');
  t('C2 auto-oblezenie: miasto gracza jak dotad; barbarzyncy nie oblegaja AI i nie sa oblegani', () =>
    G.aiAutoSiegeAllowed(0, 1, isHuman, isBarb) === true && G.aiAutoSiegeAllowed(0, 99, isHuman, isBarb) === true
    && G.aiAutoSiegeAllowed(2, 99, isHuman, isBarb) === false && G.aiAutoSiegeAllowed(99, 2, isHuman, isBarb) === false || 'bramki');
  t('C3 czlowiek nie oblega przez auto-skan AI', () => G.aiAutoSiegeAllowed(2, 0, isHuman, isBarb) === false || 'czlowiek');
  const captureScenario = (walled) => {
    E.setWarAllInCapitalOverride(true);
    E.setArmyConsolidationOverride(false);
    const city2 = mkCity('c2', 2, 6, 4, walled ? { maMur: true } : {});
    const unit = mkUnit('u1', 1, 5, 4);
    let captured = false;
    const out = E.executeAiCityMove({
      command: { unitId: 'u1', toQ: 6, toR: 4, targetCityId: 'c2' }, unit, cities: [city2], cityBuiltIds: [],
      hasCityDefenders: false, unitIsCivilian: false, targetVisible: true, canEngageOwner: () => true,
      canOccupyCityHex: false, blockedKeys: new Set(), destinationKey: '6,4',
      computePath: () => [{ q: 6, r: 4 }], onCapture: () => { captured = true; return true; },
    });
    return { out, captured };
  };
  t('C4 armia AI pokonala obrone (miasto puste, bez muru) -> zajecie wykonywane', () => {
    const r = captureScenario(false);
    return (r.out.captured === true && r.captured === true) || JSON.stringify(r.out);
  });
  t('C5 miasto z murem: wejscie bez oblezenia zablokowane (dlatego potrzebne auto-oblezenie AI-AI)', () => {
    const r = captureScenario(true);
    return (r.out.captured === false && r.out.moved === false) || JSON.stringify(r.out);
  });
  t('C6 decideAITurn: AI obok pustego miasta wroga wydaje komende wejscia (targetCityId)', () => {
    E.setWarAllInCapitalOverride(true);
    E.setArmyConsolidationOverride(false);
    const cities = [mkCity('m1', 1, 0, 4), mkCity('c2', 2, 6, 4), mkCity('c2b', 2, 20, 4)];
    const mine = [mkUnit('u1', 1, 5, 4), mkUnit('u2', 1, 5, 5)];
    const targets = E.buildWarCityTargets({ selfOwnerId: 1, enemyOwnerIds: [2], engage: () => true, cities, combatUnits: [],
      isHuman, isBarbarian: isBarb, capitalCityIdForOwner: () => 'c2b' });
    const cmds = E.decideAITurn(1, mine, cities, makeMap(40, 10), DATA, { canEngageOwner: (x) => x === 2, currentTurn: 60, warAllIn: { targets } });
    const into = cmds.filter(c => c.type === 'move' && c.toQ === 6 && c.toR === 4 && c.targetCityId === 'c2');
    return into.length > 0 || 'komendy: ' + JSON.stringify(cmds.filter(c => c.type === 'move'));
  });

  // ---------------- straznik okablowania main.ts (tekstowy) ----------------
  const main = fs.existsSync(MAIN_TS) ? fs.readFileSync(MAIN_TS, 'utf8') : '';
  const wired = (name, needle) => t('W ' + name, () => main.includes(needle) || 'brak w main.ts: ' + needle.slice(0, 70));
  wired('main.ts: cele przez buildWarCityTargets', 'buildWarCityTargets({');
  wired('main.ts: rejestracja prosby AI->AI o pokoj', "cmd.type === 'zaproponuj_pokoj' || cmd.type === 'oferuj_trybut_za_pokoj'");
  wired('main.ts: tick pokoju po prosbie', 'tickAiAiPeaceRequests();');
  wired('main.ts: auto-oblezenie AI-AI', 'aiAutoSiegeAllowed(city.ownerId, auto.oblegajacyOwnerId');
  wired('main.ts: pokoj konczy sie standardowym finalizePeaceTreatyBetween', 'finalizePeaceTreatyBetween(loser, winner);');
  return res;
}

// ---- mutacje (zrodlo -> zlamanie zachowania) ---------------------------------------------------------------------
const MUTATIONS = [
  { name: 'cel tylko stolica (AI->AI)', file: 'game/ai-war-target-select.ts',
    from: 'return !isHuman(selfOwnerId) && !isBarbarian(selfOwnerId)', to: 'return false && !isHuman(selfOwnerId) && !isBarbarian(selfOwnerId)' },
  { name: 'remis: ignoruj obroncow', file: 'game/warAllInCapital.ts',
    from: 'if (a.defenders !== b.defenders) return a.defenders < b.defenders;', to: '' },
  { name: 'limit pokoju +1 tura', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'return turnsSincePeaceRequest(req, turn) >= limit;', to: 'return turnsSincePeaceRequest(req, turn) > limit;' },
  { name: 'force nie dziala po limicie', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (turnsSince >= limit) {', to: 'if (turnsSince >= limit + 99) {' },
  { name: 'bez ceny (bilans zawsze >= 0)', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'return Math.round(coveredPn - Math.max(0, requiredPn));', to: 'return Math.round(coveredPn + 1e9);' },
  { name: 'gracz tez zmuszany', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (p.aIsHuman || p.bIsHuman) return false;', to: '' },
  { name: 'wojna wymuszona tez objeta', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (p.eliminated || p.forcedEpochWar) return false;', to: 'if (p.eliminated) return false;' },
  { name: 'cesja stolicy dozwolona', file: 'game/diplomacy-ai-forced-peace.ts',
    from: "a.kind === 'miasto' && !a.forbidden && a.pn > 0", to: "a.kind === 'miasto' && a.pn > 0" },
  { name: 'auto-oblezenie AI-AI zablokowane', file: 'game/diplomacy-siege-war-gate.ts',
    from: 'return cityOwnerId !== besiegerOwnerId;', to: 'return false;' },
  { name: 'barbarzyncy oblegaja AI', file: 'game/diplomacy-siege-war-gate.ts',
    from: 'if (isBarbarianOwner(cityOwnerId) || isBarbarianOwner(besiegerOwnerId)) return false;', to: '' },
];

function main() {
  const E = bundle('base');
  const results = suite(E);
  cleanup(E);
  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
    if (!r.ok) failed++;
  }
  console.log(`\nZESTAW: ${results.length - failed}/${results.length} PASS`);
  let survivors = 0;
  if (process.env.AI_SRC_DIR === undefined && !process.env.NO_MUT) {
    for (const m of MUTATIONS) {
      let killed = false;
      try {
        const Em = bundle('mut', m);
        const rm = suite(Em);
        cleanup(Em);
        killed = rm.some(x => !x.ok);
      } catch (e) { killed = true; }
      console.log(`${killed ? 'KILLED  ' : 'SURVIVED'} mutacja: ${m.name}`);
      if (!killed) survivors++;
    }
    console.log(`\nMUTACJE: ${MUTATIONS.length - survivors}/${MUTATIONS.length} zabite`);
  }
  const bad = failed > 0 || survivors > 0;
  console.log(bad ? 'WYNIK: FAIL' : 'WYNIK: PASS');
  process.exit(bad ? 1 : 0);
}
try { main(); } catch (e) { console.log('FAIL (bundle/runtime): ' + String(e && e.message || e).slice(0, 300)); process.exit(1); }
