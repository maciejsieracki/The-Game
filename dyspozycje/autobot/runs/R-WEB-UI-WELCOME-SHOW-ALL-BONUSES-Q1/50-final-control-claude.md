STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-UI-WELCOME-SHOW-ALL-BONUSES-Q1
GOAL: Ekran powitalny nowej cywilizacji pokazuje WSZYSTKIE Plusy/Minusy bezposrednio (bez "+ N wiecej (najedz...)" i tooltipu title).
ZMIANY/COMMIT: kandydat db7940f7d1074ba964619cd3f1a0e5edc0c00ce2; `merge-base --is-ancestor df20918b3 db7940f7d` = TAK. Diff (9 plikow): civWelcomeLogic.ts (usuniete WELCOME_VISIBLE_*), civWelcomeScreen.ts (listHtml(items) bez ciecia, CSS: karta flex, .cww-body przewijalne, stopka stala), civ-welcome-screen-test.cjs, raporty runa, 4 PNG dowodowe. Wszystko w allowliscie; brak gra/data, gra-robocza, WERSJE.md, audio. `git merge-tree origin/main db7940f7d` bez konfliktow (obecny main d4afe2838 zawiera tez zmiane audio w tym pliku).
TESTY (wlasne, surowe wyjscie): tsc --noEmit exit 0; civ-welcome-screen-test OK 490 asercji; logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33 ALL GREEN; unit-replace-test 21/21; combat-test 6/6 (dodatkowo ai-unit-replace-same-rules-test 45/0). Mutacje na kopiach civWelcomeScreen.ts: title="x" w <li> = 54 FAIL; <details><summary> = 1 FAIL; items.slice(0,3) = 44 FAIL. Zarzut 1 Evaluatora: naprawiony przez obrone (test renderuje listHtml dla kazdej civ, sprawdza liczbe <li>, brak "wiecej"/"najedz"/title/details).
DOWOD WIZUALNY: obejrzany evidence-rzymianie-1280x720.png: 4 plusy (Atak piechoty +15%, Pancerz piechoty +15%, Limit ludnosci +2, Odnawianie rezerw ludzkich +35%), 1 minus, brak "+ N wiecej", przyciski Audiencja/Zamknij widoczne. Pozostale PNG (480x800, max plusy, max minusy) zgodnie z raportem operatora; nie renderowane przeze mnie ponownie w Chromium (NIE ZMIERZONO w FC).
ZARZUT 2 (Evaluator): dokumentacyjny; ODDANY jako uwaga. civ-welcome-screen-brand-live-test.cjs jest w repo; nie uruchamiany przeze mnie (NIE ZMIERZONO w FC); Evaluator potwierdzil zielone na 3 viewportach.
BLOKADY: brak
RUNDY: FC po rundzie 2 obrony; 5 max
UWAGI-DLA-ORKIESTRATORA: integrowac kandydata db7940f7d (nie rodzica); po merge uruchomic civ-welcome-screen-test i tsc na wyniku (main zmienil sie od bazy). Lista innych miejsc UI z wzorcem "najedz" jest w 10-operator-claude.md (nie weryfikowana ponownie w FC).
NASTEPNY KROK: integracja orkiestratora (merge + bramki), deploy na ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
