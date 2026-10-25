STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-RULES-MULTIWAR-Q1
GOAL: Runda 3: przywrócić R3 (globalnie max 1 wojna epoki na epokę), zachować R1/R2/W1/W2, naprawić testy kodujące stare progi tury, zebrać bramki.
BAZA: 0244e7d7 (r2), checkout --detach.

ZMIANY/COMMIT: allowlista
- gra/data/war-rules-params.json: maxEraForcedWarsPerEra null -> 1 (R3).
- gra/src/game/war-rules-multiwar.ts: komentarze R3 zaktualizowane (wycofanie zastąpione przywróceniem); logika bez zmian (canDeclareEraForcedWar już czyta parametr; wiring w main.ts ~35265/35315 już istnieje).
- gra/tools/war-rules-multiwar-test.cjs: R3f-R3l dla limitu 1 (druga wojna Kamienia/Brązu blokowana, null = bez limitu), R3j = 1.
- gra/tools/forced-war-iron-player-target-live-test.cjs, forced-war-player-no-contact-live-test.cjs, forced-war-trojstronna-domino-live-test.cjs: fast-forward z tury 24 do tury 39 (jak już robi forced-war-player-target-live-test.cjs). Powód: R1 (delayInterCivWarsUntilTurn=40) blokuje wojnę przed turą 40; testy wymuszały wojnę w turze 25 i zakładały stary zakres. Bez osłabiania asercji.
- Commit: patrz sekcja końcowa orkiestratora (commit w worktree, bez push).

ZAŁOŻENIA:
- Z1: R3 liczony po etykiecie epoki w powodzie (R-EPOKA-KAMIEN/BRAZU/ZELAZO-WYMUSZONA-WOJNA), globalnie, nie per cywilizacja.
- Z2: zablokowana wojna epoki pozostaje pending (nie konsumowana) — kolejna próba w kolejnej turze jest także blokowana.

TESTY (wyniki z logów w scratchpad/gates):
- war-rules-multiwar-test: 50/0.
- forced-war-stone-test 38/0; bronze-test 56/0; iron-test 55/0; waves 17/0; trojstronna 23/0.
- forced-war-stone-main-guard 19/0; iron-main-guard 37/0; trojstronna-main-guard 14/0.
- forced-war-bronze-main-guard: 27/1 — CZERWONE TAKŻE NA BAZIE 00fe8dc4 (ten sam FAIL: finalizePeaceTreatyBetween). Nie naprawiane (poza zakresem).
- forced-war-bronze-new-game-reset: exit 1 (ReferenceError forcedWarWavesByPairKey) — CZERWONE TAKŻE NA BAZIE 00fe8dc4. Poza zakresem.
- forced-war-iron-era-enter-turn-save-load 20/0; player-pre-contact-gate exit 0.
- forced-war-player-target-live, iron-player-target-live (12/0 po zmianie), no-contact-live (14/0 po zmianie), domino-live: patrz wynik poniżej.
- war-allin-capital-test 95/0; ai-move-range 46/0; barbarzyncy-krazenie 249/0; barb-city-behavior 178/0.
- logic-test 213/213; ai-test 276/18 (= baza); endturn-battle-deadlock 38/0; exec 46/0.
- diplomacy-war-gates 19/0; alliance-war-obligation 14/0; ai-war-gate 24/0; forced-war-reguly-multi-turn 39/0.
- tsc --noEmit: exit 0. Vite build do katalogu tymczasowego (scratch): exit 0.
- Uwaga: forced-war-iron-player-target-live-test na 0244e7d7 (r2) też był czerwony (2 FAIL, relacja "neutralni" przy turze 24) — przyczyna: R1, nie R3.

NIE ZROBIONE (NIE_ZMIERZONO / brak):
- (b) symulacja ≥60 tur × 5 seedów na realnym silniku main.ts: NIE_ZMIERZONO. main.ts nie jest uruchamialny headless; war-allin-capital-harness jest silnikiem zastępczym bez bramek wojen. Brak liczb przed/po.
- (c) flaga OFF = hash jak baza oraz determinizm 2 przebiegów: NIE_ZMIERZONO.
- (d) czas tury ≤ ×1,15 (smoke Chromium 46 tur): NIE_ZMIERZONO.
- (e) sekcja diagnostyczna „dlaczego nikt nie wypowiada wojny graczowi": NIE_ZMIERZONO w tej rundzie.
- (f) dowód realnej walki W1 w pełnej grze: NIE_ZMIERZONO.
- (g) nowe testy garnizonów i bypassów R1/R2/R3 (klaster city-states ~main.ts:34073, joinAllyToWar, applyAllianceObligationsOnWar ~20193): NIE napisane. Kod bramek jest w main.ts (interCivWarBlockedForAi 20052 używane w 20193 i 34073; wypowiedz_wojne 35265 z R3); test nie istnieje.
- Mutacje (usunięcie W1/W2/limitu kamienia/opóźnienia) — NIE wykonane.

BLOKADY: brak blokad technicznych; pełna symulacja wymaga headless main.ts (poza zakresem tej rundy).

RUNDY: 3/5. Ostatni werdykt Final Control r2: lista napraw (a)-(h). Zrealizowane: (a), (h) częściowo, R3. Niezrealizowane: (b)-(g) jak wyżej.

NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje R3 w war-rules-params.json i testach; osobny temat na sim headless main.ts + testy (g) + mutacje.
DEPLOY/PUSH: NIE WYKONANO
