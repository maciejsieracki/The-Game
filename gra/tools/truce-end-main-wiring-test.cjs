'use strict';
/**
 * truce-end-main-wiring-test.cjs — R-WEB-TEST-DEBT-TRUCE-WIRING-Q1 (tag TRUCETEST, #166).
 * Run from gra/:  node tools/truce-end-main-wiring-test.cjs
 *
 * Test okablowania main.ts dla ścieżki „koniec rozejmu → oferta pokoju z ceną”.
 * Ciała funkcji wycinane z src/main.ts (brace-matching po wcięciu 4 spacji) i wykonywane
 * w new Function na atrapach (portów i silnika). Moduły czyste (diplomacy-peace-lock,
 * diplomacy-truce-end-price) są bundlowane z żywego źródła (esbuild, stdin — bez plików tymczasowych).
 *
 * Węzły pokryte (main.ts): truceEndPorts (declareWarAfterTruce, enqueueOffer, finalizePeace, settlePeacePrice),
 * enqueueTruceEndOffer, truceEndWindowFor (okno gracza, flaga forbidden, cena 0), settleTruceEndPrice
 * (cena 0 → 1 Pn, płatnik → odbiorca, port transferBasketItems, bramka bilansu AI↔AI), tickTruceExpiries,
 * clearTruceEndOffer, truceEndToWar, allWiarygodnoscOwnerIds.
 * Moduły: truceEndTickPair (wygaśnięcie = wojna trwa, AI↔AI bez zapłaty = wojna), truceEndPriceRule
 * (płatnik poza pasmem), truceEndDuePn (symboliczna opłata), truceEndWindowOpen, truceEndAcceptCore.
 *
 * Test jest zielony na bazie i czerwony dla każdej mutacji (kopia tekstu main.ts / modułu; plik nie jest zapisywany).
 */
const fs = require('fs');
const path = require('path');

let esbuild;
try { esbuild = require('esbuild'); } catch (e) {
  console.error('esbuild not found (npm ci w gra/)'); process.exit(1);
}

const SRC = path.resolve(__dirname, '..', 'src');
const MAIN = path.join(SRC, 'main.ts');
const MAIN_TXT = fs.readFileSync(MAIN, 'utf8');

const MAIN_FNS = [
  'truceEndPorts', 'enqueueTruceEndOffer', 'truceEndWindowFor', 'settleTruceEndPrice',
  'tickTruceExpiries', 'clearTruceEndOffer', 'truceEndToWar', 'allWiarygodnoscOwnerIds',
];

function replaceOnce(text, oldS, newS) {
  const n = text.split(oldS).length - 1;
  if (n !== 1) throw new Error(`mutacja/kotwica wystąpiła ${n} razy (oczekiwano 1): ${oldS.slice(0, 70)}`);
  return text.replace(oldS, () => newS);
}

function extractMain(mainMuts) {
  const lines = MAIN_TXT.split('\n');
  const chunks = MAIN_FNS.map(name => {
    const start = lines.findIndex(l => l.startsWith('    function ' + name + '('));
    if (start < 0) throw new Error('brak funkcji w main.ts: ' + name);
    let end = start;
    while (end < lines.length && lines[end] !== '    }') end++;
    if (end >= lines.length) throw new Error('brak końca funkcji: ' + name);
    return lines.slice(start, end + 1).join('\n');
  });
  let text = chunks.join('\n\n');
  for (const m of mainMuts) text = replaceOnce(text, m.old, m.neu);
  return esbuild.transformSync(text, { loader: 'ts' }).code;
}

const ENTRY_SRC = `
export { truceEndPriceFor, truceEndTickPair, truceEndToWarCore, clearTruceEndOfferCore, truceEndWindowOpen, truceEndAcceptCore } from './game/diplomacy-peace-lock';
export { executeTruceEndSettlement, truceEndDuePn, truceEndOfferReason } from './game/diplomacy-truce-end-price';
`;

async function buildModules(modMuts) {
  const plugin = {
    name: 'truce-mutations',
    setup(build) {
      build.onLoad({ filter: /diplomacy-(peace-lock|truce-end-price)\.ts$/ }, args => {
        let txt = fs.readFileSync(args.path, 'utf8');
        for (const m of modMuts) {
          if (args.path.endsWith(m.file)) txt = replaceOnce(txt, m.old, m.neu);
        }
        return { contents: txt, loader: 'ts' };
      });
    },
  };
  const res = await esbuild.build({
    stdin: { contents: ENTRY_SRC, resolveDir: SRC, sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'node18', write: false,
    plugins: [plugin], logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', res.outputFiles[0].text)(mod, mod.exports);
  return mod.exports;
}

const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

function makeWorld() {
  return {
    metas: new Map(), rel: new Map(), army: new Map([[0, 100], [1, 100], [2, 100], [3, 100]]),
    price: 40, balanceOk: true, tailFull: true, cityFull: false, cityAssets: [],
    inbox: null, warLog: null, finalize: [], transfers: [],
  };
}

function makeEngine(M, mainJs, w) {
  const deps = {
    ME: () => 0,
    isHuman: id => id === 0,
    sumArmyMForOwner: id => w.army.get(id) ?? 0,
    getDiploPairMeta: (a, b) => w.metas.get(key(a, b)) ?? {},
    setDiploPairMeta: (a, b, m) => { w.metas.set(key(a, b), m); },
    getDiploRelation: (a, b) => ({ status: w.rel.get(key(a, b)) ?? 'pokoj' }),
    setDiploRelation: (a, b, r) => { w.rel.set(key(a, b), r.status); },
    applyDiploEventTracked: (a, b, cur, ev) => ({ ...cur, status: ev === 'wojna_wypowiedziana' ? 'wojna' : cur.status }),
    diploPairKey: key,
    ownerDiploLabel: id => 'Cyw' + id,
    trimWarEventLog: () => {},
    showHintMessage: () => {},
    DIPLOMACY_MSG_PREFIX: '[D]',
    diploPendingTitle: () => 'Tytul',
    refreshD1bHud: () => {},
    finalizePeaceTreatyBetween: (a, b) => { w.finalize.push([a, b]); },
    aiOwnerCivMap: new Map([[1, 'a'], [2, 'b'], [3, 'c']]),
    aiAiPeacePriceFor: () => ({ requiredPn: w.price, balanceFor: () => 0, loserBalanceFor: () => 0, tolerancePn: 0 }),
    aiPeacePaymentAssets: () => w.cityAssets,
    peacePlanWithTail: inp => {
      if (inp.maxCities > 0) {
        return { full: w.cityFull, coveredPn: w.cityFull ? inp.duePn : 0,
          items: w.cityFull ? [{ kind: 'miasto', id: 'city-7', pn: inp.duePn, amount: 1 }] : [] };
      }
      return { full: w.tailFull, coveredPn: w.tailFull ? inp.duePn : 0,
        items: [{ kind: 'zloto', id: 'zloto', amount: inp.duePn }] };
    },
    peaceTailPricingForPayer: () => ({}),
    peaceTailWiringDeps: () => ({}),
    peaceTailPricingFor: () => ({}),
    isAiAiPeaceBalanceAllowed: () => w.balanceOk,
    transferBasketItems: (payer, payee, basket) => { w.transfers.push({ payer, payee, basket }); },
    truceEndPriceFor: M.truceEndPriceFor,
    truceEndTickPair: M.truceEndTickPair,
    truceEndToWarCore: M.truceEndToWarCore,
    clearTruceEndOfferCore: M.clearTruceEndOfferCore,
    truceEndWindowOpen: M.truceEndWindowOpen,
    executeTruceEndSettlement: M.executeTruceEndSettlement,
    truceEndDuePn: M.truceEndDuePn,
    truceEndOfferReason: M.truceEndOfferReason,
  };
  const names = Object.keys(deps);
  const src = `"use strict";
const { ${names.join(', ')} } = deps;
let turn = 0;
const warEventLog = [];
const pendingDiplomacyInbox = [];
${mainJs}
return { truceEndPorts, enqueueTruceEndOffer, truceEndWindowFor, settleTruceEndPrice, tickTruceExpiries,
  clearTruceEndOffer, truceEndToWar, warEventLog, pendingDiplomacyInbox, setTurn: v => { turn = v; } };`;
  const E = new Function('deps', src)(deps);
  w.inbox = E.pendingDiplomacyInbox;
  w.warLog = E.warEventLog;
  return E;
}

/* Sceneria. Każda zwraca liczbę niespełnionych oczekiwań (opis w `errs`). */
const SCENARIOS = [
  ['S1 wygasły rozejm (AI-gracz): AI składa ofertę do skrzynki gracza, bez wojny', (E, w, M) => {
    const errs = [];
    w.price = 40;
    w.metas.set(key(0, 1), { truceInitiatorId: 1, truceUntilTurn: 5 });
    E.setTurn(5);
    E.tickTruceExpiries();
    if (w.inbox.length !== 1) errs.push('inbox: ' + w.inbox.length + ' (oczekiwano 1)');
    const o = w.inbox[0] || {};
    if (o.ownerId !== 1) errs.push('właściciel oferty ' + o.ownerId + ' (oczekiwano AI=1)');
    if (o.cmdType !== 'zaproponuj_pokoj') errs.push('cmdType ' + o.cmdType);
    if (!String(o.reason || '').includes('ok. 40')) errs.push('treść bez ceny 40: ' + o.reason);
    const m = w.metas.get(key(0, 1)) || {};
    if (!m.truceEndOffer || m.truceEndOffer.fromOwnerId !== 1 || m.truceEndOffer.toOwnerId !== 0 || m.truceEndOffer.turn !== 5)
      errs.push('meta.truceEndOffer niepoprawna: ' + JSON.stringify(m.truceEndOffer));
    if (m.truceUntilTurn !== undefined || m.truceEndTurn !== 5) errs.push('truceUntilTurn/truceEndTurn: ' + m.truceUntilTurn + '/' + m.truceEndTurn);
    if (w.rel.get(key(0, 1)) !== undefined && w.rel.get(key(0, 1)) !== 'pokoj') errs.push('status zmieniony przed odpowiedzią');
    return errs;
  }],
  ['S1b cena 0 → symboliczna opłata 1 Pn, oferta nadal składana (nie wojna)', (E, w) => {
    const errs = [];
    w.price = 0;
    w.metas.set(key(0, 1), { truceInitiatorId: 1, truceUntilTurn: 5 });
    E.setTurn(5);
    E.tickTruceExpiries();
    if (w.inbox.length !== 1) errs.push('oferta nie trafiła do skrzynki przy cenie 0 (inbox ' + w.inbox.length + ')');
    if (w.inbox[0] && !String(w.inbox[0].reason).includes('ok. 1')) errs.push('opłata symboliczna nie jest 1: ' + w.inbox[0].reason);
    if (w.rel.get(key(0, 1)) === 'wojna') errs.push('cena 0 przeszła w wojnę');
    return errs;
  }],
  ['S2 oferta bez odpowiedzi do kolejnej tury = wojna trwa, oferta usunięta', (E, w) => {
    const errs = [];
    w.price = 40;
    w.metas.set(key(0, 1), { truceInitiatorId: 1, truceUntilTurn: 5 });
    E.setTurn(5);
    E.tickTruceExpiries();
    if (w.rel.get(key(0, 1)) === 'wojna') errs.push('wojna przed upływem tury oferty');
    E.setTurn(6);
    E.tickTruceExpiries();
    if (w.rel.get(key(0, 1)) !== 'wojna') errs.push('po wygaśnięciu oferty status ' + w.rel.get(key(0, 1)) + ' (oczekiwano wojna)');
    if (w.inbox.length !== 0) errs.push('wpis oferty nie usunięty z skrzynki (' + w.inbox.length + ')');
    if (!w.warLog.some(e => String(e.id).startsWith('truce-war-'))) errs.push('brak wpisu „Rozejm wygasł, wojna wraca” dla gracza');
    const m = w.metas.get(key(0, 1)) || {};
    if (m.truceEndOffer != null) errs.push('meta.truceEndOffer nie wyczyszczona po wojnie');
    return errs;
  }],
  ['S3 okno propozycji gracza: płatnik = gracz, cena, waluta, okno 1 tura', (E, w) => {
    const errs = [];
    const setup = (army0, army1) => {
      w.army.set(0, army0); w.army.set(1, army1);
      w.metas.set(key(0, 1), { truceInitiatorId: 0, truceEndTurn: 5,
        truceEndOffer: { turn: 5, fromOwnerId: 1, toOwnerId: 0, inboxId: 'x' } });
    };
    E.setTurn(5);
    // W1 równe armie → płaci inicjator (gracz): surowce, cena 40
    setup(100, 100); w.price = 40;
    let r = E.truceEndWindowFor(0, 1);
    if (!r.open || r.requiredPn !== 40 || r.currency !== 'surowce') errs.push('W1 ' + JSON.stringify(r));
    // W1b cena 0 → symboliczna 1
    w.price = 0;
    r = E.truceEndWindowFor(0, 1);
    if (!r.open || r.requiredPn !== 1) errs.push('W1b cena 0 nie daje symbolicznej opłaty 1: ' + JSON.stringify(r));
    // W2 gracz słabszy poza pasmem → płaci miastem, miasto cedowalne
    setup(50, 100); w.price = 40; w.cityAssets = [{ kind: 'miasto', forbidden: false, pn: 30 }];
    r = E.truceEndWindowFor(0, 1);
    if (!r.open || r.currency !== 'miasto' || r.cityAvailable !== true) errs.push('W2 ' + JSON.stringify(r));
    // W3 to samo, ale miasto `forbidden` (stolica/ostatnie) → brak cedowalnego miasta
    w.cityAssets = [{ kind: 'miasto', forbidden: true, pn: 30 }];
    r = E.truceEndWindowFor(0, 1);
    if (r.cityAvailable !== false) errs.push('W3 miasto forbidden liczone jako cedowalne: ' + JSON.stringify(r));
    // W5 gracz silniejszy poza pasmem → płaci AI → okno zamknięte dla gracza
    setup(100, 50); w.price = 40;
    r = E.truceEndWindowFor(0, 1);
    if (r.open) errs.push('W5 okno otwarte, a płaci AI');
    // W4 po jednej turze od końca rozejmu okno zamknięte
    setup(100, 100); w.price = 40; E.setTurn(7);
    r = E.truceEndWindowFor(0, 1);
    if (r.open) errs.push('W4 okno otwarte po 2 turach od końca rozejmu');
    return errs;
  }],
  ['S4 płatność: przelew payer→payee przez transferBasketItems, kształt koszyka', (E, w) => {
    const errs = [];
    w.price = 40;
    const ok = E.truceEndPorts().settlePeacePrice(1, 0, 'surowce');
    if (ok !== true) errs.push('settle zwrócił ' + ok);
    if (w.transfers.length !== 1) errs.push('przelewów: ' + w.transfers.length + ' (oczekiwano 1)');
    const t = w.transfers[0] || {};
    if (t.payer !== 1 || t.payee !== 0) errs.push('kierunek przelewu ' + t.payer + '→' + t.payee + ' (oczekiwano 1→0)');
    if (!t.basket || t.basket.length !== 1 || t.basket[0].typ !== 'zloto' || t.basket[0].ilosc !== 40) errs.push('koszyk ' + JSON.stringify(t.basket));
    return errs;
  }],
  ['S4b cena 0 → przelew symbolicznej opłaty 1 Pn', (E, w) => {
    const errs = [];
    w.price = 0;
    const ok = E.truceEndPorts().settlePeacePrice(1, 0, 'surowce');
    if (ok !== true) errs.push('cena 0 nie zawiera płatności (zwrot ' + ok + ')');
    const t = w.transfers[0] || {};
    if (w.transfers.length !== 1 || !t.basket || t.basket[0].ilosc !== 1) errs.push('opłata symboliczna: ' + JSON.stringify(w.transfers));
    return errs;
  }],
  ['S4c waluta miasto z cedowalnym miastem → przelew typu miasto', (E, w) => {
    const errs = [];
    w.price = 40; w.cityFull = true; w.cityAssets = [{ kind: 'miasto', forbidden: false, pn: 40 }];
    const ok = E.truceEndPorts().settlePeacePrice(0, 1, 'miasto');
    const t = w.transfers[0] || {};
    if (ok !== true || !t.basket || t.basket[0].typ !== 'miasto' || t.payer !== 0 || t.payee !== 1) errs.push('miasto: ' + ok + ' ' + JSON.stringify(w.transfers));
    return errs;
  }],
  ['S4d para AI↔AI z ujemnym bilansem PW → brak przelewu, brak pokoju', (E, w) => {
    const errs = [];
    w.price = 40; w.balanceOk = false;
    const ok = E.truceEndPorts().settlePeacePrice(1, 2, 'surowce');
    if (ok !== false || w.transfers.length !== 0) errs.push('AI↔AI bez bilansu: ok=' + ok + ' przelewy=' + w.transfers.length);
    return errs;
  }],
  ['S4e AI↔AI: miasto przy ujemnym bilansie nie wchodzi w plan miasta', (E, w) => {
    const errs = [];
    w.price = 40; w.balanceOk = false; w.cityFull = true; w.cityAssets = [{ kind: 'miasto', forbidden: false, pn: 40 }];
    const ok = E.truceEndPorts().settlePeacePrice(1, 2, 'miasto');
    if (ok !== false || w.transfers.length !== 0) errs.push('miasto przy złym bilansie: ok=' + ok + ' ' + JSON.stringify(w.transfers));
    return errs;
  }],
  ['S4f brak pełnego planu (surowce za mało) → brak przelewu i brak pokoju', (E, w) => {
    const errs = [];
    w.price = 40; w.tailFull = false;
    const ok = E.truceEndPorts().settlePeacePrice(0, 1, 'surowce');
    if (ok !== false || w.transfers.length !== 0) errs.push('niepełna płatność: ok=' + ok + ' przelewy=' + w.transfers.length);
    return errs;
  }],
  ['S5 porty: enqueueOffer, finalizePeace, declareWarAfterTruce, removeOffer', (E, w) => {
    const errs = [];
    const P = E.truceEndPorts();
    const id = P.enqueueOffer(1, 'powod');
    if (typeof id !== 'string' || w.inbox.length !== 1 || w.inbox[0].ownerId !== 1 || w.inbox[0].reason !== 'powod') errs.push('enqueueOffer: ' + JSON.stringify(w.inbox));
    P.removeOffer(id);
    if (w.inbox.length !== 0) errs.push('removeOffer nie usunął wpisu');
    P.finalizePeace(1, 0);
    if (JSON.stringify(w.finalize) !== '[[1,0]]') errs.push('finalizePeace nie wywołał finalizePeaceTreatyBetween(1,0): ' + JSON.stringify(w.finalize));
    if (!w.warLog.some(e => String(e.id).startsWith('truce-peace-'))) errs.push('brak wpisu „przeszedł w pokój” dla gracza');
    w.rel.set(key(0, 1), 'pokoj');
    P.declareWarAfterTruce(0, 1);
    if (w.rel.get(key(0, 1)) !== 'wojna') errs.push('declareWarAfterTruce nie ustawił wojny');
    if (!w.warLog.some(e => String(e.id).startsWith('truce-war-'))) errs.push('brak wpisu „wojna wraca” dla gracza');
    return errs;
  }],
  ['S6 AI↔AI tick: płatność payer→payee i pokój (initiator,target) gdy bilans OK', (E, w, M) => {
    const errs = [];
    w.price = 40; w.balanceOk = true;
    w.metas.set(key(1, 2), { truceInitiatorId: 1, truceUntilTurn: 5 });
    E.setTurn(5);
    E.tickTruceExpiries();
    if (JSON.stringify(w.finalize) !== '[[1,2]]') errs.push('pokój AI↔AI nie wywołany: ' + JSON.stringify(w.finalize));
    const t = w.transfers[0] || {};
    if (w.transfers.length !== 1 || t.payer !== 1 || t.payee !== 2) errs.push('przelew AI↔AI: ' + JSON.stringify(w.transfers));
    return errs;
  }],
  ['S7 AI↔AI tick: brak zapłaty = wojna, bez pokoju', (E, w) => {
    const errs = [];
    w.price = 40; w.balanceOk = false;
    w.metas.set(key(1, 2), { truceInitiatorId: 1, truceUntilTurn: 5 });
    E.setTurn(5);
    E.tickTruceExpiries();
    if (w.finalize.length !== 0) errs.push('pokój bez zapłaty: ' + JSON.stringify(w.finalize));
    if (w.rel.get(key(1, 2)) !== 'wojna') errs.push('brak zapłaty nie daje wojny (status ' + w.rel.get(key(1, 2)) + ')');
    return errs;
  }],
  ['S8 zgoda gracza (truceEndAcceptCore): płatność → pokój, oferta czyszczona; brak płatności → wojna', (E, w, M, mainJs) => {
    const errs = [];
    w.price = 40;
    w.metas.set(key(0, 1), { truceInitiatorId: 1, truceEndTurn: 5,
      truceEndOffer: { turn: 5, fromOwnerId: 1, toOwnerId: 0, inboxId: 'x' } });
    w.inbox.push({ id: 'x', ownerId: 1 });
    const ok = M.truceEndAcceptCore(E.truceEndPorts(), 0, 1);
    if (ok !== true) errs.push('accept z płatnością zwrócił ' + ok);
    if (JSON.stringify(w.finalize) !== '[[1,0]]') errs.push('finalize przy akceptacji: ' + JSON.stringify(w.finalize));
    if ((w.metas.get(key(0, 1)) || {}).truceEndOffer != null) errs.push('oferta nie wyczyszczona po zgodzie');
    if (w.inbox.length !== 0) errs.push('wpis skrzynki nie usunięty po zgodzie');
    // bez płatności
    const w2 = makeWorld(); w2.price = 40; w2.tailFull = false;
    const E2 = makeEngine(M, mainJs, w2);
    return errs.concat(acceptUnpaid(M, E2, w2));
  }],
];

function acceptUnpaid(M, E, w) {
  const errs = [];
  w.metas.set(key(0, 1), { truceInitiatorId: 1, truceEndTurn: 5,
    truceEndOffer: { turn: 5, fromOwnerId: 1, toOwnerId: 0, inboxId: 'x' } });
  const ok = M.truceEndAcceptCore(E.truceEndPorts(), 0, 1);
  if (ok !== false) errs.push('accept bez płatności zwrócił ' + ok);
  if (w.finalize.length !== 0) errs.push('pokój bez płatności przy akceptacji');
  if (w.rel.get(key(0, 1)) !== 'wojna') errs.push('brak płatności przy akceptacji nie daje wojny');
  return errs;
}

// Mutacje: m = w main.ts (wycinane ciała), k = w modułach czystych. Każda musi zaczerwienić test.
const MAIN_MUTS = [
  { id: 'm1', what: 'settle: usunięty przelew transferBasketItems', old: 'transferBasketItems(payer, payee, basket);', neu: 'void basket;' },
  { id: 'm2', what: 'settle: zamiana płatnika z odbiorcą', old: 'transferBasketItems(payer, payee, basket);', neu: 'transferBasketItems(payee, payer, basket);' },
  { id: 'm3', what: 'okno: brak filtra forbidden (stolica/ostatnie miasto cedowalne)', old: "a.kind === 'miasto' && !a.forbidden && a.pn > 0", neu: "a.kind === 'miasto' && a.pn > 0" },
  { id: 'm4', what: 'settle: brak symbolicznej opłaty przy cenie 0', old: 'requiredPn: truceEndDuePn(price0.requiredPn) };', neu: 'requiredPn: price0.requiredPn };' },
  { id: 'm5', what: 'port finalizePeace bez wywołania finalizePeaceTreatyBetween', old: 'finalizePeaceTreatyBetween(proposerId, responderId);', neu: 'void 0;' },
  { id: 'm6', what: 'enqueueTruceEndOffer: wpis nie trafia do skrzynki', old: 'pendingDiplomacyInbox.push({', neu: 'void ({' },
  { id: 'm7', what: 'settle: przelew pustego koszyka', old: 'transferBasketItems(payer, payee, basket);', neu: 'transferBasketItems(payer, payee, basket.slice(0, 0));' },
  { id: 'm8', what: 'port declareWarAfterTruce: brak zmiany statusu na wojnę', old: "setDiploRelation(a, b, applyDiploEventTracked(a, b, cur, 'wojna_wypowiedziana'));", neu: 'void cur;' },
  { id: 'm9', what: 'okno: brak zamknięcia po końcu okna', old: 'if (!truceEndWindowOpen(meta.truceEndTurn, turn)) return closed;', neu: 'if (false) return closed;' },
  { id: 'm10', what: 'okno: brak sprawdzenia, że płaci gracz', old: 'if (rule == null || rule.payerId !== ME()) return closed;', neu: 'if (rule == null) return closed;' },
  { id: 'm11', what: 'settle: bramka bilansu AI↔AI pominięta', old: '|| isAiAiPeaceBalanceAllowed(price.balanceFor', neu: '|| true || isAiAiPeaceBalanceAllowed(price.balanceFor' },
];
const MOD_MUTS = [
  { id: 'k1', what: 'tick: oferta nie wołana przez enqueueOffer', file: 'diplomacy-peace-lock.ts', old: 'const inboxId = ports.enqueueOffer(ai, reason);', neu: "const inboxId = 'none';" },
  { id: 'k2', what: 'reguła ceny: płatnik poza pasmem zamieniony', file: 'diplomacy-truce-end-price.ts', old: "return { band: 'outside', payerId: weakerId, payeeId: other(weakerId), currency: 'miasto' };", neu: "return { band: 'outside', payerId: other(weakerId), payeeId: weakerId, currency: 'miasto' };" },
  { id: 'k3', what: 'cena 0: brak symbolicznej opłaty (0 zamiast 1 Pn)', file: 'diplomacy-truce-end-price.ts', old: 'return Number.isFinite(symbolicPn) && symbolicPn > 0 ? symbolicPn : 0;', neu: 'return 0;' },
  { id: 'k4', what: 'okno gracza za długie (2 tury zamiast 1)', file: 'diplomacy-peace-lock.ts', old: 'return delta >= 0 && delta <= TRUCE_END_WINDOW_EXTRA_TURNS;', neu: 'return delta >= 0 && delta <= TRUCE_END_WINDOW_EXTRA_TURNS + 1;' },
  { id: 'k5', what: 'tick: pokój AI↔AI bez sprawdzenia zapłaty', file: 'diplomacy-peace-lock.ts', old: 'if (truceEndSettleCore(ports, a, b)) {', neu: 'if (true) {' },
  { id: 'k6', what: 'tick: wygaśnięcie oferty pominięte (wojna nie wraca)', file: 'diplomacy-peace-lock.ts', old: 'if (truceEndOfferExpired(meta.truceEndOffer.turn, turn)) truceEndToWarCore(ports, a, b);', neu: 'if (false) truceEndToWarCore(ports, a, b);' },
  { id: 'k7', what: 'plan miastem bez bilansu PW', file: 'diplomacy-truce-end-price.ts', old: 'if (cityPlan.full && cityPlan.items.length > 0 && input.balanceOk(cityPlan)) {', neu: 'if (cityPlan.full && cityPlan.items.length > 0) {' },
  { id: 'k8', what: 'tick: oferta u złej strony (adresat = gracz zamiast AI)', file: 'diplomacy-peace-lock.ts', old: 'const ai = ports.isHuman(target) ? initiator : target;', neu: 'const ai = ports.isHuman(target) ? target : initiator;' },
];

async function runSuite(mainMuts, modMuts) {
  const M = await buildModules(modMuts);
  const mainJs = extractMain(mainMuts);
  const results = [];
  for (const [name, fn] of SCENARIOS) {
    const w = makeWorld();
    try {
      const E = makeEngine(M, mainJs, w);
      const errs = fn(E, w, M, mainJs);
      results.push({ name, errs });
    } catch (e) {
      results.push({ name, errs: ['wyjątek: ' + (e && e.message)] });
    }
  }
  return results;
}

(async () => {
  let fail = 0;
  // Baza: wszystkie sceneria zielone.
  const base = await runSuite([], []);
  for (const r of base) {
    if (r.errs.length) { fail++; console.error('FAIL ' + r.name + ': ' + r.errs.join(' | ')); }
    else console.log('PASS ' + r.name);
  }
  const baseFail = fail;
  // Mutacje: każda musi dać co najmniej jedną czerwoną scenerię.
  let red = 0;
  const all = [...MAIN_MUTS.map(m => ({ ...m, kind: 'main' })), ...MOD_MUTS.map(m => ({ ...m, kind: 'modul' }))];
  for (const m of all) {
    let res;
    try {
      res = m.kind === 'main' ? await runSuite([m], []) : await runSuite([], [m]);
    } catch (e) {
      console.error('MUTACJA ' + m.id + ' nie zastosowana: ' + e.message); fail++; continue;
    }
    const nRed = res.filter(r => r.errs.length).length;
    if (nRed > 0) { red++; console.log('MUT-RED ' + m.id + ' (' + nRed + ' czerwonych) ' + m.what); }
    else { fail++; console.error('MUT-SURVIVED ' + m.id + ' ' + m.what); }
  }
  console.log(`\nBAZA: ${SCENARIOS.length - baseFail}/${SCENARIOS.length} zielonych`);
  console.log(`MUTACJE CZERWONE: ${red}/${all.length}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
