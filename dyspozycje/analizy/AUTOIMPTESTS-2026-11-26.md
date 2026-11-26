# AUTOIMPTESTS (2026-11-26) — klasyfikacja czerwonych testów autoulepszeń

Temat: R-WEB-AUTOIMPROVE-TESTS-OWNER-RULES-Q1 (runda obrony 1, Operator Haiku 5.5).
Baza: origin/main `1bb77a7a0`. Kandydat: `5040d8b76`. Obrona: commit w `git log` gałęzi operatora (SHA w raporcie 30-obrona-claude.md).

## 1. Klasyfikacja czerwonych asercji na bazie (1bb77a7a0)

Pomiar: testy z bazy uruchomione na tym samym `gra/src` (w bazie i kandydacie `gra/src` jest identyczne; zmiany dotyczą tylko `gra/tools/`).

| test | asercja (skrót) | przed (baza) | klasyfikacja | dowód |
|---|---|---|---|---|
| stages-q1 | [K2] irygacja czeka na Pracę (pula 50, +8/turę): 0 dróg przed irygacją | FAIL, irygacja nie pojawia się w 8 turach | STARY-PIN | koszt irygacji wg epoki 3 = 120 (`getImprovementMeta('irygacja', 3)`); test zakłada koszt 30 (epoka 0–1) i dochód +8 |
| stages-q1 | [K2] niedobór kamienia, brak heksu pod kamieniołom: drogi ruszają | FAIL, 0 dróg | STARY-PIN | test wymaga pustej puli 50 przy kamieniołomie 22; koszt kamieniołomu wg epoki 3 = 88, rezerwa 30 blokuje drogi |
| stages-q1 | [K2/K3] pula 80: kamieniołom idzie pierwszy | FAIL, brak rozkazów | STARY-PIN | koszt kamieniołomu e3 = 88 > pula 80 - rezerwa 30 |
| stages-q1 | [AI cywilizacji] pula 60: wydano 0 (3 farmy = 60) | FAIL, wydano 0 | STARY-PIN | test liczy koszt farmy płaski (20); `getImprovementMeta('farma', 3).kosztPraca` = 80, więc pula 60 < 80 |
| stages-q1 | [panstwo-miasto] pula 72: wydano 0 (3 farmy = 60) | FAIL, wydano 0 | STARY-PIN | j.w. (farma e3 = 80, 3 farmy = 240) |
| stages-q1 | [K1] KROK 0: pula 300 x 1% = 3 >= 2,5: dokładnie 1 wyrąb | FAIL, 0 wyrębów | STARY-PIN | koszt wyrębu e3 = 10 > sufit 3; test zakłada koszt 2,5 (epoka 0–1) |
| stages-q1 | [K2] KROK 0: j.w. | FAIL | STARY-PIN | j.w. |
| stages-q1 | [K1] FAZA 2 (wyrąb): j.w. | FAIL | STARY-PIN | j.w. |
| pasture-irrigation-q2 | asercja „pola poza rzeką” (ziarno 1, flaga) | NIE ODTWORZONO | — | na bazie `16 OK / 0 FAIL`; nie znaleziono czerwonej asercji w tym pliku na bazie. Zarzut dispatchu nie potwierdzony w tym przebiegu |
| pasture-irrigation-q2 | (e) AUTOIMPMASS próg 46 tur po odkryciu | zielony (46 <= 46) | ZLUZOWANIE POLITYCZNE, nie naprawa | test zielony na bazie; kandydat podnosi próg do 55 na podstawie odp. 25A („irygacja czasem późno — zamierzone”). Mutacja E4 (irygacja w 56 turze) nadal wykrywana przy 55; pomiar mutacji NIE ZMIERZONO w tej rundzie |

Wniosek: wszystkie 8 czerwonych asercji na bazie to STARY-PIN (test zakłada płaski koszt ulepszeń sprzed reguły kosztu wg epoki). Żadna nie jest BŁĘDEM GRY. Koszty i pula domyślna 33% nie zostały zmienione.

## 2. Kolejność „farmy → trzody → irygacja” (zarzut 3, pkt 1 dispatchu)

- Kandydat `owner-rules` (ii-c) i `(e) kolejność wycinka -> farmy -> trzoda -> irygacja`: zielone (orderViol = 0). Pomiar z `NNS-T1-I-KOSZT-ULEPSZEN-ZYWNOSC-2026-11-26.md`: orderViol = 0 we wszystkich przebiegach.
- „19 farm bez trzody w turze 24” (flagi false, głodzenie ziarna 3) pochodzi z tamtej analizy (bez kosztu wg epoki). Mechanizm tej luki NIE ZMIERZONO w tej rundzie (wymaga śledzenia kolejki pickera).
- ZAŁOŻENIE (rozstrzygnięcie luki): luka farm bez trzody jest zgodna z kolejnością właściciela (farmy są wybierane przed trzodami), a nie jest dowodem błędu pickera, dopóki nie zmierzono, że trzoda była dostępna i tańsza od farmy. Nie zamykam tego jako potwierdzonego. Do wyjaśnienia w osobnym temacie (śledzenie kolejki pickera w turze 24).

## 3. Maksimum puli Pracy na ulepszenia (zarzut 1, pkt 4(i) dispatchu)

- `gra/src/game/cities.ts:230` — `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT = 100` (pole (b) „Automatyzacja ulepszeń”).
- `gra/src/game/cities.ts:466` — `MAX_PROCENT_PULI_IMPERIUM = 100 - MIN` (= 50, pole (a) podziału Pracy, nie pole (b)).
- Komentarz w `cities.ts:232–240` (P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1): cap 50% na polu (b) był wcześniej uznany za REGRESJĘ i celowo zdjęty.
- Odpowiedź właściciela 25A (2026-11-26): „można zwiększyć maksymalnie do 50% ilość pracy przeznaczonej na ulepszenia”.

To jest konflikt dwóch decyzji właściciela (wcześniejszej: pole (b) 0–100%; późniejszej 25A: max 50%). Nie jest to błąd kodu. Zmiana wymaga decyzji właściciela, nie cichej poprawki. Test z wartością 50 i 51/60 NIE został dopisany, bo na obecnym kodzie padłby, a nie wiadomo, która wersja obowiązuje. Patrz DECISION_REQUIRED w raporcie.

## 4. Zasada „całość na jedzenie” (pkt 4(ii))

- `owner-rules` (ii-a): każda tura wydatek <= 50% puli; co najmniej raz wydatek >= 90% całej puli 50% — zielone na kandydacie (7 OK / 0 FAIL).
- `owner-rules` (ii-b): zero wyborów poza żywnością i wycinką przy profilu „jedzenie” — zielone.
- Mutacja M2 (połowienie budżetu) przechodzi górny limit (ii-a) i jest wykrywana wyłącznie przez asercję „najlepsza tura >= 90%”. Komentarz w teście dopisany (zarzut 4, przyjęty).

## Bramki (kandydat + commit obrony)

- `autoimprove-owner-rules-test.cjs`: 7 OK / 0 FAIL
- `autoimprove-stages-q1-test.cjs`: 299 passed / 0 failed
- `autoimprove-pasture-irrigation-q2-test.cjs`: 16 OK / 0 FAIL
- Pozostałe bramki ogólne (tsc, logic, tech-tree, research, combat, ai-test) NIE URUCHAMIANE w tej rundzie obrony (zmiana dotyczy wyłącznie plików testowych `gra/tools/`).
