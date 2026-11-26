'use strict';
/**
 * truce-end-settle-exec-test.cjs — R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1 (pkt 2).
 * Test WYKONAWCZY realnej płatności ceny pokoju po rozejmie: executeTruceEndSettlement
 * (diplomacy-truce-end-price.ts) z portem przelewu na prostym ledgerze (surowce + właściciel miasta).
 *   - stan przed/po: surowce zmniejszone u płatnika, zwiększone u odbiorcy; miasto zmienia właściciela;
 *   - przelew wołany dokładnie raz (brak podwójnej zapłaty), z płatnikiem i odbiorcą we właściwej kolejności;
 *   - brak planu (cena 0 / plan niepełny) → zero przelewów i zero zmian stanu.
 * Mutanty czerwone: M-NOPAY (usunięty przelew), M-SWAP (zamiana płatnika i odbiorcy), M-DOUBLE (podwójny przelew).
 * Run: node tools/truce-end-settle-exec-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const PRICE = path.resolve(GRA, 'src', 'game', 'diplomacy-truce-end-price.ts');
const ENTRY = path.resolve(GRA, 'src', '.truce-end-settle-exec-entry.ts');
const BUNDLE = path.resolve(__dirname, '.truce-end-settle-exec.cjs');
const BUNDLE_NOPAY = path.resolve(__dirname, '.truce-end-settle-exec-nopay.cjs');
const BUNDLE_SWAP = path.resolve(__dirname, '.truce-end-settle-exec-swap.cjs');
const BUNDLE_DOUBLE = path.resolve(__dirname, '.truce-end-settle-exec-double.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { executeTruceEndSettlement, pickTruceEndSettlementPlan } from './game/diplomacy-truce-end-price';",
  '',
].join('\n');

function mutantPlugin(target, from, to) {
  const info = { applied: 0 };
  const filter = new RegExp(path.basename(target).replace(/[.]/g, '\\.') + '$');
  return {
    info,
    plugin: {
      name: 'mutant-truce-settle-exec',
      setup(build) {
        build.onLoad({ filter }, async () => {
          const src = fs.readFileSync(target, 'utf8');
          info.applied = src.split(from).length - 1;
          return { contents: src.split(from).join(to), loader: 'ts' };
        });
      },
    },
  };
}

async function buildBundle(outfile, plugins) {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      format: 'cjs',
      platform: 'node',
      outfile,
      logLevel: 'silent',
      plugins: plugins || [],
    });
  } finally {
    fs.unlinkSync(ENTRY);
  }
  return require(outfile);
}

/** Ledger: zasoby per właściciel + właściciel miast. Port przelewu (jak transferBasketItems) zapisuje stan. */
function makeLedger() {
  const ledger = {
    goods: { 7: { zloto: 100, brąz: 50 }, 9: { zloto: 0, brąz: 0 } },
    cityOwner: { 'c-7-1': 7, 'c-7-2': 7 },
    transfers: [],
  };
  ledger.transfer = (plan, payerId, payeeId) => {
    ledger.transfers.push({ payerId, payeeId, items: plan.items.length });
    for (const it of plan.items) {
      if (it.kind === 'miasto') {
        ledger.cityOwner[it.id] = payeeId;
      } else {
        ledger.goods[payerId][it.id] -= it.amount;
        ledger.goods[payeeId][it.id] += it.amount;
      }
    }
  };
  ledger.snapshot = () => JSON.parse(JSON.stringify({ goods: ledger.goods, cityOwner: ledger.cityOwner }));
  return ledger;
}

/** Plan testowy: pozycje surowców (kind 'zloto'/'brąz') albo miast (kind 'miasto'). */
function planWith(full, items) {
  return { full, coveredPn: full ? 50 : 10, items };
}

(async () => {
  const lib = await buildBundle(BUNDLE);
  const exec = lib.executeTruceEndSettlement;
  const okBal = () => true;

  // (1) Surowce: płatnik 7 (przegrywający, surowce), odbiorca 9. Stan przed/po.
  {
    const L = makeLedger();
    const before = L.snapshot();
    const pick = exec({
      requiredPn: 50, currency: 'surowce',
      planCity: () => planWith(false, []),
      planTail: () => planWith(true, [{ kind: 'zloto', id: 'zloto', amount: 30 }, { kind: 'brąz', id: 'brąz', amount: 20 }]),
      balanceOk: okBal,
    }, 7, 9, L.transfer);
    check('(1) surowce: płacona cena pokryta → plan zwrócony z walutą surowce', pick != null && pick.currency === 'surowce', pick);
    check('(1) surowce: płatnik 7 traci złoto 30 i brąz 20', L.goods[7].zloto === before.goods[7].zloto - 30 && L.goods[7].brąz === before.goods[7].brąz - 20, L.goods[7]);
    check('(1) surowce: odbiorca 9 zyskuje złoto 30 i brąz 20', L.goods[9].zloto === 30 && L.goods[9].brąz === 20, L.goods[9]);
    check('(1) surowce: przelew wołany dokładnie raz (brak podwójnej zapłaty)', L.transfers.length === 1, L.transfers);
    check('(1) surowce: przelew niesie płatnika 7 i odbiorcę 9 (kolejność)', L.transfers[0] && L.transfers[0].payerId === 7 && L.transfers[0].payeeId === 9, L.transfers);
    check('(1) surowce: miasta bez zmian właściciela', JSON.stringify(L.cityOwner) === JSON.stringify(before.cityOwner));
  }

  // (2) Miasto: płatnik 7 (słabszy, >20%), cesja miasta c-7-1 do 9 przez planCity.
  {
    const L = makeLedger();
    const before = L.snapshot();
    const pick = exec({
      requiredPn: 80, currency: 'miasto',
      planCity: () => planWith(true, [{ kind: 'miasto', id: 'c-7-1', amount: 1, pn: 80 }]),
      planTail: () => planWith(true, [{ kind: 'zloto', id: 'zloto', amount: 80 }]),
      balanceOk: okBal,
    }, 7, 9, L.transfer);
    check('(2) miasto: plan miastem wybrany', pick != null && pick.currency === 'miasto', pick);
    check('(2) miasto: cesja zmienia właściciela c-7-1 na 9 (planCityCession)', L.cityOwner['c-7-1'] === 9, L.cityOwner);
    check('(2) miasto: drugie miasto 7 zostaje', L.cityOwner['c-7-2'] === 7, L.cityOwner);
    check('(2) miasto: surowce nie zmieniają się (brak ogona przy pełnym planie miastem)', JSON.stringify(L.goods) === JSON.stringify(before.goods), L.goods);
    check('(2) miasto: przelew wołany raz', L.transfers.length === 1, L.transfers);
  }

  // (3) Miasto niedostępne → wariant zastępczy surowcami (ten sam koszyk), 1 przelew.
  {
    const L = makeLedger();
    const pick = exec({
      requiredPn: 40, currency: 'miasto',
      planCity: () => planWith(false, []),
      planTail: () => planWith(true, [{ kind: 'zloto', id: 'zloto', amount: 40 }]),
      balanceOk: okBal,
    }, 7, 9, L.transfer);
    check('(3) brak cedowalnego miasta → surowce zastępczo', pick != null && pick.currency === 'surowce', pick);
    check('(3) wariant zastępczy: złoto przeszło 7 → 9 (40)', L.goods[9].zloto === 40 && L.goods[7].zloto === 60, L.goods);
    check('(3) wariant zastępczy: jeden przelew', L.transfers.length === 1, L.transfers);
  }

  // (4) Cena 0 → brak planu, zero przelewów, zero zmian stanu.
  {
    const L = makeLedger();
    const before = L.snapshot();
    const pick = exec({
      requiredPn: 0, currency: 'surowce',
      planCity: () => planWith(true, [{ kind: 'miasto', id: 'c-7-1', amount: 1, pn: 0 }]),
      planTail: () => planWith(true, [{ kind: 'zloto', id: 'zloto', amount: 10 }]),
      balanceOk: okBal,
    }, 7, 9, L.transfer);
    check('(4) cena 0 → null (pokój nie wchodzi)', pick === null, pick);
    check('(4) cena 0 → zero przelewów i stan nietknięty', L.transfers.length === 0 && JSON.stringify(L.snapshot()) === JSON.stringify(before));
  }

  // (5) Plan niepełny (brak pokrycia) → brak przelewu i brak zmian stanu.
  {
    const L = makeLedger();
    const before = L.snapshot();
    const pick = exec({
      requiredPn: 90, currency: 'surowce',
      planCity: () => planWith(false, []),
      planTail: () => planWith(false, [{ kind: 'zloto', id: 'zloto', amount: 20 }]),
      balanceOk: okBal,
    }, 7, 9, L.transfer);
    check('(5) plan niepełny → null, brak przelewu', pick === null && L.transfers.length === 0);
    check('(5) plan niepełny → stan nietknięty', JSON.stringify(L.snapshot()) === JSON.stringify(before));
  }

  // Mutanty (czerwone): każdy musi zostać wykryty przez powyższe asercje.
  const src = fs.readFileSync(PRICE, 'utf8');
  const callOld = 'if (pick.plan.items.length > 0) transfer(pick.plan, payerId, payeeId);';
  check('wzorzec mutantów: wywołanie przelewu obecne w module', src.split(callOld).length - 1 === 1);

  const mNopay = mutantPlugin(PRICE, callOld, 'void transfer;');
  const libNopay = await buildBundle(BUNDLE_NOPAY, [mNopay.plugin]);
  check('M-NOPAY zastosowany', mNopay.info.applied === 1, mNopay.info);
  {
    const L = makeLedger();
    libNopay.executeTruceEndSettlement({
      requiredPn: 50, currency: 'surowce', planCity: () => planWith(false, []),
      planTail: () => planWith(true, [{ kind: 'zloto', id: 'zloto', amount: 30 }]), balanceOk: okBal,
    }, 7, 9, L.transfer);
    check('M-NOPAY wykryty: usunięty przelew (stan 7/9 nie zmienia się)', L.goods[9].zloto === 0 && L.transfers.length === 0);
  }

  const mSwap = mutantPlugin(PRICE, callOld, 'if (pick.plan.items.length > 0) transfer(pick.plan, payeeId, payerId);');
  const libSwap = await buildBundle(BUNDLE_SWAP, [mSwap.plugin]);
  check('M-SWAP zastosowany', mSwap.info.applied === 1, mSwap.info);
  {
    const L = makeLedger();
    libSwap.executeTruceEndSettlement({
      requiredPn: 50, currency: 'surowce', planCity: () => planWith(false, []),
      planTail: () => planWith(true, [{ kind: 'zloto', id: 'zloto', amount: 30 }]), balanceOk: okBal,
    }, 7, 9, L.transfer);
    check('M-SWAP wykryty: zamiana płatnika (przelew 9 → 7; płatnik 7 nie traci 30, stan 7 ≠ 70)', L.goods[7].zloto !== 70 && L.transfers[0].payerId === 9, L.transfers);
  }

  const mDouble = mutantPlugin(PRICE, callOld, 'if (pick.plan.items.length > 0) { transfer(pick.plan, payerId, payeeId); transfer(pick.plan, payerId, payeeId); }');
  const libDouble = await buildBundle(BUNDLE_DOUBLE, [mDouble.plugin]);
  check('M-DOUBLE zastosowany', mDouble.info.applied === 1, mDouble.info);
  {
    const L = makeLedger();
    libDouble.executeTruceEndSettlement({
      requiredPn: 50, currency: 'surowce', planCity: () => planWith(false, []),
      planTail: () => planWith(true, [{ kind: 'zloto', id: 'zloto', amount: 30 }]), balanceOk: okBal,
    }, 7, 9, L.transfer);
    check('M-DOUBLE wykryty: podwójna zapłata (złoto 9 = 60, nie 30)', L.goods[9].zloto === 60 && L.transfers.length === 2, L.goods[9]);
  }

  // Dowód, że scenariusze (1)–(5) wykrywają mutanty: wynik mutanta różni się od czystej implementacji.
  try { fs.unlinkSync(BUNDLE_NOPAY); fs.unlinkSync(BUNDLE_SWAP); fs.unlinkSync(BUNDLE_DOUBLE); } catch (_) { /* sprzątanie */ }

  console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
