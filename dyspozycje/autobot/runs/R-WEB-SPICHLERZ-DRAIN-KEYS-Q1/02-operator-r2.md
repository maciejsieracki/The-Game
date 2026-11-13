STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-SPICHLERZ-DRAIN-KEYS-Q1
GOAL: Zużycie Spichlerza (Ceramika I, Ceramika II, Sól II) czytane z econ-params.json wg trudności; wartości 25/25/25 bez zmian; zachowanie gry identyczne.
ZMIANY/COMMIT: kod+testy+logi bramek `cc8b6a261` (na `68e07ccb2`, runda 1 `1c7c17e92`, raport r1 `68e07ccb2`). Pliki: `gra/src/game/turn-economy.ts` (tickEmpireResourcePipeline: `spichlerzDrainParams` wymagany, bez default; `resolveOwnerActiveLabels`/`resolveOwnerZlotoAccess` wymagane pozycyjnie), `gra/tools/spichlerz-drain-pipeline-test.cjs` (NOWY), `gates-head/`, `gates-base/`. Raport r2: ten plik (commit osobny).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Test przez `advanceCityEconomy` (realna ścieżka tick → drain): część B `spichlerz-drain-pipeline-test.cjs`, 21/0. Mutacja M1 (okablowanie w advanceCityEconomy ignoruje JSON: `loadSpichlerzDrainParams(undefined, difficulty)`) → 11 FAIL (np. "Spichlerz I (normal) zużywa 40: got 75"). Mutacja M2 (zamiana I↔II w `spichlerzCeramikaDrainAmount`) → 14 FAIL w pipeline, 10 FAIL w keys-test. Obie przywrócone, `git diff` czysty względem commitu.
2. PRZYJMUJĘ CZĘŚCIOWO / ODRZUCAM REST. Usunięty default w `tickEmpireResourcePipeline` (turn-economy.ts ~1691-1713) — ACCEPT. `paySpichlerzDrainForCity` (building-resource-gate.ts:423) zostawiam z defaultem = `SPICHLERZ_DRAIN_DEFAULT_PARAMS` (ta sama stała fallback 25, nie osobna wartość). DOWÓD ODRZUCENIA: tymczasowe usunięcie defaultu → `tsc --noEmit`: `src/ui/cityPanel.ts(1281,28): error TS2554: Expected 5 arguments, but got 4` oraz `building-resource-gate.ts(634,7)` (opcjonalne `drainParams` w resolveOwnedBuildingInactiveStatus). cityPanel.ts jest poza allowlistą → nie zmieniano (patrz 4). Plik przywrócony.
3. PRZYJMUJĘ. Golden zmierzony na bazie: ten sam, niezmieniony plik testu uruchomiony na `4d1916f2c` (git archive do scratch) i na HEAD: `GOLDEN-DIGEST sha256=9fe8c371221e194ae0590d0068400813a93e93fb5350984797c97e8ddcd555a2` (126 scenariuszy: brak/I/II/I+II × 24/25/26 × sól 24/25/26, dwa miasta I pula 49/50/51, II sól 24/25/26, 3 trudności) — identyczny. Czysty probe: `out-base.json` == `out-head.json` (cmp). ZAŁOŻENIE pozostaje: miasto z I+II płaci jedną wypłatę ceramiki (klucz II); przy rozbieżnych kluczach płaci wartość II.
4. PRZYJMUJĘ jako warunek, NIE zmieniam kodu (plik poza allowlistą). `gra/src/ui/cityPanel.ts:1281` i `:9278` wołają drain bez params → podgląd HUD na fallback 25. Proponowany wpis do rejestru (orkiestrator): "R-WEB-SPICHLERZ-HUD-PARAMS-Q1: cityPanel.ts:1281 i :9278 przekazują loadSpichlerzDrainParams(econParams, difficulty); potem usunąć default z paySpichlerzDrainForCity i opcjonalność drainParams. Blokuje strojenie JSON." Test `spichlerz-panel-food-parity-test.cjs:144` także wywołuje bez params (działa na fallbacku).

TESTY (HEAD cc8b6a261; tsc EXIT=0):
- spichlerz-drain-keys-test 44/0; spichlerz-drain-pipeline-test 21/0 (base: golden-only 4/0, digest identyczny).
- Bramki base 4d1916f2c vs HEAD: wszystkie podsumowania identyczne (różnią się tylko ścieżki w stack trace i czasy mapGen; nowe testy wg oczekiwania).
- Zielone: auto-wyzywienie 17/0, building-resource-visibility 15/0, building-stock-visibility 7/0, converter-era 87/0, converters 49/0, diplomacy 148/0, empire-food-b5 34/0, empire-skarbiec 11/0, magazyn-era 58/0, owned-building-detail-side 17/0, owned-building-inactive 4/0, owner-economy 20/0, r-wzrost 59/0, spichlerz-cap 12/0, panel-food-parity 11/0, unit-owner-emblem-ring 15/0, war-era 82/0, wonder-yields 11/0.
- Czerwone jak na bazie: deposit-building-gate 1 F, hex-plony 4 F, mennica 7 F, resource-usage 2 F, spichlerz-deficyt 4 F, spichlerz-widocznosc 8 F, spichlerz-wzrost 7 F; EXIT=1 bez podsumowania: ai-major-economy, cities-buildings-production-owner-contract, pr141-matrix-only, szczescie-przebudowa-skali.
- Logi: 34 pliki w każdym gates-*, dokładnie jedna linia `EXIT=` na końcu.

BLOKADY: cityPanel.ts (punkt 4) — osobny temat w rejestrze wymagany przed Final Control. Nie rozstrzygałem sam.
RUNDY: 3/5
NASTĘPNY KROK: Evaluator (niezależny) na cc8b6a261, potem Final Control; orkiestrator rejestruje R-WEB-SPICHLERZ-HUD-PARAMS-Q1.
DEPLOY/PUSH: NIE WYKONANO
