'use strict';
/**
 * R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (runda 4) -- test REALNEGO KROKU RUCHU wobec zasadzki.
 *
 * Wolany jest prawdziwy kod (bundle esbuild): jadro kroku ruchu `game/ambushMove.ts` (to samo, ktore wola main.ts),
 * prawdziwy `executeAiCityMove`, `decideBarbarianMoves`, `buildMoveOccupancy`/`computePath`, `unitsVisibleOnMap`,
 * `computeDiplomaticContacts`, oraz prawdziwe UI (`createArmyStackHud`, `createArmyListHud`, `buildUnitExtraStatusLinesHtml`)
 * w jsdom. Zadne asercje nie czytaja tekstu main.ts.
 *
 * MUTACJE: te same scenariusze uruchamiane na zrodle z jedna wstrzykniêta usterka -- kazda MUSI dac >= 1 FAIL
 * (M2 releaseAmbushOnMoveOrder, M3 reconcile bez miast, M4 guard launchAttack, M7 ownerId==mover, M9 filtr widza,
 * M10 filtr planisty, M11 mapa, M12 kontakt dyplomatyczny, M13 dystans po ruchu, M14 lista armii, M15 panel stosu,
 * M16 karta jednostki).
 * Uruchomienie: node gra/tools/ambush-realstep-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require(path.resolve(__dirname, '..', 'node_modules', 'jsdom'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'ambush-realstep-'));

// jsdom jako globalny dokument (UI tworzy elementy przez document.createElement).
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;

/** Mutacje: plik (regex sciezki) + dokladny fragment -> zamiennik. */
const MUTANTS = {
  M2: { file: /game[\\/]ambushMove\.ts$/, from: 'export function releaseAmbushOnMoveOrder(stack: RuntimeUnit[]): void {\n  cancelAmbush(stack);', to: 'export function releaseAmbushOnMoveOrder(stack: RuntimeUnit[]): void {' },
  M18: { file: /game[\\/]ambushMove\.ts$/, from: "if (plan.kind !== 'clear') {\n      ambushHex = plan.ambushHex;", to: "if (false) {\n      ambushHex = plan.ambushHex;" },
  M19: { file: /game[\\/]ambushMove\.ts$/, from: "  const order = resolveAmbushAfterMove(units, barb, ambushHex, isAtWar);\n  if (order === undefined) return undefined;\n  return { cmd:", to: "  const order = resolveAmbushAfterMove(units, barb, ambushHex, isAtWar);\n  if (order !== undefined) return undefined;\n  return { cmd:" },
  M3: { file: /game[\\/]ambushMove\.ts$/, from: '(q, r) => cities.some(c => c.q === q && c.r === r)', to: '() => false' },
  M4: { file: /game[\\/]ambushMove\.ts$/, from: "if (!launchAttack) return { kind: 'blocked', path: [], ambushHex: cut.ambushHex };", to: '' },
  M7: { file: /game[\\/]ambush\.ts$/, from: 'u => u.q === q && u.r === r && isUnitAmbushed(u)\n      && u.ownerId !== moverOwnerId && isAtWar(moverOwnerId, u.ownerId),', to: 'u => u.q === q && u.r === r && isUnitAmbushed(u)\n      && isAtWar(moverOwnerId, u.ownerId),' },
  M9: { file: /game[\\/]ambushMove\.ts$/, from: 'return unitsVisibleToViewer(units, viewerOwnerId);', to: 'return units.slice();' },
  M10: { file: /game[\\/]ambushMove\.ts$/, from: 'if (!units.some(u => u.ambush === true && u.ownerId !== plannerOwnerId && canEngage(u.ownerId))) return units;', to: 'return units;' },
  M11: { file: /game[\\/]visibility\.ts$/, from: 'if (u.ambush === true && u.ownerId !== playerOwnerId) return false;', to: '' },
  M12: { file: /game[\\/]diplomacy-layers\.ts$/, from: '    if (u.ambush === true) continue;\n', to: '' },
  M13: { file: /game[\\/]ambushMove\.ts$/, from: 'if (hexDistance(mover.q, mover.r, ambushHex.q, ambushHex.r) !== 1) return undefined;', to: '' },
  M14: { file: /ui[\\/]sideListHud\.css\.ts$/, from: "if (entry.ambush) return { text: 'w zasadzce', variant: 'green' };", to: '' },
  M15: { file: /ui[\\/]armyStackHud\.ts$/, from: 'st.ambushed === true ?', to: 'false ?' },
  M16: { file: /ui[\\/]unitCardStatus\.ts$/, from: 'if (input.ambush) {', to: 'if (false) {' },
  M17: { file: /ui[\\/]hexContextTooltip\.ts$/, from: 'const ambushChip = u.ambush === true', to: 'const ambushChip = false' },
};

async function buildBundle(name, mutantKey) {
  const entry = path.join(WORK, name + '-entry.ts');
  const out = path.join(WORK, name + '-bundle.cjs');
  fs.writeFileSync(entry, `
export * from ${JSON.stringify(path.join(SRC, 'game/ambush.ts'))};
export * from ${JSON.stringify(path.join(SRC, 'game/ambushMove.ts'))};
export { buildMoveOccupancy, computePath, keyOf } from ${JSON.stringify(path.join(SRC, 'units/setup.ts'))};
export { executeAiCityMove } from ${JSON.stringify(path.join(SRC, 'game/ai-city-capture-executor.ts'))};
export { decideBarbarianMoves, FALLBACK_BARB_PARAMS } from ${JSON.stringify(path.join(SRC, 'game/barbarians.ts'))};
export { findSplitDestHexes } from ${JSON.stringify(path.join(SRC, 'game/armyMerge.ts'))};
export { unitsVisibleOnMap } from ${JSON.stringify(path.join(SRC, 'game/visibility.ts'))};
export { computeDiplomaticContacts } from ${JSON.stringify(path.join(SRC, 'game/diplomacy-layers.ts'))};
export { armyStatusBadge } from ${JSON.stringify(path.join(SRC, 'ui/sideListHud.css.ts'))};
export { buildUnitExtraStatusLinesHtml } from ${JSON.stringify(path.join(SRC, 'ui/unitCardStatus.ts'))};
export { createArmyStackHud } from ${JSON.stringify(path.join(SRC, 'ui/armyStackHud.ts'))};
export { createArmyListHud } from ${JSON.stringify(path.join(SRC, 'ui/armyListHud.ts'))};
export { buildUnitContextTooltipHtml } from ${JSON.stringify(path.join(SRC, 'ui/hexContextTooltip.ts'))};
`);
  const mut = mutantKey ? MUTANTS[mutantKey] : null;
  let applied = 0;
  const plugin = {
    name: 'mutate',
    setup(b) {
      b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: path.resolve(__dirname, '.stubs', 'ambush-realstep-brandAssets-stub.ts') }));
      if (!mut) return;
      b.onLoad({ filter: mut.file }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        if (text.split(mut.from).length !== 2) throw new Error(`mutacja ${mutantKey}: fragment nie wystepuje dokladnie raz w ${args.path}`);
        text = text.replace(mut.from, mut.to);
        applied++;
        return { contents: text, loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl' }, absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin],
  });
  if (mut && applied !== 1) throw new Error(`mutacja ${mutantKey}: zastosowana ${applied} razy`);
  delete require.cache[require.resolve(out)];
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
  id: 'u', typeId: 'Wojownik', category: 'miecznik', ownerId: 0, q: 5, r: 5, hp: 10, ruch: 6, ruchLeft: 6,
}, over);
const ambushed = (over) => {
  const u = unit(over);
  u.ambush = true;
  u.ambushAt = u.q + ',' + u.r + ',' + u.ownerId;
  return u;
};

/** Wszystkie scenariusze; zwraca liste bledow (puste = zielono). */
function runScenarios(B) {
  const errors = [];
  const check = (name, fn) => {
    try { fn(); } catch (e) { errors.push(name + ' -- ' + (e && e.message ? e.message.split('\n')[0] : String(e))); }
  };
  const map = makeMap(30, 12);
  const AT_WAR = (a, b) => a !== b;
  const NO_WAR = () => false;
  const line = (from, to) => { const out = []; for (let q = from; q <= to; q++) out.push({ q, r: 5 }); return out; };

  // ---- krok ruchu gracza (startAnimatedMove) na prawdziwym pathfindingu ----
  check('S1 gracz: trasa przez zasadzke AI konczy sie przed nia, bitwa po dojsciu, brak nakladania', () => {
    const mover = unit({ id: 'p1', ownerId: 0, q: 5, r: 5 });
    const amb = [ambushed({ id: 'a1', ownerId: 1, q: 8, r: 5 }), ambushed({ id: 'a2', ownerId: 1, q: 8, r: 5 })];
    const units = [mover, ...amb];
    const occ = B.buildMoveOccupancy(units, 0, ['p1'], AT_WAR);
    const path = B.computePath(mover, map, 11, 5, occ);
    assert.ok(path.some(h => h.q === 8 && h.r === 5), 'pathfinding prowadzi przez heks zasadzki (dla wroga pusty)');
    const plan = B.planPlayerAmbushMove(units, path, 0, AT_WAR, true);
    assert.equal(plan.kind, 'cut');
    assert.deepEqual(plan.ambushHex, { q: 8, r: 5 });
    const last = plan.path[plan.path.length - 1];
    assert.deepEqual({ q: last.q, r: last.r }, { q: 7, r: 5 }, 'ruch staje na heksie PRZED zasadzka');
    mover.q = last.q; mover.r = last.r;
    const order = B.resolveAmbushAfterMove(units, mover, plan.ambushHex, AT_WAR);
    assert.ok(order, 'po dojsciu otwiera sie bitwa');
    assert.equal(order.revealed.length, 2);
    assert.ok(amb.every(u => u.ambush === undefined && u.ambushAt === undefined), 'stan zdjety');
    assert.ok(!units.some(u => u.id !== 'p1' && u.q === mover.q && u.r === mover.r), 'brak dwoch jednostek na jednym heksie');
  });
  check('S2 zasadzka tuz przy starcie: pusta trasa => fire-now', () => {
    const units = [unit({ id: 'p1', q: 5, r: 5 }), ambushed({ id: 'a1', ownerId: 1, q: 6, r: 5 })];
    const plan = B.planPlayerAmbushMove(units, line(6, 9), 0, AT_WAR, true);
    assert.equal(plan.kind, 'fire-now');
    assert.equal(plan.path.length, 0);
  });
  check('S3 M4: koniec tury bez prawa do bitwy (launchAttack=false) => ruch zablokowany, zasadzka nietknieta', () => {
    const units = [unit({ id: 'p1' }), ambushed({ id: 'a1', ownerId: 1, q: 8, r: 5 })];
    const plan = B.planPlayerAmbushMove(units, line(6, 10), 0, AT_WAR, false);
    assert.equal(plan.kind, 'blocked');
    assert.equal(units[1].ambush, true);
  });
  check('S4 sojusznik / pokoj / wlasna zasadzka: trasa bez zmian, brak wyzwolenia, heks nadal zajety', () => {
    const own = [unit({ id: 'p1', ownerId: 0 }), ambushed({ id: 'a1', ownerId: 0, q: 8, r: 5 })];
    assert.equal(B.planPlayerAmbushMove(own, line(6, 10), 0, AT_WAR, true).kind, 'clear');
    const peace = [unit({ id: 'p1', ownerId: 0 }), ambushed({ id: 'a1', ownerId: 1, q: 8, r: 5 })];
    assert.equal(B.planPlayerAmbushMove(peace, line(6, 10), 0, NO_WAR, true).kind, 'clear');
    assert.equal(B.buildMoveOccupancy(peace, 0, ['p1'], NO_WAR).has(B.keyOf(8, 5)), true, 'pokoj: heks zajety (brak nakladania)');
    assert.equal(B.resolveAmbushAfterMove(peace, unit({ q: 7, r: 5 }), { q: 8, r: 5 }, NO_WAR), undefined);
    assert.equal(peace[1].ambush, true, 'zasadzka przetrwala kontakt z nie-wrogiem');
  });
  check('S5 M7: wlasciciel zasadzki nie wyzwala wlasnej zasadzki', () => {
    const units = [ambushed({ id: 'a1', ownerId: 1, q: 8, r: 5 })];
    const res = B.resolveAmbushTrigger(units, 8, 5, 1, () => true);
    assert.equal(res.triggered, false);
    assert.equal(units[0].ambush, true);
  });
  check('S6 M2: rozkaz ruchu zdejmuje zasadzke z poruszajacego sie stosu (przed jakakolwiek synchronizacja)', () => {
    const st = [ambushed({ id: 'a1' }), ambushed({ id: 'a2' })];
    B.releaseAmbushOnMoveOrder(st);
    assert.ok(st.every(u => u.ambush === undefined && u.ambushAt === undefined));
  });
  check('S7 M3: reconcile w swiecie zdejmuje zasadzke na heksie miasta, zostawia w polu', () => {
    const inCity = [ambushed({ id: 'a1', q: 5, r: 5 })];
    assert.equal(B.reconcileAmbushInWorld(inCity, [{ q: 5, r: 5 }]), 1);
    assert.equal(inCity[0].ambush, undefined);
    const inField = [ambushed({ id: 'a2', q: 5, r: 5 })];
    assert.equal(B.reconcileAmbushInWorld(inField, [{ q: 9, r: 9 }]), 0);
    assert.equal(inField[0].ambush, true);
  });

  // ---- krok ruchu AI: prawdziwy executeAiCityMove + przycinacz z main.ts ----
  check('S8 AI: executeAiCityMove z przycinaczem konczy ruch przed zasadzka gracza, potem rozkaz ataku na ujawniona', () => {
    const ai = unit({ id: 'ai1', ownerId: 1, q: 5, r: 5, ruchLeft: 8 });
    const amb = [ambushed({ id: 'pa1', ownerId: 0, q: 9, r: 5 })];
    const units = [ai, ...amb];
    const cutter = B.makeAmbushPathCutter(units, 1, AT_WAR);
    const res = B.executeAiCityMove({
      command: { unitId: 'ai1', toQ: 12, toR: 5 }, unit: ai, cities: [], cityBuiltIds: [], hasCityDefenders: false,
      unitIsCivilian: false, targetVisible: true, canOccupyCityHex: true, canEngageOwner: () => true,
      blockedKeys: B.buildMoveOccupancy(units, 1, ['ai1'], AT_WAR), destinationKey: B.keyOf(12, 5),
      computePath: (_u, toQ, toR, occ) => B.computePath(ai, map, toQ, toR, occ),
      truncatePath: (p) => cutter.cut(p),
    });
    assert.equal(res.moved, true);
    assert.equal(ai.q, 8, 'AI stanelo na heksie przed zasadzka');
    const order = B.resolveAmbushAfterMove(units, ai, cutter.hit(), AT_WAR);
    assert.ok(order && order.defender.id === 'pa1', 'ujawniona zasadzka gracza = obronca');
    assert.equal(amb[0].ambush, undefined);
    assert.ok(!units.some(u => u.id !== 'ai1' && u.q === ai.q && u.r === ai.r));
  });
  check('S9 M13: AI, ktore po ruchu stoi DALEJ niz 1 heks od zasadzki, jej nie wyzwala', () => {
    const ai = unit({ id: 'ai1', ownerId: 1, q: 5, r: 5, ruchLeft: 2 });
    const amb = [ambushed({ id: 'pa1', ownerId: 0, q: 12, r: 5 })];
    const units = [ai, ...amb];
    // AI przesuwa sie o 2 heksy w strone zasadzki, ale trasa nie dotyka jeszcze heksu zasadzki
    ai.q = 7;
    assert.equal(B.resolveAmbushAfterMove(units, ai, { q: 12, r: 5 }, AT_WAR), undefined);
    assert.equal(amb[0].ambush, true);
  });

  // ---- barbarzyncy ----
  const BARB = -1;
  const barb = (id, q, r) => ({ id, ownerId: BARB, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2 });
  const P = Object.assign({}, B.FALLBACK_BARB_PARAMS, { aggroRadius: 6 });
  const BARB_ENGAGE = () => true;
  check('S10 M10 barbarzyncy: kontrola -- widoczna jednostka gracza obok jest celem ataku', () => {
    const b = barb('b1', 10, 5);
    const p = unit({ id: 'p1', ownerId: 0, q: 11, r: 5 });
    const cmds = B.decideBarbarianMoves([b], B.unitsForPlanner([p], BARB, BARB_ENGAGE), [], [], map, P);
    assert.ok(cmds.some(c => c.type === 'attack' && c.targetUnitId === 'p1'), JSON.stringify(cmds));
  });
  check('S11 M10 barbarzyncy: zasadzka gracza jest dla planisty niewidoczna (nie jest celem), a krok ruchu ja wyzwala', () => {
    const b = barb('b1', 10, 5);
    const p = ambushed({ id: 'p1', ownerId: 0, q: 11, r: 5 });
    const cmds = B.decideBarbarianMoves([b], B.unitsForPlanner([p], BARB, BARB_ENGAGE), [], [], map, P);
    assert.ok(!cmds.some(c => c.targetUnitId === 'p1'), 'barbarzynca nie widzi zasadzki: ' + JSON.stringify(cmds));
    // krok ruchu barbarzyncy (jak w main.ts): trasa przez heks zasadzki konczy sie przed nia, potem bitwa
    const units = [b, p];
    const full = [{ q: 10, r: 5 }, { q: 11, r: 5 }, { q: 12, r: 5 }].slice(1);
    const plan = B.planPlayerAmbushMove(units, full, BARB, () => true, true);
    assert.equal(plan.kind, 'fire-now', 'zasadzka tuz obok => bitwa od razu');
    const order = B.resolveAmbushAfterMove(units, b, plan.ambushHex, () => true);
    assert.ok(order && order.defender.id === 'p1');
    assert.equal(p.ambush, undefined);
  });

  // ---- plan ruchu barbarzyncy (planBarbarianAmbushMove / buildBarbarianAmbushAttack z ambushMove.ts) ----
  check('S21 M18 M19 plan barbarzyncy: trasa przez zasadzke gracza przycieta przed nia, zasadzka ujawniona, atak wstrzykniety', () => {
    const b = barb('b1', 5, 5);
    const p = ambushed({ id: 'p1', ownerId: 0, q: 8, r: 5 });
    const units = [b, p];
    const occ = B.buildMoveOccupancy(units, BARB, ['b1'], () => true);
    const full = B.computePath(b, map, 11, 5, occ);
    assert.ok(full.some(h => h.q === 8 && h.r === 5), 'trasa wiedzie przez heks zasadzki (dla barbarzyncy pusty)');
    const plan = B.planBarbarianAmbushMove(units, b, 11, 5, full, () => true);
    assert.deepEqual({ q: plan.toQ, r: plan.toR }, { q: 7, r: 5 });
    assert.equal(plan.stays, false);
    assert.deepEqual(plan.ambushHex, { q: 8, r: 5 });
    b.q = plan.toQ; b.r = plan.toR;
    const atk = B.buildBarbarianAmbushAttack(units, b, plan.ambushHex, () => true);
    assert.ok(atk, 'bitwa z zasadzki');
    assert.deepEqual(atk.cmd, { type: 'attack', unitId: 'b1', targetUnitId: 'p1' });
    assert.equal(atk.defender.id, 'p1');
    assert.equal(p.ambush, undefined, 'zasadzka ujawniona');
  });
  check('S22 M18 plan barbarzyncy: zasadzka tuz przy starcie => barbarzynca stoi (stays), bitwa od razu', () => {
    const b = barb('b1', 10, 5);
    const p = ambushed({ id: 'p1', ownerId: 0, q: 11, r: 5 });
    const units = [b, p];
    const plan = B.planBarbarianAmbushMove(units, b, 13, 5, [{ q: 11, r: 5 }, { q: 12, r: 5 }, { q: 13, r: 5 }], () => true);
    assert.equal(plan.stays, true);
    assert.deepEqual({ q: plan.toQ, r: plan.toR }, { q: 10, r: 5 });
    assert.ok(B.buildBarbarianAmbushAttack(units, b, plan.ambushHex, () => true));
  });
  check('S23 M18 plan barbarzyncy: brak zasadzek / brak wojny => trasa bez zmian i brak ataku', () => {
    const b = barb('b1', 5, 5);
    const none = B.planBarbarianAmbushMove([b], b, 9, 5, null, () => true);
    assert.deepEqual({ q: none.toQ, r: none.toR, stays: none.stays, h: none.ambushHex }, { q: 9, r: 5, stays: false, h: undefined });
    const p = ambushed({ id: 'p1', ownerId: 0, q: 7, r: 5 });
    const peace = B.planBarbarianAmbushMove([b, p], b, 9, 5, line(6, 9), NO_WAR);
    assert.deepEqual({ q: peace.toQ, r: peace.toR, h: peace.ambushHex }, { q: 9, r: 5, h: undefined });
    assert.equal(B.buildBarbarianAmbushAttack([b, p], b, { q: 7, r: 5 }, NO_WAR), undefined);
  });

  check('S24 M9 panel rozdzielania: flaga dostepnosci liczona na widocznych jednostkach (ukryta zasadzka wroga nie zajmuje heksu)', () => {
    const me = unit({ id: 'p1', ownerId: 0, q: 5, r: 5 });
    const ring = [[6, 5], [6, 4], [5, 4], [4, 5], [4, 6], [5, 6]];
    // kazdy sasiedni heks zajety ukryta zasadzka wroga => dla gracza wszystkie wolne
    const hidden = ring.map(([q, r], i) => ambushed({ id: 'e' + i, ownerId: 1, q, r }));
    const all = [me, ...hidden];
    const viaViewer = B.findSplitDestHexes(B.unitsForViewer(all, 0), 5, 5, () => true, false);
    assert.equal(viaViewer.length, 6, 'ukryta zasadzka nie blokuje celu rozdzielenia w UI');
    const raw = B.findSplitDestHexes(all, 5, 5, () => true, false);
    assert.equal(raw.length, 0, 'kontrola: bez filtra heksy sa zajete (wyciek flagi dostepnosci)');
  });

  // ---- widocznosc / wycieki ----
  check('S12 M9 widz: cudza zasadzka nie jest rysowana, wlasna tak', () => {
    const us = [unit({ id: 'me', ownerId: 0 }), ambushed({ id: 'ea', ownerId: 1, q: 8, r: 5 }), ambushed({ id: 'ma', ownerId: 0, q: 9, r: 5 })];
    const ids = B.unitsForViewer(us, 0).map(u => u.id).sort();
    assert.deepEqual(ids, ['ma', 'me']);
  });
  check('S13 M11 mapa: unitsVisibleOnMap nie pokazuje cudzej zasadzki nawet w zasiegu widzenia', () => {
    const us = [unit({ id: 'me', ownerId: 0 }), ambushed({ id: 'ea', ownerId: 1, q: 8, r: 5 }), unit({ id: 'ev', ownerId: 1, q: 9, r: 5 })];
    const vis = new Set(['8,5', '9,5']);
    const ids = B.unitsVisibleOnMap(us, vis, 0).map(u => u.id).sort();
    assert.deepEqual(ids, ['ev', 'me']);
  });
  check('S14 M12 kontakt dyplomatyczny: sama zasadzka nie ujawnia cywilizacji, widoczna jednostka tak', () => {
    const vis = new Set(['8,5']);
    const onlyAmbush = B.computeDiplomaticContacts(vis, [], [ambushed({ id: 'ea', ownerId: 3, q: 8, r: 5 })], 0);
    assert.equal(onlyAmbush.size, 0, 'zasadzka nie otwiera audiencji pierwszego kontaktu');
    const seen = B.computeDiplomaticContacts(vis, [], [unit({ id: 'ev', ownerId: 3, q: 8, r: 5 })], 0);
    assert.equal(seen.has(3), true);
  });
  check('S15 hit-test/tooltip: filtr widza ukrywa heks zasadzki (brak „Heks zajety”, brak wyboru)', () => {
    const us = [ambushed({ id: 'ea', ownerId: 1, q: 8, r: 5 })];
    assert.equal(B.unitsForViewer(us, 0).length, 0);
    assert.equal(B.unitsForViewer(us, 1).length, 1);
  });

  // ---- znacznik dla wlasciciela (prawdziwe UI) ----
  check('S16 M14 lista armii: odznaka „w zasadzce” (prawdziwe armyStatusBadge)', () => {
    const b = B.armyStatusBadge({ ambush: true });
    assert.ok(b && b.text === 'w zasadzce', JSON.stringify(b));
    assert.equal(B.armyStatusBadge({}), null);
  });
  check('S17 M14 lista armii (jsdom): wiersz ma odznake i tytul o zasadzce', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = B.createArmyListHud({
      getArmies: () => [{ id: 'u1', name: 'Wojownik ×3', unitCount: 3, hexLabel: '(5, 5)', ambush: true }],
      onSelectArmy: () => {}, onClose: () => {},
    });
    host.appendChild(api.el);
    api.show();
    api.update();
    const html = api.el.innerHTML;
    assert.ok(/class="sl-badge green">w zasadzce</.test(html), 'odznaka w DOM listy armii');
    assert.ok(/w zasadzce; wróg jej nie widzi/.test(html), 'tytul wiersza');
    api.destroy();
  });
  check('S18 M15 panel stosu (jsdom): „W zasadzce” w naglowku tylko gdy ambushed', () => {
    const mk = (ambushedFlag) => {
      const combat = { atakBase: 4, atakEffective: 4, obronaBase: 4, obronaEffective: 4, hpMaxBase: 26, hpMaxEffective: 26,
        pancerzBase: 2, pancerzEffective: 2, weaponDamageBase: 1, weaponDamageEffective: 1, piercingBase: 0, piercingEffective: 0 };
      const api = B.createArmyStackHud({
        getStack: () => ({
          hexLabel: '(5, 5)', unitCount: 1, ambushed: ambushedFlag, combat, mov: 2, rng: 0, hp: 26,
          cards: [{ id: 'u1', name: 'Wojownik', icon: '', hp: 26, hpMax: 26, ruchLeft: 2, ruchMax: 2, active: true }],
          actions: [],
        }),
        onSelectUnit: () => {}, onAction: () => {}, onClose: () => {},
      });
      document.body.appendChild(api.el);
      api.update();
      const h = api.el.innerHTML;
      api.destroy();
      return h;
    };
    const withMark = mk(true);
    assert.ok(withMark.includes('ash-ambush-mark'), 'znacznik w naglowku panelu');
    assert.ok(withMark.includes('W zasadzce'));
    assert.ok(!mk(false).includes('ash-ambush-mark'));
  });
  check('S19 M16 karta jednostki: wiersz „W zasadzce” (prawdziwe buildUnitExtraStatusLinesHtml)', () => {
    const esc = (s) => s;
    assert.ok(B.buildUnitExtraStatusLinesHtml({ ambush: true, esc }).includes('W zasadzce'));
    assert.ok(!B.buildUnitExtraStatusLinesHtml({ esc }).includes('W zasadzce'));
  });
  check('S20 M17 karta/panel jednostki (hexContextTooltip): odznaka „W zasadzce” w naglowku tylko dla ambush', () => {
    const combat = { atakBase: 4, atakEffective: 4, obronaBase: 4, obronaEffective: 4, hpMaxBase: 26, hpMaxEffective: 26,
      pancerzBase: 2, pancerzEffective: 2, weaponDamageBase: 1, weaponDamageEffective: 1, piercingBase: 0, piercingEffective: 0 };
    const mk = (amb) => B.buildUnitContextTooltipHtml({ displayName: 'Wojownik', q: 5, r: 5, ruchLeft: 0, ruchMax: 2, combat, hp: 26,
      ambush: amb, esc: (v) => String(v) });
    assert.ok(mk(true).includes('uc-ambush-chip') && mk(true).includes('W zasadzce'));
    assert.ok(!mk(false).includes('uc-ambush-chip'));
  });
  return errors;
}

(async () => {
  const B = await buildBundle('ok', null);
  const base = runScenarios(B);
  let fail = 0;
  let pass = 0;
  if (base.length === 0) { pass++; console.log('PASS: wszystkie scenariusze kroku ruchu (kod produkcyjny)'); }
  else { fail += base.length; for (const e of base) console.log('FAIL: ' + e); }

  for (const key of Object.keys(MUTANTS)) {
    let errs;
    try {
      const BM = await buildBundle('mut-' + key, key);
      errs = runScenarios(BM);
    } catch (e) {
      console.log('FAIL: mutant ' + key + ' -- blad budowy/uruchomienia: ' + e.message);
      fail++;
      continue;
    }
    if (errs.length > 0) { pass++; console.log(`PASS: mutant ${key} czerwony (${errs.length} scenariuszy: ${errs.map(e => e.split(' ')[0]).join(',')})`); }
    else { fail++; console.log(`FAIL: mutant ${key} PRZEZYL (testy go nie wykrywaja)`); }
  }
  fs.rmSync(WORK, { recursive: true, force: true });
  console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
