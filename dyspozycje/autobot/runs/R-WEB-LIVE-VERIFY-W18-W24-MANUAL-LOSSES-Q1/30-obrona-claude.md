STATUS: PASS-WITH-NOTES (obrona runda 2: zarzuty 1-5 rozstrzygnięte; punkty 1 i 3 nadal NIE_ZMIERZONO; W24 ma realną anomalię wizualną)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1
GOAL: odpowiedź na zarzuty Evaluatora (d61744e71, kandydat 158700e9b): poprawka i dowód tam, gdzie zarzut jest zasadny; odrzucenie z dowodem tam, gdzie nie. Baza: 158700e9bdfdc82ee3afda8a38c12cd807035fe8.

ZMIANY-COMMIT:
- d7d0f4007 (kod narzędzi i dowody, bez gra/src i gra/data): gra/tools/live-verify-w18-w24-manual-losses-w24.cjs, gra/tools/live-verify-w18-w24-manual-losses-w18.cjs, evidence/w24-lewy-baner.json, evidence/w18-rekrutacja.json, evidence/*.png (odświeżone).
- commit raportu: ten plik (30-obrona-claude.md), SHA w polu sha odpowiedzi.
- Allowlista: zgodna (gra/tools/live-verify-w18-w24-manual-losses-*.cjs, runs/R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1/**). git diff --check: czysty.

ODPOWIEDZI NA ZARZUTY:

1. Brak 00-dispatch-DODATEK-claude.md: PRZYJMUJĘ jako fakt, bez poprawki (cudzego dodatku nie da się wytworzyć).
   Dowód: git ls-tree -r --name-only origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 | grep W18-W24 zwraca tylko 00-dispatch.md; git show origin/main:dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1/00-dispatch.md kończy się "does not exist" (dispatch jest tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0). Kryteria użyte: 00-dispatch.md z tej gałęzi + treść zadania w tej rundzie. ZAŁOŻENIE: dodatek nie istnieje i nie zmienia kryteriów punktów 1-3.

2. W24 pomiar niepełny (top<0, przycięcie): PRZYJMUJĘ, poprawka + dowód.
   Zmiana: measure() rozszerzony o overflowingTop (top < -0.5), overflowingBottom (bottom > H + 0.5) i clippedText (scrollWidth > clientWidth + 1 dla elementów z tekstem); dodane asercje, pole verdict i kod wyjścia.
   Wynik (surowy JSON, evidence/w24-lewy-baner.json, uruchomienie z tego commita):
   - 1000x700: hasHorizontalScroll false, maxRight 370 <= 1000, overflowingTop 0, overflowingBottom 0, clippedText 0.
   - 640x480: hasHorizontalScroll false, maxRight 190 <= 640, overflowingTop 0, overflowingBottom 0, clippedText 0.
   - 800x600: hasHorizontalScroll false, maxRight 270 <= 800, overflowingTop 13 (hud-chip-grid top -6; span.civ-hud-chip-cell top -6; span.civ-hud-chip-lbl top -5 i kolejne), overflowingBottom 0, clippedText 0.
   VERDICT skryptu: FAIL ["800x600: top<0 x13"].
   Obejrzany zrzut evidence/w24-lewy-baner-800x600.png: górny rząd wartości żetonów (+4, 0 itd.) i etykiet przy górnej krawędzi okna jest ucięty przez brzeg okna. Baner (left 20, right 270, top 16) mieści się poziomo, ale siatka żetonów wychodzi ponad jego górną krawędź o 6 px.
   Zrzut 640x480 obejrzany: etykiety Skarbiec / Praca / Spichlerz stoją przy samej górnej krawędzi (top >= 0 wg pomiaru), bez wyraźnego ucięcia. NIE potwierdzam zarzutu "Spichlerz przycięty po prawej": clippedText nic nie wykrył, a na zrzucie etykieta mieści się w banerze.
   Ocena: literalne kryterium dispatchu (brak poziomego scrolla, right <= W) PASS. Anomalia pionowa 800x600 to REALNY DEFEKT wizualny, NIE naprawiony (dispatch zakazuje zmian w gra/src). Zgłoszenie do orkiestratora jako osobny temat R-WEB-*.

3. W18 punkt zasadniczy NIE_ZMIERZONO, uzasadnienie "nie dało się wywołać oblężenia" słabe: PRZYJMUJĘ krytykę uzasadnienia; próby NIE podjęto w tej rundzie.
   Korekta uzasadnienia: nie twierdzę już, że oblężenia nie dało się wywołać. Hooki civ-test-hooks.ts (addUnit, setWar, foundCity, endTurn) pozwalają teoretycznie je wywołać. Panel rekrutacji nie jest jednak właściwą powierzchnią machin: budowa machin idzie osobną kolejką (gra/src/game/siegeMachines.ts:29 queueSiegeMachine, poza ścieżką rekrutacji). Wynik przed/po w panelu rekrutacji (siegeHits [] w obu fazach) jest zgodny z oczekiwaniem i nie rozstrzyga widoczności machin po techu.
   Pełny pomiar (miasto obce, setWar, armia przy mieście, panel oblężenia i powiadomienia, Taran przy Obróbce drewna) NIE wykonany w tej rundzie. Werdykt pozostaje NIE_ZMIERZONO.

4. Punkt 3 (straty zwycięzcy, >=5 bitew) NIE_ZMIERZONO: PRZYJMUJĘ zarzut o nieprecyzyjnym uzasadnieniu ("brak haka"). Istnieją presety testBattle, hooki addUnit i setWar, narzędzie auto-battle-loss-audit-test.cjs i przełącznik "Trafienia: pewne" (#285). Nie wykonano żadnej bitwy: 0 bitew, tabela nie powstała. Werdykt NIE_ZMIERZONO, bez zgadywania wyników.

5. Słabość dowodów (skrypty bez asercji; W18 "po" = "przed"; nakładka Dyplomacji na zrzucie "po"): PRZYJMUJĘ częściowo.
   - Dodany werdykt w W24 (patrz 2) i w W18: W18 wystawia NIE_ZMIERZONO (brak machin w panelu rekrutacji przed i po unlockAllTech) albo BLAD; kod wyjścia 1 tylko przy BLAD.
   - "po identyczne z przed" ODRZUCAM jako zarzut wobec skryptu: to rzeczywisty wynik pomiaru (evidence/w18-rekrutacja.json, siegeHits [] w obu fazach), a nie błąd narzędzia. Brak różnicy w panelu rekrutacji nie dowodzi braku widoczności po techu, stąd NIE_ZMIERZONO.
   - Nakładka Dyplomacji na zrzucie "po": PRZYJMUJĘ jako zanieczyszczenie zrzutu, NIE naprawiam (nie wpływa na dane JSON; zrzut nie jest kryterium dispatchu).

TESTY:
- Pomiar W24 (uruchomienie po rozszerzeniu; bundle /tmp/claude-0/w18w24-build/index.html zbudowany poza repo z tego samego gra/src, bez zmian gra/src w tym temacie): VERDICT FAIL ["800x600: top<0 x13"]. Literalne kryteria PASS (hasHorizontalScroll false we wszystkich trzech rozmiarach; maxRight 370/270/190 <= W 1000/800/640).
- Pomiar W18 (po dopisaniu werdyktu): VERDICT NIE_ZMIERZONO (brak machin w panelu rekrutacji przed i po unlockAllTech; scenariusz oblężenia nie wykonany). przed: Rydwan (woły), Wojownik, Łucznik, Oszczepnik; po: te same 4; siegeHits [] w obu fazach.
- tsc / logic / tech-tree / research / unit-replace / combat: NIE_ZMIERZONO w tej rundzie (brak zmian w gra/src i gra/data; zielone bramki Evaluatora dotyczą tej samej zawartości gra/src). gra/node_modules w worktree jest puste, nie uruchamiano npm ci.
- Playwright: NODE_PATH=/tmp/claude-0/nm/node_modules (tylko odczyt), chromium /opt/pw-browsers/chromium przez common.cjs.

BLOKADY:
- Punkt 1 (W18 po techu): NIE_ZMIERZONO. Wymaga scenariusza oblężenia albo haka "odkryj tech X" (unlockAllTech nie izoluje Obróbki drewna).
- Punkt 3 (bitwa ręczna): NIE_ZMIERZONO. Wymaga ścieżki pomiaru z presetami i sterowaniem bitwą ręczną.
- Dodatek orkiestratora: nieobecny w repo (zarzut 1).

RUNDY: 2/5 (runda Operatora po zarzutach Evaluatora r1; Operator = Haiku, bez eskalacji modelu).

NASTĘPNY KROK: orkiestrator decyduje (a) czy osobny temat R-WEB-* na anomalię pionową baneru 800x600 (hud-chip-grid wychodzi ponad górną krawędź o 6 px); (b) czy runda 3 ma wykonać scenariusz oblężenia dla W18 po techu (hooki addUnit/setWar/foundCity/endTurn) i pomiar punktu 3 (presety + auto "pewne"), albo zostawić oba jako NIE_ZMIERZONO w tym temacie.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch dostępny tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch.md), nie na origin/main; dodatek nieobecny.
- Anomalia W24 800x600 (pionowa) to kandydat na osobny temat R-WEB-*; nie naprawiana tutaj (zakaz gra/src).
- W18: nakładka Dyplomacji po starcie gry (__cityStateStartUnitsTestDebug.startNewGame) do rozważenia w przyszłym skrypcie (zamknięcie przed zrzutem).
- Commit d7d0f4007 zawiera zmiany narzędzi i dowodów; commit raportu to osobny commit (zapis tylko tego pliku).
