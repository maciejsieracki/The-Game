# Analiza: bramka „Zakończ turę” w turze 1 (NNS) i koszt ulepszeń w żywności (2026-11-26)

Temat: R-WEB-NNS-T1-FOOD-UPGRADE-ANALYSIS-Q1 (zadanie #154). Baza: origin/main `8ad1d555d`.
Zakres: analiza bez zmian kodu i danych. Liczby oznaczone ZMIERZONO pochodzą z uruchomienia na bazie
8ad1d555d w tej rundzie; NIE ZMIERZONO oznacza brak pomiaru tutaj (wskazano źródło, jeśli to wynik z rejestru).

## (a) Bramka NNS „Zakończ turę” w turze 1

### Stan faktyczny w kodzie (ZMIERZONO: odczyt kodu)

- Zasada „gracz wolny od bramki w turach 1–10” z dispatchu NIE OBOWIĄZUJE. Została usunięta decyzją właściciela
  z 2026-11-14 (prognoza po turze, od tury 1, bez wyjątku). Ślad w kodzie:
  - `gra/src/game/no-negative-stocks.ts`, `evaluateEndTurnStocks`: `wyjatekTur = false` na stałe; komentarz
    wskazuje, że pola `wyjatekTur` / `wyjatekStarego` zostały w typie tylko dla zgodności wstecznej.
  - `NNS_WOLNE_TURY = 10` nadal istnieje jako eksportowana stała, ale NIE jest używana w `main.ts`
    (test `gra/tools/end-turn-gate-projection-only-test.cjs`, asercja (11e), pilnuje braku odwołań w `main.ts`).
  - `gra/tools/no-negative-stocks-ai-from-turn1-test.cjs` i `no-negative-stocks-test.cjs` asercjami potwierdzają
    `wyjatekTur === false` i blokadę od tury 1.
- Ścieżka gracza w `main.ts` (`nnsGateForPlayer`, ok. linii 43276) liczy prognozę po ticku tury, pozwala automatowi
  zarządzania poprawić ją (`extra.automat`) i dopiero wynik po automacie trafia do `decideEndTurnGate`.
- Reguła blokady (`decideEndTurnGate`, komentarz w kodzie): blokada, gdy po automacie prognoza skarbca lub spichlerza
  jest < 0 ORAZ istnieje realna, niewykorzystana dźwignia gracza (podatek, racja, rozwiązanie jednostki o zysku > 0).
  Brak dźwigni = brak blokady. Użycie dźwigni ma zysk 0 w kolejnym przebiegu, więc blokada znika po jej wyczerpaniu
  (brak zakleszczenia). Kolejka produkcji NIE jest dźwignią gracza.

### Odpowiedzi na pytania z dispatchu

**Pytanie 1: czy blokada tury 1 w teście t57 wynika z błędu kodu, z ustawienia testu czy z zamierzenia?**
Odpowiedź ZAŁOŻENIEM (wynik kodu, nie pomiaru): blokada tury 1 jest ZAMIERZONA przez obecny projekt. Zgodnie z kodem
i decyzją z 2026-11-14 bramka działa od tury 1 bez wyjątku. Nie jest to błąd implementacji bramki.
Co NIE jest rozstrzygnięte: sam timeout t57 (rejestr: „t57 NIEROZSTRZYGNIĘTE”, dług harnessu #417). Rejestr podaje,
że przy domyślnych podatkach 30/60/10 prognoza tury 1 wynosi −2 (ziarno 4242) i −3 (ziarno 777), więc bramka blokuje.
Rejestr podaje też czasy 89 s (bramka aktywna) i 250 s (obejście, tury 1–56 przechodzą). To są dane z rejestru,
NIE ZMIERZONO w tej rundzie. Czy test t57 nadal oczekuje wyjątku tur 1–10, NIE ZMIERZONO (nie otwierano asercji
harnessu t57 jako zakresu tej rundy).

**Pytanie 2: w jakich realnych warunkach gracz widzi blokadę „Zakończ turę” w turach 1–10?**
Wg kodu (ZMIERZONO: odczyt): wtedy, gdy po ticku tury i po reakcji automatu prognoza skarbca albo spichlerza
państwa jest ujemna, a gracz ma jeszcze dostępny ruch naprawczy (podniesienie podatku, zmniejszenie racji,
rozwiązanie jednostki). Przy domyślnych podatkach w turze 1 taka prognoza zachodzi wg rejestru dla dwóch ziaren
(patrz wyżej). Gdy gracz podniesie podatek lub zmniejszy racje, prognoza wraca do ≥ 0 i blokada znika.
Żywa weryfikacja w przeglądarce tej rundy: NIE ZMIERZONO (Chromium w tej rundzie nie był uruchamiany; rejestr
z Obrony podaje, że tooltip blokady i dźwignia podatku odblokowują turę 11→12 na żywo, to nie jest pomiar tej
rundy).

**Pytanie 3: warianty zachowania dla gracza (skutek dla gry)**

- Wariant A (stan obecny, rekomendowany jako punkt odniesienia): blokada od tury 1, gdy prognoza po turze jest ujemna
  i gracz ma ruch naprawczy.
  - Za: spójne z decyzją z 2026-11-14; gracz nie zamienia nieuchronnego deficytu w kary później; brak zmian kodu
    i testów; sama gra wyraźnie komunikuje, co zrobić.
  - Przeciw: pierwsza tura nowej gry może wymagać od gracza od razu podatku lub racji, zanim pozna mechanikę; test t57
    i długi harness mogą wymagać ręcznego obejścia.
  - Konsekwencja implementacyjna: brak. Konsekwencja testowa: brak zmian; ewentualnie aktualizacja harnessu t57
    (dług #417).
- Wariant B (wyjątek łagodny w turach 1–10): w turach 1–10 gracz zobaczy ostrzeżenie zamiast blokady; tura
  przechodzi, a skarbiec/spichlerz może spaść poniżej zera do tury 11.
  - Za: nowy gracz nie utyka w pierwszej turze; zgodne z dawnym duchem zasady „okres wolny”.
  - Przeciw: cofa decyzję z 2026-11-14, więc wymaga nowej decyzji właściciela; ujemny skarbiec może przeciągnąć się
    na kolejne tury; wydłuża ścieżkę do kary głodu wojska (siatka bezpieczeństwa).
  - Konsekwencja implementacyjna: przywrócić wyjątek tur 1–10 w `evaluateEndTurnStocks` albo w wołającym (ok. 1 pliku
    logiki + komunikat); `NNS_WOLNE_TURY` przestaje być martwe. Konsekwencja testowa: zmienią się asercje
    `no-negative-stocks-test.cjs` (wyjatekTur), `no-negative-stocks-ai-from-turn1-test.cjs` oraz asercja (11e) w
    `end-turn-gate-projection-only-test.cjs`.
- Wariant C (domyślne podatki startowe wyższe o jeden krok, bez zmiany reguły): zasada bez zmian, ale nowa gra
  startuje z podatkiem, który nie daje ujemnej prognozy w turze 1 (dla ziaren 4242 i 777 wg rejestru).
  - Za: gracz nie widzi blokady w pierwszej turze; reguła pozostaje jedna.
  - Przeciw: zmiana balansu, którą wymaga decyzja właściciela; może zmienić wynik ekonomii wszystkich ustawień
    domyślnych; wymaga pomiaru 10 tur na kilku ziarnach.
  - Konsekwencja implementacyjna: zmiana wartości startowej podatku (dane/ustawienia). Konsekwencja testowa:
    asercje domyślnych podatków i pomiary ekonomii; test t57 bez zmiany logiki.

Rekomendacja: wariant A do czasu decyzji; kwestia wariantu B/C jest decyzją gry, nie techniczną. Pytanie do
właściciela należy przygotować wg zasad ABC (wpływ na pierwszą turę gracza), NIE w tej rundzie.

## (b) Koszt ulepszeń w żywności a automatyczne ulepszanie pastwisk i irygacji

### Fakty

- Źródło kosztu: FALA 878 (decyzja właściciela 2026-11-19, wariant B): koszt BUDOWY ulepszenia (Praca) liczony wg
  epoki WŁAŚCICIELA, z jednej funkcji dla gracza, AI, auto-ulepszeń i karty. Flaga:
  `gra/data/improvement-cost-params.json`, `kosztUlepszenWgEpokiWlasciciela: true`; odczyt w
  `gra/src/game/terrain-improvements.ts` (ok. linii 177–189). Decyzja nie zawiera wyjątku dla żywności (ślad:
  `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-D1C/30-obrona-claude.md`).
- Metryka „głodowanie” (harness `gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs`): liczba tur fazy wzrostu
  (tury 1–24), w których istnieje pole obywatela z farmą bez trzody (przy rzece, Łąka/Równina), a automat nie
  postawił ani trzody, ani irygacji, mimo puli > 500. Czyli: „farma stoi bez trzody, a budżet się marnuje”.
- Test (e) w `gra/tools/autoimprove-pasture-irrigation-q2-test.cjs` wymaga starved = 0, firstPast ≤ 3,
  firstIrr ≤ 6 oraz zero naruszeń kolejności.

### Pomiar na bazie 8ad1d555d (ZMIERZONO: uruchomienie harnessu, 14 ziaren, domyślne parametry)

Harness uruchomiony na `gra/src` tej bazy (flaga true) i na kopii `gra/src` z flagą false (kopia poza repo).

| ziarno | flaga true: starved / firstIrr / pool | flaga false: starved / firstIrr / pool |
|---|---|---|
| 1 | 0 / 7 / 365 | 0 / 3 / 333 |
| 2 | 0 / 11 / 290 | 0 / 3 / 315 |
| 3 | 2 / 40 / 335 | 2 / 3 / 340 |
| 4 | 0 / 36 / 315 | 0 / 3 / 290 |
| 5 | 1 / brak / 315 | 0 / 3 / 310 |
| 6 | 0 / 10 / 340 | 0 / 3 / 300 |
| 7 | 0 / 8 / 325 | 0 / 3 / 290 |
| 8 | 0 / 39 / 375 | 0 / 3 / 318 |
| 9 | 0 / 4 / 330 | 0 / 2 / 328 |
| 10 | 0 / 12 / 300 | 0 / 3 / 295 |
| 11 | 0 / 35 / 355 | 0 / 3 / 320 |
| 12 | 1 / 3 / 305 | 0 / 2 / 285 |
| 13 | 0 / 5 / 335 | 0 / 2 / 288 |
| 14 | 0 / 5 / 330 | 0 / 3 / 315 |

Podsumowanie ZMIERZONO:
- Flaga true: 3 z 14 ziaren ma tury głodzone (ziarna 3, 5, 12; łącznie 4 tury), mediana firstIrr = 8 (irygacja
  pojawia się późno: 35–40 tur w czterech ziarnach, brak w ziarnie 5 w horyzoncie testu).
- Flaga false: 1 z 14 ziaren ma tury głodzone (ziarno 3, 2 tury), firstIrr = 2–3 we wszystkich ziarnach.
- Ziarno 3 głoduje także przy fladze false. Flaga NIE jest jedyną przyczyną na tej bazie.
- Średnia puli (14 ziaren): true ≈ 330, false ≈ 309 (ta sama metryka; przyczyny różnicy NIE ZMIERZONO).
- Test (e) (ziarno 1, domyślne ustawienia): starved 0 i firstPast 2 spełnione; firstIrr = 7 przy progu ≤ 6, czyli
  asercja irygacji z flagą true na tej bazie wypada. NIE ZMIERZONO: pełny przebieg `npm`-testu (uruchomiono
  tylko harness, nie cały plik testowy).

Uwaga o liczbach z dispatchu: „starved 3 z pulą 340” pochodzi z kandydata 141a2bc56 (FALA 878) i
z kandydata 79d6972c2 (Obrona R-WEB-TEST-DEBT-Q14-D1C), a nie z bazy 8ad1d555d. Na bazie 8ad1d555d zjawisko
jest mniejsze (1–3 ziarna z 14 zależnie od flagi). Związek „flaga = jedyna przyczyna” z Obrony NIE potwierdza się
na obecnej bazie, bo ziarno 3 głodzi także przy fladze false.

### Interpretacja (ZAŁOŻENIE, rozstrzygnięte w tej analizie)

- Koszt wg epoki właściciela podnosi cenę ulepszeń (w tym farm, trzody i irygacji) w epokach wyższych od ich
  epoki odblokowania. Skutek: w tej samej turze mniej ulepszeń się mieści w puli, a kolejność (farmy → trzoda →
  irygacja) jest egzekwowana. To zgodne z decyzją B (ZAŁOŻENIE: decyzja nie wyłącza żywności).
- „Głodowanie” z testu (e) jest skutkiem kolejności etapów przy rosnącej liczbie farm, a nie wyczerpaniem żywności
  w sensie ekonomii państwa. Metryka mierzy opóźnienie trzody/irygacji przy farmach bez trzody, nie niedobór żywności.
- Realny wpływ na grę: AI i gracz z autoulepszaniem dostają trzodę/irygację później (firstIrr 35–40 tur na
  czterech ziarnach zamiast 2–3), co obniża wydajność pól przy rzece w połowie wzrostu. To jest konsekwencja
  zatwierdzonej decyzji kosztu, a nie błąd kolejności (kolejność jest zachowana: orderViol = 0 we wszystkich
  przebiegach).

### Warianty dla właściciela (skutek dla gry, po polsku)

- Wariant A (obecny): koszt wg epoki właściciela dla wszystkich ulepszeń, także farm, trzody i irygacji.
  - Za: jedna, prosta reguła; zgodna z decyzją z 2026-11-19; spójna dla gracza i AI.
  - Przeciw: w epokach wyższych automat stawia trzodę i irygację późno (w części ziaren dopiero po 35–40 turach);
    pola przy rzece dłużej bez wydajności.
  - Konsekwencja implementacyjna: brak. Konsekwencja testowa: test (e) pozostaje czerwony na części ziaren; wymaga
    decyzji o zmianie kryterium albo o wariancie B.
- Wariant B (wyjątek dla żywności): koszt wg epoki tylko dla surowców i ulepszeń nieżywnościowych; farmy, trzoda
  i irygacja liczone po epoce odblokowania.
  - Za: trzoda i irygacja wracają wcześnie (firstIrr 2–3 we wszystkich ziarnach na bazie flagi false); kryterium
    testu (e) jest spełnione.
  - Przeciw: łamie jednolitość reguły z decyzji 2026-11-19; w wyższych epokach ulepszenia żywnościowe są relatywnie
    tańsze niż reszta.
  - Konsekwencja implementacyjna: wyjątek w funkcji kosztu budowy (jedna funkcja wg decyzji „z jednej funkcji”),
    flaga per kategoria. Konsekwencja testowa: testy kosztu ulepszeń (ścieżka gracza, AI, karta) wymagają
    zaktualizowania; test (e) wraca do zielonego.
- Wariant C (kryterium zmienione): zostaje koszt wg epoki, a test (e) zostaje przeformułowany na
  „trzoda/irygacja w rozsądnym czasie od wyczerpania farm”, z progiem liczbowym do zatwierdzenia przez właściciela.
  - Za: reguła gry bez zmian; test mierzy to, co gra ma robić.
  - Przeciw: wymaga nowego kryterium i decyzji, czy 35–40 tur to akceptowalne opóźnienie.
  - Konsekwencja implementacyjna: tylko test/harness. Konsekwencja testowa: zmiana asercji (e); bez zmiany gry.

Rekomendacja orkiestratora (do decyzji właściciela, NIE rozstrzygam sam): wariant C, jeśli 35–40 tur opóźnienia
trzody i irygacji w części ziaren jest akceptowalne dla gry; wariant B, jeśli nie. Wariant A bez zmiany kryterium
zostawia test czerwony.

## Ograniczenia

- Harness uruchomiono na 14 ziarnach z domyślnymi parametrami; test (e) używa tej samej metryki na ziarnie 1.
- Gra w przeglądarce NIE była uruchamiana (NIE ZMIERZONO): brak zrzutów, brak pomiaru tooltipu bramki na żywo.
- Dwie liczby z rejestru (89 s / 250 s, prognozy −2/−3) NIE zostały tu ponownie zmierzone.
- Nie wykonano zmian w `gra/`, `dyspozycje/WERSJE.md` ani w manifeście. Środowisko: `npm ci` w `gra/` tylko na
  potrzeby harnessu; `gra/node_modules` usunięty po pomiarze.
