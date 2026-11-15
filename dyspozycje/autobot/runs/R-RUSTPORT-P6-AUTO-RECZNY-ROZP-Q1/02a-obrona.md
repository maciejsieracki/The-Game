STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-AUTO-RECZNY-ROZP-Q1
GOAL: Odpowiedź Operatora na zarzuty Evaluatora r1 (02-evaluator.md, SHA 8c9f626d3) wobec 01-rozpoznanie.md (SHA 28a4c0b98).
ZMIANY/COMMIT: tylko dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-RECZNY-ROZP-Q1/01-rozpoznanie.md (rewizja r2) i ten plik. Zero zmian kodu. Baza bez zmian: origin/rust-port/parity-v2 = f7baa3848.
TESTY: NIE URUCHAMIANO (rozpoznanie tekstowe). Weryfikacja: git show 07d2fbd72:gra/src/battle/battleScene.ts (kopia poza repo), git grep w 07d2fbd72 i f7baa3848.
BLOKADY: brak blokad przy obronie; niepewności w 01-rozpoznanie.md sekcja 5 (NIE_ZMIERZONO).
RUNDY: 2/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Evaluator r2 na 01-rozpoznanie.md r2 i tym pliku, potem FC.
DEPLOY/PUSH: NIE WYKONANO

# Odpowiedzi na zarzuty

## Zarzut 1: pominięte wołające _performPlayerOrder (18082, 18122, 18608) — PRZYJMUJĘ
Dowód: 18082 i 18122 leżą w `_executeGroupDoctrineStep` (17966); ustawiają `playerOrder = move` i wołają `_performPlayerOrder` rekurencyjnie. 18608 leży w `_executeUnitsImmediate` (18578), pętli `runNext` wołanej z kolejki SPACJA (17424–17433 → `_executeQueuedOrders` 3603–3610).
Poprawka: 01 r2, sekcja 1 (wiersz „Pozostałe wołające”), sekcja 2 (producenci wejść: doktryna i kolejka), sekcja 3 (zależność od #112 jako rekurencja), sekcja 4 (T2 obejmuje producenta kolejki SPACJA).
Dodatek własny: w r1 brakowało wariantu `attack{targetId}` w modelu `playerOrder` (`battleScene.ts:2029`, ustawiany w 18641). Dodane w sekcji 2 i 1.

## Zarzut 2: logika utraty dowódcy i isArmyCommander w Rust to BRAK — PRZYJMUJĘ (ocena zmieniona na CZĘŚCIOWE/ROZBIEŻNE)
Dowód: `rust-port/engine/src/domain/army_leadership.rs:26` (pole `is_army_commander` w `ArmyLeaderCombatant`), `:31` (`routed`), `:128` (pominięcie dowódcy w sumie), `:156` (filtr `is_army_commander && !dead && !fading_out && !routed`). Predykat jest identyczny z pinem (10010, 17352).
Nowe ustalenie (wynika z zarzutu): `siege_tactics_loop.rs:350` w `ratio()` hardkoduje `is_army_commander: false` dla każdej jednostki. Pin przekazuje realne jednostki z flagami (`battleScene.ts` 9988–9990, `_armyMoraleRatio` → `armyMoraleRatioWithoutCommander(arr)`). W Rust dowódca liczy się więc jako zwykła jednostka w stosunku morale. To rozbieżność wyniku, nie tylko brak wejścia.
Poprawka: 01 r2, sekcja 1 (wiersz utraty dowódcy: „predykat ma odpowiednik”), sekcja 3 (wejście `isArmyCommander` do `ProdUnit`, `:350`).

## Zarzut 3: manualControlAllowed — NIE_ZMIERZONO → PRZYJMUJĘ (rozstrzygnięte grepem)
Dowód: `git grep -n manualControlAllowed 07d2fbd72 -- gra/src`: `main.ts:33581, 33635, 34312, 34399, 36988, 37043` = `roster.some(u => u.isGeneral === true)`. Źródłem gate jest `isGeneral`, nie `isArmyCommander`. `preBattle.ts:905` ma domyślne `!== false` (tylko podgląd, sterowanie w BattleScene, 853).
Start: `battleScene.ts:3570–3571` sprawdza `isArmyCommander && !dead && !routed` (bez `!fadingOut`); przełącznik 17352 i utrata 10010 mają `!fadingOut`. Różnica zapisana w 01 r2, sekcja 1 i 2.
Poprawka: 01 r2, sekcja 1 (wiersz gate i wiersz wyzwalaczy), sekcja 2 (wejście gate i predykaty).

## Zarzut 4: wiersz `_manualMode = true` błędnie ROZBIEŻNE — PRZYJMUJĘ
Dowód: konstruktor `battleScene.ts:2286` = true, ale `_startBattle` (3558) linia 3572 nadpisuje to zawsze. Reset `_resetBattleRuntimeState` (10533) linia 10539 = true. Rust: `git grep "manual_mode *="` w `f7baa3848:rust-port`: przypisania tylko w testach (`tests/p6_siege_tactics_autobatch.rs:322, 587`). Produkcja nigdy nie ustawia flagi.
Ocena: wartość domyślna false sama nie jest rozbieżnością. Prawdziwa rozbieżność to brak przypisania startowego (3572) i resetu (10539). Wiersz w 01 r2 rozbity na: start/reset (BRAK) i wartość domyślną (bez oceny jako rozbieżność).
Poprawka: 01 r2, sekcja 1, pierwszy wiersz.

## Zarzut 5: pominięty fragment FF (3695–3711), wołający _disableManualIfCommanderLost (9805, 9931) — PRZYJMUJĘ
Dowód: `battleScene.ts:3703` `_ffPendingAuto = _manualMode && busy`; `3704` `if (!_ffPendingAuto) _ffEnterAuto()`; `3709–3710` `_ffEnterAuto`: `if (_manualMode) _toggleManualMode()`, potem kickoff. Komentarz w pinie (3695–3702) potwierdza ryzyko: jednostka z `acted=false` zaplanowana drugi raz, stąd FF dokańcza rozkaz. Dodatkowo 9425: `_ffPendingAuto && !busy` → `_ffEnterAuto`. Wołający 9805 i 9931 z warunkiem `!_autoBatchPlanning` i `_schedule(0)` (10007–10016; warunek w 10008).
Poprawka: 01 r2, sekcja 1 (wiersze wyzwalaczy i FF), sekcja 2 (wejścia `_ffPendingAuto`), sekcja 4 (T1 obejmuje FF i utratę dowódcy).

## Zarzut 6: propozycja tematu (allowlista, zależność #112, szacunek rund) — PRZYJMUJĘ
Allowlista: dodano `siege_tactics_autobatch.rs` (halt 765, blokady 351/403/654/733), `army_leadership.rs` i `ProdUnit` (`siege_tactics_loop.rs:350`). Rozbicie na T1/T2/T3 w 01 r2 sekcja 4.
Zależność #112: uznana za twardą dla gałęzi `none` przy doktrynie (`_performPlayerOrder` 18288–18296) i dla rekurencji 18082/18122. Zmiana z „najlepiej przed startem” na „twarda”.
Szacunek: r1 „3–4 rundy” uznany za zaniżony. Rewizja: T1 3–5, T2 4–5, T3 3–5 rund, każdy temat w limicie 5 rund.
„Wektory z pinu” bez generatora: PRZYJMUJĘ jako lukę otwartą, nie zamkniętą. Generator wektorów dla tego obszaru NIE_ZMIERZONO (01 r2, sekcja 4 i 5). Nie wskazuję generatora bez sprawdzenia, bo nie znalazłem go w `rust-port` na f7baa3848 (sprawdzono tylko nazwy plików z `vector`/`gen`; testy `economy_city_vectors*` to wzorzec, nie generator tego obszaru).

## Zarzut 7: attackMove (18355–18434) i _performSiegeManualOrder — NIE_ZMIERZONO / tylko nagłówek → PRZYJMUJĘ
Dowód przeczytany w tej rewizji: `attackMove` 18355–18372 (`_attackMovePath`, sortowanie `_priorityScore` i manhattan, atak gdy `_canStrikeTargetFrom`); `_performSiegeManualOrder` 18435–18470 (warunek wejścia, taran/wieża, strzelec przy `none`, `onWallWalkway`, wspinaczka, podejście przy `_siegeApproachRestricted`). Opis zachowania wpisany w 01 r2, sekcja 1.
Nadal NIE_ZMIERZONO (wypisane w 01 r2, sekcja 5): ciało `_attackMovePath` i `_canStrikeTargetFrom`, pełne gałęzie `_siegeRamTowerStep` i wspinaczki, gałąź `attack{targetId}` w ciele `_performPlayerOrder`, wołający `_executeUnitsImmediate` (18649, 18677, 18699), ciało `_kickoffBattleTurn` (3615).

## Uwaga proceduralna (z zarzutu Evaluatora)
Bramki cargo (fmt, clippy, test) nie były uruchamiane. Dispatch to rozpoznanie tylko do odczytu, bez zmian kodu, bez testu do uruchomienia. Przyjmuję to bez zmian.

# Podsumowanie zmian
- Przyjęte: 1, 2 (ocena zmieniona), 3, 4, 5, 6, 7. Odrzucone: brak.
- Uzupełnienie własne: wariant `attack{targetId}`, rozbicie `_manualMode` na start/reset/wartość domyślną, dwa wołające `_disableManualIfCommanderLost` z warunkami.
- Pliki zmienione: `01-rozpoznanie.md` (rewizja r2), `02a-obrona.md` (ten plik). Zero zmian w `gra/`, `origin/main`, `rust-port/`.
