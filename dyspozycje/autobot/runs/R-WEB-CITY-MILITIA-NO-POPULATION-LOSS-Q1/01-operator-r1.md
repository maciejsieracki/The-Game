STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-NO-POPULATION-LOSS-Q1
GOAL: Straty Milicji w bitwie nie zmieniaja ludnosci miasta; jedyna konsekwencja = odnowa 5 tur (REGEN-COOLDOWN bez zmian).

## Pomiar (zrodla spadku ludnosci od Milicji)
- Jedyne zrodlo: `applyMilitiaPopulationLoss` (gra/src/game/siegeDefenders.ts, dawne ~343-356: `Math.max(1, before - fallen)`), wolane z jednego miejsca: gra/src/main.ts (`applyMapBattleOutcome`, po `applyPostBattleMap`, dawne ~31502-31503). Obsluguje WSZYSTKIE sciezki (taktyczna, Pomin/Auto, oblezenie/szturm; gracz, AI, panstwa-miasta, barbarzyncy), bo wszystkie przechodza przez ten jeden punkt.
- `siege.ts`: brak redukcji `population` (grep `population` -> tylko opis/derivacja Milicji). `post-battle-map.ts`: brak `population`.
- Inne spadki ludnosci w main.ts (zamierzone, NIE ruszane, niezwiazane z Milicja): koszt ludnosci akcji (main.ts:14858, 38865), migracja po rewolcie (36116 `city.population -= 1`). NIE_ZMIERZONO: zwykle straty ludnosci przy zdobyciu miasta/glod po oblezeniu poza powyzszymi — grep nie znalazl innych `.population -=` w sciezce bitwy.

## Zmiany
- siegeDefenders.ts: usunieta `applyMilitiaPopulationLoss` (komentarz-zastepnik); `fallenMilitiaIds`/`militiaIdsDestroyedForCooldown`/cooldown zachowane (liczba milicjantow = ludnosc z chwili ataku, M1-M3 bez zmian).
- main.ts: usuniete wywolanie i import; komentarz zaktualizowany.
- PROJEKT-GRY-master.md §9c: jedno zdanie "straty Milicji nie zmniejszaja ludnosci".
- Nowy test gra/tools/city-militia-no-population-loss-test.cjs: pop 10 cala Milicja ginie -> 10 + odnowa 15; czesciowe -> 10; Pomin/Auto (loss 0.5/0.97/1.0, prawdziwy applyLossPctToRoster) -> 10, odnowa 25; realny obronca; inwariant pop 1..60 x straty 0..100%; statyczna kontrola main.ts; 3 mutacje (wszystkie zlapane).
- Zaktualizowane testy kodujace stary kontrakt (z komentarzem): city-militia-no-defenders-test.cjs (M4: asercje 10->6/min.1 zastapione asercja braku funkcji; mutacja pop-floor-zero usunieta bo bez celu), city-militia-regen-cooldown-test.cjs (population 8 zamiast 1/5; usuniete wywolania; pozostale asercje odnowy bez zmian).
- Brak tekstow o stratach ludnosci w siegeMapPanel.ts/cityAttackChoice.ts (nie dotykane). Zero zmian w gra-robocza/, WERSJE.md, rust-port/.

## TESTY
- Nowy test: BASE 20 PASS, 3/3 mutacje zlapane, EXIT=0 (gate-new-test.txt). RED na bazie origin/main (c1581619f): 2 FAIL (funkcja istnieje, main.ts ja wola) + EXIT=1 (MILITIA_TEST_ROOT=baza).
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- PO, EXIT=0: city-militia-no-defenders, city-militia-regen-cooldown, militia-garrison-contract, militia-garrison-router-siege, siege-defenders, city-siege-wall-rules, map-siege, oblezenie, oblezenie-remis-endsiege, oblezenie-siege-lifted-po-bitwie, pre-battle-defender-retreat, siege-ai, garnizon-exit, retreat-garnizon-fortyfikacja, ai-siege-requires-war.
- budynek-garnizon-test EXIT=1: pada na kotwicy `[AI1] ai.ts infraOrder` — plik ai.ts nietkniety w tym temacie, awaria niezalezna (przedistniejaca); porownanie PRZED NIE_ZMIERZONO (baza w scratchpadzie bez node_modules).
- wall-defenders-bonus-range-test: NIE_ZMIERZONO — test uruchamia `vite build` (zakaz build w gra/), timeout 120 s.
- Chromium: NIE uruchamiano; weryfikacja na prawdziwych funkcjach + statyczna kontrola main.ts. Sciezka main.ts nie jest bundlowalna w node.

## Stan zastany
Utracona ludnosc w istniejacych zapisach nie do odzyskania (brak danych sprzed bitwy) — odnotowane, bez migracji.

## BLOKADY
Brak.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja w Chromium/harnessie bitwy niewykonana, `wall-defenders-bonus-range-test` do oceny).
DEPLOY/PUSH: NIE WYKONANO
