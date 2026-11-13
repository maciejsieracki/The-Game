# `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1` — dispatch

- **Status:** Operator i Evaluator r2 zakończyli; Evaluator `PASS-WITH-NOTES`, oczekuje na Final Control. Integracja/deploy/push niewykonane.
- **Zgłoszenie:** w produkcyjnym Chromium, w trybie Atak, łucznik ruszał się poza zasięgiem strzału w kierunku przeciwnym do jego pozycji zamiast dojść do legalnego zasięgu.
- **Twardy dowód początkowy:** odległość do najbliższego wroga 5; w sześciu aktywacjach wykonano ruch na 18 polach, bez strzału i bez zużycia amunicji; odległości: 5, 5, 5, 8, 11, 14. Kontrola w zasięgu PASS: strzał, amunicja −1, HP celu spadło.
- **Założona reguła:** w Ataku łucznicy posuwają się do zasięgu ataku za linią piechoty i strzelają, kiedy cel jest w zasięgu. Obrona utrzymuje pozycję; Szturm zachowuje indywidualne natarcie.
- **Role:** Operator implementuje i odtwarza; po commicie wymagana niezależna Ewaluacja, następnie obrona Operatora w razie uwag, Final Control, integracja, publikacja Robocza i git push. Do deployu nie wchodzi bez przejścia wszystkich bramek.
- **Brak Kanbanu:** zgodnie z decyzją właściciela Kanban nie jest używany w tym repo.
- **Bieżący przebieg:** Evaluator r1 zgłosił regresję w Skirmish; Operator zawęził nową regułę do Ataku i dodał test łucznika poza zasięgiem przy żywej piechocie. Evaluator r2 niezależnie potwierdził poprawkę oraz typecheck, testy doktryn 10/10, melee Atak/Szturm, manual contract 12/12 i produkcyjny mixed Chromium 42v42. Raport: `12-evaluator-r2.md` (commit `f42317c9`). Następny legalny etap: Final Control.
