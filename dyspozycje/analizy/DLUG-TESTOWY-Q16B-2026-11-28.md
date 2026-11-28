# DLUG-TESTOWY-Q16B (2026-11-28) — piny nagłówka canPlayerInitiateEndTurn po ENDQUIET

## Stan wiążący

- Kod gry bez zmian: `git diff b075137340b553e5f6b599c5bc17460d624390c0 -- gra/src` (oraz `gra/data`) = pusty.
- Baza testów: origin/main `b075137340b5` (pin nagłówka wciąż stary → 5 testów czerwonych).
- Zmiany testów (już w commicie WIP `a87d15ddd`, zweryfikowane niezależnie w tej rundzie): nagłówek `canPlayerInitiateEndTurn(quiet = false): boolean` w 5 testach; w `diplomacy-sensible-deals-main-guard-test` mutacja „usunięcie blokady końca tury” zaktualizowana do `if (!quiet) console.warn(...)`; w `load-game-blockers-exec-test` dopisano zaślepki (resety sesji, `eventDeferQueue`, `nnsGateForPlayer`, `prunePendingForcedPeace`, `pendingForcedPeaceTreaties`).
- Wynik na `a87d15ddd`: 5/5 zielone (diplo-forced-peace 40/0, diplomacy-sensible-deals 22/0, koniec-tury-f1-f4 39/0, koniec-tury-g1-g2 41/0, load-game-blockers 15/0).
- Wzmocnienie wzorca: NIE osłabiano. Wymagana jest nowa sygnatura; wzorce nadal sprawdzają treść bramki.

## Klasyfikacja (wszystkie 5 = A)

| Test | Przed (b075137) | Padająca asercja | Przyczyna | Po (a87d15ddd) |
|---|---|---|---|---|
| diplo-forced-peace-pending-test | 39/1 | `g: bramka „Zakończ turę” sprawdza oczekujący pokój wymuszony` (wzorzec szuka ciała po starym nagłówku) | A | 40/0 |
| diplomacy-sensible-deals-main-guard-test | 20/2 | `realne main.ts: blokada końca tury…` + mutacja „usunięcie blokady końca tury” (fragment nie istnieje) | A | 22/0 |
| koniec-tury-f1-f4-runda3-test | 37/2 | `[F3-A1]` (nie znaleziono funkcji), `[F3-A2]` (ciało po starym nagłówku) | A | 39/0 |
| koniec-tury-g1-g2-runda4-test | 39/2 | `[A-order-setup]`, `[A-order]` (healStale jako pierwsza instrukcja) | A | 41/0 |
| load-game-blockers-exec-test | RC 1 | `TypeError: env.api.canPlayerInitiateEndTurn is not a function` (brak ekstrakcji po starym nagłówku) | A (+ zaślepki po FALACH 931–936) | 15/0 |

## Dowód mutacją (kopia `gra/src/main.ts`, mutacja → test czerwony → przywrócenie → test zielony)

| Asercja | Mutacja | Wynik |
|---|---|---|
| diplo g (bramka pokoju wymuszonego) | usunięta linia `pendingForcedPeaceTreaties.length > 0` w bramce | FAIL g (39/1) |
| F3-A2 (hasPendingAutoPreBattle) | `isPreBattleOpen() || hasPendingAutoPreBattle()` → `isPreBattleOpen()` | FAIL F3-A2 |
| F3-A1 (nagłówek) | zmiana nazwy funkcji w main.ts | FAIL F3-A1 i F3-A2 |
| A-order (healStale jako pierwsza) | usunięte wywołanie `healStaleEndTurnBlockers();` | FAIL A-order |
| diplomacy „blokada końca tury” | wbudowana mutacja testu (7 mutacji) | wszystkie 7 czerwone (PASS: mutacja …) |
| load-game L1/L2 | wbudowane mutacje M1, M2 | czerwienią L1 i L2 |

Po każdej mutacji `main.ts` przywrócono z kopii; `git diff -- gra/src` = pusty.

Mutacja „usunięcie blokady `aiTurnAwaitingBattle`” NIE czerwieni load-game ani F1-F4 (te testy nie sprawdzają tej gałęzi). Nie jest to naprawiana asercja; nie zgłaszam jej jako luki w tym temacie.

Stan zaślepek load-game: wariant bez zaślepek resetów → `ReferenceError: resetNeighborTenureSession is not defined`; wariant bez `eventDeferQueue` → `ReferenceError: eventDeferQueue is not defined`. Zaślepki są więc wymagane. NIE ZMIERZONO osobno dla `nnsGateForPlayer`, `prunePendingForcedPeace`, `pendingForcedPeaceTreaties`.

## Skan: testy z wzorcem canPlayerInitiateEndTurn

Pierwsze wyszukanie w `gra/tools/*.cjs` znalazło 18 plików z tekstem `canPlayerInitiateEndTurn`. Wzorzec sygnatury `function canPlayerInitiateEndTurn(): boolean` występuje w 6 plikach (5 testów z tematu + `endturn-battle-deadlock-exec-test`, gdzie stary nagłówek jest tylko w liście historycznej).

| Test | Przed (b075137) | Po (a87d15ddd) | Uwagi |
|---|---|---|---|
| endturn-battle-deadlock-exec-test | 49/0 | 49/0 | stary nagłówek jako baza historyczna w liście; bez zmian |
| endturn-battle-deadlock-test | 38/0 | 38/0 | bez zmian |
| endturn-quiet-test | 10/0 | 10/0 | bez zmian |
| no-negative-stocks-end-turn-gate-levers-test | 34/0 | 34/0 | bez zmian |
| no-negative-stocks-endturn-test | 19/0 | 19/0 | bez zmian |
| ai-wojny-zwykle-cap-dwa-miasta-test | 2 PASS / 2 FAIL | 2 PASS / 2 FAIL | Chromium + vite build; FAIL „fast-forward: endTurn() nie osiągnął settled” w turze 17. Nie zależy od nagłówka (przed i po identycznie). Przyczyna NIE ZBADANA; osobny temat. |
| hotseat-drugi-fotel-tura-test | RC 2 | RC 2 | Chromium: timeout `.civ-newgame .start`. Środowisko przeglądarki, nie nagłówek. NIE ZBADANO dalej. |

Pominięte (live, Chromium/bundle; nie uruchamiane w tej rundzie): forced-war-iron-player-target-live-test, forced-war-player-no-contact-live-test, forced-war-player-target-live-test, war-era-counter-live-test, perf-long-session-live-test. Odwołują się do funkcji (wywołania), nie do sygnatury; nie sprawdzono, czy są zielone.

Uwaga: dwa testy uruchomiły `vite build` do katalogu w `/tmp` (wymóg testu, nie `npm run build`). Katalog `/tmp/civ-hotseat-drugi-fotel-tura-*` usunięto po teście.

## Bramki

- `git diff -- gra/src` = pusty (kod gry nietknięty).
- tsc / logic 213 / ai-test 297 — NIE ZMIERZONO w tej rundzie (dispatch wymienia je jako bramki kodu; kod gry bez zmian, więc nie uruchamiałem pełnych bramek).
