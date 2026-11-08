STATUS: FAIL (CZĘŚCIOWO — N4 domknięte; N5, N6, N7 NIE_ZROBIONE; NIE PASS)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TRUCE-Q1
GOAL: rozejm (5/10/15 tur), baza PW 200, wspólne bramki z pokojem, wygaśnięcie bez kary, złamanie w oknie, AI, UI, save/load. Ten przebieg: N4 (AI proponuje rozejm gdy wojna < 20 tur).
ZMIANY-COMMIT: baza origin/web-wip/TRUCE-r3 (5e5e0e8eb). Commit 42be53726: gra/src/game/ai.ts (AI_ROZEJM_DO_TUR=20, aiPeaceProposalKind, pole rodzaj w zaproponuj_pokoj); gra/src/game/diplomacy-proposals.ts (aiCommandToPendingProposal: rodzaj=rozejm → actionId 'rozejm', payload.turns=TRUCE_DEFAULT_TURNS; opis); gra/src/main.ts (baza PW rozejmu 200 w gałęzi AI; akceptacja rozejmu AI nie idzie przez finalizePeaceTreatyBetween); gra/tools/diplo-truce-r4-ai-test.cjs (nowy). Poza allowlistą: nic. Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, Cargo.toml, diploListHud.ts. Brak push.
TESTY:
- npx tsc --noEmit (gra): exit 0.
- node tools/diplo-truce-r4-ai-test.cjs: 17 pass / 0 fail (granice 0/19/20/21; decideAIDiplomacy 19→rozejm, 20/21→pokój; mapowanie na actionId; baza PW 200 vs 500). Mutanty: M1 granica <= (zabity), M2 gałąź rozejmu wyłączona (zabity), M3 AI zawsze pokój (zabity).
- diplo-truce-r1-test 30/0; diplomacy-war-gates-test 22/0; diplomacy-test 148/0; diplomacy-peace-lock-test 9/0; diplo-war-peace-sim 22/0; diplo-war-peace-gate 11/0; diplo-war-peace-d7 8/0; diplo-war-peace-profile-unit 198/0.
- Bramki bazowe: war-era-counter 82/0; war-rules-multiwar 57 OK/0; city-cession 79/0; city-cession-r3 73/0; aggressor unit 73/0; aggressor wiring 15/0; forced-war-relation-gate 14/0.
- ai-test.cjs: 274 pass / 20 fail. 19 z 20 to lista znana z poprzedniego baseline (ekonomia budynków, T9a/T9h/T9j, T2S, T4S-d, T10b). Nowa: T9c — ZAŁOŻENIE: pre-existing względem HEAD 5e5e0e8eb, NIE_ZMIERZONO na czystym HEAD. Test podaje turnsAtWar=0; gate aiPeaceTimeOk (minTurWojny) blokuje komendę, a ten warunek nie został zmieniony przez diff N4.
- git diff --check: czysty.
- ring i pozostałe bramki z BAZY: NIE_ZMIERZONO w tym przebiegu.
BLOKADY:
1. N5 UI (przełącznik pokój/rozejm + 5/10/15 w modalu, hak testowy, zrzut Chromium pełnego cyklu) — NIE ZROBIONE.
2. N6 roundtrip save/load stanu rozejmu i reset nowej gry — NIE ZROBIONE.
3. N7 mutacje gałęzi main.ts (tik wygaśnięcia, kara za złamanie, bramka czasu) — NIE ZROBIONE.
4. Integracja rozejmu z transferCityByTreaty — ZAŁOŻENIE (ta sama ścieżka oneShotTrade co pokój), nie zbadane.
5. TREATY_GATED_NEGOTIATION_ACTIONS (main.ts ~18230) nie zawiera 'rozejm' — NIE_ZBADANE, zostawione otwarte.
6. Test end-to-end decyzji AI → stół → akceptacja w grze (main.ts) — NIE ZROBIONE; pokrycie N4 to testy funkcji i decideAIDiplomacy.
ZAŁOŻENIA: (a) AI proponuje rozejm, gdy słabsze i turnsAtWar < 20 (AI_ROZEJM_DO_TUR), pokój od 20 (wg dispatchu); (b) AI-rozejm używa domyślnej długości TRUCE_DEFAULT_TURNS (10); (c) brak pola rodzaj = pokój (kompatybilność).
RUNDY: 1/5 wg zlecenia orkiestratora; dispatch w repo oznacza tę pracę jako rundę 4/5 (zakres N4 z r4). Pozostało N5-N7 — kolejna runda.
NASTĘPNY KROK: Evaluator/Final Control dla N4; następnie Operator na N5-N7 (N5 wymaga Chromium i zrzutu do katalogu runu; gra/node_modules usunąć po etapie).
DEPLOY/PUSH: NIE WYKONANO
