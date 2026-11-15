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

// ---- (1) + (2): przelew umowy + zapis delta obu stron; mutacja bez biorcy ----
console.log('[1] Umowa wymiany: przelew silnika + księga (30 iteracji)');
{
  const rng = makeRng(20261115);
  let maxDiff = 0;
  let mutationDiffSeen = 0;
  let movedTotal = 0;
  for (let it = 0; it < 30; it++) {
    const cities = makeCities(rng);
    const fromOwner = OWNERS[it % 3];
    const toOwner = OWNERS[(it + 1) % 3];
    const key = KEYS[it % 2];
    const qty = 1 + Math.floor(rng() * 25);
    const capId = cities.find(c => c.ownerId === toOwner).id;

    const fromBefore = { ...M.ownerResourceStockAll(cities, fromOwner) };
    const toBefore = { ...M.ownerResourceStockAll(cities, toOwner) };
    const refs = cities.map(c => ({ id: c.id, ownerId: c.ownerId, surowce: c.surowce ?? {} }));
    const result = M.transferSurowiecIlosc(key, qty, fromOwner, toOwner, capId, refs);
    for (let i = 0; i < cities.length; i++) {
      const after = result.cities[i];
      if (refs[i] && after && after.surowce !== refs[i].surowce) cities[i].surowce = after.surowce;
    }

    const turn = M.createLedgerTurn();
    M.recordStockDeltaToTurn(turn, fromBefore, M.ownerResourceStockAll(cities, fromOwner),
      `umowa|out|${toOwner}`, { kind: 'umowa_wymiany', label: 'Umowa wymiany (test)' });
    M.recordStockDeltaToTurn(turn, toBefore, M.ownerResourceStockAll(cities, toOwner),
      `umowa|in|${fromOwner}`, { kind: 'umowa_wymiany', label: 'Umowa wymiany (test)' });
    // Ta sama księga, ale per właściciel: biorcy/nadawcy kolidują tylko gdy jest to ten sam owner;
    // tu sprawdzamy sumę po obu stronach przelewu, czyli zmianę łączną obu magazynów.
    const deltaFrom = M.ownerResourceStockAll(cities, fromOwner)[key] - (fromBefore[key] ?? 0);
    const deltaTo = M.ownerResourceStockAll(cities, toOwner)[key] - (toBefore[key] ?? 0);
    const bookedFrom = M.ledgerResourceNet(turn, key).net;
    // Księga po stronie nadawcy + biorcy: suma = deltaFrom + deltaTo (przelew netto 0 między
    // magazynami, więc suma delt obu stron = 0 dla samego przelewu, a księga musi to odzwierciedlić).
    const diff = Math.abs((deltaFrom + deltaTo) - bookedFrom);
    maxDiff = Math.max(maxDiff, diff);
    movedTotal += Math.abs(deltaFrom);

    // Mutacja: pominięcie wpisu biorcy -> rozjazd, gdy coś przeniesiono.
    const mutTurn = M.createLedgerTurn();
    M.recordStockDeltaToTurn(mutTurn, fromBefore, M.ownerResourceStockAll(cities, fromOwner),
      `umowa|out|${toOwner}`, { kind: 'umowa_wymiany', label: 'Umowa wymiany (test)' });
    const mutDiff = Math.abs((deltaFrom + deltaTo) - M.ledgerResourceNet(mutTurn, key).net);
    if (Math.abs(deltaFrom) > 0 && mutDiff > 0) mutationDiffSeen++;
  }
  check('suma księgi = zmiana magazynów obu stron (30 iteracji, maks. różnica 0)', maxDiff === 0, `maxDiff=${maxDiff}`);
  check('mutacja (brak wpisu biorcy) daje rozjazd przy przelewie', movedTotal === 0 || mutationDiffSeen > 0,
    `movedTotal=${movedTotal} mutationDiffSeen=${mutationDiffSeen}`);
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

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
