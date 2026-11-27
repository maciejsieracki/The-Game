STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-REBEL-WORLD-NEWS-Q1 (tag AIREBELNEWS)
GOAL: bunt miasta AI (nowe gry) dodaje wpis do TRWAŁEJ listy „Wydarzenia na świecie” w oknie dyplomacji, widoczny tylko przy odkrytym właścicielu; tryb zgodności bez zmian.
ZMIANY/COMMIT: baza e6f3fd4b6 (origin/main). Zmienione pliki: gra/src/game/diplo-world-news.ts (newsKind += 'rebelia'; sanitize akceptuje 'rebelia'; nowa czysta funkcja worldDiploNewsRebellionEntry z filtrem widoczności worldDiploNewsVisible(owner, owner, discovered)); gra/src/main.ts (import + w recordAiCityRebellionNews dopisanie wpisu do worldDiploNewsList przez worldDiploNewsPush PRZED dziennikiem; dziennik bez zmian; gałąź gracza nietknięta). Nowy test: gra/tools/ai-city-rebellion-news-test.cjs. diploListHud.ts NIE zmieniony (render już używa klasy dl-wn-<newsKind>, ikona z wpisu; zero zmian layoutu). Raport: dyspozycje/autobot/runs/R-WEB-AI-REBEL-WORLD-NEWS-Q1/10-operator-claude.md.
TESTY:
- tsc --noEmit: exit 0
- ai-city-rebellion-news-test.cjs: PASS 24/0
- mutacja (usunięcie linii worldDiploNewsPush w main.ts): test CZERWONY, WYNIK 23/1, exit 1; po przywróceniu PASS 24/0
- logic-test: exit 0 (ostatnia linia PASS [213])
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- combat-test: All sanity checks passed, exit 0
- society-breakdown-test: 56 OK, 0 FAIL
- ai-city-rebellion-gate-test: PASS=37 FAIL=0
- ai-test: 297 passed, 0 failed
- tech-tree-test, unit-replace-test: exit 0 (bez czytelnej linii podsumowania w wyjściu; wynik = kod wyjścia 0)
- Tryb zgodności i round-trip: pokryte testem (stary zapis bez 'rebelia' wczytuje się; nowy z 'rebelia' wczytuje się i zachowuje rodzaj).
- Realny render w Chromium (zrzut okna dyplomacji z wpisem o buncie AI): NIE ZMIERZONO. Nie uruchamiano żywej gry w tej rundzie; wpis nie był wizualnie oglądany.
BLOKADY: brak; render live NIE ZMIERZONO (patrz TESTY). node_modules w worktree to dowiązanie symboliczne do node_modules innego worktree tego samego repo (tylko odczyt).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator: przegląd diffu (allowlista, brak zmian layoutu, tryb zgodności); decyzja o weryfikacji live przez civTest przed FC.
DEPLOY/PUSH: NIE WYKONANO

Założenia (luki rozstrzygnięte założeniem):
- Widoczność: dispatch wymaga warunku jak dla wojen/pokojów AI. Użyto worldDiploNewsVisible (oba boki odkryte). Bunt nie tworzy drugiej cywilizacji, więc strony pary = właściciel (a = b). Efekt: wpis widoczny tylko, gdy właściciel odkryty, czyli ten sam warunek, którym już bramkowany jest dziennik (getDiplomaticContacts().has(prevOwnerId)).
- Treść: jak w dzienniku („Miasto <właściciel> zbuntowało się i ogłosiło niepodległość”), tytuł „Bunt miasta: <nazwa>”, ikona ⚑, newsKind 'rebelia'. Nie dodano CSS (brak per-rodzaj stylów w diploListHud).
- Tryb zgodności: zmiana dotyczy wyłącznie ścieżki buntu AI (gałąź else przy isHuman), bez zmian progów i logiki buntu.
- Maksymalny poziom ustawień (Trudny, Kultura trudny, Koszty Wysoki ×4): dotyczy biegu live, którego w tej rundzie nie wykonano.

UWAGI-DLA-ORKIESTRATORA:
- main.ts jest edytowany równolegle (AIPLUS10/LIVEGATE2). Zmiana w main.ts to 1 import + 7 linii w recordAiCityRebellionNews.
- Brak pliku dyspozycje/analizy/AI-REBELIA-WPIS-SWIAT-2026-11-27.md w gałęzi dispatchu (nie utworzono; nie był wymagany do zamknięcia kryterium).
