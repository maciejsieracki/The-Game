STATUS: BLOCK (techniczny: kryterium 4 - żywy test Chromium wojny epoki - nieosiągnięte w tej rundzie)
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-PEACE-RULES-R8R9-Q1
GOAL: R8 - wojna epoki blokowana przy Relacji >= 100 (relationScore); R9 - usunięty automatyczny koniec wojen wymuszonych (czas i 2 miasta), koniec wyłącznie pokojem.
BAZA: origin/web/integration-20261030 = 2d3f49d0d (worktree detached, branch operator/R-WEB-PEACE-RULES-R8R9-Q1).

ZMIANY/COMMIT: SHA: patrz commit na branchu operator/R-WEB-PEACE-RULES-R8R9-Q1 (nie wypchnięty).
- R8: gra/src/game/forced-war-common.ts - FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD=100, isForcedWarRelationBlocked, opt pairRelationScore, wewnętrzny pairBlocked używany w gracza-pierwszego, DP 1v1, fallbacku i dołączaniu.
- R8: gra/src/main.ts isForcedWarPairBlocked (+ linia 'isForcedWarRelationBlocked(pairRelationOfR8(a, b))'), opts pairRelationScore.
- R9: gra/src/main.ts - usunięte maybeResolve{Bronze,Stone,Iron}ForcedWarOnCityCapture (definicje ~31452-31639 i 4 wywołania), resolveForcedWarDurationLimits (definicja + wywołanie w ~35458), importy shouldEnd*.
- R9: gra/src/game/forced-war-{bronze,stone,iron}.ts - usunięte shouldEnd*ForcedWarByCityCount / ByDuration (stałe MAX_CZAS zostają).
- Testy zmienione jawnie (auto-koniec -> brak auto-końca): forced-war-bronze-test.cjs T3/Część C, forced-war-stone-test.cjs (sekcje Część C i 2 miasta), forced-war-iron-test.cjs (2 miasta, 20 tur), forced-war-reguly-multi-turn-simulation-test.cjs (K6, K7, K8, K9 teksty), forced-war-{bronze,stone,iron,trojstronna}-main-guard-test.cjs (hooki -> negatywna asercja R9; regex isForcedWarPairBlocked rozszerzony o R8), miasto-zdobycie-raport-test.cjs (kotwica końca lejka).
- Nowy: gra/tools/forced-war-relation-gate-test.cjs (R8, 14 asercji).
- Poza zakresem (nie zmieniano): regularna wojna AI↔AI R-AI-WOJNY-ZWYKLE-CAP (maybeResolveRegularWarOnCityCapture) - pomija pary wymuszone, więc nie kończy wojny wymuszonej.

TESTY (baza -> po zmianach):
- tsc --noEmit: PASS.
- war-era-counter 82/0 -> 82/0; war-rules-multiwar 57/0 -> 57/0; multiwar-main-guard 21/0 -> 21/0; diplo-war-peace profile-unit 198 -> 198, gate 11 -> 11, main-guard 28 -> 28, sim 22 -> 22, d7 8 -> 8; diplo-tick-war-brake 51 / unit 69 -> bez zmian; diplomacy 148 -> 148; peace-lock 9 -> 9; trojstronna-test 23 -> 23; load-game-blockers 15/0.
- forced-war-bronze-test 56/0 -> 48/0 (usunięte asercje auto-końca); stone-test 38/0 -> 31/0; iron-test 58/0 -> 54/0; reguly-sim -> 48/0; miasto-zdobycie-raport 117/0.
- Main-guard: bronze 28/0, stone 19/0 -> 16/0 (3 asercje tylko o hakach usunięte), iron 37/0 -> 36/0, trojstronna 14/0.
- Znane czerwone w bazie, bez zmian: forced-war-waves 16/1; forced-war-bronze-new-game-reset (ReferenceError forcedEraPeaceUntilNextEraByPairKey, poza zakresem).
- R8 nowy test: forced-war-relation-gate-test 14/0. Mutacja progu 100->101: test pada (exit 1), przywrócono.
- R9 mutacja: przywrócenie wywołania/komentarza z nazwą hooka czerwieni negatywną asercję R9 w guardach (zaobserwowane w trakcie).
- Live Chromium: diplo-war-peace-live-test 17/0 (brak pageerror). NIE_ZMIERZONO: war-rules-multiwar-live-test (timeout 300 s), 'ring 15' (nie zidentyfikowano pliku bramki), diplo-tick-war-brake '17' (nie zidentyfikowano).
- Kryterium 4 (żywy scenariusz wojny epoki po 2 miastach): NIE WYKONANO. Wymaga hooka wymuszenia pary + przejęcia miasta przez realną ścieżkę applyCityCaptureToMap; w tej rundzie nie zrobiono.

BLOKADY: kryterium 4 (żywy test); brak potwierdzenia ring 15 / 17 w bazie.
ZAŁOŻENIA: (1) R8 dotyczy każdej pary (nie tylko gracz-AI), relacja = relationScore(getDiploRelation(a,b)) jak licznik R7. (2) Regularne wojny AI↔AI nie są objęte R9 (poza zakresem). (3) Stałe MAX_CZAS_TRWANIA zostają w modułach, bo są parametrami testów; usunięte tylko helpery.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje diff i gate; Operator r2 domyka kryterium 4 (żywy test) i ring/17.
DEPLOY/PUSH: NIE WYKONANO
