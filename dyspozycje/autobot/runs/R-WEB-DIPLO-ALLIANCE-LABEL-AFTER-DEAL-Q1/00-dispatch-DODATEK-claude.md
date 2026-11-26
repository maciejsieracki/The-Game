# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = args.cand)
## Tropy
- dyspozycje/analizy/ZNIKANIE-SOJUSZY-AI-2026-11-25.md i SOJUSZE-PODMIANA-WZORZEC-2026-11-25.md: status relacji zostaje „sojusz” po zniknięciu umowy; mechanizm w main.ts: syncRelationFro… (nazwa zbliżona; grep -n "syncRelation" gra/src/main.ts) oraz 8 ścieżek usuwania umowy sojuszu (w tym odmowa-sojuszu-finalize ~26224, wasalizacja, wygaśnięcie, zerwanie).
- Zmiana: przy KAŻDYM usunięciu umowy sojuszu relacja pary wraca do statusu pokoju (zachowaj pozostałe pola relacji: zaufanie itd., chyba że kod dla innych końców sojuszu robi inaczej — opisz). Nie zmieniaj limitu 2 sojuszy, tylko czyść relację w jednym miejscu (zaleca się wspólny punkt zmiany relacji).
- RYZYKO (wymaga pomiaru): podmiana sojuszu AI↔AI (okno 1 tura i natychmiastowe odnowienie) mogła opierać się na pozostającej relacji „sojusz”. Po zmianie sprawdź, czy AI nadal może podpisać nową umowę oraz czy liczba sojuszy AI nie spada drastycznie. Pomiar PRZED/PO: runner gra/tools/limits-measure.cjs lub diplomacy-harder-measure-run.cjs (seed 4242 i 7, do t67); jeśli Chromium nie startuje (SIGSEGV, znany problem #90) — NIE ZMIERZONO z powodem, ale test jednostkowy/źródłowy obowiązkowy.
## Testy
Nowy gra/tools/alliance-label-clean-test.cjs (usunięcie umowy → relacja nie jest „sojusz”; ponowne podpisanie możliwe; mutacja czerwona); przejrzyj testy alliance-*, limits-measure, alliance-limit-ai-t66, ai-ai-alliance-*, diplo-* i zaktualizuj asercje kodujące stary kontrakt (wypisz).
## Allowlista
gra/src/main.ts (tylko miejsce zmiany relacji przy usuwaniu sojuszu), gra/src/game/diplomacy-*.ts jeśli tam leży rdzeń, nowy test, zaktualizowane testy sojuszy, dyspozycje/autobot/runs/R-WEB-DIPLO-ALLIANCE-LABEL-AFTER-DEAL-Q1/** (+ dane pomiaru).
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana wartości balansu poza zakresem, osłabianie asercji (zmiana asercji dozwolona WYŁĄCZNIE dla testów kodujących stary kontrakt — wypisz je w raporcie z uzasadnieniem), git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash. Dysk >= 4 GB; usuń node_modules po bramkach.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; testy tematu; nowy test z mutacją czerwoną na rdzeniu. Zacommituj i zwróć SHA.
## DECISION_REQUIRED
Jeśli pomiar pokaże, że liczba sojuszy AI spada o >30% względem stanu przed zmianą — zwróć DECISION_REQUIRED z jednym zdaniem konfliktu per wariant (bez rozwiązania).
## Binarne kryterium
Relacja czyszczona przy KAŻDYM końcu umowy sojuszu; AI może ponownie zawrzeć sojusz; pomiar przed/po opisany (ZMIERZONO lub NIE ZMIERZONO z powodem); bramki zielone.
