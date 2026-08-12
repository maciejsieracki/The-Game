'use strict';
/**
 * retreat-garnizon-fortyfikacja-test.cjs — P-BARBARZYNCY-WYCOFANIE-ASYMETRIA-Q1
 * (Maciej 2026-08-12, odpowiedź WŁASNA, ECHO dyspozycje/PYTANIA-OTWARTE.md
 * commit 1d9691b0): „Jeżeli jakaś jednostka jest ufortyfikowana w mieście i jest
 * w garnizonie, to nie może się wycofać. Ani AI, ani gracz, ani nikt."
 *
 * Testuje `allDefendersFortifiedInGarnizon` (game/armyMerge.ts) — predykat,
 * który main.ts (funkcja `launchIncomingMapFieldBattle`, jedyne miejsce w całym
 * repo, gdzie `PreBattleInfo.defenderCanRetreat` jest kiedykolwiek ustawiane na
 * `true`) łączy z `playerDefends` we wzorze:
 *   defenderCanRetreat = playerDefends && !allDefendersFortifiedInGarnizon(defRoster)
 * Ten test odtwarza DOKŁADNIE ten sam wzór (sekcja 4 niżej), żeby sprawdzić
 * realne zachowanie „Wycofaj" dla gracza I dla AI/barbarzyńcy jako obrońcy, bez
 * bundlowania całego main.ts (zbyt ciężkie — main.ts nie eksportuje tej funkcji).
 *
 * DLACZEGO predykat sprawdza WYŁĄCZNIE `inGarnizon`, nie koniunkcję z
 * `ufortyfikowanyWPolu` (mimo że ECHO literalnie zapisało koniunkcję obu pól) —
 * patrz obszerny komentarz przy `allDefendersFortifiedInGarnizon` w
 * game/armyMerge.ts oraz raport zadania fix-retreat-garnizon. Skrót: te dwa pola
 * są dziś wzajemnie wykluczające się w CAŁYM silniku (enterGarnizon/
 * enterFieldFortify w main.ts handleSelectedUnitHudAction, akcja 'fortify', wołają
 * TYLKO jedno z dwóch — nigdy oba na tej samej jednostce w normalnym przepływie
 * gry) — dosłowna koniunkcja nigdy nie byłaby prawdziwa, co przeczyłoby cytatowi
 * właściciela („Ani AI, ani gracz, ani nikt" — czyli KTOŚ ma być zablokowany).
 * Sekcja 3 niżej dowodzi tę niemożliwość WYKONANIEM (nie tylko czytaniem kodu),
 * wołając realne enterGarnizon/enterFieldFortify z armyMerge.ts.
 *
 * Usage (z gra/): node tools/retreat-garnizon-fortyfikacja-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.retreat-garnizon-fortyfikacja-entry.ts');
const BUNDLE = path.join(__dirname, '.retreat-garnizon-fortyfikacja-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import {
  allDefendersFortifiedInGarnizon,
  enterGarnizon,
  enterFieldFortify,
  exitGarnizon,
  exitFieldFortify,
} from '../src/game/armyMerge';
export {
  allDefendersFortifiedInGarnizon,
  enterGarnizon,
  enterFieldFortify,
  exitGarnizon,
  exitFieldFortify,
};`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  allDefendersFortifiedInGarnizon,
  enterGarnizon,
  enterFieldFortify,
  exitGarnizon,
  exitFieldFortify,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

function u(over) {
  return Object.assign({
    id: 'u', ownerId: 0, typeId: 'Miecznik', category: 'piechota',
    q: 0, r: 0, ruch: 2, ruchLeft: 2,
  }, over);
}

// ===========================================================================
// 1) Scenariusz (a) z dyspozycji Operatora: obrońca W PEŁNI ufortyfikowany +
//    w garnizonie -> BRAK opcji wycofania (predykat = true = blokada).
// ===========================================================================
{
  const single = [u({ id: 'g1', inGarnizon: true })];
  assert(allDefendersFortifiedInGarnizon(single) === true,
    '1a: pojedynczy obrońca inGarnizon=true -> blokada wycofania (true)');

  const multiAllGarrisoned = [
    u({ id: 'g1', inGarnizon: true }),
    u({ id: 'g2', inGarnizon: true }),
    u({ id: 'g3', inGarnizon: true }),
  ];
  assert(allDefendersFortifiedInGarnizon(multiAllGarrisoned) === true,
    '1b: WSZYSCY obrońcy (3) inGarnizon=true -> blokada wycofania (true)');
}

// ===========================================================================
// 2) Scenariusz (b): obrońca BEZ pełnej fortyfikacji/garnizonu -> opcja
//    wycofania ZACHOWANA (predykat = false), zgodnie z dzisiejszym zachowaniem.
// ===========================================================================
{
  assert(allDefendersFortifiedInGarnizon([u({ id: 'p1' })]) === false,
    '2a: obrońca bez inGarnizon (undefined) -> wycofanie dozwolone (false)');

  assert(allDefendersFortifiedInGarnizon([u({ id: 'p1', inGarnizon: false })]) === false,
    '2b: obrońca inGarnizon=false jawnie -> wycofanie dozwolone (false)');

  // Fortyfikacja W POLU (ufortyfikowanyWPolu) BEZ garnizonu -- osobny stan
  // (oblegający/stojący w otwartym terenie), CELOWO nie blokuje wycofania:
  // cytat właściciela mówi "ufortyfikowana W MIEŚCIE i w garnizonie", nie
  // "ufortyfikowana w polu". Patrz uzasadnienie interpretacji w armyMerge.ts.
  assert(allDefendersFortifiedInGarnizon([u({ id: 'f1', ufortyfikowanyWPolu: true })]) === false,
    '2c: obrońca TYLKO ufortyfikowanyWPolu=true (bez inGarnizon) -> wycofanie dozwolone (false) -- fortyfikacja w POLU to inny stan niż garnizon miasta');

  // Mieszany roster (np. gracz ma część wojsk w garnizonie, część zwyczajnie
  // stojącą na heksie miasta bez wejścia w "Ufortyfikuj") -- reguła właściciela
  // to "WSZYSCY obrońcy", więc JEDEN niegarnizonowy obrońca odblokowuje Wycofaj
  // dla całego stosu.
  const mixed = [
    u({ id: 'g1', inGarnizon: true }),
    u({ id: 'g2', inGarnizon: true }),
    u({ id: 'p3' }), // stoi na heksie miasta, NIE w garnizonie
  ];
  assert(allDefendersFortifiedInGarnizon(mixed) === false,
    '2d: roster mieszany (2 garnizon + 1 nie-garnizon) -> wycofanie dozwolone (false), bo NIE WSZYSCY są w garnizonie');
}

// ===========================================================================
// 3) DOWÓD WYKONANIEM: koniunkcja `inGarnizon===true I ufortyfikowanyWPolu===true`
//    (dosłowny zapis ECHO) jest NIEOSIĄGALNA przez realny stan-maszyny gry --
//    wołamy PRAWDZIWE enterGarnizon/enterFieldFortify z armyMerge.ts (nie
//    zgadujemy z czytania kodu) i pokazujemy, że wejście w jeden stan nie
//    współistnieje z wejściem w drugi w normalnym przepływie main.ts (gałąź
//    "na hexie własnego miasta" -> WYŁĄCZNIE enterGarnizon, gałąź "poza"
//    -> WYŁĄCZNIE enterFieldFortify -- main.ts nigdy nie woła obu na tej samej
//    jednostce). To uzasadnia, dlaczego predykat w sekcji 1/2 sprawdza
//    WYŁĄCZNIE `inGarnizon`, nie koniunkcję z `ufortyfikowanyWPolu`.
// ===========================================================================
{
  // 3a: enterGarnizon() NIE ustawia ufortyfikowanyWPolu.
  const a = u({ id: 'a', ruchLeft: 2 });
  enterGarnizon(a);
  assert(a.inGarnizon === true && a.ufortyfikowanyWPolu !== true,
    '3a: enterGarnizon() ustawia WYŁĄCZNIE inGarnizon (ufortyfikowanyWPolu pozostaje nieustawione)');

  // 3b: enterFieldFortify() NIE ustawia inGarnizon.
  const b = u({ id: 'b', ruchLeft: 2 });
  enterFieldFortify(b);
  assert(b.ufortyfikowanyWPolu === true && b.inGarnizon !== true,
    '3b: enterFieldFortify() ustawia WYŁĄCZNIE ufortyfikowanyWPolu (inGarnizon pozostaje nieustawione)');

  // 3c: main.ts (handleSelectedUnitHudAction, akcja 'fortify') woła DOKŁADNIE
  //     jedną z dwóch funkcji wg pozycji jednostki -- odtwarzamy TĘ SAMĄ
  //     logikę rozgałęzienia tutaj (bez importu main.ts, zbyt ciężki do
  //     zbundlowania) i potwierdzamy że w KAŻDYM z dwóch scenariuszy (na
  //     hexie miasta / poza) tylko JEDNO pole końcowo jest ustawione.
  function simulateFortifyAction(unit, onOwnCityHex) {
    if (onOwnCityHex) enterGarnizon(unit); else enterFieldFortify(unit);
  }
  const onCity = u({ id: 'c1', ruchLeft: 2 });
  simulateFortifyAction(onCity, true);
  assert(allDefendersFortifiedInGarnizon([onCity]) === true,
    '3c-i: jednostka na hexie własnego miasta po akcji Ufortyfikuj -> inGarnizon=true, predykat blokuje wycofanie');

  const inField = u({ id: 'c2', ruchLeft: 2 });
  simulateFortifyAction(inField, false);
  assert(allDefendersFortifiedInGarnizon([inField]) === false,
    '3c-ii: jednostka POZA własnym miastem po akcji Ufortyfikuj -> TYLKO ufortyfikowanyWPolu=true, predykat NIE blokuje wycofania (inny stan niż z cytatu właściciela)');

  // 3d: gdyby (hipotetycznie, poza dzisiejszym main.ts) coś ustawiło OBA pola
  //     na tej samej jednostce naraz -- predykat i tak poprawnie blokuje
  //     wycofanie (bo sprawdza wyłącznie inGarnizon, które w tym scenariuszu
  //     JEST true) -- odporność na przyszłą zmianę inwariantu wykluczania.
  const both = u({ id: 'd1', inGarnizon: true, ufortyfikowanyWPolu: true });
  assert(allDefendersFortifiedInGarnizon([both]) === true,
    '3d: hipotetyczny stan z OBOMA polami true (poza dzisiejszym main.ts) -> predykat nadal blokuje (true), spełnia też dosłowny zapis ECHO jako szczególny przypadek');

  // exitGarnizon/exitFieldFortify sprzątają (dla czytelności -- nieużywane dalej).
  exitGarnizon(a);
  exitFieldFortify(b);
}

// ===========================================================================
// 4) PARYTET OWNERA (wprost wymagany przez cytat: "Ani AI, ani gracz, ani
//    nikt") -- wzór main.ts `defenderCanRetreat = playerDefends &&
//    !allDefendersFortifiedInGarnizon(defRoster)` odtworzony tutaj dosłownie
//    (main.ts:~20698-20721, launchIncomingMapFieldBattle). Test dowodzi:
//    (i) gracz w pełnym garnizonie -> wycofanie zablokowane (NOWE, naprawa),
//    (ii) gracz NIE w pełnym garnizonie -> wycofanie zachowane (bez regresji),
//    (iii) AI/barbarzyńca jako obrońca -> wycofanie ZAWSZE false, niezależnie
//         od stanu garnizonu -- bo `playerDefends` (ownerId===0 w rosterze)
//         jest już dziś jedynym miejscem w całym silniku, gdzie
//         defenderCanRetreat może wyjść `true` (main.ts nigdy nie pokazuje
//         ekranu pre-bitwy AI-vs-AI/AI-vs-barbarzyńca -- rozstrzygane po cichu
//         przez doAutoPowerMapBattle, bez UI). Predykat garnizonu jest więc
//         dla AI/barbarzyńcy jako obrońcy strukturalnie no-op (i tak było
//         false) -- ALE reguła jest zapisana OWNER-AGNOSTYCZNIE (nie
//         `if (ownerId===0)`), więc gdyby silnik kiedyś zaczął pokazywać
//         pre-bitwę AI-vs-AI, ta sama blokada zadziała identycznie.
// ===========================================================================
function computeDefenderCanRetreat(defRoster) {
  const playerDefends = defRoster.some((x) => x.ownerId === 0);
  return playerDefends && !allDefendersFortifiedInGarnizon(defRoster);
}

{
  // (i) Gracz, W PEŁNI ufortyfikowany w garnizonie -> false (NOWE zachowanie).
  const playerGarrisoned = [
    u({ id: 'pg1', ownerId: 0, inGarnizon: true }),
    u({ id: 'pg2', ownerId: 0, inGarnizon: true }),
  ];
  assert(computeDefenderCanRetreat(playerGarrisoned) === false,
    '4i: GRACZ jako obrońca, WSZYSCY inGarnizon=true -> defenderCanRetreat=false (naprawa -- przed poprawką byłoby true)');

  // (ii) Gracz, BEZ pełnego garnizonu -> true (zachowanie SPRZED naprawy, bez regresji).
  const playerOpen = [
    u({ id: 'po1', ownerId: 0 }),
  ];
  assert(computeDefenderCanRetreat(playerOpen) === true,
    '4ii: GRACZ jako obrońca w otwartym polu (bez garnizonu) -> defenderCanRetreat=true (bez regresji względem dzisiejszego zachowania)');

  // (iii) AI jako obrońca (ownerId=3), W PEŁNI garnizonowany -> false (tak jak dziś, strukturalnie).
  const aiGarrisoned = [
    u({ id: 'ag1', ownerId: 3, inGarnizon: true }),
  ];
  assert(computeDefenderCanRetreat(aiGarrisoned) === false,
    '4iii: AI (ownerId=3) jako obrońca, garnizonowany -> defenderCanRetreat=false (spójne z "ani AI")');

  // (iv) AI jako obrońca, BEZ garnizonu -> RÓWNIEŻ false (AI nigdy nie widzi
  //      ekranu pre-bitwy jako jedyny obrońca -- playerDefends=false blokuje
  //      niezależnie od stanu fortyfikacji; to jest DZISIEJSZE zachowanie,
  //      nietknięte tą naprawą, potwierdzone tu jako regresyjny pin).
  const aiOpen = [
    u({ id: 'ao1', ownerId: 3 }),
  ];
  assert(computeDefenderCanRetreat(aiOpen) === false,
    '4iv (PIN, bez regresji): AI (ownerId=3) jako obrońca bez garnizonu -> defenderCanRetreat=false (playerDefends=false -- AI nigdy nie miało realnej opcji wycofania w tym ekranie, niezmienione)');

  // (v) Barbarzyńca (ownerId=-1) jako obrońca, garnizonowany -> false (parytet z AI).
  const barbGarrisoned = [
    u({ id: 'bg1', ownerId: -1, inGarnizon: true }),
  ];
  assert(computeDefenderCanRetreat(barbGarrisoned) === false,
    '4v: Barbarzyńca (ownerId=-1) jako obrońca, garnizonowany -> defenderCanRetreat=false (parytet z AI/gracz)');

  // (vi) Roster MIESZANY właściciela: gracz + sojusznik AI broniący RAZEM tego
  //      samego heksu (collectBattleRoster filtruje po ownerId anchor -- w
  //      praktyce nie miesza ownerów -- ale predykat i formuła muszą być
  //      poprawne nawet gdyby roster kiedyś zawierał kilku ownerów). Gracz
  //      obecny, ale NIE wszyscy garnizonowani (AI-sojusznik bez inGarnizon)
  //      -> wycofanie dozwolone.
  const mixedOwners = [
    u({ id: 'mo1', ownerId: 0, inGarnizon: true }),
    u({ id: 'mo2', ownerId: 3, inGarnizon: false }),
  ];
  assert(computeDefenderCanRetreat(mixedOwners) === true,
    '4vi: roster mieszany ownerów, gracz obecny ale NIE WSZYSCY garnizonowani -> defenderCanRetreat=true');
}

// ===========================================================================
// 5) Edge case: pusty roster -- predykat nie blokuje "na pusto" (roster.length>0
//    wymagane), formuła defenderCanRetreat i tak wychodzi false (playerDefends
//    na pustej tablicy = false), więc to nie wpływa na wynik w praktyce -- ale
//    dokumentujemy zamierzone zachowanie predykatu wprost.
// ===========================================================================
{
  assert(allDefendersFortifiedInGarnizon([]) === false,
    '5: pusty roster -> predykat false (nie blokuje "na pusto"; w main.ts ten call-site i tak zwraca wcześniej, gdy defRoster.length===0)');
}

console.log(`retreat-garnizon-fortyfikacja-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
