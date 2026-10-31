'use strict';
/** R-WEB-PEACE-CITY-CESSION-Q1 — wycena, zakazy, waga i suma PN pozycji 'miasto'. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-city-cession-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-city-cession-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  diplomacyPnMiasto,
  diplomacyMiastoZakaz,
  diplomacyMiastoWagaBilansu,
  diplomacySumPn,
  diplomacyPnBudynek,
  MIASTO_PN_BAZA,
  MIASTO_WAGA_ODDAJACEGO,
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
function eq(a, b, m) { ok(a === b, `${m} (got ${a}, want ${b})`); }
function near(a, b, m) { ok(Math.abs(a - b) < 1e-9, `${m} (got ${a}, want ${b})`); }

// --- Wycena ---------------------------------------------------------------
// kuznia/port/akwedukt: kosztBudowy 30 każdy → Σ=90.
const T3 = [{ id: 'kuznia' }, { id: 'port' }, { id: 'akwedukt' }];
eq(D.diplomacyPnMiasto({ populacja: 4, budynki: T3 }), 1060, 'wycena 4 obyw. + 3 bud. (30) = 1060');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [] }), D.MIASTO_PN_BAZA, 'pusty pusty = baza 400');
eq(D.diplomacyPnMiasto({ populacja: 4, budynki: T3, cudy: 1 }), 1560, '+500 za cud');
eq(D.diplomacyPnMiasto({ populacja: 4, budynki: T3, zlozaPn: 150 }), 1210, '+cena złoża 150');
// Poziom 2: kuznia 30·1.1 = 33 → 2·33 = 66 zamiast 60
eq(D.diplomacyPnBudynek('kuznia', 2), 33, 'budynek L2 = 33');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [{ id: 'kuznia', level: 2 }] }), 400 + 66, 'poziom 2 w wycenie miasta');
// Nieznany budynek nie wnosi PW
eq(D.diplomacyPnMiasto({ populacja: 1, budynki: [{ id: 'nie_ma_takiego' }] }), 520, 'nieznany budynek = 0 PW');
// Ujemna/nieskończona populacja nie psuje wyceny
eq(D.diplomacyPnMiasto({ populacja: -5, budynki: [] }), 400, 'ujemna populacja obcięta do 0');

// --- Zakazy ----------------------------------------------------------------
const owned = ['c1', 'c2', 'c3'];
eq(D.diplomacyMiastoZakaz({ cityId: 'c1', capitalCityId: 'c1', ownerCityIds: owned }),
  'Stolicy nie można oddać w pokoju', 'stolica zakazana');
eq(D.diplomacyMiastoZakaz({ cityId: 'c2', capitalCityId: 'c1', ownerCityIds: owned }), null, 'zwykłe miasto dozwolone');
eq(D.diplomacyMiastoZakaz({ cityId: 'c2', capitalCityId: 'c1', ownerCityIds: ['c1', 'c2'] }), null,
  'N=2 miasta: nie-stolica dozwolona (N ostatnie-1)');
eq(D.diplomacyMiastoZakaz({ cityId: 'c9', capitalCityId: 'c1', ownerCityIds: owned }),
  'Miasto nie należy do oddającego', 'obce miasto odrzucone');
eq(D.diplomacyMiastoZakaz({ cityId: 'c2', capitalCityId: null, ownerCityIds: ['c2'] }),
  'Nie można oddać ostatniego miasta', 'ostatnie miasto zakazane (bez stolicy)');
eq(D.diplomacyMiastoZakaz({ cityId: 'c1', capitalCityId: 'c1', ownerCityIds: ['c1'] }),
  'Stolicy nie można oddać w pokoju', 'stolica ma pierwszeństwo przed regułą ostatniego');

// --- Waga bilansu ----------------------------------------------------------
eq(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: false }), 1, 'gracz oddający: bez wagi AI');
near(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: true, aiEkspansywnosc: 3 }), 1.5, 'AI eks=3 → ×1.5');
near(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: true, aiEkspansywnosc: 5 }), 1.8, 'AI eks=5 → ×1.8');
near(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: true, aiEkspansywnosc: 1 }), 1.2, 'AI eks=1 → ×1.2');
near(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: true, aiEkspansywnosc: 0 }), 1.05, 'AI eks=0 → ×1.05');
eq(D.MIASTO_WAGA_ODDAJACEGO, 1.5, 'stała wagi 1.5');

// --- Suma PN pozycji 'miasto' ---------------------------------------------
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1060 }]), 1060, 'suma: miasto z cityPn');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', ilosc: 1, cityPn: 1060 }]), 1060, 'suma: ilosc=1 nie mnoży');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', ilosc: 3, cityPn: 1060 }]), 1060, 'suma: miasto nie mnoży się przez ilosc');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2' }]), null, 'brak cityPn = nieznana wartość (null)');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 500 }, { typ: 'zloto', id: '', ilosc: 100 }]), 600,
  'suma miasto + złoto');

console.log(`diplomacy-city-cession-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
