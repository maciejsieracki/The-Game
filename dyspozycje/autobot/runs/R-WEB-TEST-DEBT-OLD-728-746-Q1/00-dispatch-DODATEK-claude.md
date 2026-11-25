# R-WEB-TEST-DEBT-OLD-728-746-Q1 — starszy dług testowy z FAL 728–746: zmierzyć stan dziś, naprawić stare piny

DOMAIN: GAME (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 29f7ba81a8e9caf8c584ad578dfdead6fa7cfc04. Bez deployu, zero zmian w gra/src i gra/data (błędy gry tylko opisać jako kandydatów R-WEB-*).

## Kontekst
Pozycje z dyspozycje/autobot/KOLEJKA-WEB.md sekcja „DŁUG TESTOWY / OBSERWACJE NIE ZMIERZONO” (źródło: rejestr, wiersze podane w KOLEJKA): FALA 728 recruitment-panel-compact-row (7 FAIL); FALA 729 resource-usage-breakdown, ui-language-count-renderer, citizen-resource-upkeep (2 FAIL), empire-armia-produkcja; FALA 740 martwa sonda ledgerAuditE3c* w main.ts i dziennik AI nie przeżywa zapisu; FALA 744 defense-breakdown-test (TypeError grecy.bonusy), 4 testy pr141 / budynek-civ-bonus-u17; FALA 745 doctrine-live r3 i line-advance-browser (sidecary zwracają HTML); FALA 746 t57 endTurn (przyczyna nierozstrzygnięta). Część mogła zostać naprawiona w tematach Q10–Q14 — NIE ZAKŁADAJ, zmierz.
## Zadanie
1. Dla KAŻDEJ pozycji ustal aktualny stan: uruchom test solo (surowe wyjście, exit, czas; testy live Chromium po jednym, limit 10 min), lub — gdy nie ma pliku testu (np. „martwa sonda”) — sprawdź obecność w kodzie (grep w gra/src) i opisz.
2. Klasyfikuj: JUŻ ZIELONE (dowód), STARY-PIN (popraw test do obowiązującej reguły, komentarz 'R-WEB-TEST-DEBT-Q14' + commit/decyzja, asercji nie osłabiaj, mutacja czerwona), HARNESS, BŁĄD-GRY (minimalne odtworzenie + cytat obowiązującej reguły; test zostaje czerwony; kandydat R-WEB-*, bez pytania), NIE-ZMIERZONO (po wyczerpaniu dowodu, z konkretnym powodem i śladem prób). Martwą sondę ledgerAuditE3c* opisz (czy jest dalej w main.ts, jaki ma koszt) — nie usuwaj kodu gry.
3. Paczki po 5, commit po każdej, raport z tabelą na bieżąco. ZAKAZ statusu BLOCK bez blokady technicznej. git log -S tylko ze ścieżką (gra/src gra/data gra/tools).
## Allowlista
gra/tools/*-test.cjs wskazanych pozycji (i tylko ich), dyspozycje/autobot/runs/R-WEB-TEST-DEBT-OLD-728-746-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build tylko vite --outDir poza repo), zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background. Jeden Chromium naraz; po pracy pkill własnych chrome i usuń node_modules/bundle z /tmp. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0. Zacommituj i zwróć SHA.
## Binarne kryterium
Każda pozycja z listy ma stan dziś z dowodem i klasyfikację; naprawione testy zielone solo z mutacją czerwoną; kandydaci błędów gry opisani; bramki zielone.
