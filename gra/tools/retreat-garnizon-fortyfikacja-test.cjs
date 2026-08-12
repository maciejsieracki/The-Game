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
 * game/armyMerge.ts. RUNDA 2 (Evaluator): teza rundy 1 — że te dwa pola są
 * wzajemnie wykluczające się w CAŁYM silniku, więc dosłowna koniunkcja jest
 * nieosiągalna — została OBALONA WYKONANIEM: `enterFieldFortify(u);
 * enterGarnizon(u);` na TEJ SAMEJ jednostce daje OBA pola `true` (żadna z dwóch
 * funkcji nie czyści pola ustawianego przez drugą). Sekcja 3 niżej dowodzi tę
 * OSIĄGALNOŚĆ WYKONANIEM (nie fabrykacją stanu w literale obiektu — tak robiła
 * runda 1, co było rozumowaniem kołowym) i pokazuje, że mimo to predykat
 * poprawnie blokuje wycofanie w tym przypadku (bo sprawdza `inGarnizon`
 * samodzielnie — logiczny NADZBIÓR koniunkcji ECHO). To jest właściwy powód,
 * dla którego predykat zostaje przy samym `inGarnizon`: nie dlatego, że
 * koniunkcja jest nieosiągalna, ale dlatego, że sam `inGarnizon` już poprawnie
 * łapie WSZYSTKIE przypadki (koniunkcję jako szczególny przypadek) i dodatkowo
 * łapie też zwykły „sam w garnizonie" — czyli DOKŁADNIE sedno prośby
 * właściciela („Ani AI, ani gracz, ani nikt").
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
// 3) DOWÓD WYKONANIEM (RUNDA 2 -- poprawiony po Evaluatorze, nie kołowy):
//    3a/3b -- enterGarnizon/enterFieldFortify, wołane OSOBNO, ustawiają KAŻDA
//    WYŁĄCZNIE swoje pole. 3c -- main.ts (handleSelectedUnitHudAction, akcja
//    'fortify') w NORMALNYM przepływie gry rozgałęzia się na DOKŁADNIE jedną z
//    dwóch funkcji wg pozycji jednostki (na hexie własnego miasta ->
//    enterGarnizon, poza -> enterFieldFortify) -- odtworzone tu jako
//    simulateFortifyAction, bez importu main.ts (zbyt ciężki do zbundlowania).
//    3d -- DOWÓD, że koniunkcja OBU pól (dosłowny zapis ECHO) jest mimo to
//    OSIĄGALNA: wołamy PRAWDZIWE enterFieldFortify(u) a POTEM enterGarnizon(u)
//    NA TEJ SAMEJ jednostce (nie fabrykujemy stanu ręcznie w literale obiektu
//    -- runda 1 tak robiła, to był kołowy "dowód": zakładał wprost to, co miał
//    udowodnić). Żadna z dwóch funkcji nie czyści pola ustawianego przez drugą,
//    więc obie wartości zostają `true` -- i predykat i tak poprawnie blokuje
//    wycofanie, bo sprawdza `inGarnizon` samodzielnie (logiczny NADZBIÓR
//    koniunkcji ECHO, patrz komentarz przy allDefendersFortifiedInGarnizon w
//    armyMerge.ts). To uzasadnia, dlaczego predykat w sekcji 1/2 sprawdza
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

  // 3d: DOWÓD WYKONANIEM (nie kołowy -- nie fabrykujemy stanu w literale
  //     obiektu jak w rundzie 1). Wołamy PRAWDZIWE enterFieldFortify(u) a
  //     POTEM enterGarnizon(u) z armyMerge.ts NA TEJ SAMEJ jednostce --
  //     dokładnie ta sekwencja, którą Evaluator (runda 2) użył do obalenia
  //     tezy "STRUKTURALNIE NIEOSIĄGALNA" z rundy 1. Żadna z dwóch funkcji nie
  //     czyści pola ustawianego przez drugą (patrz 3a/3b), więc oczekujemy OBU
  //     pól true na wyjściu -- to jest fakt WYPROWADZONY z wykonania realnego
  //     kodu, nie założenie wpisane wprost do danych testowych.
  const both = u({ id: 'd1', ruchLeft: 2 });
  enterFieldFortify(both);
  enterGarnizon(both);
  assert(both.ufortyfikowanyWPolu === true && both.inGarnizon === true,
    '3d-pre: enterFieldFortify(u) + enterGarnizon(u) NA TEJ SAMEJ jednostce (prawdziwe funkcje, nie fabrykacja literalu) -> OBA pola true (dowód osiągalności wykonaniem)');
  assert(allDefendersFortifiedInGarnizon([both]) === true,
    '3d: jednostka z OBOMA polami true, OSIĄGNIĘTA prawdziwymi enterFieldFortify+enterGarnizon (nie ręcznym literałem) -> predykat nadal blokuje wycofanie (true), bo sprawdza inGarnizon samodzielnie -- nadzbiór, spełnia też dosłowny zapis ECHO jako szczególny przypadek');

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

// ===========================================================================
// 6) STRAŻNIK TEKSTOWY main.ts (wzorem sekcji B w
//    tools/ai-founding-territory-test.cjs -- ta sama technika: bramka sekcji
//    1-5 wyżej NIGDY nie ładuje main.ts, bo woła sam predykat/formułę
//    odtworzone tutaj, a main.ts jest zbyt ciężki do zbundlowania w tym
//    testcase'ie -- więc integrację main.ts <-> allDefendersFortifiedInGarnizon
//    trzeba osobno chronić kontrolą TREŚCI pliku, żeby wykryć cofnięcie
//    warunku bez psucia bramki 1-5 (Evaluator wykazał realną mutację: usunięcie
//    `!defenderLockedByGarnizon` z formuły `defenderCanRetreat:` i z gałęzi
//    `onCancel` daje zieloną bramkę 1-5, mimo że silnik przestaje blokować
//    wycofanie -- integracja pęka niewidocznie dla testu jednostkowego).
//    Kotwiczymy się PO NAZWIE FUNKCJI (launchIncomingMapFieldBattle), nie po
//    numerze linii -- odporne na przesunięcie, czułe na USUNIĘCIE warunku.
// ===========================================================================
console.log('\n--- 6: strażnik tekstowy main.ts -- defenderCanRetreat / onCancel w launchIncomingMapFieldBattle ---');
{
  const mainTsPath = path.join(__dirname, '..', 'src', 'main.ts');
  const mainSrc = fs.readFileSync(mainTsPath, 'utf8');

  // Balansuje nawiasy klamrowe od podanego indeksu '{' i zwraca indeks TUŻ ZA
  // dopasowanym '}' (technika 1:1 z ai-founding-territory-test.cjs).
  function balancedBraceEnd(src, openBraceIdx) {
    let depth = 0;
    let i = openBraceIdx;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    return i;
  }

  const fnMarker = 'function launchIncomingMapFieldBattle(';
  const fnStart = mainSrc.indexOf(fnMarker);
  assert(fnStart !== -1, '6-pre: funkcja launchIncomingMapFieldBattle nie znaleziona w main.ts');

  let fnBody = '';
  if (fnStart !== -1) {
    // Sygnatura tej funkcji zwraca "void" (bez adnotacji typu w klamrach), więc
    // pierwsze '{' po nazwie funkcji to od razu początek ciała -- w przeciwieństwie
    // do wzorca w ai-founding-territory-test.cjs nie trzeba pomijać osobnej klamry
    // adnotacji typu zwracanego.
    const bodyBraceStart = mainSrc.indexOf('{', fnStart);
    const bodyEnd = bodyBraceStart !== -1 ? balancedBraceEnd(mainSrc, bodyBraceStart) : fnStart;
    fnBody = mainSrc.slice(fnStart, bodyEnd);
  }
  assert(fnBody.length > 500, '6-pre: ciało funkcji launchIncomingMapFieldBattle wycięte (niepuste, sensownej długości)');

  // (1) Pole `defenderCanRetreat:` (w literale PreBattleInfo) musi zawierać
  //     warunek `!defenderLockedByGarnizon` -- dopasowanie NIE zależy od linii
  //     (przez fnBody), toleruje ewentualny reformat wieloliniowy do najbliższego
  //     przecinka na tym samym poziomie (wartość nie zawiera przecinków).
  const retreatFieldMatch = fnBody.match(/defenderCanRetreat:\s*([\s\S]*?),/);
  assert(retreatFieldMatch !== null, '6a-pre: pole "defenderCanRetreat:" nie znalezione w ciele launchIncomingMapFieldBattle');
  if (retreatFieldMatch) {
    assert(retreatFieldMatch[1].includes('!defenderLockedByGarnizon'),
      '6a: pole defenderCanRetreat: musi zawierać warunek !defenderLockedByGarnizon '
      + '(znaleziono: "' + retreatFieldMatch[1].trim() + '") -- usunięcie tego warunku '
      + 'odblokowałoby wycofanie zagarnizonowanego obrońcy mimo zielonej bramki sekcji 1-5');
  }

  // (2) Gałąź `onCancel` w showPreBattle (TA z applyDefenderPreBattleRetreat --
  //     funkcja ma DRUGĄ gałąź "onCancel" w zagnieżdżonym BattleScene, która nie
  //     dotyczy wycofania; kotwiczymy się WSTECZ od wywołania
  //     applyDefenderPreBattleRetreat, więc zawsze trafiamy we właściwą gałąź
  //     niezależnie od tego, która z dwóch jest w źródle pierwsza/druga).
  const retreatCallIdx = fnBody.indexOf('applyDefenderPreBattleRetreat');
  assert(retreatCallIdx !== -1, '6b-pre: wywołanie applyDefenderPreBattleRetreat nie znalezione w ciele launchIncomingMapFieldBattle');
  if (retreatCallIdx !== -1) {
    const onCancelIdx = fnBody.lastIndexOf('onCancel:', retreatCallIdx);
    assert(onCancelIdx !== -1 && onCancelIdx < retreatCallIdx,
      '6b-pre: gałąź "onCancel:" poprzedzająca applyDefenderPreBattleRetreat nie znaleziona');
    if (onCancelIdx !== -1) {
      const between = fnBody.slice(onCancelIdx, retreatCallIdx);
      assert(/if\s*\([^)]*\)/.test(between),
        '6b-pre: warunek "if (...)" pomiędzy onCancel: a applyDefenderPreBattleRetreat nie znaleziony');
      assert(between.includes('!defenderLockedByGarnizon'),
        '6b: gałąź onCancel (bezpośrednio przed applyDefenderPreBattleRetreat) musi zawierać warunek '
        + '!defenderLockedByGarnizon (obrona-w-głąb, patrz komentarz przy tej gałęzi w main.ts) -- '
        + 'usunięcie tego warunku pozwoliłoby zagarnizonowanemu obrońcy wycofać się przez Esc/anuluj '
        + 'mimo że przycisk "Wycofaj" jest ukryty');
    }
  }
}

console.log(`retreat-garnizon-fortyfikacja-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
