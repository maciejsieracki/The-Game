'use strict';
/**
 * R-WEB-DIPLO-PEACE-CITIES-NOT-TRANSFERRED-AND-WAR-NEXT-TURN-Q1 — regresja wyboru sekwencyjnego cesji miast
 * w pokoju wymuszonym. Testuje PRAWDZIWE funkcje z src/game/diplomacy-value-catalog.ts (bundle esbuild),
 * nie kopię. Mutacja kopii (stara walidacja „każde miasto względem stanu wyjściowego") musi dać wynik
 * czerwony: test sprawdza, że stara logika przepuszcza 2 miasta, a sekwencyjna — tylko 1 z 2.
 * Zakres: wyłącznie logika wyboru miast. Ścieżka main.ts (pendingPeaceItems/acceptPendingForcedPeace)
 * NIE jest tu odtwarzana (domknięcia w main.ts) — patrz raport, sekcja NIE ZMIERZONO.
 * Uruchom: node tools/peace-city-cession-and-rewar-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.peace-cession-seq-entry.ts');
const BUNDLE = path.resolve(__dirname, '.peace-cession-seq-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  selectSequentialCityCessions,
  diplomacyMiastoZakaz,
} from '../src/game/diplomacy-value-catalog';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const D = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(JSON.stringify(a) === JSON.stringify(b), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// Stara (błędna) walidacja: każde miasto sprawdzane względem STANU WYJŚCIOWEGO — do mutacji kopii.
function oldIndependentSelection({ cityIds, ownerCityIds, capitalCityId }) {
  return cityIds.filter(id => !D.diplomacyMiastoZakaz({ cityId: id, capitalCityId, ownerCityIds }));
}

// 1. Dwa miasta, dawca ma dokładnie dwa: drugie jest „ostatnim miastem" po pierwszym przelewie.
eq(
  D.selectSequentialCityCessions({ cityIds: ['A', 'B'], ownerCityIds: ['A', 'B'], capitalCityId: 'CAP' }),
  ['A'],
  'dawca z 2 miastami: tylko pierwsze przechodzi, drugie zablokowane jako ostatnie',
);
eq(
  oldIndependentSelection({ cityIds: ['A', 'B'], ownerCityIds: ['A', 'B'], capitalCityId: 'CAP' }),
  ['A', 'B'],
  'mutacja kopii (stara walidacja) przepuszcza OBA miasta — to jest defekt',
);

// 2. Dawca ma trzy miasta, oddaje dwa: oba przechodzą, zostaje jedno.
eq(
  D.selectSequentialCityCessions({ cityIds: ['A', 'B'], ownerCityIds: ['A', 'B', 'C'], capitalCityId: 'CAP' }),
  ['A', 'B'],
  'dawca z 3 miastami oddaje 2: oba przechodzą (zostaje 1)',
);

// 3. Stolica nigdy nie przechodzi, nawet gdy jest na liście.
eq(
  D.selectSequentialCityCessions({ cityIds: ['CAP', 'A'], ownerCityIds: ['CAP', 'A', 'B'], capitalCityId: 'CAP' }),
  ['A'],
  'stolica odrzucona, zwykłe miasto przechodzi',
);

// 4. Duplikat id na liście: przechodzi raz.
eq(
  D.selectSequentialCityCessions({ cityIds: ['A', 'A'], ownerCityIds: ['A', 'B', 'C'], capitalCityId: 'CAP' }),
  ['A'],
  'duplikat id przechodzi tylko raz',
);

// 5. Miasto nienależące do dawcy odpada.
eq(
  D.selectSequentialCityCessions({ cityIds: ['Z'], ownerCityIds: ['A', 'B', 'C'], capitalCityId: 'CAP' }),
  [],
  'miasto spoza dawcy odrzucone',
);

// 6. Brak miast na liście.
eq(
  D.selectSequentialCityCessions({ cityIds: [], ownerCityIds: ['A', 'B'], capitalCityId: null }),
  [],
  'pusta lista -> pusty wynik',
);

// 7. Kolejność zachowana: pierwsze z listy ma pierwszeństwo przed „ostatnim miastem".
eq(
  D.selectSequentialCityCessions({ cityIds: ['B', 'A'], ownerCityIds: ['A', 'B'], capitalCityId: 'CAP' }),
  ['B'],
  'kolejność listy decyduje, które miasto zostaje zablokowane',
);

console.log(`peace-city-cession-and-rewar-test: PASS=${pass} FAIL=${fail}`);
try { fs.unlinkSync(ENTRY); } catch (_) { /* sprzątanie best-effort */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* sprzątanie best-effort */ }
if (fail > 0) process.exit(1);
