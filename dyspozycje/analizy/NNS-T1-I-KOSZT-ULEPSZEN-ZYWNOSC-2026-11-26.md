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
- Dwie miary w harnessie `gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs` (ten sam produkcyjny picker):
  - `starved` = liczba tur fazy wzrostu (1–24), w których istnieje pole obywatela z farmą bez trzody (przy rzece,
    Łąka/Równina), a automat nie postawił ani trzody, ani irygacji, mimo puli > 500.
  - `gapGrow` = liczba farm na polach obywateli bez trzody w turze 24 (koniec fazy wzrostu).
- Test (e) w `gra/tools/autoimprove-pasture-irrigation-q2-test.cjs` działa na JEDNYM ziarnie (SEED = 1) i wymaga:
  starved = 0; pierwsza trzoda w turze ≤ 3; pierwsza irygacja w turze ≤ 6; gapGrow.farmNoPast = 0; zero naruszeń
  kolejności. Sekcja (a)+(b)+(c) tego samego pliku wymaga dodatkowo: pola obywateli POZA rzeką z farmą ≥ 1.

### Wynik pełnego pliku testowego (ZMIERZONO: pełny przebieg, ok. 55 s, baza 8ad1d555d)

| Przebieg | WYNIK | Niespełnione asercje |
|---|---|---|
| flaga true (stan obecny) | 14 OK / 3 FAIL | (1) pola obywateli POZA rzeką z farmą: 0 (wymagane ≥ 1); (2) (e) pierwsza irygacja w turze 7 (wymagane ≤ 6); (3) (e) w turze 24 farmy na polach obywateli bez trzody: 38 (wymagane 0) |
| flaga false (tymczasowa zmiana pliku danych, cofnięta `git checkout`) | 15 OK / 2 FAIL | (1) jw.; (3) (e) w turze 24 farmy bez trzody: 19 |

Wnioski z wyniku:
- Liczba „14/3" z dispatchu to wynik testu: 14 asercji OK, 3 FAIL. NIE oznacza „3 z 14 ziaren". Zdanie „3 z 14 ziaren
  głoduje" pochodzi z osobnej pętli po 14 ziarnach (tabela niżej) i jest innym pomiarem.
- Pełny test NIE przechodzi przy żadnej wartości flagi.
- Asercja (1) „pola POZA rzeką" pada niezależnie od flagi kosztu (na ziarnie 1 nie ma pola obywatela poza rzeką z
  farmą). To nie jest skutek kosztu żywności; to osobna sprawa scenariusza testu (rozstrzyga orkiestrator jako
  kwestię inżynierską, nie balansową).
- Asercja (2) (irygacja w turze 7) pada tylko przy fladze true.
- Asercja (3) (luka trzody w turze 24) pada w obu przebiegach; flaga kosztu podwaja lukę (19 → 38 farm bez trzody).
- Zarzut „wariant B naprawia test (e)" był błędny: patrz wariant B niżej.

### Pomiar 14 ziaren na bazie 8ad1d555d (ZMIERZONO: pętla harnessu bisect po SEED = 1..14, domyślne parametry)

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

Podsumowanie:
- Flaga true: starved > 0 w 3 z 14 ziaren (ziarna 3, 5, 12; łącznie 4 tury); firstIrr w czterech ziarnach 35–40 tur
  (ziarno 5: brak irygacji w horyzoncie).
- Flaga false: starved > 0 tylko w ziarnie 3 (2 tury); firstIrr 2–3 we wszystkich ziarnach z irygacją.
- Ziarno 3 głodzi także przy fladze false: flaga nie jest jedyną przyczyną.
- Średnia puli (14 ziaren): true ≈ 330, false ≈ 309 (przyczyna różnicy NIE ZMIERZONO).
- Ziarno 1 (test (e)): starved 0 w obu przebiegach (test przechodzi tę miarę); luka gapGrow 38 / 19 — NIE była
  widoczna w tabeli starved, stąd konieczność podania obu miar.

### Interpretacja (ZAŁOŻENIE, nie rozstrzygnięte pomiarem)

- Koszt wg epoki właściciela podnosi cenę ulepszeń (farm, trzody, irygacji) w epokach wyższych niż epoka ich
  odblokowania. Skutek w pomiarze: trzoda i irygacja pojawiają się później (irygacja 35–40 tur w czterech ziarnach
  zamiast 2–3), a liczba farm bez trzody w turze 24 rośnie z 19 do 38 (ziarno 1).
- Mechanizm, dlaczego nawet przy fladze false zostaje 19 farm bez trzody w turze 24 i dlaczego ziarno 3 głodzi
  w obu przebiegach: NIE ZMIERZONO w tej rundzie (wymaga osobnego śledzenia kolejki w pickerze).
- Realny wpływ na grę (ZAŁOŻENIE): AI i gracz z autoulepszaniem dostają trzodę i irygację później; pola przy rzece
  dłużej działają bez wydajności. Kolejność etapów jest zachowana (orderViol = 0 we wszystkich przebiegach).

### Warianty dla właściciela (skutek dla gry, po polsku)

- Wariant A (obecny): koszt wg epoki właściciela dla wszystkich ulepszeń, także farm, trzody i irygacji.
  - Za: jedna, prosta reguła zgodna z decyzją z 2026-11-19; spójna dla gracza i AI.
  - Przeciw: w epokach wyższych trzoda i irygacja pojawiają się późno (w części ziaren po 35–40 turach); pola przy
    rzece dłużej bez wydajności; gracz widzi więcej farm bez zwierząt w połowie wzrostu.
  - Konsekwencja implementacyjna: brak zmian w grze. Konsekwencja testowa: test (e) pozostaje czerwony (asercje 2
    i 3), a asercja (1) pada niezależnie. Zielony test wymaga wariantu B lub C oraz osobnej naprawy asercji (1).
- Wariant B (wyjątek dla żywności): farmy, trzoda i irygacja liczone po epoce odblokowania; reszta po epoce właściciela.
  - Za: irygacja wraca wcześnie (przy fladze false: 2–3 tury na wszystkich ziarnach z irygacją; asercja (2) przechodzi);
    luka trzody maleje z 38 do 19 farm.
  - Przeciw: łamie jednolitość decyzji z 2026-11-19; luka trzody (19 farm) NIE znika; asercja (3) i asercja (1)
    nadal padają, więc test NIE wraca do zielonego.
  - Konsekwencja implementacyjna: wyjątek w jednej funkcji kosztu budowy (dla kategorii żywnościowych) oraz osobne
    zbadanie przyczyny luki trzody (NIE ZMIERZONO). Konsekwencja testowa: testy kosztu ulepszeń (gracz, AI, karta)
    do aktualizacji; asercja (2) przechodzi; asercje (3) i (1) wymagają dalszej pracy.
- Wariant C (kryterium zmienione): koszt wg epoki zostaje; test (e) przeformułowany na progi czasowe do zatwierdzenia
  przez właściciela (np. dopuszczalne opóźnienie irygacji i trzody).
  - Za: reguła gry bez zmian; test mierzy to, co gra ma zapewniać.
  - Przeciw: progi są decyzją gry; 35–40 tur opóźnienia i 38 farm bez trzody w turze 24 trzeba zaakceptować albo
    odrzucić; asercja (1) (pola poza rzeką) wymaga osobnej decyzji o scenariuszu.
  - Konsekwencja implementacyjna: tylko test/harness, bez zmiany gry. Konsekwencja testowa: zmiana asercji (2), (3)
    i (1); wymagany nowy pomiar na 14 ziarnach po zmianie progów.

Rekomendacja: nie rozstrzygam za właściciela. Pytanie ABC do właściciela należy przygotować po zakończeniu rundy
(ile tur gracz czeka na trzodę i irygację przy farmach, przy jakim koszcie budowy), z wariantami A/B/C powyżej.

## Ograniczenia

- Pełny plik testowy uruchomiono na bazie 8ad1d555d (flaga true i false); tabelę 14 ziaren zebrano harnessem bisect
  (ta sama baza, pętla po SEED).
- Gra w przeglądarce NIE była uruchamiana (NIE ZMIERZONO): brak zrzutów, brak pomiaru tooltipu bramki na żywo.
- Liczby 89 s / 250 s i prognozy −2 / −3 dla t57 z rejestru NIE zostały tu ponownie zmierzone.
- Tanie testy bramki NNS uruchomiono w tej rundzie (ZMIERZONO): no-negative-stocks-test.cjs 25/0,
  end-turn-gate-projection-only-test.cjs 49/0, no-negative-stocks-ai-from-turn1-test.cjs 27/0. Nie mierzą one
  prognozy tury 1 przy domyślnych podatkach; ta liczba pozostaje NIE ZMIERZONO.
- Nie wykonano zmian w `gra/src/`, `gra/data/` (flaga przywrócona `git checkout`), `dyspozycje/WERSJE.md` ani w manifeście.
- Środowisko: `npm ci --ignore-scripts` w `gra/` tylko na potrzeby harnessu; `gra/node_modules` usuwany po rundzie.
