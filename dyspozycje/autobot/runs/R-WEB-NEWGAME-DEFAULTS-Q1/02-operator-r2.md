STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NEWGAME-DEFAULTS-Q1
GOAL: Nowe domyślne kreatora (tabela właściciela, CZĘŚĆ 2) z testami zgodnymi z nowymi wartościami; bramki bazowe zmierzone i zacommitowane.
ZMIANY/COMMIT: kod Operatora R1 9c3d921db (bez zmian w src). R2: b07859a16 — gra/tools/newgame-defaults-test.cjs (przepisany: harness esbuild, świeży profil, params startu, prefs nie nadpisane, reset), gra/tools/battle-mode-choice-labels-test.cjs l.53-66, gra/tools/newgame-settings-layout-reposition-test.cjs l.134, logi gate-*.txt i zrzuty evidence/ regenerowane. Commit raportu: SHA w historii brancha (ten plik).

ODPOWIEDZI NA ZARZUTY:
1. battle-mode-choice-labels l.53/62 — PRZYJMUJĘ: start „Bitwa ręczna i automatyczna" (battleAlwaysManual=true, newGameFlow.ts:250), cykl od ręcznej; b07859a16; gate PASS.
2. newgame-settings-layout-reposition l.134 — PRZYJMUJĘ: oczekiwanie = (wybrana etykieta === „ręczna i automatyczna"); b07859a16; gate PASS.
3. Bramki nie domknięte / brak gate-*.txt — PRZYJMUJĘ: zmierzone w R2: nav 270/0; battle-labels PASS; layout PASS; sett-grid 6/8 (ten sam wynik na 5ab3d58e2 wg Evaluatora — NIE_ZMIERZONO na bazie w tym runie); diplo-truce-r1 30/0; war-era-counter 82/0; diplomacy 148/0; adv-tooltip 31/0; battle-save-reload PASS; barbarians 213/0; miasta-panstwa-wylaczone 55/0 (PRE = git archive 5ab3d58e2). land-sea-ratio: EXIT=124 (timeout) — NIE_ZMIERZONO; test sprawdza defaultLandFractionForTyp (land-sea-ratio-test.cjs:38), którego R1 nie zmienił (newGameMapDefaults.ts:470 zmienia tylko defaultLandFractionPercentForTyp).
4. Słaby newgame-defaults-test — PRZYJMUJĘ: 60 pass / 0 fail (gate-newgame-defaults.txt, EXIT=0): wszystkie wartości DOM z tabeli, okno Zaawansowane (17 wierszy), brak suwaka dla Ziemi w siatce i oknie, window.__params dla startu (landFractionPercent 30, dealsEndTurnGate, playerEpochWarEnabled, advanced.battleAlwaysManual/ruchSwiataPace/buildingCostPace/wzrostLudnosciPace/kosztJednostekPace/cityStateDifficultyOverride/barbariansLevel/victoryMode/cityLimitBase/landFractionCustom), prefs zapisane i nienadpisane po przeładowaniu, reset (usunięcie klucza civ-new-game-prefs-v1) = domyślne. Luźny assert „Normalny" zastąpiony wartościami dokładnymi w params.
5. Błędny baseline ruch-swiata-tempo („32/3") — PRZYJMUJĘ: pomiar R2 = 33 zaliczone / 2 niezaliczone (gate-ruch-swiata-tempo.txt, EXIT=1); 2 FAIL to main.ts regex (linie 33-34 logu: fallback `player.ruchSwiataPace ?? 'krotki'` i serializacja), istniały też na bazie wg Evaluatora — pre-existing, nie wina R1.
6. main.ts poza allowlistą — ZAŁOŻENIE (nie zmieniono main.ts): main.ts:26059 i :26747 mają `battleAlwaysManual: false` oraz fallbacki `?? 'krotki'/'niski'/'wysoki'` (np. :4080, :8337, :39773). Ścieżka kreatora zawsze przekazuje `advanced` przez onStart, więc fallbacki nie są osiągane w przepływie kreatora (dowód: __params w newgame-defaults-test). Ścieżka startNewGame (:26050) poza kreatorem — do decyzji właściciela w osobnym temacie.

TESTY: tsc --noEmit EXIT=0 (gate-tsc.txt). Pozostałe liczby jak w pkt 3. Logi: dyspozycje/autobot/runs/R-WEB-NEWGAME-DEFAULTS-Q1/gate-*.txt (gate-infra-vite-oom.txt z R1 zachowany jako historia, zastąpiony przez logi R2).
BLOKADY: brak. Nieotwarte: land-sea-ratio (timeout), sett-grid 6/8 pre-existing.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (niezależny) -> Final Control -> integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
