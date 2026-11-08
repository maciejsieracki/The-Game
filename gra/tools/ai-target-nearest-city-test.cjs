'use strict';
/**
 * ai-target-nearest-city-test.cjs -- R-WEB-AI-TARGET-NEAREST-CITY-NOT-CAPITAL-Q1 (zgloszenie wlasciciela 2026-11-08).
 *
 * Zasada: AI w wojnie (z graczem albo z inna AI) idzie na NAJBLIZSZE miasto wroga, nie na jego stolice.
 * Stolica jest celem tylko wtedy, gdy jest najblizszym miastem (albo jedynym). Barbarzyncy jako atakujacy -- bez zmian.
 * Prawdziwe funkcje silnika (esbuild bundle z gra/src): buildWarCityTargets, planWarAllInCapital, decideAITurn.
 *
 *   node tools/ai-target-nearest-city-test.cjs     # exit 0 = GREEN
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');

function bundle() {
  const entry = path.resolve(__dirname, '.ai-target-nc-entry.ts');
  const out = path.resolve(__dirname, '.ai-target-nc-bundle.cjs');
  const J = (p) => JSON.stringify(path.join(SRC, p));
  fs.writeFileSync(entry, [
    `export { decideAITurn } from ${J('game/ai')};`,
    `export { setWarAllInCapitalOverride, planWarAllInCapital, isWarAllInCapitalEnabled } from ${J('game/warAllInCapital')};`,
    `export { setArmyConsolidationOverride } from ${J('game/army-consolidation')};`,
    `export { buildWarCityTargets, isNearestCityWarPair } from ${J('game/ai-war-target-select')};`,
  ].join('\n'), 'utf8');
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
    absWorkingDir: GRA_ROOT, logLevel: 'silent' });
  delete require.cache[out];
  const E = require(out);
  E._files = [entry, out];
  return E;
}
function cleanup(E) { for (const f of E._files || []) { try { fs.unlinkSync(f); } catch (_) { /* ok */ } } }

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
const mkCity = (id, ownerId, q, r) => ({ id, ownerId, q, r, name: id, population: 5 });

function suite(E) {
  const res = [];
  const t = (name, fn) => {
    try { const v = fn(); res.push({ name, ok: v === true, detail: v === true ? '' : String(v) }); }
    catch (e) { res.push({ name, ok: false, detail: 'WYJATEK: ' + String(e && e.message || e).slice(0, 200) }); }
  };
  const HUMAN = 0;
  const isHuman = (o) => o === HUMAN;
  const isBarb = (o) => o === 99;
  // Stolica = najstarsze (najmniejsze id) miasto wlasciciela -- jak fallback capitalCityIdForOwner.
  const capOf = (cities) => (o) => {
    const c = cities.filter(x => x.ownerId === o).sort((a, b) => (a.id < b.id ? -1 : 1))[0];
    return c ? c.id : null;
  };
  // Stolica gracza = 'a-cap' (wymuszona przez capitalCityIdForOwner w tescie).
  const capFixed = (capId) => () => capId;

  const targetsFor = (self, enemy, cities, capIdFn, units = []) => E.buildWarCityTargets({
    selfOwnerId: self, enemyOwnerIds: [enemy], engage: () => true, cities, combatUnits: units,
    isHuman, isBarbarian: isBarb, capitalCityIdForOwner: capIdFn,
  });
  // Pelny ruch AI: zwraca komendy ruchu jednostek `mine` przy aktywnej wojnie z `enemy`.
  const moveOf = (self, enemy, cities, capIdFn, mine) => {
    E.setWarAllInCapitalOverride(true);
    E.setArmyConsolidationOverride(false);
    const targets = targetsFor(self, enemy, cities, capIdFn);
    const cmds = E.decideAITurn(self, [...mine], cities, makeMap(40, 10), DATA,
      { canEngageOwner: (x) => x === enemy, currentTurn: 60, warAllIn: { targets } });
    return cmds.filter(c => c.type === 'move' && mine.some(u => u.id === c.unitId));
  };

  // ---- AI -> GRACZ ----
  t('P1 AI->gracz: 3 miasta, stolica NIE najblizsza -> cel = najblizsze miasto gracza', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-cap', HUMAN, 30, 4), mkCity('p-near', HUMAN, 12, 4), mkCity('p-mid', HUMAN, 20, 4)];
    const mine = [mkUnit('u1', 1, 3, 4), mkUnit('u2', 1, 3, 5), mkUnit('u3', 1, 4, 4)];
    const mv = moveOf(1, HUMAN, cities, capFixed('p-cap'), mine);
    if (mv.length === 0) return 'brak komend ruchu';
    const bad = mv.filter(c => c.targetCityId !== 'p-near');
    return bad.length === 0 || 'cel inny niz p-near: ' + JSON.stringify(bad.map(c => c.targetCityId));
  });
  t('P2 AI->gracz: lista celow = wszystkie 3 miasta gracza (nie 1)', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-cap', HUMAN, 30, 4), mkCity('p-near', HUMAN, 12, 4), mkCity('p-mid', HUMAN, 20, 4)];
    const tg = targetsFor(1, HUMAN, cities, capFixed('p-cap'));
    return (tg.length === 3 && ['p-cap', 'p-near', 'p-mid'].every(id => tg.some(x => x.cityId === id)))
      || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });
  t('P3 AI->gracz: stolica JEST najblizszym miastem -> cel = stolica', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-cap', HUMAN, 10, 4), mkCity('p-far', HUMAN, 30, 4)];
    const mine = [mkUnit('u1', 1, 3, 4), mkUnit('u2', 1, 3, 5)];
    const mv = moveOf(1, HUMAN, cities, capFixed('p-cap'), mine);
    return (mv.length > 0 && mv.every(c => c.targetCityId === 'p-cap')) || 'cele: ' + JSON.stringify(mv.map(c => c.targetCityId));
  });
  t('P4 AI->gracz: stolica jedynym miastem gracza -> cel = stolica', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-cap', HUMAN, 30, 4)];
    const tg = targetsFor(1, HUMAN, cities, capFixed('p-cap'));
    return (tg.length === 1 && tg[0].cityId === 'p-cap') || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });
  t('P5 AI->gracz: remis odleglosci -> slabiej broniony (pole defenders), potem nizsze id', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-up', HUMAN, 8, 4), mkCity('p-down', HUMAN, 7, 5)];
    const guards = [mkUnit('g1', HUMAN, 7, 5), mkUnit('g2', HUMAN, 7, 5)];
    const p = E.planWarAllInCapital([mkUnit('u1', 1, 4, 4)], targetsFor(1, HUMAN, cities, capFixed('p-up'), guards),
      { map: makeMap(40, 10), blocked: new Set(['8,4', '7,5']), occupied: new Set() });
    if (!p.orders[0] || p.orders[0].targetCityId !== 'p-up') return 'obroncy: ' + JSON.stringify(p.orders[0] && p.orders[0].targetCityId);
    const p2 = E.planWarAllInCapital([mkUnit('u1', 1, 4, 4)], targetsFor(1, HUMAN, cities, capFixed('p-up'), []),
      { map: makeMap(40, 10), blocked: new Set(['8,4', '7,5']), occupied: new Set() });
    return (p2.orders[0] && p2.orders[0].targetCityId === 'p-down') || 'bez obroncow: ' + JSON.stringify(p2.orders[0] && p2.orders[0].targetCityId);
  });
  t('P6 AI->gracz: brak wojny (engage=false) -> brak celow miast gracza', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-cap', HUMAN, 30, 4), mkCity('p-near', HUMAN, 12, 4)];
    const tg = E.buildWarCityTargets({ selfOwnerId: 1, enemyOwnerIds: [HUMAN], engage: () => false, cities, combatUnits: [],
      isHuman, isBarbarian: isBarb, capitalCityIdForOwner: capFixed('p-cap') });
    return tg.length === 0 || 'cele mimo braku wojny: ' + JSON.stringify(tg.map(x => x.cityId));
  });

  // ---- AI -> AI ----
  t('Q1 AI->AI: 3 miasta wroga, stolica NIE najblizsza -> najblizsze', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('a-cap', 2, 30, 4), mkCity('a-near', 2, 12, 4), mkCity('a-mid', 2, 20, 4)];
    const mine = [mkUnit('u1', 1, 3, 4), mkUnit('u2', 1, 3, 5)];
    const mv = moveOf(1, 2, cities, capFixed('a-cap'), mine);
    return (mv.length > 0 && mv.every(c => c.targetCityId === 'a-near')) || 'cele: ' + JSON.stringify(mv.map(c => c.targetCityId));
  });

  // ---- AI -> BARBARZYNCA (barbarzynca jako cel poza lista ownerIds; barbarzynca jako atakujacy bez zmian) ----
  t('R1 barbarzynca jako atakujacy: tylko stolica wroga (bez zmian)', () => {
    const cities = [mkCity('b1', 99, 0, 4), mkCity('a-cap', 2, 30, 4), mkCity('a-near', 2, 12, 4)];
    const tg = targetsFor(99, 2, cities, capFixed('a-cap'));
    return (tg.length === 1 && tg[0].cityId === 'a-cap') || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });
  t('R2 barbarzynca jako CEL nie wchodzi w zasade najblizszego miasta (stolica)', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('b-cap', 99, 30, 4), mkCity('b-near', 99, 12, 4)];
    const tg = E.buildWarCityTargets({ selfOwnerId: 1, enemyOwnerIds: [99], engage: () => true, cities, combatUnits: [],
      isHuman, isBarbarian: isBarb, capitalCityIdForOwner: capFixed('b-cap') });
    return (tg.length === 1 && tg[0].cityId === 'b-cap') || 'cele: ' + JSON.stringify(tg.map(x => x.cityId));
  });
  t('R3 isNearestCityWarPair: AI->gracz TAK, AI->AI TAK, barbarzynca-atakujacy NIE, cel barbarzynca NIE', () => {
    const ok = E.isNearestCityWarPair(1, HUMAN, isHuman, isBarb) === true
      && E.isNearestCityWarPair(1, 2, isHuman, isBarb) === true
      && E.isNearestCityWarPair(99, 2, isHuman, isBarb) === false
      && E.isNearestCityWarPair(1, 99, isHuman, isBarb) === false;
    return ok || 'zle wartosci pary';
  });

  // ---- SCIEZKA KAMPANII WODZA (appendAiGeneralCampaignOrders, stage 'attacking'): ten sam cel co war-allin ----
  // Kampania nie czyta warAllIn; cele marszu = opts.aiGeneralWarCampaign.targets (ustawiane w main.ts
  // prepareAiGeneralWarCampaign). Brak pola targets = stara stolica jako jedyny cel (zgodnosc wsteczna).
  const campaignMoves = (self, enemy, cities, capId, mine, targets) => {
    E.setWarAllInCapitalOverride(true);
    E.setArmyConsolidationOverride(false);
    const cap = cities.find(c => c.id === capId);
    const general = mine.find(u => u.isGeneral === true);
    const campaign = {
      targetOwnerId: enemy, stage: 'attacking', generalUnitId: general.id, gatherTurnsCompleted: 5,
      rallyQ: general.q, rallyR: general.r, target: { ownerId: enemy, cityId: cap.id, q: cap.q, r: cap.r },
      turn: 60, seaTravelAllowed: false, ...(targets ? { targets } : {}),
    };
    const cmds = E.decideAITurn(self, [...mine], cities, makeMap(40, 10), DATA,
      { canEngageOwner: (x) => x === enemy, currentTurn: 60, aiGeneralWarCampaign: campaign });
    return cmds.filter(c => c.type === 'move' && mine.some(u => u.id === c.unitId));
  };
  const general = (id, owner, q, r) => ({ ...mkUnit(id, owner, q, r), isGeneral: true });
  t('C1 kampania wodza AI->gracz: 3 miasta, stolica NIE najblizsza -> ruch na najblizsze miasto gracza', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-cap', HUMAN, 30, 4), mkCity('p-near', HUMAN, 12, 4), mkCity('p-mid', HUMAN, 20, 4)];
    const mine = [general('g1', 1, 3, 4), mkUnit('u1', 1, 3, 5), mkUnit('u2', 1, 4, 4)];
    const targets = targetsFor(1, HUMAN, cities, capFixed('p-cap'));
    const mv = campaignMoves(1, HUMAN, cities, 'p-cap', mine, targets);
    if (mv.length === 0) return 'brak komend ruchu kampanii';
    const bad = mv.filter(c => c.targetCityId !== 'p-near');
    return bad.length === 0 || 'kampania celuje w: ' + JSON.stringify([...new Set(bad.map(c => c.targetCityId))]);
  });
  t('C2 kampania wodza AI->AI: 3 miasta wroga, stolica NIE najblizsza -> najblizsze miasto', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('a-cap', 2, 30, 4), mkCity('a-near', 2, 12, 4), mkCity('a-mid', 2, 20, 4)];
    const mine = [general('g1', 1, 3, 4), mkUnit('u1', 1, 3, 5)];
    const targets = targetsFor(1, 2, cities, capFixed('a-cap'));
    const mv = campaignMoves(1, 2, cities, 'a-cap', mine, targets);
    if (mv.length === 0) return 'brak komend ruchu kampanii';
    const bad = mv.filter(c => c.targetCityId !== 'a-near');
    return bad.length === 0 || 'kampania celuje w: ' + JSON.stringify([...new Set(bad.map(c => c.targetCityId))]);
  });
  t('C3 kampania wodza, stolica JEST najblizsza -> cel = stolica (bez zmian)', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-cap', HUMAN, 10, 4), mkCity('p-far', HUMAN, 30, 4)];
    const mine = [general('g1', 1, 3, 4), mkUnit('u1', 1, 3, 5)];
    const targets = targetsFor(1, HUMAN, cities, capFixed('p-cap'));
    const mv = campaignMoves(1, HUMAN, cities, 'p-cap', mine, targets);
    return (mv.length > 0 && mv.every(c => c.targetCityId === 'p-cap')) || 'cele: ' + JSON.stringify(mv.map(c => c.targetCityId));
  });
  t('C4 kampania wodza bez pola targets (zapis sprzed zmiany) -> stara stolica jako cel', () => {
    const cities = [mkCity('m1', 1, 0, 4), mkCity('p-cap', HUMAN, 30, 4), mkCity('p-near', HUMAN, 12, 4)];
    const mine = [general('g1', 1, 3, 4), mkUnit('u1', 1, 3, 5)];
    const mv = campaignMoves(1, HUMAN, cities, 'p-cap', mine, undefined);
    return (mv.length > 0 && mv.every(c => c.targetCityId === 'p-cap')) || 'cele: ' + JSON.stringify(mv.map(c => c.targetCityId));
  });
  t('W2 main.ts: prepareAiGeneralWarCampaign buduje targets przez buildWarCityTargets i zwraca je w kampanii', () => {
    const src = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
    const i = src.indexOf('function prepareAiGeneralWarCampaign');
    const body = i >= 0 ? src.slice(i, i + 9000) : '';
    return (body.includes('buildWarCityTargets({') && body.includes('targets: campaignTargets')) || 'brak okablowania targets w kampanii';
  });
  t('W3 ai.ts: appendAiGeneralCampaignOrders przekazuje campaign.targets do applyWarAllInCapitalToCommands', () => {
    const ai = fs.readFileSync(path.join(SRC, 'game', 'ai.ts'), 'utf8');
    return ai.includes('targets: campaign.targets ?? [campaign.target]') || 'brak przekazania targets';
  });

  // ---- Flaga wylaczona: brak kontekstu war-allin, brak celow ----
  t('F1 flaga war-allin OFF: isWarAllInCapitalEnabled = false (sciezka legacy)', () => {
    E.setWarAllInCapitalOverride(false);
    const v = E.isWarAllInCapitalEnabled();
    E.setWarAllInCapitalOverride(null);
    return v === false || 'flaga wlaczona';
  });

  // ---- Okablowanie main.ts ----
  const mainPath = path.join(SRC, 'main.ts');
  const main = fs.readFileSync(mainPath, 'utf8');
  t('W main.ts: buildWarCityTargets wolane z warAllInContextFor (flaga ON -> kontekst)', () =>
    (main.includes('buildWarCityTargets({') && main.includes('if (!isWarAllInCapitalEnabled()) return undefined;')) || 'brak okablowania');
  return res;
}

function main() {
  const E = bundle();
  const results = suite(E);
  cleanup(E);
  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
    if (!r.ok) failed++;
  }
  console.log(`\nZESTAW: ${results.length - failed}/${results.length} PASS`);
  console.log(failed === 0 ? 'WYNIK: PASS' : 'WYNIK: FAIL');
  process.exit(failed === 0 ? 0 : 1);
}
try { main(); } catch (e) { console.log('FAIL (bundle/runtime): ' + String(e && e.message || e).slice(0, 300)); process.exit(1); }
