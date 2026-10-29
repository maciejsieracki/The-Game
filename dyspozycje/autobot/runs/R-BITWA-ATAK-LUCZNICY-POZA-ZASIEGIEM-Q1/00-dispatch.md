# `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1` — dispatch

- **Status:** Operator zakończył implementację i focused verification; oczekuje na niezależnego Evaluatora. Integracja/deploy/push niewykonane.
- **Zgłoszenie:** w produkcyjnym Chromium, w trybie Atak, łucznik ruszał się poza zasięgiem strzału w kierunku przeciwnym do jego pozycji zamiast dojść do legalnego zasięgu.
- **Twardy dowód początkowy:** odległość do najbliższego wroga 5; w sześciu aktywacjach wykonano ruch na 18 polach, bez strzału i bez zużycia amunicji; odległości: 5, 5, 5, 8, 11, 14. Kontrola w zasięgu PASS: strzał, amunicja −1, HP celu spadło.
- **Założona reguła:** w Ataku łucznicy posuwają się do zasięgu ataku za linią piechoty i strzelają, kiedy cel jest w zasięgu. Obrona utrzymuje pozycję; Szturm zachowuje indywidualne natarcie.
- **Role:** Operator implementuje i odtwarza; po commicie wymagana niezależna Ewaluacja, następnie obrona Operatora w razie uwag, Final Control, integracja, publikacja Robocza i git push. Do deployu nie wchodzi bez przejścia wszystkich bramek.
- **Brak Kanbanu:** zgodnie z decyzją właściciela Kanban nie jest używany w tym repo.
- **Bieżący przebieg:** przyczyna i fix opisane w `10-operator.md`; testy jednostkowe i typecheck PASS, produkcyjny mixed Chromium PASS według dowodu w `evidence/`. Ponowny browser rerun nie zakończył się w limicie sesji, więc nie jest raportowany jako PASS. Następny legalny etap: niezależna ewaluacja.
