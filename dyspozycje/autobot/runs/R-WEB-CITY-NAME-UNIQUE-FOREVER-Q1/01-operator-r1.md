STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-NAME-UNIQUE-FOREVER-Q1
GOAL: Nazwa miasta zuzyta raz jest zuzyta na zawsze w obrebie gry (utrata miasta, eliminacja, odrodzenie, inna civ ze wspolna nazwa w puli) — kolejne miasta biora nastepna nazwe z puli.

## Pomiar PRZED (plik:linia, origin/main c4a541a27)
- Pule: `gra/data/city-names-pools.json` (110 nazw/civ), logika `gra/src/game/city-names-pool.ts`, fasada `civ-names.ts`.
- Wybor nazwy = first-free z puli wzgledem migawki `used`. Migawka `collectUsedCityNamesFromCities` (city-names-pool.ts) filtruje po CURRENT wlascicielu i jego civ. Miasta NIGDY nie znikaja z `cities` (zero `cities.splice`; zdobycie/cesja/eliminacja zmieniaja tylko `ownerId`), wiec po utracie nazwa wypadala ze zbioru civ-wlasciciela -> Rzym wracal (przyczyna).
- Dodatkowo pule nakladaja sie miedzy civ (97 nazw wspolnych z 15 pul, np. Teby grecy/egipt) a start (`cluster-spawn.ts`, `cluster-start.ts`) liczyl zbior per civ -> duplikat miedzy civ.
- Miejsca przydzialu: main.ts ~9393 (fallback wyswietlania), ~10035 (rywale/miasta-panstwa), ~10189 (bonusowe AI), ~10244 (sloty klastra), ~15014 (gracz), ~39513 (AI founding); cluster-start.ts:222; cluster-spawn.ts:~410.
- Save: osobnego zbioru nie ma; `cities` w save niesie wszystkie nazwy.
- Symulacja pickerow (3 ziarna x 150 tur, zakladanie+zdobywanie, prawdziwe funkcje): duplikaty nazw PRZED = 11/16/14 (razem 41 na 212 miast).

## Naprawa (minimalna)
- Nowe `collectAllUsedCityNames(cities)` (city-names-pool.ts, re-eksport civ-names.ts): GLOBALNY zbior nazw wszystkich miast ze ksiegi `cities` niezaleznie od wlasciciela/civ. `pickAiFoundCityName`, `suggestPlayerFoundCityName` i 3 miejsca w main.ts + fallback uzywaja go.
- cluster-spawn.ts i cluster-start.ts: jeden globalny zbior zamiast Map per civ.
- Zalozenie (luka): osobne pole `usedCityNames` w save NIE jest potrzebne, bo `cities` jest trwala ksiega rezerwacji (brak usuwania i zmiany nazw) i jest zapisywane w save; stare zapisy dzialaja bez migracji, brak zmiany SAVE_VERSION. Gdyby w przyszlosci pojawilo sie usuwanie/zmiana nazwy miasta, trzeba dodac zapisywany zbior (parametr `extraReserved` jest juz przygotowany).
- Wyczerpanie puli: istniejacy fallback sufiksowy ("Rzym II") zachowany, teraz wzgledem globalnego zbioru. Dane pul bez zmian. Barbarzyncy: nie zakladaja miast z pul (NIE_ZMIERZONO w runtime).
- Determinizm: ta sama sekwencja zdarzen -> te same nazwy (test). Wplyw na hashe/wektory: w nowej grze bez utraty miast zmiana tylko tam, gdzie pule roznych civ sie nakladaja na starcie (cluster-spawn/cluster-start, drugi dostaje nastepna nazwe) — mozliwa zmiana nazw w wektorach startowych; REPIN Rust (nazwy miast) notuje orkiestrator.

## Zmiany / commit
Pliki: gra/src/game/city-names-pool.ts, civ-names.ts, cluster-start.ts, gra/src/map/cluster-spawn.ts, gra/src/main.ts (4 wywolania + import), nowy gra/tools/city-name-unique-forever-test.cjs, ten raport. Commit: SHA w odpowiedzi orkiestratora (commit zawiera ten raport; SHA nie da sie wpisac w tym samym commicie).

## TESTY
- Nowy test city-name-unique-forever-test.cjs (GRA_ROOT = kopia origin/main): PRZED RED 6 FAIL (utrata miasta, suggest gracza, grecy+egipt, odrodzenie, save/load, symulacja 41 duplikatow); PO GREEN 14/14 ok. Zawiera: zdobyte miasto zachowuje nazwe, wyczerpanie puli 125 miast, determinizm, mutacja (stary kolektor per-civ wydaje utracona nazwe — test czuly).
- PO: city-names-pool-test 123/0, city-names-pools-test 9/0, nazwy-miast-rozlaczne-pule 9/0, capital-capture 107/107, city-capture-pop-loss 29/0, elimination-full-spoils 114/0, save-load-sort 4/4, civ-ai-allocation-saveload-order 5/5, difficulty-bonus-city-name 7/0. tsc --noEmit EXIT=0.
- Regresje PRZED (na origin/main): NIE_ZMIERZONO (tylko nowy test uruchomiony na bazie).
- Pelny przebieg gry w Chromium 3x150 tur: NIE_ZMIERZONO (symulacja pickerow zamiast pelnej gry; wymaga bundla poza repo).

## BLOKADY
brak. node_modules usuniete, brak buildu w gra/.

## RUNDY
1/5

## NASTEPNY KROK
Evaluator R1; zweryfikowac zalozenie "cities = ksiega" (brak usuwania/zmiany nazw) oraz opcjonalnie live pomiar duplikatow.

DEPLOY/PUSH: NIE WYKONANO
