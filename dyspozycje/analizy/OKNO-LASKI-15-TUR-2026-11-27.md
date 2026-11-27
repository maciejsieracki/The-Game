# Okno łaski 15 tur (R-WEB-EARLY-GRACE-15-IMPL-Q1, tag GRACE15)

Data: 2026-11-27. Baza: origin/main 6afdec814 (ROBOCZA 60d54c64, FALA 933).
Decyzja właściciela: pytanie R-WEB-EARLY-DEFENSE-START-Q41, odpowiedź A + dopowiedzenie
(barbarzyńcy nie atakują przez pierwsze 15 tur, jednostki gracza bezpłatne przez 15 tur, na każdym poziomie trudności).

## Co zrobiono

1. **Start gracza, poziom Trudny: 0 -> 1 Wojownik.**
   - `gra/src/game/ai-difficulty-bonus.ts` (`playerStartUnitCount`): `hard` zwraca 1.
   - Łatwy 2 i Normalny 1 bez zmian. Obce państwa-miasta i państwa-miasta gracza bez zmian.
   - Użycie: `gra/src/main.ts` `grantPlayerStartUnits` (ok. linia 12141).

2. **Barbarzyńcy nie wykonują tury w turach 1..15 (włącznie).**
   - Najmniej inwazyjne miejsce: bramka wejścia całej tury barbarzyńców w pętli tury, nie wewnątrz logiki ruchu.
     Cały blok `if (barbariansActive(...))` w `gra/src/main.ts` (ok. linia 49143) obejmuje spawn obozów, tick obozów,
     spawny rajdów morskich, garnizony miast barbarzyńskich i `decideBarbarianMoves`. Dodany warunek
     `&& !barbariansGraceBlocksTurnEnd(turn, barbGraceTurns)`.
     Licznik `turn` jest już N+1 (po `turn++`), a faza barbarzyńców domyka turę N, więc
     `barbariansGraceBlocksTurnEnd(t, g)` sprawdza `barbariansGraceActive(t - 1, g)`. Tak samo liczy się utrzymanie
     (`aiUpkeepTickTurnOverride = N`). Bez tej korekty barbarzyńcy działali raz po domknięciu tury 15
     (gra w turze 16 na liczniku, bramka wyłączona). Pomiar: test `barbariansGraceBlocksTurnEnd` (domknięcie 16 = blok,
     domknięcie 17 = brak bloku) i mutacja `turnAfterIncrement` zamiast `turnAfterIncrement - 1` = 5 czerwonych.
   - `gra/src/game/barbarians.ts`: `barbariansGraceActive(turn, graceTurns)` (ok. linia 696), `BARBARIAN_GRACE_TURNS_KEY`,
     `BARBARIAN_GRACE_TURNS_DEFAULT = 15`, `loadBarbGraceTurns(data)` (ok. linie 702-707).
   - `barbariansActive` i jego piny w `barbarians-test.cjs` nie zmienione (okno jest osobną bramką).
   - Skutek: w turach 1..15 nie ma spawnu obozów ani ruchu barbarzyńców. Obozy mogą istnieć, ale stoją bez tury.
     Od tury 16 działa jak dotąd.
   - ZAŁOŻENIE (do decyzji orkiestratora): bramka blokuje cały blok, więc także spawn i tick obozów. Pierwszy
     spawn obozu możliwy jest dopiero przy domknięciu tury 16. Dispatch mówił „mogą powstawać (spawn)”; wybór
     najmniej inwazyjnego punktu z dispatchu nie pozwala zostawić spawnu przy blokadzie ruchu bez przepisania bloku.
   - Parametr w danych: `gra/data/ai-params.json`, klucz `barbarzyncy_okno_laski_tury` = 15.

3. **Utrzymanie jednostek gracza-człowieka = 0 w turach 1..15.**
   - Jedno źródło: `paceUtrzymaniaWlasciciela` w `gra/src/game/ai-free-unit-upkeep.ts` (już używane przez wszystkie
     ścieżki utrzymania per właściciel: złoto, żywność w `militaryFoodConsumptionWithSpichlerz`, surowce).
     Dodane: `playerUnitUpkeepGraceActive(turn, isHuman, graceTurns)` (ok. linia 48) i gałąź zwracająca 0 (ok. linia 88).
   - Kontekst: pole `playerGraceTurns` w `AiFreeUnitUpkeepContext`, ustawiane w `gra/src/main.ts` (ok. linia 15000)
     z klucza `utrzymanie_gracza_okno_laski_tury` (wartość 15, stałe `PLAYER_UPKEEP_GRACE_TURNS_KEY/DEFAULT`).
   - Każdy fotel ludzki (hotseat) dostaje to samo okno, bo warunek to `isHumanOwner`.
   - Okno darmowego utrzymania AI (FALA 890, tury 1..40) bez zmian.
   - Koszt zakupu jednostek (recruit) NIE przechodzi przez `paceUtrzymaniaWlasciciela` (komentarz w `main.ts` przy
     podglądzie jednostek) i jest bez zmian.

4. **Zapis/wczytanie:** reguły zależą od numeru tury, więc nie dodano żadnych pól do zapisu. Zapis w turze 16+
   nie ma okna, zapis w turze <=15 ma okno dalej.

## Pliki zmienione
- gra/src/game/ai-difficulty-bonus.ts
- gra/src/game/barbarians.ts
- gra/src/game/ai-free-unit-upkeep.ts
- gra/src/main.ts (import, wiring kontekstu, bramka tury barbarzyńców)
- gra/data/ai-params.json (2 klucze)
- gra/tools/ai-difficulty-bonus-test.cjs (pin: `hard` 0 -> 1, wprost z decyzji)
- gra/tools/early-grace-15-test.cjs (nowy, 33 testy, 33/0 po rundzie 2; mutacje rundy 2: wartość
  klucza w ai-params.json 15→5 (czerwone), domknięcie tury N+1 zamiast N (5 czerwonych); mutacje M1–M3 z rundy 1 nie powtórzone)

## Testy

Deterministyczne testy (node, bez przeglądarki), wyniki z surowego wyjścia:
- `node tools/early-grace-15-test.cjs`: **24 passed, 0 failed**
- Mutacje (ręczne, źródło przywrócone i sprawdzone `cmp`):
  - M1 start Trudny = 0: 2 FAIL (R1)
  - M2 `barbariansGraceActive` zawsze false: 1 FAIL (R2)
  - M3 usunięta gałąź zera dla gracza w `paceUtrzymaniaWlasciciela`: 6 FAIL (R3)
  - Pin wiringu `main.ts` (bramka tury barbarzyńców) obecny w teście (tekstowy).
- Gate tests (wyniki z wyjścia):
  - ai-difficulty-bonus-test: 97 passed, 0 failed
  - logic-test: exit 0 (liczba z wyjścia nie wyodrębniona)
  - tech-tree-test: exit 0
  - research-test: PASSED 33 / FAILED 0
  - unit-replace-test: exit 0
  - combat-test: "All sanity checks passed."
  - society-breakdown-test: 56 OK, 0 FAIL
  - ai-city-order-need-wiring-test: 267 passed, 0 failed
  - save-load-sort-test: exit 0
  - endturn-aria-sync-test: 5 PASS / 0 FAIL
  - ai-test: 297 passed, 0 failed (bez zmiany pinów: asercje barbarzyńców nie zmieniły wyniku)
  - barbarians-test 213/0, barbarzyncy-krazenie-test 249/0, sea-peoples-boost-test 42/0, sea-peoples-wiring-test 23/0,
    diplomacy-barbarian-cooperation-test 10/0, barbarian-cooperation-grace-test 30/0,
    barbarian-cooperation-grace-maints-wiring-test 29/0, ai-home-defense-vs-barbarians-test 64/0
  - Utrzymanie: ai-free-unit-upkeep-test 34/0, upkeep-test 91/0, upkeep-difficulty-per-owner-test 19/0,
    unit-resource-upkeep-test 7/0, unit-upkeep-era-scale-test 24/0, ai-upkeep-runway-test 17/0,
    ai-upkeep-wiring-test 4/0, ai-recruit-upkeep-gate-test 23/0, recruitment-no-upkeep-gate-test 37/0,
    citizen-resource-upkeep-test 124/0, building-upkeep-resources-test 48/0
  - Start jednostek: city-state-start-units-test 16/0
  - **unit-upkeep-cost-pace-test: 80 ok, 1 FAIL** (pin tekstowy "wszystkie wywołania w main.ts niosą tempo":
    `main.ts` ok. 34592/34595/34884 — linie podglądu UI sprzed zmiany, bez słowa `kosztJednostekPace`
    w wywołaniu; ten pin nie jest związany z GRACE15 i nie był zmieniony tym tematem)
  - Pozostałe `upkeep-food-audit` (wymaga argumentów CLI) i `ai-economy-measure-upkeep-onoff` (vite build) nie są
    testami bramkowymi i nie były uruchamiane w pełni.

Uwaga środowiskowa: w sandboxie brakowało `node_modules` (three, esbuild, jsdom); zainstalowano je poza repo
(katalog scratchpad) i podlinkowano do worktree. `tsc --noEmit` w wersji z `gra/package-lock.json` (typescript 5.9.3) zwraca 0 błędów (korekta: wcześniejszy
wynik 177 dotyczył sandboxowego typescript 6.0.2 i nie jest miarodajny).

## Pomiar na żywo: NIE ZMIERZONO
- Chromium / pasywny gracz na ziarnach 4242 i 778899 na poziomie maksymalnym: NIE ZMIERZONO (brak czasu w tej rundzie).
  Kryterium "gracz ma Wojownika t1, przeżywa t20, zero ataków barbarzyńców t1–15, od t16 ruch wraca" NIE jest
  potwierdzone na żywej grze. Zweryfikowane jest tylko deterministycznie (funkcje, wiring, testy).
- Prognoza t1 "Zakończ turę" (NNS-T1-I-KOSZT-ULEPSZEN-ZYWNOSC-2026-11-26): NIE ZMIERZONO w bramce UI. Deterministycznie
  utrzymanie gracza w t1 wynosi 0 (złoto, żywność, surowce) dla armii 3 jednostek przy Wysoki; oznacza to, że
  darmowe utrzymanie zmienia bilans t1 w stronę dodatnią. Czy blokada tury w t1 znika, nie sprawdzono.
- Wpływ na AI (barbarzyńcy nie atakują AI w t1–15, AI rozwija się szybciej; AIEMPTY lub miasta AI w t30): NIE ZMIERZONO.
- Aktualizacja tekstów wiki/tooltip "Barbarzyńcy": NIE SPRAWDZONO (nie wykonano przeglądu tekstów; decyzja: tylko
  jeśli tekst wprost przeczy regule, zadanie dla kolejnej rundy).
- Powód braku pomiaru na żywo w tej rundzie: środowisko ma Chrome (/usr/bin/google-chrome), ale wymagany bieg
  2 ziaren × 16+ tur na maksimum nie został wykonany w czasie rundy 2; wynik zostaje NIE ZMIERZONO.

## Zakres poza tematem
- Zakup jednostek nie zmieniony (zgodnie z decyzją).
- Okno AI 1..40 (FALA 890) nie zmienione.
- Nie zmieniano wartości innych formuł ani progów.
