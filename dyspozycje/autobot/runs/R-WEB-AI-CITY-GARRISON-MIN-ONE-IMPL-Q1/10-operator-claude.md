STATUS: BLOCK
DOMAIN: GAME (zachowanie AI, nowa funkcja)
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: stały garnizon min. 1 jednostki bojowej w każdym mieście AI, także w pokoju, poza armią; wariant C (rezerwacja z priorytetem); pomiar PRZED/PO w grze.
ZMIANY-COMMIT: baza 8a2d31af9 (potomek 04f870acd). Zmiana kodu: gra/src/main.ts (import, helper aiGarrisonGoldReserve, bramka zakupu jednostki z priorytetem garnizonu). Commit: SHA w polu sha orkiestratora.
ZALOŻENIA: (1) garnizon z priorytetem = pierwsza jednostka bojowa lądowa (armyClassOfUnit) do miasta AI bez kwalifikującej się jednostki; (2) priorytet pomija runway i rezerwę utrzymania, zostaje skarbiec >= cena, Manpower, brak wstrzymania NNS; (3) pozostałe zakupy AI odejmują od skarbca złoto na garnizony (liczba pustych miast x koszt Wojownika), więc nie mogą go wydać.
TESTY (liczby z surowego wyjścia, worktree 8a2d31af9 + zmiana):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: ALL GREEN; unit-replace-test: 21/21; combat-test: All sanity checks passed
- ai-city-garrison-min-one-test: 13/0; ai-war-city-garrison-test: 21 PASS/0 FAIL; ai-home-defense-vs-barbarians-test: 46/0; ai-war-defend-home-test: 30/0; ai-home-defense-civilian-filter-test: 8/0; ai-war-army-seeks-army-test: 22/0; siege-ai-test: 17/0; siege-last-stand-sortie-test: 71/0; army-concentration-test: 56/0 (próg sc.4 = 9, bez zmiany)
- ai-unit-replace-same-rules-test: 45/0
POMIAR: NIE ZMIERZONO. Pomiar PRZED/PO (seed 4242, 60 tur, Chromium) nie został wykonany w tej rundzie; skuteczność zmiany w grze nie jest dowiedziona.
ODPOWIEDZI NA ZARZUTY FC r1:
1. Wykluczenie z homeDefenderPool: NIE ZROBIONE. Zlecenie koliduje z zasadą (g) dispatchu (garnizon liczy się do obrońców miasta) i łamie 2 istniejące testy (ai-home-defense-vs-barbarians T1/T7: 42/2). Wycofane. Wymaga decyzji właściciela.
2. Wykluczenie z all-in i generała: PRÓBA WYCOFANA. Wykluczenie z all-in (applyWarAllInCapitalToCommands) i dołożenie garnizonów do zbioru generała psuło ai-war-city-garrison-test (T1/T2, 17/4). Przyczyny nie zdiagnozowałem. Wycofane; nadal NIE ZROBIONE: armyMerge.ts, marsze wojenne, odsiecz, ruchy zwiadowcze.
3. Próg army-concentration sc.4: przywrócenie do 6 NIE przechodzi (klastrów=9: 5 garnizonów zostaje osobno + 4 rezerwy). Próg 9 pozostaje z uzasadnieniem w teście. Test dyskryminujący G7 nie został wzmocniony.
4. Rezerwacja z priorytetem: ZROBIONE w main.ts (wariant C). Brak testu jednostkowego dla tej bramki.
BLOKADY: (1) pomiar w grze PRZED/PO nie wykonany; (2) brak testu dla rezerwacji zakupu; (3) konflikt zasad: zasada (g) vs zlecenie „wyklucz z homeDefenderPool" -- decyzja właściciela; (4) armyMerge, marsze wojenne, odsiecz, zwiad: nie zmienione.
RUNDY: 2/5 (runda obrony 2 zakończona z DECISION_REQUIRED; ta runda Operatora = 2).
NASTĘPNY KROK: FC ocenia kod main.ts; pomiar PRZED/PO w osobnej rundzie (świeży start, 1 Chromium); decyzja właściciela co do homeDefenderPool; runda 3 dla armyMerge/marszów/odsieczy.
UWAGI-DLA-ORKIESTRATORA: node_modules zostawiony w worktree (npm ci --ignore-scripts). Log npm ci w /tmp/claude-0/npmci-garrison.log. Konflikt zasad w dispatchu: zasada (g) mówi, że garnizon liczy się do obrońców; runda 2 każe go wykluczyć z homeDefenderPool; wybrałem zasadę (g), bo testy obrony domu są zielone.
DEPLOY/PUSH: NIE WYKONANO
