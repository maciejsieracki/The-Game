'use strict';
/**
 * resource-ledger-trade-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (partia 3a).
 *
 * Sprawdza księgowanie „Umowa wymiany" i ścięcia capu / Mennicy (migawka magazynu):
 *  (1) transferSurowiecIlosc (prawdziwy silnik przelewu) + zapis delta obu stron:
 *      suma wpisów księgi per właściciel = zmiana magazynu (różnica 0), 30 iteracji, 2 surowce;
 *  (2) mutacja: pominięcie zapisu biorcy daje rozjazd > 0 (gdy coś przeniesiono);
 *  (3) reconcileOwnerResourceCaps: ścięcie nadwyżki zapisane jako 'limit_magazynu' (różnica 0);
 *  (4) pula okienkowa (pending): zapis przed tickiem trafia do rekordu tury po drainie, okno puste;
 *  (5) brak zmiany magazynu = brak wpisów.
 *
 * NIE obejmuje main.ts (pętla gry nie jest uruchamialna w node) -- patrz raport tematu.
 * Uruchom z gra/: node tools/resource-ledger-trade-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[resource-ledger-trade-test] esbuild not found'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.resource-ledger-trade-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.resource-ledger-trade-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { ownerResourceStockAll } from '../src/game/building-stock-cost';
export { transferSurowiecIlosc } from '../src/game/diplomacy-basket-transfer';
export { reconcileOwnerResourceCaps } from '../src/game/economy-upkeep';
export {
  createLedgerTurn,
  ledgerResourceNet,
  recordStockDeltaToTurn,
  recordStockDeltaToPending,
  drainPendingLedgerInto,
  peekPendingLedger,
  resetPendingLedger,
} from '../src/game/resource-ledger';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[resource-ledger-trade-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name}${detail ? ' :: ' + detail : ''}`); }
}

// Deterministyczny generator (LCG) -- bez Math.random, test powtarzalny.
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const KEYS = ['sol', 'drewno'];
const OWNERS = [1, 2, 3];

function makeCities(rng) {
  const cities = [];
  let id = 0;
  for (const ownerId of OWNERS) {
    for (let k = 0; k < 2; k++) {
      const surowce = {};
      for (const key of KEYS) surowce[key] = Math.floor(rng() * 40);
      cities.push({ id: `c${++id}`, ownerId, surowce });
    }
  }
  return cities;
}

function totalFor(cities, ownerId, key) {
  return M.ownerResourceStockAll(cities, ownerId)[key] ?? 0;
}

function ledgerSum(turn, ownerId, key) {
  return M.ledgerResourceNet(turn, key).net;
}

// ---- (1) + (2): przelew umowy; OSOBNA księga per właściciel (jak w main.ts: okno pending per owner) ----
console.log('[1] Umowa wymiany: przelew silnika + osobne księgi właścicieli (30 iteracji)');
{
  const rng = makeRng(20261115);
  let maxDiffFrom = 0, maxDiffTo = 0;
  let mutationDiffSeen = 0, movedTotal = 0, labelOk = true;
  const CIV = { 1: 'Rzymianie', 2: 'Asyria', 3: 'Hetyci' };
  for (let it = 0; it < 30; it++) {
    const cities = makeCities(rng);
    const fromOwner = OWNERS[it % 3];
    const toOwner = OWNERS[(it + 1) % 3];
    const key = KEYS[it % 2];
    const qty = 1 + Math.floor(rng() * 25);
    const capId = cities.find(c => c.ownerId === toOwner).id;

    M.resetPendingLedger();
    const fromBefore = { ...M.ownerResourceStockAll(cities, fromOwner) };
    const toBefore = { ...M.ownerResourceStockAll(cities, toOwner) };
    const refs = cities.map(c => ({ id: c.id, ownerId: c.ownerId, surowce: c.surowce ?? {} }));
    const result = M.transferSurowiecIlosc(key, qty, fromOwner, toOwner, capId, refs);
    for (let i = 0; i < cities.length; i++) {
      const after = result.cities[i];
      if (refs[i] && after && after.surowce !== refs[i].surowce) cities[i].surowce = after.surowce;
    }
    // Dokladnie jak main.ts: kazda strona pisze do WLASNEGO okna pending (etykieta = druga strona).
    M.recordStockDeltaToPending(fromOwner, fromBefore, M.ownerResourceStockAll(cities, fromOwner),
      `umowa-wymiany|out|${toOwner}`, { kind: 'umowa_wymiany', label: `Umowa wymiany z ${CIV[toOwner]}` });
    M.recordStockDeltaToPending(toOwner, toBefore, M.ownerResourceStockAll(cities, toOwner),
      `umowa-wymiany|in|${fromOwner}`, { kind: 'umowa_wymiany', label: `Umowa wymiany z ${CIV[fromOwner]}` });
    const books = new Map();
    M.drainPendingLedgerInto(books);

    const deltaFrom = M.ownerResourceStockAll(cities, fromOwner)[key] - (fromBefore[key] ?? 0);
    const deltaTo = M.ownerResourceStockAll(cities, toOwner)[key] - (toBefore[key] ?? 0);
    const bookFrom = books.get(fromOwner), bookTo = books.get(toOwner);
    // Osobne ksiegi: ksiega nadawcy = zmiana magazynu nadawcy, ksiega biorcy = zmiana magazynu biorcy (nie suma obu).
    maxDiffFrom = Math.max(maxDiffFrom, Math.abs(deltaFrom - (bookFrom ? M.ledgerResourceNet(bookFrom, key).net : 0)));
    maxDiffTo = Math.max(maxDiffTo, Math.abs(deltaTo - (bookTo ? M.ledgerResourceNet(bookTo, key).net : 0)));
    movedTotal += Math.abs(deltaFrom);
    if (deltaFrom !== 0) {
      const srcFrom = Object.values(bookFrom.byResource[key] || {})[0];
      const srcTo = Object.values(bookTo.byResource[key] || {})[0];
      labelOk = labelOk && srcFrom && srcFrom.label === `Umowa wymiany z ${CIV[toOwner]}` && srcFrom.amount < 0
        && srcTo && srcTo.label === `Umowa wymiany z ${CIV[fromOwner]}` && srcTo.amount > 0;
    }
    // Mutacja: ten sam przelew, ale zapis BIORCY pominiety -> osobna ksiega biorcy pusta -> rozjazd TYLKO biorcy.
    M.resetPendingLedger();
    M.recordStockDeltaToPending(fromOwner, fromBefore, M.ownerResourceStockAll(cities, fromOwner),
      `umowa-wymiany|out|${toOwner}`, { kind: 'umowa_wymiany', label: `Umowa wymiany z ${CIV[toOwner]}` });
    const mutBooks = new Map();
    M.drainPendingLedgerInto(mutBooks);
    const mutTo = mutBooks.get(toOwner);
    const mutDiffTo = Math.abs(deltaTo - (mutTo ? M.ledgerResourceNet(mutTo, key).net : 0));
    if (deltaTo !== 0 && mutDiffTo > 0) mutationDiffSeen++;
  }
  check('ksiega nadawcy = zmiana jego magazynu (30 iteracji, maks. roznica 0)', maxDiffFrom === 0, `maxDiffFrom=${maxDiffFrom}`);
  check('ksiega biorcy = zmiana jego magazynu (30 iteracji, maks. roznica 0)', maxDiffTo === 0, `maxDiffTo=${maxDiffTo}`);
  check('przeniesiono cos (test nie jest pusty)', movedTotal > 0, `movedTotal=${movedTotal}`);
  check('etykiety „Umowa wymiany z <civ>” po stronie nadawcy (−) i biorcy (+) wskazuja DRUGA strone', labelOk);
  check('mutacja: pominiecie zapisu biorcy = pusta ksiega biorcy = rozjazd (przy niezerowym przelewie)', mutationDiffSeen > 0, `seen=${mutationDiffSeen}`);
  M.resetPendingLedger();
}

// ---- (3): ścięcie capu ----
console.log('[3] Ścięcie nadwyżki ponad limit magazynu (reconcileOwnerResourceCaps)');
{
  const cities = [
    { id: 'a', ownerId: 7, surowce: { drewno: 80 } },
    { id: 'b', ownerId: 7, surowce: { drewno: 60 } },
  ];
  const before = { ...M.ownerResourceStockAll(cities, 7) };
  M.reconcileOwnerResourceCaps(cities, () => 100);
  const after = M.ownerResourceStockAll(cities, 7);
  const turn = M.createLedgerTurn();
  M.recordStockDeltaToTurn(turn, before, after, 'limit|7', { kind: 'limit_magazynu', label: 'Ścięcie (test)' });
  check('cap ścina nadwyżkę do limitu (140 -> 100)', after.drewno === 100, `after=${after.drewno}`);
  check('księga ścięcia = zmiana magazynu (różnica 0)', M.ledgerResourceNet(turn, 'drewno').net === after.drewno - before.drewno,
    `booked=${M.ledgerResourceNet(turn, 'drewno').net}`);
}

// ---- (4): okno pending -> rekord tury po drainie ----
console.log('[4] Okno poza tickiem (pending) -> rekord tury');
{
  const before = { sol: 10 };
  const after = { sol: 7 };
  M.recordStockDeltaToPending(9, before, after, 'umowa|out|8', { kind: 'umowa_wymiany', label: 'Umowa wymiany z X' });
  const peek = M.peekPendingLedger();
  check('okno pending zawiera wpis właściciela 9', peek.has(9));
  const target = new Map();
  M.drainPendingLedgerInto(target);
  const turn = target.get(9);
  check('po drainie rekord tury właściciela 9 istnieje', !!turn);
  check('po drainie suma sol = -3 (zmiana magazynu)', turn ? M.ledgerResourceNet(turn, 'sol').net === -3 : false);
  check('po drainie okno jest puste', M.peekPendingLedger().size === 0);
}

// ---- (5): brak zmiany = brak wpisów ----
console.log('[5] Brak zmiany magazynu = brak wpisów');
{
  const turn = M.createLedgerTurn();
  M.recordStockDeltaToTurn(turn, { sol: 5 }, { sol: 5 }, 'nic', { kind: 'mennica', label: 'Mennica (test)' });
  check('zerowa delta nie tworzy wpisu', Object.keys(turn.byResource).length === 0);
  M.recordStockDeltaToTurn(null, { sol: 5 }, { sol: 1 }, 'brak', { kind: 'mennica', label: 'x' });
  check('brak rekordu tury = no-op (bez wyjątku)', true);
}

console.log('[6] Reset okna przy wczytaniu / nowej grze (FC r3 nr 6)');
{
  const rng = makeRng(77);
  const cities = makeCities(rng);
  M.recordStockDeltaToPending(1, { sol: 10 }, { sol: 4 }, 'test|x', { kind: 'umowa_wymiany', label: 'Test' });
  check('6a okno niepuste przed resetem', M.peekPendingLedger().size > 0);
  M.resetPendingLedger();
  check('6b reset czyści okno', M.peekPendingLedger().size === 0);
  const tgt = new Map();
  M.drainPendingLedgerInto(tgt);
  check('6c po resecie drain nie wnosi wpisów', tgt.size === 0);
  void cities;
}

console.log('[7] Wpięcie w main.ts (sprawdzenie struktury źródła; zachowanie w żywej grze: resource-ledger-live-measure.cjs)');
{
  const mainSrc = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
  const fnBody = (name) => {
    const i = mainSrc.indexOf(`function ${name}(`);
    if (i < 0) return '';
    const next = mainSrc.indexOf('\n    function ', i + 20);
    return mainSrc.slice(i, next > 0 ? next : i + 9000);
  };
  for (const [name, call] of [['transferBasketItems', 'transferSurowiecIlosc('], ['applyCyclicDeliveryOutcome', 'transferSurowiecIlosc(']]) {
    const body = fnBody(name);
    const iT = body.indexOf(call);
    const iBefore = body.indexOf('ownerResourceStockAll(cities,');
    const iRec = body.indexOf('recordStockDeltaToPending(');
    const nRec = (body.match(/recordStockDeltaToPending\(/g) || []).length;
    check(`7a ${name}: migawka magazynu PRZED przelewem, zapis do okna PO przelewie`, iBefore >= 0 && iT > iBefore && iRec > iT, `iBefore=${iBefore} iT=${iT} iRec=${iRec}`);
    check(`7b ${name}: dwa zapisy (nadawca + biorca), kind umowa_wymiany, etykieta „Umowa wymiany z”`, nRec === 2 && (body.match(/kind: 'umowa_wymiany'/g) || []).length === 2 && (body.match(/Umowa wymiany z \$\{ownerDiploLabel\(/g) || []).length === 2, `nRec=${nRec}`);
  }
  check('7c exchange: brak ksiegowania szlaku handlowego (decyzja #311) -- brak kind szlak', !/kind: 'szlak/.test(mainSrc));
  const prepIdx = mainSrc.indexOf('function prepareSessionForLoad()');
  const prepBody = prepIdx >= 0 ? mainSrc.slice(prepIdx, prepIdx + 1200) : '';
  check('7d prepareSessionForLoad wywołuje resetPendingLedger()', /resetPendingLedger\(\)/.test(prepBody));
  const startIdx = mainSrc.indexOf('async function doStartGame(');
  const startBody = startIdx >= 0 ? mainSrc.slice(startIdx, startIdx + 2500) : '';
  check('7e doStartGame (NOWA GRA) wywołuje resetPendingLedger()', /resetPendingLedger\(\)/.test(startBody));
  const tickIdx = mainSrc.indexOf('drainPendingLedgerInto(econ.resourceLedgerByOwner)');
  check('7f drain okna pending w ticku ekonomii istnieje (jedyne miejsce opróżniania)', tickIdx > 0 && mainSrc.indexOf('drainPendingLedgerInto(econ.resourceLedgerByOwner)', tickIdx + 10) < 0);
  // runda 5 (zarzut 1 Evaluatora): wycinka GRACZA nie jest dotąd testowana mutacją na żywo (headless
  // nie wycina lasu). Test strukturalny: zapis `wycinka|<owner>` leży w pętli wyrębu gracza
  // (`hexClearingStates`, guard isHuman) PO creditOwnerResourceStock, z kind 'wycinka'.
  const clrStart = mainSrc.indexOf('for (const [hexKey, st] of hexClearingStates) {');
  const clrEnd = clrStart >= 0 ? mainSrc.indexOf('finalizeHexClearing(hexKey)', clrStart) : -1;
  const clrBody = clrStart >= 0 && clrEnd > clrStart ? mainSrc.slice(clrStart, clrEnd) : '';
  const iCredit = clrBody.indexOf('creditOwnerResourceStock(');
  const iLedger = clrBody.indexOf("`wycinka|${ownerId}`");
  check('7g wycinka gracza: guard isHuman w pętli hexClearingStates', /if \(!isHuman\(st\.ownerId\)\) continue;/.test(clrBody));
  check('7h wycinka gracza: zapis do księgi `wycinka|${ownerId}` (kind wycinka) PO creditOwnerResourceStock w tej samej pętli', iCredit > 0 && iLedger > iCredit && /kind: 'wycinka'/.test(clrBody), `iCredit=${iCredit} iLedger=${iLedger}`);
  check('7i wycinka AI: zapis do okna pending (kind wycinka) istnieje', /recordLedgerFlow\(pendingLedgerSink\(ownerId, 'wycinka'/.test(mainSrc));
  // R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1 (partia 4, zarzut 7 Evaluatora): kwota zapisu do księgi
  // MUSI być wartością zwróconą przez creditOwnerResourceStock (`wycinkaGot`), a nie stałą ani inną zmienną.
  // Wzorzec: przypisanie `wycinkaGot = creditOwnerResourceStock(` w pętli + argument `wycinkaGot` w zapisie.
  const ledgerWriteRe = /recordLedgerFlow\(ledgerTurnForOwner\(econ\.resourceLedgerByOwner, ownerId\), 'drewno', `wycinka\|\$\{ownerId\}`,\s*\{ kind: 'wycinka', label: 'Wycinka lasu' \}, wycinkaGot\)/;
  const gotAssignRe = /const wycinkaGot = creditOwnerResourceStock\(/;
  const ok7j = ledgerWriteRe.test(clrBody) && gotAssignRe.test(clrBody);
  check('7j wycinka gracza: kwota zapisu księgi = wycinkaGot (wynik creditOwnerResourceStock)', ok7j);
  // Mutacja (samokontrola asercji 7j): kwota zapisu zastąpiona stałą 0 MUSI czerwienić 7j.
  const clrMut = clrBody.replace(/, wycinkaGot\);/, ', 0);');
  check('7k mutacja wycinki gracza (kwota 0 w księdze) MUSI czerwienić 7j', clrMut !== clrBody && !ledgerWriteRe.test(clrMut));
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
