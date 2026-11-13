STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-STADNINA-FORT-TERRITORY-SCAN-Q1
GOAL: skan kandydatow AI/automatu uzywa tej samej reguly terytorium co budowa gracza (miasto + forty/posterunki) dla Stadniny.

## Ustalenia (pomiar PRZED, prawdziwe funkcje)
- Hipoteza potwierdzona, ale miejsce inne niz w dispatchu: `ai.ts` ~2589 to dzis kod cudow. AI buduje ulepszenia przez `planCityImprovements` (ai.ts) -> `pickAutoImprovements` (`gra/src/game/auto-improvements.ts`, kandydaci per miasto: `hexKeysWithinRadius(city, cityTerritoryRadius+1)`, ok. :1427). Ten sam picker zasila automat gracza.
- Budowa gracza (`improvement-build.ts`, `buildCandidateHexKeys`) uznaje tez koła fortow/posterunkow. Picker nie.
- Pomiar (tools/ai-stadnina-fort-territory-test.cjs, miasto (0,0), fort/posterunek (10,0), zloza konia (10,1) nakladka + (11,-1) stary zapis `zloze:'konie'`): legalne dla gracza 2, pickAutoImprovements PRZED 0, decideAITurn PRZED 0 (fort i posterunek). Zloze w pierscieniu miasta (2,0): widoczne przed i po.

## Zmiany
- `gra/src/game/auto-improvements.ts`: import `hexHasHorseDeposit`; w petli per miasto zbior `fortHorseExtra` = heksy ze zlozem konia w kole WLASNEGO fortu/posterunku (ownerId), poza pierscieniem miasta, przypisane do najblizszego wlasnego miasta (remis: mniejsze id); dodane do `candidateHexes` (NIE do `radiusHexes` - liczniki bez zmian); `hexAllowsKey` zwraca dla nich true wylacznie dla `stadnina`. Zasada zywnosc-tylko-przy-obywatelach i balans pozostalych ulepszen bez zmian (test kontrolny: 0 innych pickow w kole fortu).
- NOWY test `gra/tools/ai-stadnina-fort-territory-test.cjs` (11 asercji).
- ai.ts NIE zmieniony.

## Testy
- RED (PRE = origin/main src): 7 OK / 4 FAIL. GREEN (POST): 11 OK / 0 FAIL.
- Mutacja (warunek `hexHasHorseDeposit` -> pominiecie): 7 OK / 4 FAIL (czerwony).
- Regresje POST, wszystkie EXIT=0: stadnina-hex-candidates, stadnina-konie-stare-zapisy, stadnina-las, stadnina-kon-koszt, ai-improvements, ai-food-only-worked-hexes, auto-fort-claim, auto-fort-diag, fort-outpost-hard-territory, fort-outpost-placement-rules.
- tsc --noEmit: EXIT=0.
- Regresje PRE na origin/main: NIE_ZMIERZONO (nie uruchamiano osobno; POST zielone).
- Symulacja AI przed/po 3 ziarna pelnej gry (liczba Stadnin): NIE_ZMIERZONO; zastapiona deterministycznym scenariuszem (PRZED 0 -> PO 2 stadniny przy zlozach tylko w kole fortu).

## Uwagi
- Stadnina w AI wymaga deficytu `kon` (demandDriven) lub profilu bez demandDriven; scenariusz testowy uzywa deficytu `kon`.
- Zmiana dotyczy tez automatu gracza (wspolny picker) - tylko dla stadniny, zgodnie z legalnoscia budowy gracza.
- node_modules usuniete, bundle poza repo.

BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
