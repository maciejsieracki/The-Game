# R-WEB-UI-TEXT-LEFTOVERS-ADMIN-DISMISS-CIVPEDIA-Q1 — Final Control (Claude)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-TEXT-LEFTOVERS-ADMIN-DISMISS-CIVPEDIA-Q1
GOAL: (1) tekst okna potwierdzenia zwolnienia administratora spójny z nagłówkiem panelu; (2) brak „jeszcze niewdrożone” w hasłach Civpedii; wikiBundle regenerowany istniejącym narzędziem.
ZMIANY/COMMIT: kandydat b2c6859a13052be39a137ca1087c40e7c1d65474 (potomek bazy 38d145144 — `merge-base --is-ancestor` OK). Diff vs baza: 5 plików, wszystkie w allowliście (administratorPanel.ts, zaufanie.md, wikiBundle.json, ui-text-leftovers-test.cjs, 10-operator-claude.md). Brak zmian logiki gry ani gra/data. `git diff --check` czysty. integration_sha = b2c6859a13052be39a137ca1087c40e7c1d65474.

Uwaga: origin/main ma już nowszy SHA (d85bc6f41) niż baza zadania; orkiestrator integruje merge-tree (wikiBundle.json to jedna linia — przy konflikcie regenerować narzędziem `gra/tools/bundle-wiki-for-game.cjs`, nie ręcznie).

TESTY (surowe wyjście tej sesji, na kandydacie):
- `npx tsc --noEmit`: exit 0.
- logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6 — wszystkie exit 0.
- admin-dismiss-confirm-test: WSZYSTKO ZIELONE. ui-text-leftovers-test: WSZYSTKO ZIELONE.
- ui-text-leftovers-test na BAZIE (pliki 38d145144 jako argumenty): FAIL 5 (A2, A3, B1, B2, C1), exit 1 — test dyskryminujący, czerwony na bazie.
- Regeneracja `bundle-wiki-for-game.cjs` na kandydacie: `cmp` — plik IDENTYCZNY z zacommitowanym wikiBundle.json (bundle nie edytowany ręcznie).
- diplo-civpedia-values-test: 129 sprawdzeń, PASS.
- civpedia-*/pr141-matrix: czerwone budynki-historia, jednostki-j1, jednostki-j2 — czerwone także na bazie (potwierdzone na 38d145144; pliki poza diffem). civpedia-caly-wiersz-przyciskiem-test: flaky (na BAZIE raz 85/85, raz 84/85 — ta sama asercja [6] unit/falanga); nie jest regresją kandydata.
- Weryfikacja UI w Chromium (HTTP/Vite): NIE_ZMIERZONO — zmiana to jeden rzeczownik w stałym tekście okna; pokryta testem statycznym i admin-dismiss-confirm-test, nagłówek `titleFor` = „Administrator państwa” potwierdzony w kodzie.

ZARZUTY: brak (lista pusta). Samodzielna weryfikacja zgodności z GOAL: tekst okna dla miasta „miasta”, dla pozostałych „państwa” = nagłówek; hasło Zaufanie bez „jeszcze niewdrożone”, treść reguł niezmieniona (tylko nagłówek).

BLOKADY: brak.

UWAGI-DLA-ORKIESTRATORA:
1. Fraza „zasady jeszcze niewdrożone” nadal w sekcji `poradnik` bundla (docs/PORADNIK-GRACZA/12-dyplomacja.md l.8) — poza allowlistą; osobny temat. Test B1 zawężony do sekcji `encyklopedia` zgodnie z GOAL (hasła Civpedii).
2. „Zasady niewdrożone” w moc-podzial.md/respekt.md i „zasada niewdrożona” (siła militarna) w hasłach dyplomacji — nie dokładna fraza; wg tasków #337–#339/#347 mogą być nieaktualne; do weryfikacji osobno.
3. Dług bazowy: civpedia-budynki-historia, jednostki-j1/j2 czerwone; caly-wiersz flaky.

RUNDY: Final Control po rundzie 1/5.
NASTĘPNY KROK: integracja orkiestratora (merge do aktualnego main, regeneracja wikiBundle narzędziem jeśli konflikt, bramki), potem deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
