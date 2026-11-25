STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-C
GOAL: Cztery testy AI zgodne z decyzjami właściciela 2026-11-25 (bez zmian w grze: zero zmian w gra/src i gra/data).
ZMIANY/COMMIT: baza 35f601ae3 (origin/main). Commity na HEAD:
- 1e8d8c862 `gra/tools/ai-army-composition-per-civ-test.cjs` (pkt 1)
- d3d8964f9 `gra/tools/rydwan-bierny-atak-test.cjs` (pkt 2)
- 38a24e002 `gra/tools/ai-army-replacement-concentration-test.cjs` (pkt 3)
- 7cbef8e0c `gra/tools/ai-move-full-range-test.cjs` (pkt 4)
- SHA czubka: patrz pole sha w StructuredOutput (ten raport dopisany jako kolejny commit).
Allowlista: zachowana (tylko 4 pliki testów + ten raport). Brak zmian w gra/src, gra/data, manifeście, WERSJE.md, rust-port.

ZMIANY SZCZEGÓŁOWO:
1. ai-army-composition-per-civ-test.cjs: usunięte dwie asercje "min 50% wręcz" w pomiarze składu (sekcja D i F). Zostaje tolerancja ±10 pp wokół celu z tabeli właściciela (dla celów 50% = dokładnie zakres 40–60%). Asercja A4 (cel tabeli >= 50) zostaje, bo odpowiada walidatorowi src (isValidArmyCompositionTarget). UWAGA: dosłowny zakres 40–60% dla KAŻDEJ cywilizacji byłby sprzeczny z zatwierdzoną tabelą (germanie wręcz 80, rzymianie 75, grecy 70), dlatego zastosowano tolerancję wokół celu, nie sztywne 40–60 globalnie. Do rozstrzygnięcia przez Evaluatora/orkiestratora.
2. rydwan-bierny-atak-test.cjs: asercja C przepisana na: brak ataku + ruch rydwanu w budżecie ruchu (≤4 heksy) i zbliżający do wroga poza zasięgiem. Asercja D przepisana na: rydwan z ruchLeft=1 zbliża się najwyżej o 1 heks (budżet autorytatywne ruchLeft, nie ruch maksymalny).
3. ai-army-replacement-concentration-test.cjs: próg "bez bramki > 10%" -> "> 5%" (komentarz z pomiarem: bez bramki 9,1%, z bramką 2,5%, czysty main 3,0%). Warunek "z bramką spada co najmniej o połowę" bez zmian.
4. ai-move-full-range-test.cjs: tolerancja asercji D2 0,5 pp -> 1,0 pp (komentarz z pomiarem PRZED 18,8% / PO 19,7% = +0,9 pp i powołaniem na R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1). D1 (0,5 pp) nie zmieniony, bo przechodzi.

TESTY (surowe wyjście z tego worktree, Node v22.23.5, uruchomienia solo):
- ai-army-composition-per-civ-test.cjs: BAZA 331 passed / 10 failed (D: sumer/babilonia/asyria min 50%; F: L1-L3 asyria). PO: "295 passed, 0 failed".
- rydwan-bierny-atak-test.cjs: BAZA "4 passed, 2 failed". PO: "6 passed, 0 failed".
- ai-army-replacement-concentration-test.cjs: BAZA "34 passed, 1 failed" (pomiar: bez bramki 0.091 > 0.10). PO: "35 passed, 0 failed". POMIAR: bez bramki 0.091; tylko zbiórka OFF 0.030; PO 0.025.
- ai-move-full-range-test.cjs: BAZA "19 passed, 1 failed" (D2: PO 19.7% > PRZED 18.8% + 0,5 pp). PO: "20 passed, 0 failed".

BRAMKI (PO zmianach, surowe wyjście):
- tsc --noEmit: exit 0, 0 linii wyjścia (0 błędów).
- logic-test: exit 0, 213 linii [PASS], 0 FAIL.
- tech-tree-test: exit 0, "20 pass, 0 fail".
- research-test: exit 0, "PASSED: 33 / FAILED: 0 / TOTAL: 33".
- unit-replace-test: exit 0, "WSZYSTKIE TESTY ZIELONE (21/21)".
- combat-test: exit 0, "All sanity checks passed."
- ai-test.cjs: exit 0, "ai-test: 297 passed, 0 failed".
- era-war-pairing-alliance-test.cjs: exit 0, "19 pass, 0 fail".
- ai-ai-alliance-surcharge-test.cjs: exit 0, "RESULT: ALL GREEN (live + mutants detected)".

MUTACJE (kryterium binarne):
- Pkt 1 (skład): mutacja źródła danych — sumer wrecz 50->80 (dystans 35->20) w gra/data/ai-params.json: 281 passed / 11 failed (czerwone). Przywrócono (git checkout). Dolna granica (20%) nie da się podać przez walidowany cel (src odrzuca wręcz < 50 -> tryb legacy), więc nie pokazano czerwieni dla 20% wprost.
- Pkt 2 (rydwan): mutacja 1: wyłączenie bloku zbliżania flankerów (`&& false &&` w warunku hexDistance <= ruchLeft) -> 6 passed / 0 failed (ZIELONE, NIE czerwieni). Mutacja 2: dodatkowo `if (false && nearestEnemy ...)` w planCityStateOffensiveMove (ai.ts ~5449) -> 6 passed / 0 failed. Mutacja 3: isFlankingUnit -> false -> 6 passed / 0 failed. Wniosek: ruch do wroga B/C/D pochodzi z innej gałęzi decideAITurn, której nie zidentyfikowano. Wymagany pkt "mutacja -> czerwony" NIE SPEŁNIONY. Wszystkie mutacje cofnięte (git checkout src/game/ai.ts; git status czysty w src).
- Pkt 3: pomiar (mutacja gate-off) 0.091 > 0.05 wykazany w surowym wyjściu; czerwony przed zmianą (baza FAIL), zielony po.
- Pkt 4: pomiar wystarczający wg decyzji (delta +0,9 pp w surowym wyjściu bazy).

BLOKADY:
- Pkt 2: brak dowodu mutacji "wyłączenie zbliżania -> czerwony" (patrz wyżej). Asercje B/C/D nadal opierają się na ruchu, który w obecnym kodzie wynika z innej gałęzi; ich moc dowodowa wobec regresji zbliżania NIE JEST udowodniona. Do rozstrzygnięcia w Evaluatorze (wskazać właściwą gałąź lub zawęzić scenariusz).
- Pkt 1: interpretacja "zakres 40–60%" jako tolerancja ±10 wokół celu (patrz ZMIANY pkt 1); dosłowne 40–60 globalnie łamałoby tabelę właściciela.
- Gra nie zmieniona: zachowanie AI nie było modyfikowane; wynik dotyczy wyłącznie testów.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator: (a) zweryfikować diff czterech commitów względem allowlisty i decyzji; (b) rozstrzygnąć pkt 2 (który kod produkuje ruch rydwanu w B/C/D i jak wykazać czerwień); (c) potwierdzić interpretację zakresu w pkt 1. Final Control po tym. Deploy/push NIE.

ZNALEZISKA POZA ZAKRESEM (UWAGI-DLA-ORKIESTRATORA):
- Test ai-army-replacement-concentration uruchamia się dłużej niż 120 s (pomiar 2 ziarna x 70 tur x 3 symulacje). Wymaga timeoutu 590000 ms w Bash.
- Pliki tymczasowe testów (.*-bundle.cjs, .*-entry.ts) tworzone są w gra/tools/ przez testy; nie są śledzone (git status czysty).
- gra/node_modules zainstalowany przez npm ci w worktree (71 pakietów) — do usunięcia po zapisie raportu.

DEPLOY/PUSH: NIE WYKONANO
