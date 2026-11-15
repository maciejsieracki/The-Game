'use strict';
/**
 * R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 — tabela epok handlu surowcami.
 * Kamien: 10 szt. = 1 PN (blok); Braz: 50 szt. = 1 PN; Zelazo: 100 szt. = 1 PN.
 * Zloto/wegiel: krok 1 szt., cena za szt. /5 (Braz) i /10 (Zelazo).
 * Cena PN za blok surowcow blokowych nie zmienia sie miedzy epokami.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-era-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-era-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  diplomacyHandelSurowiecKrok,
  diplomacyHandelKrokBlokEpoki,
  diplomacyHandelSurowiecCenaZaBlok,
  diplomacyNormalizeSurowiecIlosc,
  diplomacyPnSurowiecIlosc,
  setDiplomacyTradeEra,
  diplomacyTradeEra,
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

const BASE_BLOCK_PN = {
  drewno: 1, glina: 2, kamien: 3, ruda: 5, ruda_zelaza: 10, ruda_cyny: 10, cegla: 5,
  sol: 2, kon: 5, ceramika: 5, braz: 15, zelazo: 20, stal: 25,
};

eq(D.diplomacyTradeEra(), 1, 'domyslna epoka handlu = 1');

eq(D.diplomacyHandelKrokBlokEpoki(1), 10, 'blok Kamien = 10');
eq(D.diplomacyHandelKrokBlokEpoki(2), 50, 'blok Braz = 50');
eq(D.diplomacyHandelKrokBlokEpoki(3), 100, 'blok Zelazo = 100');
eq(D.diplomacyHandelKrokBlokEpoki(4), 100, 'epoka powyzej Zelaza = blok Zelaza');
eq(D.diplomacyHandelKrokBlokEpoki(0), 10, 'epoka ponizej 1 = Kamien');

// Przyklad wlasciciela: drewno 10 szt = 1 PN (Kamien), 50 szt = 1 PN (Braz), 100 szt = 1 PN (Zelazo).
eq(D.diplomacyPnSurowiecIlosc('drewno', 10, 1), 1, 'drewno Kamien: 10 szt = 1 PN');
eq(D.diplomacyPnSurowiecIlosc('drewno', 50, 2), 1, 'drewno Braz: 50 szt = 1 PN');
eq(D.diplomacyPnSurowiecIlosc('drewno', 100, 3), 1, 'drewno Zelazo: 100 szt = 1 PN');
eq(D.diplomacyPnSurowiecIlosc('drewno', 10, 2), 0, 'drewno Braz: 10 szt < blok 50 = 0 PN');
eq(D.diplomacyNormalizeSurowiecIlosc('drewno', 120, undefined, 2), 100, 'Braz: 120 -> floor do 100 (krok 50 => 100)');
eq(D.diplomacyNormalizeSurowiecIlosc('drewno', 120, undefined, 3), 100, 'Zelazo: 120 -> floor do 100');

for (const key of Object.keys(BASE_BLOCK_PN)) {
  for (const era of [1, 2, 3]) {
    eq(D.diplomacyHandelSurowiecCenaZaBlok(key, era), BASE_BLOCK_PN[key], `${key} cena za blok epoka ${era}`);
    eq(D.diplomacyHandelSurowiecKrok(key, era), D.diplomacyHandelKrokBlokEpoki(era), `${key} krok epoka ${era}`);
    const blok = D.diplomacyHandelKrokBlokEpoki(era);
    eq(D.diplomacyPnSurowiecIlosc(key, blok, era), BASE_BLOCK_PN[key], `${key} epoka ${era}: jeden blok = cena bloku`);
  }
}

eq(D.diplomacyHandelSurowiecKrok('zloto', 3), 1, 'zloto krok 1');
eq(D.diplomacyHandelSurowiecKrok('wegiel', 3), 1, 'wegiel krok 1');
eq(D.diplomacyHandelSurowiecCenaZaBlok('zloto', 1), 50, 'zloto Kamien 50 PN/szt');
eq(D.diplomacyHandelSurowiecCenaZaBlok('zloto', 2), 10, 'zloto Braz 10 PN/szt');
eq(D.diplomacyHandelSurowiecCenaZaBlok('zloto', 3), 5, 'zloto Zelazo 5 PN/szt');
eq(D.diplomacyHandelSurowiecCenaZaBlok('wegiel', 1), 20, 'wegiel Kamien 20 PN/szt');
eq(D.diplomacyHandelSurowiecCenaZaBlok('wegiel', 2), 4, 'wegiel Braz 4 PN/szt');
eq(D.diplomacyHandelSurowiecCenaZaBlok('wegiel', 3), 2, 'wegiel Zelazo 2 PN/szt');
eq(D.diplomacyPnSurowiecIlosc('zloto', 1, 2), 10, 'zloto Braz: 1 szt = 10 PN');
eq(D.diplomacyPnSurowiecIlosc('zloto', 1, 3), 5, 'zloto Zelazo: 1 szt = 5 PN');

// Globalna epoka handlu (setter) — uzywana, gdy wywolanie nie podaje epoki.
D.setDiplomacyTradeEra(2);
eq(D.diplomacyTradeEra(), 2, 'setter: epoka 2');
eq(D.diplomacyHandelSurowiecKrok('drewno'), 50, 'domyslna epoka 2: krok drewna 50');
eq(D.diplomacyPnSurowiecIlosc('drewno', 50), 1, 'domyslna epoka 2: 50 szt drewna = 1 PN');
D.setDiplomacyTradeEra(3);
eq(D.diplomacyPnSurowiecIlosc('drewno', 100), 1, 'domyslna epoka 3: 100 szt drewna = 1 PN');
D.setDiplomacyTradeEra(1);
eq(D.diplomacyPnSurowiecIlosc('drewno', 10), 1, 'powrot do epoki 1: 10 szt = 1 PN');

// Mieszane epoki: epoka umowy = WYZSZA z epok dwoch stron (Braz + Kamien => blok Brazu).
const ERA_UMOWY = (eraA, eraB) => Math.max(eraA, eraB);
eq(D.diplomacyPnSurowiecIlosc('drewno', 50, ERA_UMOWY(2, 1)), 1, 'mieszane: Braz+Kamien => 50 szt = 1 PN');
eq(D.diplomacyNormalizeSurowiecIlosc('drewno', 50, undefined, ERA_UMOWY(2, 1)), 50, 'mieszane: Braz+Kamien => krok 50');
eq(D.diplomacyPnSurowiecIlosc('drewno', 50, 1), 5, 'kontrola: sama epoka Kamienia liczy 50 szt = 5 PN (rozjazd bez reguly wyzszej epoki)');

// Determinizm: ten sam wejscie = ten sam wynik.
for (let i = 0; i < 3; i++) {
  eq(D.diplomacyPnSurowiecIlosc('zloto', 7, 3), D.diplomacyPnSurowiecIlosc('zloto', 7, 3), 'determinizm zloto Zelazo');
}

// Mutacja: blok 10 w Brazie nie moze dac 1 PN.
ok(D.diplomacyPnSurowiecIlosc('drewno', 10, 2) !== 1, 'mutacja: blok 10 w Brazie odrzucony');

console.log(`diplomacy-trade-era-table-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
if (fail > 0) process.exit(1);
