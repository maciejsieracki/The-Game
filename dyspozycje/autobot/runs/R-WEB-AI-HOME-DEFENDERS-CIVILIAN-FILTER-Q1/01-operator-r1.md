STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-HOME-DEFENDERS-CIVILIAN-FILTER-Q1
GOAL: Glowna sciezka decideAITurn (krok 4b/4b2) nie przydziela obrony domu przed barbarzyncami cywilom, jednostkom zaokretowanym (embarked), morskim (seaRaider) ani wodzowi kampanii (isGeneral). Jedna wspolna funkcja puli obroncow uzywana przez obie sciezki.
ZMIANY-COMMIT: baza origin/main 45ea4b67a (detached). Allowlista:
- gra/src/game/ai.ts: nowa eksportowana funkcja homeDefenderPool(myUnits) przed assignHomeDefenders. Glowna sciezka (homeDefenderAssignments) i planCampaignBarbarianHomeDefense wolaja ja zamiast kopii filtra. Zachowanie kampanii bez zmian.
- gra/tools/ai-home-defense-civilian-filter-test.cjs (NOWY, 8 asercji).
- gra/tools/war-allin-capital-test.cjs: jedna referencja hasha (REF_OFF.aiVsAi) zaktualizowana z be060bceec8cef33 na 20a5bc2c7abcba1b, z komentarzem. Uzasadnienie: jedyna zmiana kodu zmienia przebieg aiVsAi (cywile przy barbarzyncach). Pozostale 3 hashe i 6b0/6c bez zmian.
- dyspozycje/autobot/runs/R-WEB-AI-HOME-DEFENDERS-CIVILIAN-FILTER-Q1/** (raport, gate-*.txt, ai-test-after.log).
Poza zakresem: brak dalszego refaktoru; nie dotknieto gra-robocza, WERSJE.md, rust-port, src-tauri, battle.
SHA: commit po tym pliku (podany w odpowiedzi orkiestratora).
TESTY:
- PRZED (origin/main, ai.ts bazowy): ai-home-defense-civilian-filter-test T1-T5 FAIL (def1 dostaje marsz na stolice ec1 zamiast obrony; przydzial trafia do robotnika, embarked, seaRaider, wodza lub osadnika). T6 (kontrola) PASS, T8 (determinizm) PASS. Pierwotna T7 (robotnik nie zbliza sie do barbarzyncy) FAIL takze przed poprawka, bo robotnik sam idzie ku barbarzyncy niezaleznie od przydzialu. Asercja zmieniona na "brak ataku i brak marszu na miasto wroga"; ta wersja PASS takze przed poprawka, wiec jest straznikiem regresji, nie dowodem RED.
- PO: ai-home-defense-civilian-filter-test 8/8 PASS (gate-new-test.txt EXIT=0).
- Mutacja (usuniety warunek isGeneral z homeDefenderPool): nowy test 1 FAIL, war-allin-general-path-barb-defense 22/2 FAIL. Testy lapia regresje; mutacja przywrocona.
- Regresje PRZED vs PO (identyczne):
  war-allin-general-path-barb-defense 24/0 -> 24/0; war-allin-keep-barb-defense 8/0 -> 8/0; ai-home-defense-vs-barbarians 46/0 -> 46/0; ai-war-defend-home 30/0 -> 30/0; ai-general-war-campaign 51/0 -> 51/0; army-concentration 56/0 -> 56/0; ai-army-scattered-merge 33/0 -> 33/0; ai-move-full-range 20/0 -> 20/0; war-allin-capital 98/0 -> 98/0 (po aktualizacji referencji hasha; bez niej 6b aiVsAi FAIL).
- ai-test: PRZED 274 passed / 20 failed; PO 274 passed / 20 failed; zestaw FAIL identyczny. Baza z dispatchu 276/18 jest nieaktualna; na origin/main zmierzono 274/20.
- tsc --noEmit: EXIT=0.
- Czas decyzji: PERF campaign-barb (PO) median 3.298 ms, p10 2.177, p90 8.453, n=60. Pomiar przed poprawka: NIE_ZMIERZONO. Filtr to jeden przejscie O(n) po myUnits; nie zmienia zlozonosci decideAITurn.
- Bez npm run build/dev i bez Chromium (zmiana logiczna, bez wizualnej).
BLOKADY: brak.
NOTATKA: nie zbadano przypadku, gdy zaden wojskowy obronca nie jest dostepny; zagrozenie zostaje wtedy bez przydzialu, jak dotad.
DUG: wspolna funkcja zostala wyeksportowana zamiast duplikowania. Dalszy refaktor (np. kworum groupSize) poza minimum, nie wykonany.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja RED/GREEN i mutacji), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
