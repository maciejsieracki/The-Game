# R-WEB-WAR-ALLIN-KEEP-BARB-DEFENSE-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-WAR-ALLIN-KEEP-BARB-DEFENSE-Q1
GOAL: war-allin nie przejmuje obrońców przydzielonych do obrony domu przed barbarzyńcami; reszta armii maszeruje jak dotąd. Bez zmian balansu, determinizm zachowany.

ZMIANY/COMMIT: `cf2bc8d71` (baza origin/main `c3d859a40`, bez push)
- `gra/src/game/ai.ts`: zbiór `homeDefenseMoveIds` (3616), zbierany w kroku 4b2 (4078) tylko dla zagrożenia barbarzyńskiego (`ownerId === -1`); nowy opcjonalny parametr `applyWarAllInCapitalToCommands` (4291), wołanie (4269), dodanie do `keep` (4309).
- NOWY `gra/tools/war-allin-keep-barb-defense-test.cjs`.
- Logi: `dyspozycje/autobot/runs/R-WEB-WAR-ALLIN-KEEP-BARB-DEFENSE-Q1/gate-*.txt`.
- Poza allowlistą: nic.

ZMIERZ PRZED (wojna AI1 z cywilizacją 2; barbarzyńca 7 heksów od miasta pop=5, w bramce 9; 3 jednostki AI):
- Baza bez war-allin: obrońca dostaje ruch ku barbarzyńcy (25,27)->(25,29).
- Przed poprawką z war-allin: ten sam obrońca dostaje ruch na stolicę wroga (23,27, targetCityId ec1). Nadpisane: 1 z 1 przydzielonego obrońcy. Mechanizm: splice ruchów w `applyWarAllInCapitalToCommands`; DEFEND-HOME pomija barbarzyńców (`BARB = -1`).
- Po poprawce: komenda obrońcy identyczna z bazą (0 nadpisań).

TESTY (drzewo po poprawce):
- `war-allin-keep-barb-defense-test`: 8 PASS / 0 FAIL (EXIT=0). Mutacja (keep wyłączony): T1 FAIL (EXIT=1). Mutacja cofnięta.
- `ai-war-defend-home-test`: 30/0 (baza 30/0). `ai-home-defense-vs-barbarians-test`: 46/0 (baza 46/0).
- `ai-war-gate-test` 24/0; `army-concentration-test` 56/0; `ai-army-scattered-merge-test` 33/0; `ai-general-war-campaign-test` 51/0; `ai-move-full-range-test` 20/0; `war-allin-capital-test` 98/0; wszystkie EXIT=0.
- `war-allin-capital-regress`: EXIT=0, NIEZIELONE 0 (baza i PO).
- Determinizm `war-allin-capital-quick`: hashe identyczne z bazą (aiVsAi 5eae07cc3b4cafa7, aiVsPlayer 0b2afc75febaa727, barbarians c879b6d48293589c, noLandPath 11c252a67bca53c4).
- `tsc --noEmit`: EXIT=0 (przed ostatnią zmianą wyłącznie komentarza). `git diff --check`: czysto.

ODSTĘPSTWO OD ZAKRESU: pierwsza wersja obejmowała też najeźdźców cywilizacji. `ai-war-defend-home-test` padał wtedy 5/30 (brak wymiany miast; obrońcy zostawali 4-5 heksów od miasta zamiast <=2). Zawężono do barbarzyńców; najeźdźcy cywilizacji zostają przy DEFEND-HOME (applyHomeWarPriorities). Test T4 przypina ten zakres. Objęcie najeźdźców wymagałoby osobnego tematu.

BLOKADY: brak. Nieobjęte: ścieżka wodza (`campaign.stage === 'attacking'`, drugie wywołanie war-allin ok. ai.ts:4856) nie dostaje `homeDefenseMoveIds`; nie zmieniano.
NIE ZMIERZONO: wpływ na pełną rozgrywkę wielotyrową z barbarzyńcami przy mieście AI (harness war-allin nie ma takiego scenariusza).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5): weryfikacja testów, mutacji i zakresu barbarzyńców.
DEPLOY/PUSH: NIE WYKONANO
