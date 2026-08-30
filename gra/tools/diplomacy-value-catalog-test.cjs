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
  diplomacyHandelSurowiecCenaZaBlok,
  diplomacyHandelSurowceCatalog,
  diplomacyHandelSurowcePakietWielkosc,
  diplomacyHandelSurowiecKrok,
  diplomacyNormalizeSurowiecIlosc,
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
// 22 = jedyne ulepszenie z surowiecOdblokowany='ruda' w data/terrain-improvements.json dzis: "kopalnia_miedzi"
// (koszt_praca=22, ABC-7 + ABC-14 Maciej 2026-07-04, wartosc niezmieniona od commita 1341975).
// Historycznie istnialo tez drugie ("kopalnia", epoka 1, koszt_praca=25) ale min() i tak dawalo 22 od
// poczatku historii repo -- usuniete commitem 6370311 (FALA 116, R-KOPALNIA-UNIWERSALNA-Q1=B, 2026-07-30).
// Oczekiwanie 25 bylo bledem testu od samego poczatku (oba pliki dodane w tym samym commicie 1341975),
// nie regresja danych gry.
eq(D.diplomacyPnSurowiecBoolean('ruda'), 22, 'surowiec ruda=kopalnia_miedzi');
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
eq(D.diplomacyHandelSurowiecCenaZaBlok('drewno'), 1, 'drewno 1 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('glina'), 2, 'glina 2 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('kamien'), 3, 'kamien 3 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('ruda'), 5, 'ruda miedzi 5 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('ruda_zelaza'), 10, 'ruda_zelaza 10 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('ruda_cyny'), 10, 'ruda_cyny 10 PN/szt. (R-CYNA-BRAZ, Maciej 2026-08-13)');
eq(D.diplomacyHandelSurowiecCenaZaBlok('cegla'), 5, 'cegla 5 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('sol'), 2, 'sol 2 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('kon'), 5, 'kon 5 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('ceramika'), 5, 'ceramika 5 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('braz'), 15, 'braz 15 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('zelazo'), 20, 'zelazo 20 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('stal'), 25, 'stal 25 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('zloto'), 50, 'zloto-surowiec 50 PN/szt.');
eq(D.diplomacyHandelSurowiecCenaZaBlok('wegiel'), 20, 'wegiel 20 PN/szt.');
// R-DYP-PAKIET-USUN (2026-08-08, Maciej): koszyk handlu podaje sztuki wprost — bez
// pakietów, bez ×10. PN pozycji = bloki × cena_PN/blok, nic więcej.
// R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): drewno/ruda_zelaza/stal (i pozostałe surowce
// dotknięte ×5 rebalansem produkcji) handlują się WYŁĄCZNIE wielokrotnościami kroku handlu —
// diplomacyPnSurowiecIlosc floruje w dół do najbliższej wielokrotności, a NASTĘPNIE dzieli
// przez krok żeby dostać liczbę BLOKÓW, ZANIM policzona zostanie cena. Złoto (surowiec)/
// Węgiel świadomie WYŁĄCZONE z ×5 -> zostają przy kroku 1 szt. (blok = 1 szt., bez zmian).
// NAPRAWA P-DYPLO-PW-BRAK-KROKU-5-EDYCJA-PROPOZYCJI (2026-08-13): poprzednie oczekiwane
// wartości asercjonowały STARĄ (błędną) formułę „sztuki × cena" bez dzielenia przez krok —
// dokładnie błąd zgłoszony przez właściciela (515 PW zamiast 103 PW dla 205 Glina + 105
// Drewno, patrz diplomacy-cennik-krok5-blok-test.cjs). Poprawka: cena_* to PN za BLOK (krok
// jednostek), decyzja ECHO f838b599 („cena za blok 5 sztuk = stara cena za 1 sztukę").
// R-DYPLO-CENNIK-KROK10-Q1 (Maciej 2026-08-30): krok podniesiony z 5 na 10 szt. dla TYCH
// SAMYCH surowców — cena_* liczbowo bez zmian, więc ta sama liczba PN kupuje teraz 2x więcej
// surowca (właściciel: „cena wzrośnie dwukrotnie za jeden punkt wymiany"). Wszystkie liczby
// niżej przeliczone na krok 10 (byłyby o połowę mniejsze niż przy dawnym kroku 5 dla tej
// samej ilości sztuk, bo mniej pełnych bloków mieści się w tej samej liczbie sztuk).
eq(D.diplomacyPnSurowiecIlosc('drewno', 10), 1, '10 szt. drewno = 1 blok × 1 PN/blok = 1 PN — krok 10 spełniony');
eq(D.diplomacyPnSurowiecIlosc('drewno', 20), 2, '20 szt. drewno = 2 bloki × 1 PN/blok = 2 PN');
eq(D.diplomacyPnSurowiecIlosc('ruda_zelaza', 10), 10, '10 szt. ruda_zelaza = 1 blok × 10 PN/blok = 10 PN');
eq(D.diplomacyPnSurowiecIlosc('stal', 10), 25, '10 szt. stal = 1 blok × 25 PN/blok = 25 PN');
eq(D.diplomacyPnSurowiecIlosc('zloto', 1), 50, '1 szt. zloto = 50 PN (1×50) — Złoto krok 1, bez zmian');
eq(D.diplomacyPnSurowiecIlosc('wegiel', 1), 20, '1 szt. wegiel = 20 PN (1×20) — Węgiel krok 1, bez zmian');
// Przypadki brzegowe kroku 10: ilość niebędąca wielokrotnością floruje w DÓŁ (nigdy w górę),
// a ilość poniżej jednego bloku (10 szt.) jest odrzucana jako 0 PN — spójne z istniejącym
// traktowaniem ilosc<=0 (nigdy nie zaakceptowana po cichu jako-jest).
eq(D.diplomacyPnSurowiecIlosc('drewno', 4), 0, '4 szt. drewno (< 1 kroku) = 0 PN — odrzucone, nie zaokrąglone w górę');
eq(D.diplomacyPnSurowiecIlosc('drewno', 5), 0, '5 szt. drewno (< 1 kroku 10) = 0 PN — samo w sobie już nie wystarcza (krok10 > krok5)');
eq(D.diplomacyPnSurowiecIlosc('drewno', 17), 1, '17 szt. drewno floruje do 10 szt. = 1 blok = 1 PN (nie 17 PN)');
eq(D.diplomacyPnSurowiecIlosc('drewno', 19), 1, '19 szt. drewno floruje do 10 szt. = 1 blok = 1 PN');
eq(D.diplomacyPnSurowiecIlosc('ruda_zelaza', 23), 20, '23 szt. ruda_zelaza floruje do 20 szt. = 2 bloki × 10 PN/blok = 20 PN (nie 230 PN)');
eq(D.diplomacyPnSurowiecIlosc('wegiel', 3), 60, '3 szt. wegiel (krok 1) = 60 PN — bez floorowania, Węgiel nietknięty');
eq(D.diplomacyHandelSurowiecKrok('drewno'), 10, 'krok(drewno) = 10 szt.');
eq(D.diplomacyHandelSurowiecKrok('ruda_zelaza'), 10, 'krok(ruda_zelaza) = 10 szt.');
// R-SUROWIEC-CYNA-DO-BRAZU runda 3 (Maciej 2026-08-13) — test strażniczy Noty N1 z werdyktu
// Evaluatora rundy 2: cofnięcie wpisu ruda_cyny w zbiorze surowców objętych krokiem
// przechodziło dotąd wszystkie bramki repo na zielono (brak własnej asercji). Wzorem
// ruda_zelaza wyżej; krok zaktualizowany do 10 przez R-DYPLO-CENNIK-KROK10-Q1.
eq(D.diplomacyHandelSurowiecKrok('ruda_cyny'), 10, 'krok(ruda_cyny) = 10 szt. (R-SUROWIEC-CYNA-DO-BRAZU, test strażniczy N1)');
eq(D.diplomacyHandelSurowiecKrok('braz'), 10, 'krok(braz) = 10 szt.');
eq(D.diplomacyHandelSurowiecKrok('zloto'), 1, 'krok(zloto-surowiec) = 1 szt. — wyłączone z ×5');
eq(D.diplomacyHandelSurowiecKrok('wegiel'), 1, 'krok(wegiel) = 1 szt. — wyłączone z ×5 (brak produkcji objętej rebalansem)');
eq(D.diplomacyNormalizeSurowiecIlosc('drewno', 137, 137), 130, 'normalize: 137 szt. dostępne (nie mult. 10) floruje do 130');
eq(D.diplomacyNormalizeSurowiecIlosc('drewno', 3, 137), 0, 'normalize: żądanie 3 < krok(10) -> 0, nie 3');
eq(D.diplomacyNormalizeSurowiecIlosc('wegiel', 137, 137), 137, 'normalize: wegiel krok 1 -> max przechodzi bez zmian');
const handelCat = D.diplomacyHandelSurowceCatalog();
// R-CYNA-BRAZ (Maciej 2026-08-13): 14 -> 15, doszła ruda_cyny (wymienialna dyplomatycznie
// jak miedź/żelazo, patrz asercja diplomacyHandelSurowiecCenaZaBlok('ruda_cyny') wyżej).
ok(Object.keys(handelCat).length === 15, 'katalog handlu: 15 surowców ilościowych (było 14, +ruda_cyny)');

// ---------------------------------------------------------------------------
// P-DYPLO-PW-BRAK-KROKU-5-EDYCJA-PROPOZYCJI (2026-08-13) — regresja dokładnego scenariusza
// ze zrzutu ekranu właściciela: "Edytuj swoją propozycję" (kontroferta własnej oferty),
// 205 Glina + 105 Drewno. Ekran pokazywał błędnie 515 PW (= 205×2 + 105×1, stara formuła
// sztuki×cena BEZ dzielenia na bloki). Poprawna wartość PRZY KROKU 5 (mechanizm ówczesny,
// R-DYPLO-CENNIK-SKALA-5X-Q1, ECHO f838b599, "cena za blok 5 sztuk = stara cena za 1
// sztukę") była: (205÷5 bloków)×2 PN/blok + (105÷5 bloków)×1 PN/blok = 82+21 = 103 PW.
// R-DYPLO-CENNIK-KROK10-Q1 (Maciej 2026-08-30): krok podniesiony 5→10 — TA SAMA para
// ilości daje dziś (205÷10=20 bloków, reszta 5 szt. odrzucona)×2 + (105÷10=10 bloków,
// reszta 5 szt. odrzucona)×1 = 40+10 = 50 PW. Nadal drastycznie mniej niż naiwne 515 PW —
// test pilnuje, że dzielenie na bloki wciąż działa, nie konkretnie liczby 103.
// Ten sam choke-point (diplomacyPnSurowiecIlosc / diplomacySumPn) obsługuje WSZYSTKIE
// ekrany koszyka PN (nowa oferta, kontroferta, edycja własnej propozycji) — jeden test tu
// pokrywa je wszystkie, bo żadna ścieżka UI nie liczy PN inaczej niż przez tę funkcję.
// / EN: regression for the owner's exact screenshot scenario — 205 Clay + 105 Wood must
// price block-based (50 PW at today's krok 10), never 515 PW (old per-unit formula).
eq(D.diplomacyPnSurowiecIlosc('glina', 205), 40, 'P-DYPLO-PW-BRAK-KROKU-5: 205 szt. glina = 20 bloków × 2 PN/blok = 40 PN (krok 10)');
eq(D.diplomacyPnSurowiecIlosc('drewno', 105), 10, 'P-DYPLO-PW-BRAK-KROKU-5: 105 szt. drewno = 10 bloków × 1 PN/blok = 10 PN (krok 10)');
{
  const givePn = D.diplomacySumPn(
    [
      { typ: 'surowiec_ilosc', id: 'glina', ilosc: 205 },
      { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 105 },
    ],
    { side: 'give', proposerOwnerId: 0, playerOwnerId: 0 },
  );
  eq(givePn, 50, 'P-DYPLO-PW-BRAK-KROKU-5: koszyk 205 Glina + 105 Drewno = 50 PW przy kroku 10 (NIE 515 PW — scenariusz ze zrzutu właściciela)');
}

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`diplomacy-value-catalog-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
