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
    `export { evaluateProposal, treatyBaseFairnessGap, treatyBasePnFromConfig } from ${J('game/diplomacy-proposals')};`,
    `export { relationTotal } from ${J('game/diplomacy-pn-engine')};`,
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

  // ---- B (R2): rozejm vs pokoj, cena z ISTNIEJACEJ wyceny, tick behawioralny, przegrany, T+2 ----
  const RAW = {};
  const relWar = { zaufanie: 30, respekt: 30, status: 'wojna' };
  const evalCtx = (rel) => ({ relation: rel, stanWojny: true, turn: 50, proposerRespekt: 30, responderRespekt: 60 });
  const gapFor = (kind, rel) => E.treatyBaseFairnessGap(E.treatyBasePnFromConfig(kind), 0, 0, E.relationTotal(rel));
  t('B12 baza PW: rozejm (200) != pokoj (500) -- rodzaje rozroznione', () => {
    const r = E.treatyBasePnFromConfig('rozejm'), p = E.treatyBasePnFromConfig('pokoj');
    return (r === 200 && p === 500) || `rozejm=${r} pokoj=${p}`;
  });
  t('B13 cena = -pwBalance z evaluateProposal (AI-proponent=przegrany, pusty koszyk): zwyciezca < 0 przed zaplata', () => {
    for (const kind of ['pokoj', 'rozejm']) {
      const ev = E.evaluateProposal({ actionId: kind, proposerOwnerId: 1, responderOwnerId: 2, payload: {} }, evalCtx(relWar));
      const need = P.loserRequiredPnFromGap(gapFor(kind, relWar));
      if (!(typeof ev.pwBalance === 'number' && ev.pwBalance < 0)) return `${kind}: pwBalance=${ev.pwBalance}`;
      if (need !== Math.ceil(-ev.pwBalance)) return `${kind}: cena ${need} != -pwBalance ${-ev.pwBalance}`;
    }
    return true;
  });
  t('B14 po zaplacie ceny pwBalance zwyciezcy >= 0 (evaluateProposal z koszykiem zlota od przegranego)', () => {
    for (const kind of ['pokoj', 'rozejm']) {
      const need = P.loserRequiredPnFromGap(gapFor(kind, relWar));
      const ev = E.evaluateProposal({ actionId: kind, proposerOwnerId: 1, responderOwnerId: 2,
        payload: { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: need }] } }, evalCtx(relWar));
      if (!(typeof ev.pwBalance === 'number' && ev.pwBalance >= 0)) return `${kind}: need=${need} pwBalance=${ev.pwBalance} ${ev.reason}`;
    }
    return true;
  });
  t('B15 rozejm tanszy niz pokoj (inna baza => inna cena)', () =>
    P.loserRequiredPnFromGap(gapFor('rozejm', relWar)) < P.loserRequiredPnFromGap(gapFor('pokoj', relWar)) || 'ceny');
  t('B16 rejestr zapamietuje rodzaj; pozniejszy pokoj podnosi rozejm, licznik nie jest odnawiany', () => {
    const st = new Map();
    P.registerAiPeaceRequest(st, 'k', 1, 2, 10, 'rozejm');
    const k1 = st.get('k').kind;
    P.registerAiPeaceRequest(st, 'k', 1, 2, 12, 'pokoj');
    P.registerAiPeaceRequest(st, 'k', 1, 2, 13, 'rozejm');
    return (k1 === 'rozejm' && st.get('k').kind === 'pokoj' && st.get('k').sinceTurn === 10) || JSON.stringify(st.get('k'));
  });

  // tick behawioralny: te same funkcje, ktore main.ts podpina przez deps (runAiAiPeaceTick)
  const mkTick = (o) => {
    const log = [];
    const store = new Map();
    const reqs = o.reqs || [{ kind: 'pokoj', since: 10 }];
    reqs.forEach((r, i) => store.set('p' + i, { requesterId: 1, otherId: 2 + i, sinceTurn: r.since, kind: r.kind }));
    const deps = {
      turn: o.turn, requests: store,
      eligible: o.eligible || (() => true),
      winnerShare: o.share || (() => 0.8),
      gate: () => ({ verdict: o.verdict || 'ok', priceMultiplier: 1 }),
      requiredPn: (l, w, kind) => (kind === 'rozejm' ? 200 : 500),
      assets: o.assets || (() => []),
      cityCessionOk: o.cityOk || (() => true),
      transfer: (l, w, lines) => log.push('transfer:' + lines.map(x => x.typ + ':' + x.id + ':' + x.ilosc).join('|')),
      finalize: (l, w, kind) => log.push('finalize:' + kind),
    };
    const out = P.runAiAiPeaceTick(deps);
    return { out, log, store };
  };
  t('B17 tick: platnosc zlotem przed limitem -> transfer PRZED finalize, pokoj, prosba skonsumowana przez finalize', () => {
    const { out, log } = mkTick({ turn: 10, assets: () => [gold(700)] });
    return (out[0].action === 'accept_paid' && log[0] === 'transfer:zloto:zloto:500' && log[1] === 'finalize:pokoj' && log.length === 2) || JSON.stringify([out[0], log]);
  });
  t('B18 tick: rozejm -> finalize z rodzajem rozejm i cena z bazy rozejmu (200)', () => {
    const { out, log } = mkTick({ turn: 10, reqs: [{ kind: 'rozejm', since: 10 }], assets: () => [gold(700)] });
    return (out[0].requiredPn === 200 && log[0] === 'transfer:zloto:zloto:200' && log[1] === 'finalize:rozejm') || JSON.stringify([out[0], log]);
  });
  t('B19 tick: brak majatku -> T i T+1 wait (bez finalize), T+2 force z platnoscia 0', () => {
    const a = mkTick({ turn: 10 }), b = mkTick({ turn: 11 }), c = mkTick({ turn: 12 });
    return (a.out[0].action === 'wait' && a.log.length === 0 && b.out[0].action === 'wait' && b.log.length === 0
      && c.out[0].action === 'force' && c.out[0].coveredPn === 0 && c.log[c.log.length - 1] === 'finalize:pokoj') || JSON.stringify([a.out[0].action, b.out[0].action, c.out[0].action]);
  });
  t('B20 tick: cesja miasta (zloto nie wystarcza), kolejnosc cesja->finalize, miasto niewykonalne omijane', () => {
    const assets = (l, w, skip) => [gold(100), city('c-ok', 450), city('c-bad', 400)].filter(a => !(a.kind === 'miasto' && skip.has(a.id)));
    const { out, log } = mkTick({ turn: 10, assets, cityOk: (id) => id !== 'c-bad' });
    const lines = log[0] || '';
    return (out[0].histogram.miasto === 1 && lines.includes('miasto:c-ok:1') && !lines.includes('c-bad') && log[1] === 'finalize:pokoj') || JSON.stringify([out[0].histogram, log]);
  });
  t('B21 tick: T+2 w tej samej turze po odroczeniu (aiTurnAwaitingBattle -> wznowienie) nadal wymusza pokoj', () => {
    // main.ts: tick siedzi w ogonie runAiPhase; wznowienie po bitwie (onResolved -> runAiPhase) wola go w TEJ SAMEJ turze.
    const first = mkTick({ turn: 12, assets: () => [] }); // wywolanie po wznowieniu, numer tury bez zmian
    return (first.out[0].action === 'force' && first.log.includes('finalize:pokoj')) || JSON.stringify(first.out[0]);
  });
  t('B22 tick: prosza strona wyraznie SILNIEJSZA (rw zwyciezcy 0.3) -> prosba odrzucona i skasowana; pat (0.45) -> platnosc', () => {
    const strong = mkTick({ turn: 12, share: () => 0.3 });
    const pat = mkTick({ turn: 10, share: () => 0.45, assets: () => [gold(700)] });
    return (strong.out[0].action === 'dropped_not_losing' && strong.log.length === 0 && strong.store.size === 0
      && pat.out[0].action === 'accept_paid') || JSON.stringify([strong.out[0].action, pat.out[0].action]);
  });
  t('B23 tick: para nieuprawniona (gracz / wojna wymuszona) -> brak pokoju, prosba skasowana', () => {
    const r = mkTick({ turn: 12, eligible: () => false });
    return (r.out[0].action === 'dropped_ineligible' && r.log.length === 0 && r.store.size === 0) || JSON.stringify(r.out[0]);
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

  t('C7 auto-oblezenie AI-AI end-to-end (funkcje silnika): obwarowane miasto AI + jednostka wroga AI przy murze -> kotwica + zgoda', () => {
    const ct = mkCity('cw', 2, 6, 4, { maMur: true });
    const auto = G.detectWarAutoSiegeOnCity(ct, [mkUnit('x1', 1, 5, 4)], () => true);
    return (auto && auto.oblegajacyOwnerId === 1 && G.aiAutoSiegeAllowed(ct.ownerId, auto.oblegajacyOwnerId, isHuman, isBarb) === true)
      || 'auto=' + JSON.stringify(auto && { o: auto.oblegajacyOwnerId });
  });

  // ---------------- straznik okablowania main.ts (tekstowy) ----------------
  const main = fs.existsSync(MAIN_TS) ? fs.readFileSync(MAIN_TS, 'utf8') : '';
  const wired = (name, needle) => t('W ' + name, () => main.includes(needle) || 'brak w main.ts: ' + needle.slice(0, 70));
  wired('main.ts: cele przez buildWarCityTargets', 'buildWarCityTargets({');
  wired('main.ts: rejestracja prosby AI->AI o pokoj', "cmd.type === 'zaproponuj_pokoj' || cmd.type === 'oferuj_trybut_za_pokoj'");
  wired('main.ts: tick pokoju po prosbie', 'tickAiAiPeaceRequests();');
  wired('main.ts: auto-oblezenie AI-AI', 'aiAutoSiegeAllowed(city.ownerId, auto.oblegajacyOwnerId');
  wired('main.ts: tick przez runAiAiPeaceTick', 'runAiAiPeaceTick({');
  wired('main.ts: rodzaj prosby przekazany z cmd.rodzaj', 'cmd.type === \'zaproponuj_pokoj\' ? cmd.rodzaj : undefined');
  wired('main.ts: rozejm finalizowany z truceTurns', 'finalizePeaceTreatyBetween(l, w, undefined, TRUCE_DEFAULT_TURNS)');
  wired('main.ts: cena z treatyBaseFairnessGap', 'treatyBaseFairnessGap(basePn, 0, 0, relationTotal(getDiploRelation(l, w)))');
  wired('main.ts: wznowienie po bitwie wola runAiPhase (T+2 odroczone, nie pominiete)', 'await runAiPhase();');
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
  { name: 'rozejm traktowany jak pokoj (rodzaj ignorowany)', file: 'game/diplomacy-ai-forced-peace.ts',
    from: "const kind: AiPeaceKind = req.kind ?? 'pokoj';", to: "const kind: AiPeaceKind = 'pokoj';" },
  { name: 'transfer po finalize / brak transferu', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'deps.transfer(loser, winner, plan.items.map', to: '(() => {})(loser, winner, plan.items.map' },
  { name: 'przegrany nie weryfikowany', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'return winnerShare >= AI_PEACE_WINNER_MIN_SHARE;', to: 'return true;' },
  { name: 'cena nie z wyceny (zawsze 0)', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'return Math.max(0, Math.ceil(gapEmptyBasket));', to: 'return 0;' },
  { name: 'cesja bez pre-kontroli wykonalnosci', file: 'game/diplomacy-ai-forced-peace.ts',
    from: 'if (!cityItem || deps.cityCessionOk(cityItem.id, loser, winner)) break;', to: 'break;' },
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
