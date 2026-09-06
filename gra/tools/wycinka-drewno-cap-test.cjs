'use strict';
/**
 * wycinka-drewno-cap-test.cjs
 *
 * TEMAT: R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1.
 *
 * Kryterium binarne dispatchu:
 *  1. terrain-improvements.json: wycinka.praca_per_tura === 50.
 *  2. Test bramkowy (ten plik) potwierdza, ze komunikat gracza po wyrebie pokazuje
 *     FAKTYCZNIE zapisana do magazynu (przycieta do capu) ilosc Drewna, nie surowa
 *     wartosc PRZED capem -- dokladnie tak jak juz robi to sciezka AI w main.ts.
 *
 * DOWOD REALNY (nie tylko odczyt configu): symulacja magazynu BLISKO capu
 * (cap - 10) z uzyciem PRAWDZIWEJ (nie zamockowanej) funkcji
 * `creditOwnerResourceStock` z gra/src/game/building-stock-cost.ts -- ta sama
 * funkcja, ktora main.ts wola w obu sciezkach (gracz l. ~28958, AI l. ~32380).
 *
 * KONTROLA MUTACYJNA (REGULA PRZECIW SAMOOSZUKIWANIU): [M] buduje komunikat
 * WEDLUG STAREGO (blednego) wzorca -- surowa wartosc PRZED capem -- i dowodzi,
 * ze przy magazynie bliskim capu ta stara wersja bylaby NIEZGODNA z faktycznym
 * przyrostem magazynu (asercja celowo czerwona), podczas gdy NOWY wzorzec
 * (uzywajacy zwroconej, przycietej wartosci) jest zawsze zgodny.
 *
 * Usage (z gra/): node tools/wycinka-drewno-cap-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[wycinka-drewno-cap-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.wycinka-cap-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.wycinka-cap-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

// -----------------------------------------------------------------------
// [0] Kryterium binarne #1: JSON.
// -----------------------------------------------------------------------
const improvements = JSON.parse(
  fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'));
check('[0] terrain-improvements.json: wyrab.wycinka.praca_per_tura === 50',
  improvements.wyrab && improvements.wyrab.wycinka
  && improvements.wyrab.wycinka.praca_per_tura === 50,
  improvements.wyrab && improvements.wyrab.wycinka);
check('[0] terrain-improvements.json: wyrab.wycinka.tury === 1 (bez zmian, ECHO: jednorazowo)',
  improvements.wyrab && improvements.wyrab.wycinka
  && improvements.wyrab.wycinka.tury === 1,
  improvements.wyrab && improvements.wyrab.wycinka);

// -----------------------------------------------------------------------
// [1] Zrodlo main.ts: sciezka gracza (l. ok. 28958-28963) MUSI uzywac zwroconej
//     (przycietej) wartosci creditOwnerResourceStock w komunikacie, nie surowej
//     drewnoCredit -- dokladnie jak sciezka AI (l. ok. 32380-32388).
// -----------------------------------------------------------------------
const mainTs = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');

const gracz = mainTs.indexOf("showHintMessage(\n                'Wycinka: +'");
check('[1] main.ts: hint gracza po wyrebie znaleziony (kotwica literalu)', gracz >= 0);

check('[1] main.ts: sciezka GRACZA przypisuje zwrocona wartosc creditOwnerResourceStock'
  + ' do zmiennej (drewnoCredited) PRZED komunikatem -- nie samo wywolanie bez uzycia zwrotu',
  /const drewnoCredited = creditOwnerResourceStock\(\s*cities, ownerId, 'drewno', drewnoCredit, drewnoCap,\s*\);/
    .test(mainTs));

check('[1] main.ts: komunikat gracza "Wycinka: +...' + ' Drewna" uzywa drewnoCredited'
  + ' (PRZYCIETEJ wartosci), NIE surowej drewnoCredit',
  mainTs.includes("'Wycinka: +' + drewnoCredited + ' Drewna"));

check('[1] main.ts: stary, bledny wzorzec ("+ drewnoCredit + \' Drewna") W KOMUNIKACIE GRACZA'
  + ' juz NIE wystepuje (naprawiony)',
  !mainTs.includes("'Wycinka: +' + drewnoCredit + ' Drewna"));

check('[1] main.ts: sciezka AI (wzorzec) nadal uzywa drewnoCredited w logu konsoli'
  + ' -- NIETKNIETA przez ten temat (dowod, ze naprawa nie wyszla poza allowlisty)',
  mainTs.includes('+${drewnoCredited} Drewna)'));

// -----------------------------------------------------------------------
// [2] DOWOD REALNY: bundlujemy PRAWDZIWA funkcje creditOwnerResourceStock
//     (nie mock) i symulujemy magazyn BLISKO capu (cap - 10).
// -----------------------------------------------------------------------
fs.writeFileSync(
  ENTRY_FILE,
  [
    "import { creditOwnerResourceStock } from '../src/game/building-stock-cost.ts';",
    "(globalThis as any).__creditOwnerResourceStock = creditOwnerResourceStock;",
    '',
  ].join('\n'),
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY_FILE],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'es2020',
  outfile: BUNDLE_FILE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts' },
  logLevel: 'silent',
});

require(BUNDLE_FILE);
const creditOwnerResourceStock = globalThis.__creditOwnerResourceStock;
check('[2] creditOwnerResourceStock zaladowana z realnego zrodla (nie mock)',
  typeof creditOwnerResourceStock === 'function');

function scenariuszBliskoCapu() {
  const CAP = 100;
  const STOCK_PRZED = CAP - 10; // "blisko capu" wg dispatchu: cap - 10
  const RAW_PLON = 50; // wycinka.praca_per_tura po naprawie #1
  const cities = [{ id: 'c1', ownerId: 7, surowce: { drewno: STOCK_PRZED } }];

  const drewnoCredit = RAW_PLON; // odpowiednik zmiennej main.ts PRZED capem
  const drewnoCredited = creditOwnerResourceStock(cities, 7, 'drewno', drewnoCredit, CAP);
  const stockPo = cities[0].surowce.drewno;

  return { CAP, STOCK_PRZED, RAW_PLON, drewnoCredit, drewnoCredited, stockPo };
}

const sc = scenariuszBliskoCapu();
check('[2] sanity scenariusza: magazyn BLISKO capu (cap-10), surowy plon (50) PRZEKRACZA'
  + ' pozostala pojemnosc (10) -- inaczej test niczego by nie dowodzil',
  sc.STOCK_PRZED === 90 && sc.CAP === 100 && sc.RAW_PLON > (sc.CAP - sc.STOCK_PRZED),
  sc);

check('[2] creditOwnerResourceStock PRZYCINA zapis do pozostalej pojemnosci magazynu'
  + ' (10), nie do surowego plonu (50)',
  sc.drewnoCredited === 10, sc);

check('[2] magazyn PO wyrebie == cap (100) -- zwrocona wartosc faktycznie trafila'
  + ' do City.surowce.drewno', sc.stockPo === sc.CAP, sc);

// -----------------------------------------------------------------------
// [3] REALNY komunikat (wzorzec NAPRAWIONY, tak jak main.ts po naprawie #2):
//     komunikat zbudowany z drewnoCredited MUSI byc zgodny z faktycznym
//     przyrostem magazynu w KAZDYM scenariuszu, takze blisko capu.
// -----------------------------------------------------------------------
const komunikatNaprawiony = 'Wycinka: +' + sc.drewnoCredited + ' Drewna (pozostało 0 tury)';
const faktycznyPrzyrost = sc.stockPo - sc.STOCK_PRZED;
check('[3] NAPRAWIONY komunikat (uzywa drewnoCredited): liczba w tekscie komunikatu'
  + ' == faktyczny przyrost magazynu blisko capu',
  komunikatNaprawiony === `Wycinka: +${faktycznyPrzyrost} Drewna (pozostało 0 tury)`
    && sc.drewnoCredited === faktycznyPrzyrost,
  { komunikatNaprawiony, faktycznyPrzyrost });

// -----------------------------------------------------------------------
// [4] KONTROLA MUTACYJNA (regula przeciw samooszukiwaniu): cofnij naprawe --
//     zbuduj komunikat STARYM (blednym) wzorcem (surowa drewnoCredit PRZED
//     capem) i pokaz, ze przy magazynie blisko capu ta wersja jest NIEZGODNA
//     z faktycznym przyrostem magazynu. Ta asercja MUSI wyjsc czerwona --
//     potwierdzamy to explicite (`oczekiwanoFail`), nie cofamy realnego kodu
//     main.ts (bramka jest self-contained, main.ts pozostaje naprawiony).
// -----------------------------------------------------------------------
const komunikatSprzedNaprawy = 'Wycinka: +' + sc.drewnoCredit + ' Drewna (pozostało 0 tury)';
const zgodnoscSprzedNaprawy =
  komunikatSprzedNaprawy === `Wycinka: +${faktycznyPrzyrost} Drewna (pozostało 0 tury)`;
console.log('  [M] mutacja (wzorzec SPRZED naprawy #2, drewnoCredit surowe): komunikat = '
  + JSON.stringify(komunikatSprzedNaprawy) + ', faktyczny przyrost magazynu = '
  + faktycznyPrzyrost + ' -- ' + (zgodnoscSprzedNaprawy ? 'ZGODNE (nieoczekiwane!)' : 'NIEZGODNE (oczekiwane)'));
check('[4] MUTACJA: wzorzec SPRZED naprawy #2 (surowe drewnoCredit=' + sc.drewnoCredit
  + ') przy magazynie blisko capu JEST niezgodny z faktycznym przyrostem (' + faktycznyPrzyrost
  + ') -- dowod, ze bug byl realny i ze ta bramka go wykrywa (asercja celowo neguje mutacje)',
  !zgodnoscSprzedNaprawy,
  { komunikatSprzedNaprawy, faktycznyPrzyrost, drewnoCreditSurowe: sc.drewnoCredit });
check('[4] MUTACJA: naprawiony wzorzec (drewnoCredited) POZOSTAJE zgodny w tym samym'
  + ' scenariuszu -- naprawa faktycznie usuwa rozbieznosc, nie tylko przypadkiem',
  sc.drewnoCredited === faktycznyPrzyrost && sc.drewnoCredited !== sc.drewnoCredit,
  { drewnoCredited: sc.drewnoCredited, drewnoCreditSurowe: sc.drewnoCredit });

// -----------------------------------------------------------------------
// [5] Scenariusz KONTROLNY: magazyn DALEKO od capu -- drewnoCredit ==
//     drewnoCredited (cap nie ucina), stary i nowy wzorzec komunikatu
//     rowne -- naprawa #2 nie zmienia zachowania poza przypadkiem capu.
// -----------------------------------------------------------------------
function scenariuszDalekoOdCapu() {
  const CAP = 1000;
  const STOCK_PRZED = 0;
  const RAW_PLON = 50;
  const cities = [{ id: 'c1', ownerId: 7, surowce: { drewno: STOCK_PRZED } }];
  const drewnoCredited = creditOwnerResourceStock(cities, 7, 'drewno', RAW_PLON, CAP);
  return { drewnoCredit: RAW_PLON, drewnoCredited, stockPo: cities[0].surowce.drewno };
}
const scFar = scenariuszDalekoOdCapu();
check('[5] scenariusz kontrolny (magazyn daleko od capu): drewnoCredited =='
  + ' drewnoCredit surowe (cap nie ucina) -- naprawa #2 nie zmienia normalnego przypadku',
  scFar.drewnoCredited === scFar.drewnoCredit && scFar.drewnoCredited === 50, scFar);

fs.unlinkSync(ENTRY_FILE);
fs.unlinkSync(BUNDLE_FILE);

console.log('');
console.log(`[wycinka-drewno-cap-test] ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
