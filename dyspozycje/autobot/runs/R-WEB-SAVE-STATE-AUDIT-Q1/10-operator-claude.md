STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, zero zmian w grze)
TEMAT: R-WEB-SAVE-STATE-AUDIT-Q1 (tag SAVEAUDIT)
GOAL: Ustalić, które zmienne modułowe gry nie trafiają do zapisu i czy ich brak po wczytaniu zmienia decyzje AI/gracza. Źródło: 11 kandydatów z AICSFIX (FALA 937).
BAZA: 1dbd21efcd829d34433f7f72c0b9ea81d3e79697 (origin/main), worktree detached; merge-base OK.
ZMIANY/COMMIT: allowlista — gra/tools/save-state-audit-scan.cjs (nowe, tylko odczyt), dyspozycje/analizy/ZAPIS-STAN-AUDYT-2026-11-28.md (nowe), dyspozycje/autobot/runs/R-WEB-SAVE-STATE-AUDIT-Q1/ (raport + scan-output.txt). Zero zmian w gra/src i gra/data (git diff --stat gra/src gra/data: puste). SHA commita: patrz pole sha w odpowiedzi.

WYNIKI (liczby z surowego wyjścia skanu):
- 11 kandydatów: S = 3 (difficultyBonusGrantedOwners, lastDiplomaticContactsSnapshot, pendingAdministratorChanges), D = 1 (aiWonderStuckTurnsByOwner), R = 7 (diplomacyDobraWolaActiveTura, aiNnsHoldOwners, aiNnsUncoveredOwners, aiImprovementBudgetByOwner, aiSurplusReportByOwner, aiGoldIncomeByOwner, aiWonderPracaTickByCity).
- Skan: 330 deklaracji (let/const, wcięcie 4, Map/Set/Array/Obiekt/Licznik/Flaga); 201 nie występuje w buildSaveGameSnapshot; wśród nich 46 wstępnie D? i 34 S? (heurystyka po nazwie).
- D zbadane kodem: aiWonderStuckTurnsByOwner = D (zerowany w restoreGameFromSave, linia 53108; próg cudu AI zależy od licznika); aiGoldIncomeByOwner = R (zapis 44717 przed każdym odczytem w tym samym koniec-tury); difficultyBonusGrantedOwners = S (jedyna ścieżka wywołania wymaga niezapisanej kolejki opróżnianej przy założeniu stolicy).

TESTY:
- Skan: node gra/tools/save-state-audit-scan.cjs --md — wykonany, wynik w scan-output.txt; node --check OK.
- Live (ablacja B≠A dla aiWonderStuckTurnsByOwner, macierz A==A'): NIE ZMIERZONO — dispatch dopuszcza wytłumaczenie z kodu; harness nie uruchamiany w tej rundzie.
- Bramki tsc 0 / logic 213 / ai-test 297/0: NIE ZMIERZONO — brak gra/node_modules w worktree; zakaz npm build/dev w gra/. Gra nie została zmieniona (git diff gra/src = 0), więc wynik bramek nie może się zmienić przez tę rundę.

BLOKADY: brak. Uwaga: nie wykonano pomiaru B≠A; werdykt D dla #10 opiera się na kodzie.

RUNDY: 1/5 (werdykt PASS-WITH-NOTES, bez poprawek).

UWAGI-DLA-ORKIESTRATORA (poza zakresem; do decyzji orkiestratora, NIE tworzono żadnych sesji/zadań):
1. Proponowany fix D #10 (≤10 linii: pole aiWonderStuckTurnsByOwner w meta save + odtworzenie w restore zamiast samego clear na linii 53108) — do osobnego tematu z testem round-trip i mutacją. Nie wdrażane tutaj.
2. Kolejki pendingForeignSpawnCities i pendingSameTypeRival* nie są zapisywane. Jeśli zapis może powstać przed założeniem stolicy gracza, wczytana gra traci zaplanowane miasta-państwa/rywali. Osiągalność do sprawdzenia.
3. playerStartHexByOwner (linia 3305) nie jest zapisywany; konsumenci nieprzebadani.
4. aiTurnAwaitingBattle (linia 14948): sprawdzić, czy zapis jest możliwy w trakcie oczekiwania na bitwę.
5. Pełna lista follow-upów z priorytetami: dyspozycje/analizy/ZAPIS-STAN-AUDYT-2026-11-28.md §4.

NASTĘPNY KROK: orkiestrator decyduje o temacie fixu D #10 (osobny Workflow, Operator Haiku, test round-trip + mutacja) oraz o weryfikacji pozycji 2–5 z listy follow-upów.
DEPLOY/PUSH: NIE WYKONANO
