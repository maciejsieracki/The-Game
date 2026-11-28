# DLUG-TESTOWY-Q16B (2026-11-28) — piny nagłówka canPlayerInitiateEndTurn po ENDQUIET

## Stan wiążący (runda 2 obrony, commit obrony w polu sha raportu 30-obrona-claude.md)

- Kod gry bez zmian: `git diff b075137340b553e5f6b599c5bc17460d624390c0 -- gra/src gra/data` = pusty (zmiany tematu są tylko w `gra/tools/` i `dyspozycje/`).
- Baza testów: origin/main `b075137340b5` (pin nagłówka wciąż stary → 5 testów czerwonych).
- Zmiany testów (commit WIP `a87d15ddd`, zachowane w `c5ce9978f`): nagłówek `canPlayerInitiateEndTurn(quiet = false): boolean` w 5 testach; w `diplomacy-sensible-deals-main-guard-test` mutacja „usunięcie blokady końca tury” zaktualizowana do `if (!quiet) console.warn(...)`; w `load-game-blockers-exec-test` zaślepki (resety sesji, `eventDeferQueue`, `nnsGateForPlayer`, `prunePendingForcedPeace`, `pendingForcedPeaceTreaties`).
- **Runda 2 (obrona):** bramka NNS w `load-game-blockers-exec-test` jest teraz pokryta: `nnsGateForPlayer` sterowany przełącznikiem `nnsGateBlockStub`; scenariusz NNS1–NNS3 (blokada włączona → koniec tury zablokowany, wyłączona → dozwolony) oraz mutacja M4 (wycięta bramka NNS w `canPlayerInitiateEndTurn` → koniec tury odblokowany = scenariusz wykrywa usunięcie).
- Wynik na `c5ce9978f` (zmierzone w tej rundzie): diplo-forced-peace-pending 40/0; diplomacy-sensible-deals-main-guard 22/0; koniec-tury-f1-f4-runda3 39/0; koniec-tury-g1-g2-runda4 41/0; load-game-blockers-exec 19/0 (było 15/0 + 4 nowe asercje NNS).
- Wzmocnienie wzorca: NIE osłabiano. Wymagana jest nowa sygnatura; wzorce nadal sprawdzają treść bramki.

## Klasyfikacja (wszystkie 5 = A)

| Test | Przed (b075137) | Padająca asercja | Przyczyna | Po (c5ce9978f, zmierzone r2) |
|---|---|---|---|---|
| diplo-forced-peace-pending-test | 39/1 | `g: bramka „Zakończ turę” sprawdza oczekujący pokój wymuszony` (wzorzec szuka ciała po starym nagłówku) | A | 40/0 |
| diplomacy-sensible-deals-main-guard-test | 20/2 | `realne main.ts: blokada końca tury…` + mutacja „usunięcie blokady końca tury” (fragment nie istnieje) | A | 22/0 |
| koniec-tury-f1-f4-runda3-test | 37/2 | `[F3-A1]` (nie znaleziono funkcji), `[F3-A2]` (ciało po starym nagłówku) | A | 39/0 |
| koniec-tury-g1-g2-runda4-test | 39/2 | `[A-order-setup]`, `[A-order]` (healStale jako pierwsza instrukcja) | A | 41/0 |
| load-game-blockers-exec-test | RC 1 | `TypeError: env.api.canPlayerInitiateEndTurn is not a function` (brak ekstrakcji po starym nagłówku) | A (+ zaślepki po FALACH 931–936) | 19/0 |

## Dowód mutacją

Dowód z rundy 1 (kopia `gra/src/main.ts`, mutacja → test czerwony → przywrócenie → test zielony; NIE powtarzany w rundzie 2, bo `gra/src` nie zmienił się):

| Asercja | Mutacja | Wynik |
|---|---|---|
| diplo g (bramka pokoju wymuszonego) | usunięta linia `pendingForcedPeaceTreaties.length > 0` w bramce | FAIL g (39/1) |
| F3-A2 (hasPendingAutoPreBattle) | `isPreBattleOpen() || hasPendingAutoPreBattle()` → `isPreBattleOpen()` | FAIL F3-A2 |
| F3-A1 (nagłówek) | zmiana nazwy funkcji w main.ts | FAIL F3-A1 i F3-A2 |
| A-order (healStale jako pierwsza) | usunięte wywołanie `healStaleEndTurnBlockers();` | FAIL A-order |
| diplomacy „blokada końca tury” | wbudowana mutacja testu (7 mutacji) | wszystkie 7 czerwone |
| load-game L1/L2 | wbudowane mutacje M1, M2 | czerwienią L1 i L2 |
| load-game NNS (runda 2) | M4: `if (nnsGateForPlayer().blokada) {` → `if (false) {` w `canPlayerInitiateEndTurn` | koniec tury odblokowany mimo blokady NNS → mutacja wykryta (`mutacja M4 ... czerwieni scenariusz NNS`, log `obrona-r2-wyniki.txt`) |

Mutacja „usunięcie blokady `aiTurnAwaitingBattle`” NIE czerwieni load-game ani F1-F4 (te testy nie sprawdzają tej gałęzi). Nie jest to naprawiana asercja; nie zgłaszam jej jako luki w tym temacie.

Stan zaślepek load-game: wariant bez zaślepek resetów → `ReferenceError: resetNeighborTenureSession is not defined`; wariant bez `eventDeferQueue` → `ReferenceError: eventDeferQueue is not defined`. Zaślepki są więc wymagane. Zaślepka `nnsGateForPlayer` nie jest już stała (przełącznik `nnsGateBlockStub`), więc gałąź NNS jest pokryta. `prunePendingForcedPeace` i `pendingForcedPeaceTreaties` NIE ZMIERZONO osobno pod kątem konieczności (nie są sprawdzane żadną asercją w tym teście; pozostają jako zaślepki zgodności).

## Skan: testy z wzorcem canPlayerInitiateEndTurn

Wyszukanie `grep -l canPlayerInitiateEndTurn gra/tools/*.cjs` (ta runda, poprawka liczby z rundy 1, która podawała 18): **25 plików** (lista w `obrona-r2-wyniki.txt` i poniżej).

Stary nagłówek `canPlayerInitiateEndTurn(): boolean` występował w `git grep` na `b07513734` w **6 plikach**: 5 testów tematu + `endturn-battle-deadlock-exec-test` (tam jako wpis w liście historycznej; przebieg 49/0 bez zmian). Po zmianach w `c5ce9978f` żaden plik nie zawiera już starego nagłówka jako wywołania bramki.

Wszystkie 25 plików:

| Test | Przed (b075137) | Po (c5ce9978f) | Status / uwagi |
|---|---|---|---|
| diplo-forced-peace-pending-test | 39/1 | 40/0 | pin naprawiony (klasyfikacja A) |
| diplomacy-sensible-deals-main-guard-test | 20/2 | 22/0 | pin naprawiony (A) |
| koniec-tury-f1-f4-runda3-test | 37/2 | 39/0 | pin naprawiony (A) |
| koniec-tury-g1-g2-runda4-test | 39/2 | 41/0 | pin naprawiony (A) |
| load-game-blockers-exec-test | RC 1 | 19/0 | pin + zaślepki naprawione (A) |
| endturn-battle-deadlock-exec-test | 49/0 | 49/0 | stary nagłówek tylko w liście historycznej; bez zmian |
| endturn-battle-deadlock-test | 38/0 | 38/0 | bez zmian |
| endturn-quiet-test | 10/0 | 10/0 | bez zmian |
| no-negative-stocks-end-turn-gate-levers-test | 34/0 | 34/0 (passed 34, failed 0) | bez zmian |
| no-negative-stocks-endturn-test | 19/0 | 19/0 (passed 19, failed 0) | bez zmian |
| heal-stale-blockers-pending-battle-test | PRZED NIE ZMIERZONO osobno | 23/0 | zmierzone PO. PRZED = PO z konstrukcji: `gra/src` identyczny w `b075137` i `c5ce997`, plik testu nietknięty (wynik w logu `obrona-r2-wyniki.txt`) |
| ai-wojny-zwykle-cap-dwa-miasta-test | 2 PASS / 2 FAIL | nie ponawiano w r2 (wynik z r1: 2/2) | Chromium + vite build; FAIL „fast-forward: endTurn() nie osiągnął settled” w turze 17. Nie zależy od nagłówka (przed i po identycznie w r1). Przyczyna NIE ZBADANA; osobny temat |
| hotseat-drugi-fotel-tura-test | RC 2 | nie ponawiano w r2 (wynik z r1: RC 2) | Chromium: timeout `.civ-newgame .start`. Środowisko przeglądarki, nie nagłówek. NIE ZBADANO dalej |
| hotseat-etap4-noop-test | PRZED NIE ZMIERZONO osobno | przerwany po 580 s (RC 124) w turze 3 | bieg live (Chromium, vite build); w r2 nie zakończył się w limicie czasu, więc wyniku NIE MA. Logi: `/tmp/claude-0/q16b-scan-hotseat-etap4.log`; wcześniejszy log w `runs/` (z innego worktree) pokazuje błąd Chromium. Nie zmieniano go |
| endturn-click-live | — | NIE URUCHOMIONO | sonda live (Chromium); pliku nie ma w starym wzorcu (sygnatura w b075137 nie występuje) |
| endturn-nns-console | — | NIE URUCHOMIONO | sonda live; jw. |
| endturn-perf-probe | — | NIE URUCHOMIONO | sonda wydajności; jw. |
| forced-war-iron-player-target-live-test | — | NIE URUCHOMIONO | test live; odwołuje się do funkcji (wywołanie), nie do sygnatury; jw. |
| forced-war-player-no-contact-live-test | — | NIE URUCHOMIONO | test live; jw. |
| forced-war-player-target-live-test | — | NIE URUCHOMIONO | test live; jw. |
| measure-close-modals | — | NIE URUCHOMIONO | pomiar (nie test z asercjami); jw. |
| measure-forced-peace | — | NIE URUCHOMIONO | pomiar; jw. |
| perf-long-session-live-test | — | NIE URUCHOMIONO | test live; jw. |
| war-era-counter-live-test | — | NIE URUCHOMIONO | test live; jw. |
| world-overlay-midgame-diag-probe | — | NIE URUCHOMIONO | sonda diagnostyczna; jw. |

Uwaga do kolumny „Przed” dla plików spoza zmiany: dla testów nieruchomionych w r2 „Przed” i „Po” to wyniki z r1 (identyczny `gra/src`). Pliki live/sondy nie zawierają starej sygnatury `canPlayerInitiateEndTurn(): boolean` w `b075137` (potwierdzone `git grep`), więc pin ich nie dotyczy; ich ewentualny stan zielony/czerwony NIE ZMIERZONO w tej rundzie.

Uwaga: testy z vite build tworzą katalogi `/tmp/civ-*`. Katalog z przerwanego biegu `hotseat-etap4-noop` usunięto po teście.

## Bramki (ta runda, na `c5ce9978f`, surowe wyjście)

- `npx tsc --noEmit`: exit 0, zero błędów (pusty log).
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- `node tools/ai-test.cjs`: `ai-test: 297 passed, 0 failed`.
- `git diff -- gra/src gra/data` względem `b075137`: pusty (kod gry nietknięty).
