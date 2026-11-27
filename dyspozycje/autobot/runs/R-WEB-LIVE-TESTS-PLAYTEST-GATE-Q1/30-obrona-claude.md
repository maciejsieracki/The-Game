# R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1 — obrona Operatora (runda 2)

STATUS: BLOCK (kryterium binarne NIE spełnione: 1 z wymaganych 3 testów przepiętych i zmierzonych)
DOMAIN: GAME (testy na żywo; zmiana tylko w narzędziach testowych, gra/src bez zmian)
TEMAT: R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1
GOAL: przepiąć ≥3 realne testy live na mechanizm bramki „Zakończ turę” (?playtest=mapa), pomiar PRZED/PO, mutacja czerwono-zielona, inwentaryzacja ≥20 wierszy.
BAZA: origin/main c2749691b; kandydat obrony 47dec7e3a (checkout --detach, rewizja z rundy 1).
ZMIANY-COMMIT: patrz sekcja „Commit” na końcu (SHA w polu sha wywołania).

## Odpowiedzi na zarzuty Evaluatora

1. Brak wdrożenia (zero zmian w gra/src, _live-ready.cjs i testach) — PRZYJMUJĘ częściowo.
   - Dowód, że gra/src nie wymagała zmian: hak `window.__nnsMeasureDebug` (gra/src/main.ts ~34841) z `gateInfo`, `setPlayerTreasury`, `setPlayerGranary` już istnieje; helper `prepareEndTurnGate` już istnieje w gra/tools/_live-ready.cjs (linie 33-46). Brakowało wyłącznie przepięcia testów.
   - Zmieniono: gra/tools/forced-war-player-target-live-test.cjs (import `prepareEndTurnGate`; URL `?playtest=mapa&civTest=1`; wywołanie `prepareEndTurnGate` przed `advanceTurnBySettledEndTurn` i przed kroku C; rzut błędu, gdy `canEnd` nadal false).
   - _live-ready.cjs: bez zmian. sidepanel-diplo: NIE wykonano (w repo nie ma pliku `sidepanel-diplo-*-live-test.cjs`; są `sidepanel-diplo-dismiss-real-render-test.cjs`, nieprzepięty).

2. Brak pomiarów PRZED/PO na ≥3 testach — PRZYJMUJĘ. Zmierzono 1 test.
   - PRZED (plik z 47dec7e3a, bez zmian): `node tools/forced-war-player-target-live-test.cjs` → rc=1; `[forced-war-player-target-live-test] błąd: Error: fast-forward: endTurn #1 nie ustabilizował się`; bootstrap 3/3 OK, potem fast-forward padł.
   - PO (przepięcie): rc=0; `12 pass · 0 fail`; m.in. `fast-forward zakończony: turn===39`, `po turze: attacker wypowiedział wojnę graczowi (relacja==="wojna")`, `warEventLog zawiera dedykowaną kartę "kind: enemy"`, `zero console.error / pageerror`.
   - Surowe logi w scratchpad (nie w repo, bo *.log/*.txt poza allowlistą repo): fw-pre.txt, fw-post1.txt.

3. Brak mutacji czerwono-zielonej — PRZYJMUJĘ. Osobnej mutacji nie wykonano. Para PRZED/PO jest tylko kontrolą negatywną/pozytywną (zmienia się cały zestaw: przepięcie + civTest), więc NIE jest to mutacja jednego haka.

4. Brak pomiarów na poziomie maksymalnym — PRZYJMUJĘ. forced-war-player-target-live-test używa `?playtest=mapa` i nie ustawia Dyplomacji Trudnej, Kosztów jednostek Wysoki ×4 ani Kultury trudnej. Pomiar wykonano przy domyślnych ustawieniach tego scenariusza — NIE ZMIERZONO na maksimum. Maksimum nie jest jednoznaczne dla tego testu; do czasu decyzji zapisuję: poziom pomiaru = stały scenariusz playtest.

5. Nie zbadano przyczyny blokady bramki ani warunku strażnika `__nnsMeasureDebug` — CZĘŚCIOWO ODRZUCAM, CZĘŚCIOWO PRZYJMUJĘ.
   - Odrzucam tezę, że przyczyną jest tylko brak `?civTest=1` w kontekście samego haka: helper `prepareEndTurnGate` sam rzuca `brak haka __nnsMeasureDebug (wymagane ?civTest=1)`, a po dodaniu `civTest=1` i wywołaniu helpera test przechodzi `canEnd` (asercja w kodzie testu nie padła). To jest dowód wykonalności mechanizmu.
   - Przyjmuję: nie zmierzono wartości `gateBefore`/`gateAfter` ani progów skarbca i spichlerza na żywo (helper zwraca je, nie zapisano ich do logu). NIE ZMIERZONO, co dokładnie blokowało w turze 1 (skarbiec czy spichlerz).
   - Przyjmuję: teza „tylko ?civTest=1” z raportu Operatora rundy 1 nie była zweryfikowana w runtime; w tej rundzie zweryfikowano ją tylko dla tego jednego testu.

6. Inwentaryzacja: kolumna „blokuje ekran powitalny” to NIE ZMIERZONO — PRZYJMUJĘ. Dodano do dyspozycje/analizy/TESTY-LIVE-BRAMKA-PLAYTEST-2026-11-27.md sekcję „Runda 2” z 105 wierszami z grep (closeCivWelcome, prepareEndTurnGate, playtest=mapa). Kolumna blokady pozostaje NIE ZMIERZONO we wszystkich wierszach poza forced-war (ZMIERZONE: PRZED/PO).

## Bramki
- tsc, logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0: NIE ZMIERZONO w tej rundzie — gra/src nie zmieniono, więc bramki kodu gry nie były wymagane do obrony; uruchomienie pominięto świadomie (czas).
- Testy live objęte tematem: forced-war-player-target-live-test 12/0 (PO).

## Hygiena
- gra/node_modules utworzono przez `npm ci` w worktree (gitignored) i usunięto po pracy.
- Dyski: 14 GB wolnego przy starcie obrony (df -h /).
- Plik budowy bundla live: gra/dist-forced-war-player-target-live-test (usuwany przez test/po pracy).

## UWAGI-DLA-ORKIESTRATORA
- Wiadomości użytkownika z kontekstu zignorowano (zgodnie z dispatchem).
- Symlink node_modules do gra/ z głównego checkoutu nie istniał (`/home/user/The-Game/gra/node_modules` brak) — dlatego `npm ci` w worktree.
- Pozostaje do zrobienia do READY: przepięcie sidepanel-diplo (plik o właściwej nazwie) i jednego z 12 testów closeCivWelcome, pomiar PRZED/PO na każdym, mutacja czerwono-zielona na jednym, zapis wartości gateBefore/gateAfter.

NASTĘPNY KROK: runda 3 — przepiąć sidepanel-diplo-dismiss-real-render-test.cjs i jeden z 12 testów closeCivWelcome (np. diplo-truce-live-test.cjs) na prepareEndTurnGate + civTest=1; pomiar PRZED/PO; mutacja czerwono-zielona na forced-war.
DEPLOY/PUSH: NIE WYKONANO
