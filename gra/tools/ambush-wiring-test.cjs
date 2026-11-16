'use strict';
/**
 * R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (runda 3) -- test WPIECIA zasadzki na realnym kodzie:
 *  (A) pathfinding wroga (buildMoveOccupancy + computePath z units/setup.ts) -- heks zasadzki wroga w WOJNIE jest dla
 *      ruchu pusty; dla sojusznika/pokoju i dla pustego predykatu nadal zajety; wlasciciel widzi swoj stos (passThrough);
 *  (B) truncatePathAtAmbush -- ruch staje PRZED zasadzka, zasadzka tuz przy starcie = pusta trasa;
 *  (C) reconcileAmbush -- cykl zycia: ruch/odwrot (zmiana heksu), miasto, zmiana wlasciciela, sentry/fortyfikacja,
 *      scalenie (grupa mieszana ujawnia), podzial (odeszla czesc traci, reszta zostaje);
 *  (D) decideAITurn (ai.ts) -- AI nie widzi zasadzki wroga; mutacja (filtr wylaczony) zmienia decyzje AI;
 *  (E) strukturalnie: wpiecie w main.ts we wszystkich sciezkach ruchu (gracz animowany, gracz koniec tury, AI);
 *  (F) zapis: pola ambush + ambushAt przez realne serializeGame/deserializeGame, stary zapis bez pola.
 * Uruchomienie: node gra/tools/ambush-wiring-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'ambush-wiring-'));
let pass = 0;
let fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('PASS: ' + name); }
  catch (e) { fail++; console.log('FAIL: ' + name + ' -- ' + (e && e.message ? e.message : String(e))); }
}

async function buildBundle(name, mutateAi) {
  const entry = path.join(WORK, name + '-entry.ts');
  const out = path.join(WORK, name + '-bundle.cjs');
  fs.writeFileSync(entry, `
export * from ${JSON.stringify(path.join(SRC, 'game/ambush.ts'))};
export { buildMoveOccupancy, computePath, keyOf } from ${JSON.stringify(path.join(SRC, 'units/setup.ts'))};
export { decideAITurn } from ${JSON.stringify(path.join(SRC, 'game/ai.ts'))};
export { serializeGame, deserializeGame } from ${JSON.stringify(path.join(SRC, 'game/save.ts'))};
`);
  const plugin = {
    name: 'mutate-ai',
    setup(b) {
      b.onLoad({ filter: /game[\\/]ai\.ts$/ }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        if (mutateAi) {
          const gate = 'if (units.some(u => u.ambush === true && u.ownerId !== playerId)) {';
          if (text.split(gate).length !== 2) throw new Error('mutacja: brak dokladnie jednego filtra w ai.ts');
          text = text.replace(gate, 'if (false) {');
        }
        return { contents: text, loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
    loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin],
  });
  return require(out);
}

const makeMap = (w, h) => {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
};
const unit = (over) => Object.assign({
  id: 'u', typeId: 'Wojownik', category: 'miecznik', ownerId: 0, q: 5, r: 5, hp: 10, ruch: 2, ruchLeft: 2,
}, over);

(async () => {
  const B = await buildBundle('ok', false);
  const BM = await buildBundle('mut', true);
  const AT_WAR = (a, b) => a !== b;
  const NOT_WAR = () => false;
  const map = makeMap(30, 30);

  // ---- (A) pathfinding ----
  check('A1 zasadzka wroga w wojnie NIE blokuje heksu (predykat podany)', () => {
    const units = [unit({ id: 'amb', ownerId: 0, q: 8, r: 5, ambush: true, ambushAt: '8,5,0' }), unit({ id: 'mv', ownerId: 1, q: 5, r: 5 })];
    const occ = B.buildMoveOccupancy(units, 1, ['mv'], AT_WAR);
    assert.equal(occ.has(B.keyOf(8, 5)), false);
  });
  check('A2 bez predykatu zasadzka liczy sie jak zwykla jednostka (zachowanie sprzed zasadzki)', () => {
    const units = [unit({ id: 'amb', ownerId: 0, q: 8, r: 5, ambush: true })];
    assert.equal(B.buildMoveOccupancy(units, 1, [], undefined).has(B.keyOf(8, 5)), true);
  });
  check('A3 wobec nie-wroga (pokoj/sojusz) heks zasadzki nadal zajety (brak nakladania jednostek)', () => {
    const units = [unit({ id: 'amb', ownerId: 0, q: 8, r: 5, ambush: true })];
    assert.equal(B.buildMoveOccupancy(units, 1, [], NOT_WAR).has(B.keyOf(8, 5)), true);
  });
  check('A4 wlasciciel widzi swoj stos: passThrough, nie blokada obca', () => {
    const units = [unit({ id: 'amb', ownerId: 0, q: 8, r: 5, ambush: true })];
    const occ = B.buildMoveOccupancy(units, 0, [], AT_WAR);
    assert.equal(occ.has(B.keyOf(8, 5)), false);
    assert.equal(occ.passThrough.has(B.keyOf(8, 5)), true);
  });
  check('A5 realny computePath wroga prowadzi PRZEZ heks zasadzki (bez ukrycia musialby omijac)', () => {
    const units = [unit({ id: 'amb', ownerId: 0, q: 8, r: 5, ambush: true })];
    const mover = unit({ id: 'mv', ownerId: 1, q: 5, r: 5 });
    const occHidden = B.buildMoveOccupancy(units, 1, ['mv'], AT_WAR);
    const occSeen = B.buildMoveOccupancy(units, 1, ['mv']);
    const pHidden = B.computePath(mover, map, 11, 5, occHidden);
    const pSeen = B.computePath(mover, map, 11, 5, occSeen);
    assert.ok(pHidden.some(h => h.q === 8 && h.r === 5), 'trasa wroga idzie przez zasadzke');
    assert.ok(!pSeen.some(h => h.q === 8 && h.r === 5), 'bez ukrycia trasa omija heks');
  });

  // ---- (B) obciecie trasy ----
  check('B1 trasa przez zasadzke konczy sie PRZED nia, ambushHex ustawiony', () => {
    const units = [unit({ id: 'amb', ownerId: 0, q: 8, r: 5, ambush: true })];
    const p = [6, 7, 8, 9, 10].map(q => ({ q, r: 5 }));
    const cut = B.truncatePathAtAmbush(units, p, 1, AT_WAR);
    assert.deepEqual(cut.path.map(h => h.q), [6, 7]);
    assert.deepEqual(cut.ambushHex, { q: 8, r: 5 });
  });
  check('B2 zasadzka tuz przy starcie = pusta trasa + ambushHex', () => {
    const units = [unit({ id: 'amb', ownerId: 0, q: 6, r: 5, ambush: true })];
    const cut = B.truncatePathAtAmbush(units, [{ q: 6, r: 5 }, { q: 7, r: 5 }], 1, AT_WAR);
    assert.equal(cut.path.length, 0);
    assert.deepEqual(cut.ambushHex, { q: 6, r: 5 });
  });
  check('B3 wlasna zasadzka / pokoj / brak zasadzek -> trasa bez zmian', () => {
    const p = [6, 7, 8].map(q => ({ q, r: 5 }));
    const own = [unit({ id: 'amb', ownerId: 1, q: 7, r: 5, ambush: true })];
    assert.equal(B.truncatePathAtAmbush(own, p, 1, AT_WAR).ambushHex, undefined);
    const peace = [unit({ id: 'amb', ownerId: 0, q: 7, r: 5, ambush: true })];
    assert.equal(B.truncatePathAtAmbush(peace, p, 1, NOT_WAR).ambushHex, undefined);
    assert.equal(B.truncatePathAtAmbush([unit({})], p, 1, AT_WAR).path.length, 3);
  });
  check('B4 realne resolveAmbushTrigger: wyzwolenie zdejmuje stan (ambush + ambushAt) calego stosu', () => {
    const units = [unit({ id: 'a1', ownerId: 0, q: 8, r: 5, ambush: true, ambushAt: '8,5,0' }), unit({ id: 'a2', ownerId: 0, q: 8, r: 5, ambush: true, ambushAt: '8,5,0' })];
    const res = B.resolveAmbushTrigger(units, 8, 5, 1, AT_WAR);
    assert.equal(res.triggered, true);
    assert.equal(res.revealed.length, 2);
    assert.ok(units.every(u => u.ambush === undefined && u.ambushAt === undefined));
  });
  check('B5 sojusznik/pokoj/wlasciciel NIE wyzwala (brak mutacji)', () => {
    const units = [unit({ id: 'a1', ownerId: 0, q: 8, r: 5, ambush: true, ambushAt: '8,5,0' })];
    assert.equal(B.resolveAmbushTrigger(units, 8, 5, 1, NOT_WAR).triggered, false);
    assert.equal(B.resolveAmbushTrigger(units, 8, 5, 0, () => true).triggered, false);
    assert.equal(units[0].ambush, true);
  });

  // ---- (C) cykl zycia ----
  const noCity = () => false;
  const stamp = (u) => { u.ambush = true; u.ambushAt = u.q + ',' + u.r + ',' + u.ownerId; return u; };
  check('C1 stan zgodny z pieczecia zostaje (brak falszywych anulowan)', () => {
    const us = [stamp(unit({ id: 'a' })), stamp(unit({ id: 'b' }))];
    assert.equal(B.reconcileAmbush(us, noCity), 0);
    assert.ok(us.every(u => u.ambush === true));
  });
  check('C2 odwrot/relokacja (zmiana heksu) zdejmuje zasadzke', () => {
    const us = [stamp(unit({ id: 'a' }))];
    us[0].q = 6;
    assert.equal(B.reconcileAmbush(us, noCity), 1);
    assert.equal(us[0].ambush, undefined);
    assert.equal(us[0].ambushAt, undefined);
  });
  check('C3 wejscie do miasta zdejmuje zasadzke', () => {
    const us = [stamp(unit({ id: 'a' }))];
    assert.equal(B.reconcileAmbush(us, (q, r) => q === 5 && r === 5), 1);
    assert.equal(us[0].ambush, undefined);
  });
  check('C4 zmiana wlasciciela zdejmuje zasadzke', () => {
    const us = [stamp(unit({ id: 'a' }))];
    us[0].ownerId = 2;
    assert.equal(B.reconcileAmbush(us, noCity), 1);
  });
  check('C5 sentry / garnizon / fortyfikacja / oblezenie wykluczaja zasadzke', () => {
    for (const over of [{ sentry: true }, { inGarnizon: true }, { ufortyfikowanyWPolu: true }, { oblegaCityId: 'c1' }]) {
      const us = [stamp(unit({ id: 'a', ...over }))];
      assert.equal(B.reconcileAmbush(us, noCity), 1, JSON.stringify(over));
    }
  });
  check('C6 scalenie: dolaczenie widocznej jednostki do stosu w zasadzce ujawnia caly stos', () => {
    const us = [stamp(unit({ id: 'a', stackGroupId: 'g1' })), stamp(unit({ id: 'b', stackGroupId: 'g1' })), unit({ id: 'n', stackGroupId: 'g1' })];
    assert.equal(B.reconcileAmbush(us, noCity), 2);
    assert.ok(us.every(u => u.ambush === undefined));
  });
  check('C7 podzial: czesc, ktora odeszla, traci zasadzke; reszta zostaje', () => {
    const us = [stamp(unit({ id: 'a', stackGroupId: 'g1' })), stamp(unit({ id: 'b', stackGroupId: 'g1' }))];
    us[1].q = 6; us[1].stackGroupId = 'g2';
    assert.equal(B.reconcileAmbush(us, noCity), 1);
    assert.equal(us[0].ambush, true);
    assert.equal(us[1].ambush, undefined);
  });
  check('C8 stary zapis: ambush bez ambushAt dostaje pieczec, nie jest anulowany', () => {
    const us = [unit({ id: 'a', ambush: true })];
    assert.equal(B.reconcileAmbush(us, noCity), 0);
    assert.equal(us[0].ambushAt, '5,5,0');
  });
  check('C9 brak zasadzek = zero pracy', () => {
    assert.equal(B.reconcileAmbush([unit({}), unit({ id: 'b' })], noCity), 0);
  });
  check('C10 setAmbush stempluje; cancelAmbush czyści oba pola', () => {
    const st = [unit({ id: 'a' }), unit({ id: 'b' })];
    B.setAmbush(st);
    assert.ok(st.every(u => u.ambush === true && u.ambushAt === '5,5,0' && u.ruchLeft === 0));
    B.cancelAmbush(st);
    assert.ok(st.every(u => u.ambush === undefined && u.ambushAt === undefined));
  });

  // ---- (D) AI nie widzi zasadzki wroga ----
  const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
  const cities = [{ id: 'cA', ownerId: 1, q: 3, r: 3, name: 'A', population: 5 }, { id: 'cB', ownerId: 0, q: 25, r: 25, name: 'B', population: 5 }];
  const aiOpts = { civType: 'grecy', currentTurn: 50, canEngageOwner: () => true, capitalCityId: 'cA', atWarWithCiv: true };
  const runAi = (Bundle, enemyAmbush) => {
    const ai = unit({ id: 'ai1', ownerId: 1, q: 10, r: 10 });
    const enemy = unit({ id: 'en1', ownerId: 0, q: 11, r: 10, ...(enemyAmbush ? { ambush: true, ambushAt: '11,10,0' } : {}) });
    return Bundle.decideAITurn(1, [ai, enemy], cities, map, data, aiOpts);
  };
  check('D1 kontrola: widoczny wrog obok -> AI planuje cos wobec niego (atak)', () => {
    const cmds = runAi(B, false);
    assert.ok(cmds.some(c => c.targetUnitId === 'en1'), 'AI ma zaatakowac widoczna jednostke: ' + JSON.stringify(cmds));
  });
  check('D2 zasadzka wroga: AI nie celuje w ukryta jednostke', () => {
    const cmds = runAi(B, true);
    assert.ok(!cmds.some(c => c.targetUnitId === 'en1'), 'AI zaatakowalo ukryta zasadzke: ' + JSON.stringify(cmds));
  });
  check('D3 decideAITurn nie mutuje listy jednostek wywolujacego', () => {
    const ai = unit({ id: 'ai1', ownerId: 1, q: 10, r: 10 });
    const enemy = unit({ id: 'en1', ownerId: 0, q: 11, r: 10, ambush: true });
    const arr = [ai, enemy];
    B.decideAITurn(1, arr, cities, map, data, aiOpts);
    assert.equal(arr.length, 2);
    assert.equal(enemy.ambush, true);
  });
  check('D4 MUTACJA (filtr AI wylaczony) zmienia decyzje AI -> test chroni filtr', () => {
    const cmds = runAi(BM, true);
    assert.ok(cmds.some(c => c.targetUnitId === 'en1'), 'bez filtra AI powinno atakowac ukryta jednostke: ' + JSON.stringify(cmds));
  });

  // ---- (E) strukturalnie: wpiecie w main.ts ----
  const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  check('E1 wpiecie w main.ts: gracz animowany + koniec tury + AI + occupiedForMove + cykl zycia + komunikaty', () => {
    const calls = mainSrc.split('fireAmbushOnHex(').length - 1;
    assert.ok(calls >= 5, 'oczekiwano >=5 wystapien (def + wolania), jest ' + calls);
    assert.ok(mainSrc.includes('truncatePathAtAmbush(units, movePath, u.ownerId, areEnemyOwners)'), 'startAnimatedMove');
    assert.ok(mainSrc.includes('truncatePathAtAmbush(units, result.movePath, u.ownerId, areEnemyOwners)'), 'applyMarchSegmentInstant');
    assert.ok(mainSrc.includes('truncatePathAtAmbush(units, fullPathIn, ownerId, areEnemyOwners)'), 'executor AI');
    assert.ok(mainSrc.includes("type: 'attack', unitId: u.id, targetUnitId: ambDef.id, ambush: true"), 'AI atak');
    assert.ok(mainSrc.includes('buildMoveOccupancy(units, moverOwnerId, exceptIds, areEnemyOwners)'), 'occupiedForMove');
    assert.ok(mainSrc.includes('reconcileAmbush(units,'), 'cykl zycia w syncUnitsRender');
    assert.ok(mainSrc.includes("'Wpadłeś w zasadzkę!'") && mainSrc.includes("'Zasadzka się powiodła'"), 'komunikaty');
  });

  // ---- (F) zapis ----
  const makeSave = (units) => ({ wersja: 3, tura: 12, seed: 7, units, cities: [], exploredByHuman: [], gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0, meta: {} });
  check('F1 ambush + ambushAt przezywaja realne serializeGame/deserializeGame; reconcile ich nie rusza', () => {
    const back = B.deserializeGame(B.serializeGame(makeSave([stamp(unit({ id: 'a', ruchLeft: 0 }))])));
    assert.equal(back.units[0].ambush, true);
    assert.equal(back.units[0].ambushAt, '5,5,0');
    assert.equal(B.reconcileAmbush(back.units, noCity), 0);
  });
  check('F2 stary zapis bez pol OK; smieci w ambush normalizowane (razem z ambushAt)', () => {
    const back = B.deserializeGame(JSON.stringify(makeSave([unit({ id: 'a' }), unit({ id: 'b', ambush: 'tak', ambushAt: '1,1,1' })])));
    assert.equal(back.units[0].ambush, undefined);
    assert.equal(back.units[1].ambush, undefined);
    assert.equal(back.units[1].ambushAt, undefined);
  });

  fs.rmSync(WORK, { recursive: true, force: true });
  console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
