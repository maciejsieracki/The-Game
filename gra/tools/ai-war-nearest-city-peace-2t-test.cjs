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
  // R-WEB-AI-TARGET-NEAREST-CITY-NOT-CAPITAL-Q1 (2026-11-08): gracz jako cel = jak AI->AI (wszystkie miasta gracza).
  t('A5 gracz jako cel: wszystkie miasta gracza (nie tylko stolica)', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('a-cap', 0, 30, 4), mkCity('z-near', 0, 12, 4)];
    const tg = targetsFor(1, 0, cities, []);
    return (tg.length === 2 && tg.some(x => x.cityId === 'z-near') && tg.some(x => x.cityId === 'a-cap')) || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });
  t('A6 barbarzynca jako atakujacy: tylko stolica (bez zmian)', () => {
    const cities = [mkCity('m1', 99, 0, 4), mkCity('a-cap', 2, 30, 4), mkCity('z-near', 2, 12, 4)];
    const tg = targetsFor(99, 2, cities, []);
    return (tg.length === 1 && tg[0].cityId === 'a-cap') || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });

  // ---------------- B: pokoj po 2 turach + cena (PRAWDZIWY tick runAiAiPeaceTick z wstrzyknietymi zaleznosciami) ----------------
  const P = E.peace;
  t('B0 parametr tury_do_pokoju_po_prosbie = 2 (ai-params.json)', () => P && P.AI_PEACE_TURNS_AFTER_REQUEST === 2 || 'wartosc: ' + (P && P.AI_PEACE_TURNS_AFTER_REQUEST));
  const gold = (g) => ({ kind: 'zloto', id: 'zloto', amount: g, pn: g });
  const city = (id, pn, forbidden) => ({ kind: 'miasto', id, amount: 1, pn, forbidden });
  const resAsset = (id, pn) => ({ kind: 'surowiec_ilosc', id, amount: 10, pn });
  // Wycena naslada istniejaca: bilans zwyciezcy = zaplata - cena (cena 'PEACE' dla pokoju, 'TRUCE' dla rozejmu: baza 500 vs 200).
  const PRICES = { pokoj: 500, rozejm: 200 };
  const harness = (o = {}) => {
    const store = new Map();
    const log = { pay: [], fin: [], msgs: [], priceKinds: [] };
    const h = {
      store, log,
      deps: (turn) => ({
        store, turn,
        pairEligible: o.pairEligible || (() => true),
        requesterShareOf: o.share || (() => 0.3),
        gateVerdict: o.verdict || (() => 'ok'),
        price: (w, l, kind) => {
          log.priceKinds.push(kind);
          const req = PRICES[kind];
          return { requiredPn: req, balanceFor: (c) => c - req, tolerancePn: 0 };
        },
        assets: (l, w, skip) => (o.assets || []).filter(a => !(a.kind === 'miasto' && skip.has(a.id))),
        cityCessionOk: o.cityOk || (() => true),
        battlePending: !!o.battlePending,
        pay: (l, w, plan) => log.pay.push({ l, w, plan }),
        finalize: (l, w, kind) => log.fin.push({ l, w, kind }),
        log: (m) => log.msgs.push(m),
      }),
    };
    return h;
  };
  const tick = (h, turn) => E.peace.runAiAiPeaceTick(h.deps(turn));
  const reg = (h, turn, kind = 'pokoj') => P.registerAiPeaceRequest(h.store, '1_2', 1, 2, turn, kind);

  t('B1 tick: prosba w T -> T i T+1 bez zaplaty = brak pokoju; T+2 = pokoj (platnosc maks. mozliwa = 0)', () => {
    const h = harness(); reg(h, 10);
    tick(h, 10); tick(h, 11);
    if (h.log.fin.length !== 0) return 'pokoj przed T+2';
    const o = tick(h, 12);
    return (h.log.fin.length === 1 && o[0].action === 'force') || JSON.stringify(o.map(x => x.action));
  });
  t('B2 prosba rejestrowana raz (kolejne prosby nie odnawiaja licznika)', () => {
    const store = new Map();
    const a = P.registerAiPeaceRequest(store, '1_2', 1, 2, 10);
    const b = P.registerAiPeaceRequest(store, '1_2', 1, 2, 11);
    return (a === true && b === false && store.get('1_2').sinceTurn === 10) || 'rejestr';
  });
  t('B3 przegrany placi zlotem: pokoj przechodzi PRZED limitem, bilans przed < 0, po >= 0, platnosc wykonana przed finalizacja', () => {
    const h = harness({ assets: [gold(700)] }); reg(h, 10);
    const o = tick(h, 10);
    const d = o[0] && o[0].decision;
    return (o[0].action === 'accept_paid' && d.balanceBefore < 0 && d.balanceAfter >= 0
      && h.log.pay.length === 1 && h.log.fin.length === 1 && h.log.pay[0].plan.histogram.zloto === 1
      && h.log.pay[0].plan.coveredPn === 500 && !h.store.has('1_2')) || JSON.stringify(o);
  });
  t('B4 czesciowa zaplata: przed limitem zwyciezca odrzuca, w T+2 pokoj z cala dostepna zaplata', () => {
    const h = harness({ assets: [gold(200)] }); reg(h, 10);
    const a = tick(h, 11)[0].action;
    const o = tick(h, 12)[0];
    return (a === 'wait' && o.action === 'force' && h.log.pay[0].plan.coveredPn === 200 && h.log.pay[0].plan.shortfallPn === 300) || `${a}/${o.action}`;
  });
  t('B5 cesja miasta gdy zloto nie wystarcza; stolica (forbidden) nigdy; niewykonalna cesja pomijana', () => {
    const h = harness({ assets: [gold(100), city('capital', 900, true), city('c-small', 300), city('c-big', 800)],
      cityOk: (id) => id !== 'c-big' }); reg(h, 10);
    const o = tick(h, 12)[0];
    const items = h.log.pay[0].plan.items.map(i => i.kind + ':' + i.id).join(',');
    return (!items.includes('capital') && !items.includes('c-big') && items.includes('miasto:c-small')) || items;
  });
  t('B6 bramka zwyciezcy stronger/too_early wstrzymuje wczesna akceptacje, nie limit', () => {
    const h = harness({ assets: [gold(700)], verdict: () => 'stronger' }); reg(h, 10);
    const early = tick(h, 11)[0].action;
    const late = tick(h, 12)[0].action;
    return (early === 'wait' && late === 'force') || `${early}/${late}`;
  });
  t('B7 surowce pokrywaja reszte zanim ruszy miasto', () => {
    const h = harness({ assets: [gold(100), resAsset('zelazo', 450), city('c1', 600)] }); reg(h, 10);
    const o = tick(h, 10)[0];
    const hist = h.log.pay[0] && h.log.pay[0].plan.histogram;
    return (o.action === 'accept_paid' && hist.surowiec_ilosc === 1 && hist.miasto === 0) || JSON.stringify(hist);
  });
  t('B8 gracz nie jest zmuszany: para z czlowiekiem nieuprawniona; prosba usuwana', () => {
    const base = { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: false, atWar: true };
    const okPair = P.isForcedPeaceEligiblePair(base) === true
      && P.isForcedPeaceEligiblePair({ ...base, bIsHuman: true }) === false
      && P.isForcedPeaceEligiblePair({ ...base, aIsHuman: true, aIsMajorAi: false }) === false;
    const h = harness({ pairEligible: () => false }); reg(h, 10);
    const o = tick(h, 12);
    return (okPair && o[0].action === 'dropped_ineligible' && h.log.fin.length === 0 && h.store.size === 0) || 'uprawnienie pary';
  });
  t('B9 wojna wymuszona epoki / miasto-panstwo / brak wojny: nieuprawnione', () => {
    const base = { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: false, atWar: true };
    return P.isForcedPeaceEligiblePair({ ...base, forcedEpochWar: true }) === false
      && P.isForcedPeaceEligiblePair({ ...base, bIsMajorAi: false }) === false
      && P.isForcedPeaceEligiblePair({ ...base, atWar: false }) === false || 'wyjatki';
  });
  t('B10 ROZEJM != POKOJ: prosba "rozejm" wyceniana baza rozejmu (200) i konczona rozejmem (kind=rozejm do finalize)', () => {
    const h = harness({ assets: [gold(250)] }); reg(h, 10, 'rozejm');
    const o = tick(h, 10)[0];
    return (o.action === 'accept_paid' && h.log.priceKinds[0] === 'rozejm' && h.log.fin[0].kind === 'rozejm'
      && h.log.pay[0].plan.coveredPn === 200) || JSON.stringify([o.action, h.log.priceKinds, h.log.fin]);
  });
  t('B11 prosba "pokoj" i brak pola kind (stary zapis) = pokoj z baza 500 i finalize bez rozejmu', () => {
    const h = harness({ assets: [gold(900)] });
    h.store.set('1_2', { requesterId: 1, otherId: 2, sinceTurn: 10 });
    tick(h, 10);
    return (h.log.priceKinds[0] === 'pokoj' && h.log.fin[0].kind === 'pokoj' && h.log.pay[0].plan.coveredPn === 500) || JSON.stringify(h.log.fin);
  });
  t('B12 T+2 mimo trwajacej bitwy oczekujacej: pokoj wchodzi, ale bez cesji miast', () => {
    const h = harness({ assets: [gold(100), city('c-small', 600)], battlePending: true }); reg(h, 10);
    const o = tick(h, 12)[0];
    return (o.action === 'force' && h.log.fin.length === 1 && h.log.pay[0].plan.histogram.miasto === 0) || JSON.stringify(o.action);
  });
  t('B13 przegrany zweryfikowany: prosba pat (udzial > 0.45) nie jest rejestrowana; silniejszy prosacy w ticku -> prosba wygasa', () => {
    const regOk = P.isClearlyLosing(0.30) === true && P.isClearlyLosing(0.50) === false && P.isClearlyLosing(0.46) === false;
    const h = harness({ share: () => 0.62 }); reg(h, 10);
    const o = tick(h, 12);
    const stillOk = P.isStillLosing(0.48) === true && P.isStillLosing(0.62) === false;
    return (regOk && stillOk && o[0].action === 'dropped_not_losing' && h.log.fin.length === 0 && h.store.size === 0) || JSON.stringify(o.map(x => x.action));
  });
  t('B14 requesterShare: udzial sily prosacego w parze', () => P.requesterShare(30, 70) === 0.3 && P.requesterShare(0, 0) === 0.5 || 'share');

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

  // C7-C9: ta sama funkcja, ktorej uzywa scanAutoSiegesAfterAiTurn (autoSiegeCandidateForScan) na prawdziwych strukturach
  const areEnemies = (a, b) => a !== b;
  const scan = (cities, units) => cities.filter(c => G.autoSiegeCandidateForScan(c, units, areEnemies, isHuman, isBarb));
  t('C7 skan: obwarowane miasto AI z wroga AI jednostka przy murze -> kandydat na oblezenie; bez muru/bez jednostki -> nie', () => {
    const walled = mkCity('c2', 2, 6, 4, { maMur: true });
    const open = mkCity('c3', 2, 20, 4, {});
    const lone = mkCity('c4', 2, 30, 4, { maMur: true });
    const units = [mkUnit('u1', 1, 5, 4), mkUnit('u2', 1, 19, 4)];
    const got = scan([walled, open, lone], units).map(c => c.id);
    return (got.length === 1 && got[0] === 'c2') || JSON.stringify(got);
  });
  t('C8 skan: miasto gracza jak dotad; barbarzynca przy murze AI nie zaklada oblezenia; czlowiek-oblegajacy nie przez skan AI', () => {
    const pc = mkCity('p1', 0, 6, 4, { maMur: true });
    const ac = mkCity('a1', 2, 16, 4, { maMur: true });
    const u1 = scan([pc], [mkUnit('u1', 1, 5, 4)]).length === 1;
    const ub = scan([ac], [mkUnit('b1', 99, 15, 4)]).length === 0;
    const uh = scan([ac], [mkUnit('h1', 0, 15, 4)]).length === 0;
    return (u1 && ub && uh) || JSON.stringify({ u1, ub, uh });
  });
  t('C9 skan: miasto inne niz gracza z ownerem-czlowiekiem (hotseat) pomijane; miasto juz oblegane pomijane', () => {
    const hot = mkCity('h1', 3, 6, 4, { maMur: true });
    const sieged = mkCity('s1', 2, 16, 4, { maMur: true, oblegane: true });
    const isHuman2 = (o) => o === 0 || o === 3;
    const a = G.autoSiegeCandidateForScan(hot, [mkUnit('u1', 1, 5, 4)], areEnemies, isHuman2, isBarb) === null;
    const b = G.autoSiegeCandidateForScan(sieged, [mkUnit('u1', 1, 15, 4)], areEnemies, isHuman, isBarb) === null;
    return (a && b) || JSON.stringify({ a, b });
  });
  t('C10 koszt skanu: 300 miast z murem x 600 jednostek < 400 ms', () => {
    const cs = []; const us = [];
    for (let i = 0; i < 300; i++) cs.push(mkCity('k' + i, 2 + (i % 5), (i * 7) % 90, (i * 3) % 60, { maMur: true }));
    for (let i = 0; i < 600; i++) us.push(mkUnit('v' + i, 1 + (i % 6), (i * 11) % 90, (i * 5) % 60));
    const t0 = Date.now(); scan(cs, us); const ms = Date.now() - t0;
    console.log('   [info] C10 czas pelnego skanu: ' + ms + ' ms');
    return ms < 400 || 'za wolno: ' + ms;
  });

  // ---------------- straznik okablowania main.ts (tekstowy) ----------------
  const main = fs.existsSync(MAIN_TS) ? fs.readFileSync(MAIN_TS, 'utf8') : '';
  const wired = (name, needle) => t('W ' + name, () => main.includes(needle) || 'brak w main.ts: ' + needle.slice(0, 70));
  wired('main.ts: cele przez buildWarCityTargets', 'buildWarCityTargets({');
  wired('main.ts: rejestracja prosby AI->AI o pokoj', "cmd.type === 'zaproponuj_pokoj' || cmd.type === 'oferuj_trybut_za_pokoj'");
  wired('main.ts: rodzaj rozejm przenoszony do prosby', "cmd.type === 'zaproponuj_pokoj' && cmd.rodzaj === 'rozejm' ? 'rozejm' : 'pokoj'");
  wired('main.ts: tick pokoju poza gałęzią !aiTurnAwaitingBattle (gwarancja T+2)', 'tickAiAiPeaceRequests(aiTurnAwaitingBattle);');
  wired('main.ts: skan oblezen przez autoSiegeCandidateForScan', 'autoSiegeCandidateForScan(city, units, areEnemyOwners, isHuman, isBarbarian)');
  wired('main.ts: tick przez runAiAiPeaceTick', 'runAiAiPeaceTick({');
  wired('main.ts: cena z peaceOfferAiRequestPn', 'peaceOfferAiRequestPn(0, 0, relTotal, basePn, difficulty)');
  wired('main.ts: rozejm konczy sie truceTurns', "kind === 'rozejm' ? TRUCE_DEFAULT_TURNS : undefined");
  t('W main.ts: tick NIE jest wewnatrz bloku if (!aiTurnAwaitingBattle)', () => {
    const i = main.indexOf('tickAiAiPeaceRequests(aiTurnAwaitingBattle);');
    const j = main.indexOf('if (!aiTurnAwaitingBattle) {', i);
    const prev = main.lastIndexOf('if (!aiTurnAwaitingBattle) {', i);
    return (i > 0 && j > i && (prev < 0 || i - prev > 400)) || 'tick w galezi !aiTurnAwaitingBattle';
  });
  return res;
}

// ---- mutacje (zrodlo -> zlamanie zachowania) ---------------------------------------------------------------------
const MUTATIONS = [
  { name: 'cel tylko stolica (AI->AI)', file: 'game/ai-war-target-select.ts',
    from: 'return !isHuman(selfOwnerId) && !isBarbarian(selfOwnerId)', to: 'return false && !isHuman(selfOwnerId) && !isBarbarian(selfOwnerId)' },
  { name: 'remis: ignoruj obroncow', file: 'game/warAllInCapital.ts',
    from: 'if (a.defenders !== b.defenders) return a.defenders < b.defenders;', to: '' },
  { name: 'limit pokoju +1 tura', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (turnsSince >= limit) {', to: 'if (turnsSince > limit) {' },
  { name: 'force nie dziala po limicie', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (turnsSince >= limit) {', to: 'if (turnsSince >= limit + 99) {' },
  { name: 'bez ceny (akceptacja zawsze)', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (inp.plan.full || balanceAfter >= -inp.tolerancePn) {', to: 'if (true) {' },
  { name: 'gracz tez zmuszany', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (p.aIsHuman || p.bIsHuman) return false;', to: '' },
  { name: 'wojna wymuszona tez objeta', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (p.eliminated || p.forcedEpochWar) return false;', to: 'if (p.eliminated) return false;' },
  { name: 'cesja stolicy dozwolona', file: 'game/diplomacy-ai-forced-peace.ts',
    from: "a.kind === 'miasto' && !a.forbidden && a.pn > 0", to: "a.kind === 'miasto' && a.pn > 0" },
  { name: 'rozejm traktowany jak pokoj', file: 'game/diplomacy-ai-forced-peace.ts',
    from: "const kind: AiPeaceKind = req.kind ?? 'pokoj';", to: "const kind: AiPeaceKind = 'pokoj';" },
  { name: 'brak weryfikacji przegranego', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (!isStillLosing(d.requesterShareOf(loser, winner))) {', to: 'if (false) {' },
  { name: 'prosba pat rejestrowalna', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'export function isClearlyLosing(share: number): boolean { return share <= LOSER_MAX_SHARE_AT_REQUEST; }',
    to: 'export function isClearlyLosing(share: number): boolean { return true; }' },
  { name: 'cesja miasta mimo bitwy oczekujacej', file: 'game/diplomacy-ai-forced-peace.ts',
    from: "d.battlePending && a.kind === 'miasto'", to: "false && a.kind === 'miasto'" },
  { name: 'niewykonalna cesja nie pomijana', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (!cityItem || d.cityCessionOk(cityItem.id, loser, winner)) break;', to: 'break;' },
  { name: 'skan: miasta AI pomijane (jak dotad tylko gracz)', file: 'game/diplomacy-siege-war-gate.ts',
    from: 'if (city.oblegane || !city.maMur) return null;', to: 'if (city.oblegane || !city.maMur || city.ownerId !== 0) return null;' },
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
