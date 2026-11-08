# R-CIV-ALL-TOPICS-ROBOCZA-20261027 — Operator: długie tury i watchdog końca tury

STATUS: **PASS — poprawka jest już obecna w kandydacie i przeszła walidację operatora.**
ROLA: Operator · kontrola dokładnego wspólnego checkoutu; bez dodatkowej zmiany kodu w tej fazie.
BAZA: branch `integration/robocza-all-topics-20261027`, bazowy HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`.

## Cel i ustalenie

Stress test dużej rozgrywki pokazał powtarzające się logi `Force-clearing stuck transition (>8s)` podczas rzeczywistej asynchronicznej fazy EOT. Pasywny odczyt HUD mógł więc skasować blokadę aktywnej tury i dopuścić ponowne uruchomienie końca tury.

W bieżącym kandydacie `main.ts` ma marker `activeWorldEndTurnPipeline`: jest włączany przed uruchomieniem asynchronicznego potoku świata i wyłączany w jego `finally`. `healStaleEndTurnBlockers()` pomija wszystkie czyszczenia AI-resume, blokady tury i overlayu, gdy potok nadal działa; po zakończeniu potoku dotychczasowe sprzątanie rzeczywiście osieroconych flag/overlayu pozostaje aktywne.

Test wykonawczy `endturn-battle-deadlock-exec-test.cjs` wyciąga i wykonuje rzeczywisty healer z `main.ts`. Nowy scenariusz I ustawia aktywny EOT starszy niż 9 s wraz z overlayem i flagami AI, wywołuje healer dwukrotnie jak pasywny polling HUD i sprawdza, że wszystkie stany pozostają. Następnie wyłącza marker i sprawdza sprzątnięcie starej blokady oraz samotnego overlayu. Test obejmuje też dotychczasowe ścieżki kolejki, watchdogu bitwy, legalnych modalów i kontrole mutacyjne.

## Wyniki

- `node tools/endturn-battle-deadlock-exec-test.cjs` — **49 PASS / 0 FAIL**, w tym nowe I1–I3.
- `node tools/koniec-tury-g1-g2-runda4-test.cjs` — **41 PASS / 0 FAIL**, w tym asercje markera w healerze i async EOT.
- `node tools/load-game-blockers-exec-test.cjs` — **15 PASS / 0 FAIL**.
- `npm run typecheck` — **PASS**.
- `git diff --check` — **PASS**.

Nie wykonano pełnego długiego przeglądu gry przez UI dla tego konkretnego błędu. Poprawka usuwa ryzyko błędnego odblokowania aktywnego potoku; sama nie rozwiązuje pozostałego kosztu dużej tury. Niezależny Evaluator i Final Control pozostają wymagane dla całego kandydata.

NASTĘPNY KROK: niezależny Evaluator tej poprawki i całościowego kandydata; potem Final Control.
DEPLOY/PUSH: nie wykonano.
