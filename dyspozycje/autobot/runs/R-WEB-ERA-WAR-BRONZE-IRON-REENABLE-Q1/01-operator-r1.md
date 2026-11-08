STATUS: BLOCK (techniczny: live w przeglądarce nie dobiegły końca w limicie 590 s na wywołanie)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-BRONZE-IRON-REENABLE-Q1
GOAL: wojna epoki Brązu i Żelaza wybucha jak Kamień; flaga enabledForcedWarEras = [stone,bronze,iron]; testy bez SKIP; niezmiennik 3 epok.
ZMIANY/COMMIT: fde3aca30 (kod+testy; baza origin/main a66a8480c). Allowlista: gra/data/war-rules-params.json, gra/tools/{forced-war-bronze-main-guard-test, forced-war-bronze-new-game-reset-test, forced-war-iron-main-guard-test, forced-war-player-no-contact-live-test, forced-war-player-target-live-test, war-epoch-player-first-main-guard-test, war-era-counter-test, war-rules-multiwar-test}.cjs, NOWY gra/tools/era-war-all-eras-test.cjs. Zero zmian src/ (main.ts, war-rules-multiwar.ts, forced-war-common.ts, diplomacy-ai-forced-peace.ts nietknięte: blokady były tylko w testach i flagach). Brak zmian gra-robocza, WERSJE.md, rust-port, render.
TESTY:
- logic-test 213/213 OK.
- ai-test 274 pass / 20 fail: identyczna lista 20 FAIL jak baza (brak regresji).
- tsc --noEmit: exit 0.
- war-rules-multiwar-test 57/0; war-era-counter-test 37/0 + B 16/16; war-epoch-player-first-test B 16/16.
- war-epoch-player-first-main-guard-test 34/0 (baza failowała: stara bramka siatki newGameFlow).
- forced-war-iron-main-guard-test 35/0 (baza failowała: okno regex).
- forced-war-bronze-main-guard-test 22/0 (baza failowała: stara bramka sąsiedztwa).
- forced-war-bronze-new-game-reset-test 40/0 (baza: ReferenceError, brak rejestrów forcedEraPeaceUntilNextEraByPairKey i forcedWarWavesByPairKey w liście).
- forced-war-iron-era-enter-turn-save-load-test, forced-war-stone-test, forced-war-stone-main-guard-test, forced-war-trojstronna-test, forced-war-trojstronna-main-guard-test, forced-war-waves-test, forced-war-reguly-multi-turn-simulation-test, forced-war-relation-gate-test, forced-war-player-pre-contact-gate-test, forced-war-bronze-test, forced-war-iron-test, war-rules-multiwar-main-guard-test: wszystkie exit 0.
- NOWY era-war-all-eras-test: 10/0 (Kamień/Brąz/Żelazo po 2 wypowiedzenia w turach 40..60; przy ["stone"] Brąz=0, Żelazo=0).
- git diff --check: OK.
- NIE ZROBIONE: forced-war-player-target-live-test, forced-war-player-no-contact-live-test, forced-war-iron-player-target-live-test (przeglądarka). Player-target: build vite ~57 s plus fast-forward do tury 39 przekroczył 590 s (przerwany, błąd "Target closed"). Nie uruchamiano w tle (zakaz). Kryterium 2 (wybuch w realnej grze) NIEZWERYFIKOWANE.
BLOKADY: (1) live w przeglądarce ponad limit wywołania; (2) testy live same budują vite do gra/dist-* (usuwane po teście) -- sprzeczne z zakazem build w gra/ z dispatchu, do decyzji orkiestratora; (3) brak wykrytej innej blokady w kodzie poza bramkami tekstowymi wymienionymi wyżej.
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 albo rozbicie live na kroki (<590 s) lub uruchomienie poza operatorem; Evaluator ma ocenić, czy niezmiennik E2 + testy tekstowe wystarczają do kroku 2.
DEPLOY/PUSH: NIE WYKONANO
