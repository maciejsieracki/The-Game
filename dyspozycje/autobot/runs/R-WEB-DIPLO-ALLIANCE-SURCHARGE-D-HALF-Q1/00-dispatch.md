# R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-HALF-Q1 — dopłata D sojuszy AI↔AI: 1,0 → 0,5 (decyzja właściciela 2026-11-22, zgoda na start 2026-11-25)

DOMAIN: GAME | Operator HAIKU 5.5 | runda 1/5 | BAZA KODU = origin/main aa96cfc618de124e48b74408870115854293e6c5 (FALA 890). Deploy na ROBOCZĄ jako FALA 892 po Final Control (po FALI 891 polar, jeśli wcześniej gotowa; numer ustala orkiestrator).

## Kontekst
Dopłata D (osobny parametr w sojuszach AI↔AI; Dyplomacja B, FALE 848/849/851/853) ma dziś wartość 1,0. Właściciel zdecydował: 0,5. Znajdź parametr (grep: surcharge, doplata, allianceSurcharge, 'dopłata D' w gra/data/*.json i gra/src/game/*alliance*/*diplo*; dyspozycje/analizy ma wcześniejszą analizę/pomiar dopłaty D). Zasada stała właściciela: nowe mnożniki są DODATKOWE i mnożą obecne współczynniki — tu zmieniasz WYŁĄCZNIE tę jedną wartość.

## Zadanie
1. Zmień wartość dopłaty D z 1,0 na 0,5 w jednym źródle prawdy (plik danych/stała), bez zmian reszty dyplomacji (progi, sojusze, koalicje, poziomy „Dyplomacja i wojna” bez zmian).
2. Testy: istniejące testy pinujące 1,0 → re-pin na 0,5 z uzasadnieniem w raporcie; nowy/zmodyfikowany test dowodowy: dopłata D = 0,5 w ścieżce liczenia sojuszu AI↔AI; mutacja (powrót do 1,0) → czerwony — pokaż.
3. Pomiar kierunkowy NIE jest wymagany (napisz NIE ZMIERZONO skutku w grze).

## Allowlista
plik danych/stała dopłaty D (znajdź), testy sojuszy/dyplomacji wymagające re-pinu (uzasadnij każdy), nowy test gra/tools/diplo-alliance-surcharge-d-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-HALF-Q1/**.

## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana innych parametrów dyplomacji, rm/rmdir/unlink, git add -A, push, NOWE SESJE/ZADANIA/HARMONOGRAMY (spawn_task, create_session, create_trigger, send_later — NIGDY), run_in_background. Operator nie integruje i nie deployuje. Dysk ≥ 4 GB; npm ci w gra/ w swoim worktree.

## Bramki
tsc --noEmit exit 0; logic-test 213, tech-tree-test 20, research-test 33, unit-replace-test 21, combat-test 6; testy dyplomacji/sojuszy (gra/tools/*alliance*, *diplo*, *coalition*) — surowe liczby; nowy test zielony z mutacją czerwoną. ZACOMMITOWAĆ i zwrócić SHA.

## Binarne kryterium
PRAWDA: dopłata D = 0,5 w jedynym źródle prawdy, żadna inna wartość dyplomacji niezmieniona, testy i bramki zielone.
