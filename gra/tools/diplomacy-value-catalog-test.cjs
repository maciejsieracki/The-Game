'use strict';
/** Katalog PN — diplomacy-value-catalog.ts */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-value-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-value-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  diplomacyPnZloto,
  diplomacyPnPraca,
  diplomacyPnZywnosc,
  diplomacyZywnoscNaPn,
  diplomacyPnZloze,
  diplomacyPnTech,
  diplomacyPnUlepszenie,
  diplomacyPnJednostka,
  diplomacyPnBudynek,
  diplomacyPnSurowiecBoolean,
  diplomacyResourceAccessCatalog,
  diplomacySumPn,
  diplomacyDealFairAtRel,
  diplomacyFairGivePn,
  diplomacySurplusPn,
  diplomacyPnToZaufanieDelta,
  diplomacyClampTrustGainNaTure,
  diplomacyTrustFromSurplus,
  diplomacyTradeTrustFromDeal,
  diplomacyGiftTrustFromPn,
  diplomacyDobraWolaFromSurplus,
  diplomacyProgDarRelacja,
  diplomacyPnSurowiecIlosc,
  diplomacyHandelSurowiecCenaJednostkowa,
  diplomacyHandelSurowceCatalog,
  diplomacyHandelSurowcePakietWielkosc,
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

eq(D.diplomacyPnZloto(100), 100, 'zloto 100');
eq(D.diplomacyPnPraca(50), 50, 'praca 50');
eq(D.diplomacyPnZloze('zelazo'), 150, 'zloze zelazo');
eq(D.diplomacyPnUlepszenie('farma'), 20, 'ref koszt farma (surowiec_boolean only)');
eq(D.diplomacyPnUlepszenie('tartak'), 25, 'ref koszt tartak (surowiec_boolean only)');
eq(D.diplomacyPnJednostka('Wojownik'), 10, 'jednostka Wojownik');
eq(D.diplomacyPnBudynek('stolarnia', 1), 20, 'ref budynek L1 (nie handel)');
eq(D.diplomacyPnBudynek('stolarnia', 2), 22, 'ref budynek L2 (nie handel)');
eq(D.diplomacyPnSurowiecBoolean('drewno'), 25, 'surowiec drewno=tartak');
eq(D.diplomacyPnSurowiecBoolean('ruda'), 25, 'surowiec ruda=kopalnia');
ok(D.diplomacyPnZloze('bydlo') === null, 'bydlo nie w cenniku zloza');
ok(D.diplomacyPnSurowiecBoolean('bydlo') === 20, 'bydlo boolean=ulepszenie 20');

const techPn = D.diplomacyPnTech('Obróbka drewna', 'standardowa');
eq(techPn, 10, 'tech Obróbka drewna JSON=5 @ standardowa');

const sum = D.diplomacySumPn([
  { typ: 'zloto', id: '', ilosc: 50 },
  { typ: 'praca', id: '', ilosc: 20 },
]);
eq(sum, 70, 'suma PN 50+20');

ok(D.diplomacyDealFairAtRel(100, 100, 100), 'fair @ Rel 100 1:1');
ok(D.diplomacyDealFairAtRel(67, 100, 150), 'fair @ Rel 150 — płacisz mniej');
ok(!D.diplomacyDealFairAtRel(50, 100, 100), 'unfair give too low');

const cat = D.diplomacyResourceAccessCatalog();
ok(typeof cat.drewno === 'number' && cat.drewno === 25, 'katalog surowcow drewno');

eq(D.diplomacyPnZywnosc(1), 1, '1 zywn = 1 PN');
eq(D.diplomacyPnZywnosc(10), 10, '10 zywn = 10 PN');
eq(D.diplomacyPnZywnosc(0), 0, '0 zywn = 0 PN');
eq(D.diplomacyZywnoscNaPn(), 1, 'kurs 1 na PN');
eq(D.diplomacyFairGivePn(100, 150), 67, 'fair give @ Rel 150');
eq(D.diplomacySurplusPn(150, 100, 100), 50, 'nadmiar handel 50');
eq(D.diplomacySurplusPn(100, 100, 100), 0, 'brak nadmiaru fair deal');
eq(D.diplomacyPnToZaufanieDelta(99), 0, '99 PN = 0 Zauf @ 100');
eq(D.diplomacyPnToZaufanieDelta(100), 1, '100 PN = +1 Zauf @ 100');
eq(D.diplomacyPnToZaufanieDelta(500), 5, '500 PN surowo +5');
eq(D.diplomacyClampTrustGainNaTure(5, 0), 5, 'cap tura pelne 5');
eq(D.diplomacyClampTrustGainNaTure(5, 3), 2, 'cap tura zostalo 2');
eq(D.diplomacyClampTrustGainNaTure(3, 5), 0, 'cap tura wyczerpane');
const trade = D.diplomacyTradeTrustFromDeal(250, 100, 100, 0);
eq(trade.surplusPn, 150, 'trade surplus 150');
eq(trade.deltaZaufanieRaw, 1, 'trade raw +1');
eq(trade.deltaZaufanie, 1, 'trade efekt +1');
const trade2 = D.diplomacyTradeTrustFromDeal(600, 0, 100, 0);
eq(trade2.deltaZaufanieRaw, 6, 'duzy deal raw 6');
eq(trade2.deltaZaufanie, 5, 'duzy deal cap 5 na ture');
const dw = D.diplomacyDobraWolaFromSurplus(150);
ok(dw.active && dw.tur === 3, 'dobra wola @ 150 PN');
ok(!D.diplomacyDobraWolaFromSurplus(50).active, 'brak dobrej woli @ 50 PN');
eq(D.diplomacyProgDarRelacja(), 30, 'prog dar Rel 30');
const gift = D.diplomacyGiftTrustFromPn(250, 3);
eq(gift.deltaZaufanieRaw, 2, 'dar raw +2');
eq(gift.deltaZaufanie, 2, 'dar z limitem tury +2');

// Maciej 2026-07-29: PN/szt. surowców magazynowych (handel_surowce)
eq(D.diplomacyHandelSurowcePakietWielkosc(), 10, 'pakiet_wielkosc = 10 szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('drewno'), 1, 'drewno 1 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('glina'), 2, 'glina 2 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('kamien'), 3, 'kamien 3 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('ruda'), 5, 'ruda miedzi 5 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('ruda_zelaza'), 10, 'ruda_zelaza 10 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('cegla'), 5, 'cegla 5 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('sol'), 2, 'sol 2 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('kon'), 5, 'kon 5 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('ceramika'), 5, 'ceramika 5 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('braz'), 15, 'braz 15 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('zelazo'), 20, 'zelazo 20 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('stal'), 25, 'stal 25 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('zloto'), 50, 'zloto-surowiec 50 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaJednostkowa('wegiel'), 20, 'wegiel 20 PN/szt.');
eq(D.diplomacyPnSurowiecIlosc('drewno', 1), 10, '1 pakiet drewno = 10 PN (1×10×1)');
eq(D.diplomacyPnSurowiecIlosc('ruda_zelaza', 2), 200, '2 pakiety ruda_zelaza = 200 PN (2×10×10)');
eq(D.diplomacyPnSurowiecIlosc('stal', 1), 250, '1 pakiet stal = 250 PN (1×10×25)');
eq(D.diplomacyPnSurowiecIlosc('zloto', 1), 500, '1 pakiet zloto = 500 PN (1×10×50)');
eq(D.diplomacyPnSurowiecIlosc('wegiel', 1), 200, '1 pakiet wegiel = 200 PN (1×10×20)');
const handelCat = D.diplomacyHandelSurowceCatalog();
ok(Object.keys(handelCat).length === 14, 'katalog handlu: 14 surowców ilościowych');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`diplomacy-value-catalog-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
