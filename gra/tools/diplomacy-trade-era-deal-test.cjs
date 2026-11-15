'use strict';
/**
 * R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 (FC r1 pkt 1, runda 2) — epoka UMOWY w Szybkiej umowie.
 * Test: computeQuickDealBasket liczy ziarno ilosci w epoce przekazanej przez tradeEra
 * (wyzsza z epok stron), nie w epoce gracza. Mieszane epoki: Braz+Kamien => blok 50.
 * Uruchomienie: node tools/diplomacy-trade-era-deal-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-era-deal-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-era-deal-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { computeQuickDealBasket } from '../src/game/diplomacy-pn-engine';
export {
  diplomacyTradeEra, setDiplomacyTradeEra, diplomacyDealTradeEra, withDiplomacyTradeEra,
  diplomacyHandelKrokBlokEpoki, diplomacyPnSurowiecIlosc,
} from '../src/game/diplomacy-value-catalog';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const D = require(BUNDLE);
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${a}, want ${b})`); }

function quickFor(era, maxQty) {
  return D.computeQuickDealBasket({
    relacjaTotal: 60,
    ourGoldAvailable: 0,
    ourResourceOptions: [],
    theirResourceOptions: [],
    ourQuantityResourceOptions: [],
    theirQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty }],
    tradeEra: era,
  });
}
function receiveDrewno(res) {
  const it = res.receiveItems.find(i => i.typ === 'surowiec_ilosc' && i.id === 'drewno');
  return it ? it.ilosc : 0;
}

// Ziarno ilosci = blok epoki (Kamien 10, Braz 50, Zelazo 100), nie stale 10.
eq(receiveDrewno(quickFor(1, 500)), 10, 'Szybka umowa Kamien: ziarno 10 szt.');
eq(receiveDrewno(quickFor(2, 500)), 50, 'Szybka umowa Braz: ziarno 50 szt. (nie 0, nie 10)');
eq(receiveDrewno(quickFor(3, 500)), 100, 'Szybka umowa Zelazo: ziarno 100 szt.');
// Braz z zapasem ponizej bloku: brak ziarna (floor do kroku), nie zawyzenie.
eq(receiveDrewno(quickFor(2, 30)), 0, 'Braz: zapas 30 < blok 50 => brak ziarna drewna');

// Epoka umowy przekazana jawnie nie zalezy od epoki globalnej (gracz w Kamieniu).
D.setDiplomacyTradeEra(1);
eq(receiveDrewno(quickFor(2, 500)), 50, 'jawna epoka umowy Braz przy globalnej Kamien: 50 szt.');
eq(D.diplomacyTradeEra(), 1, 'computeQuickDealBasket nie zmienia globalnej epoki');

// Mieszane epoki: Braz (partner) + Kamien (gracz) => epoka umowy = Braz => blok 50.
const mixed = D.diplomacyDealTradeEra(1, 2);
eq(mixed, 2, 'mieszane: Kamien+Braz => epoka umowy 2');
eq(receiveDrewno(quickFor(mixed, 500)), 50, 'mieszane: Braz+Kamien => blok 50 w Szybkiej umowie');
eq(D.diplomacyPnSurowiecIlosc('drewno', 50, mixed), 1, 'mieszane: 50 szt. drewna = 1 PN');

// Mutacja: blok 10 w Brazie nie moze dac 1 PN.
ok(D.diplomacyPnSurowiecIlosc('drewno', 10, 2) !== 1, 'mutacja: blok 10 w Brazie odrzucony');
// Determinizm.
for (let i = 0; i < 3; i++) eq(receiveDrewno(quickFor(2, 500)), 50, 'determinizm Szybkiej umowy Braz');
// withDiplomacyTradeEra przywraca epoke po wyjatku.
try { D.withDiplomacyTradeEra(3, () => { throw new Error('x'); }); } catch (_) { /* oczekiwane */ }
eq(D.diplomacyTradeEra(), 1, 'withDiplomacyTradeEra przywraca epoke po wyjatku');

console.log(`diplomacy-trade-era-deal-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
if (fail > 0) process.exit(1);
