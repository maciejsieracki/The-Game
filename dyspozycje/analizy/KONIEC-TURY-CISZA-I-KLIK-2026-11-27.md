# Koniec tury: cicha bramka w cyklu HUD i klik t2→t3 (R-WEB-ENDTURN-QUIET-CLICK-Q1, ENDQUIET)

Baza: origin/main 5d5a38a51. Operator HAIKU 5.5, runda 1/5.

## 1. Co jest w kodzie (dowód statyczny, zmierzone)

- `gra/src/ui/bottomBarHud.ts`: cykl `syncEndTurnState` co 500 ms wywołuje `config.canEndTurn()`.
  `render()` też wywołuje ten odczyt.
- `gra/src/main.ts` przed poprawką: `canPlayerInitiateEndTurn()` zawierała 10 wywołań
  `console.warn('[EndTurn] blocked: …')` (gałęzie: playtestWalkaActive, awaitingFirstPlayerCity,
  preBattleOpen, galleryOn, gameOver, endTurnInProgress, aiTurnAwaitingBattle/resume, oferta
  handlowa AI, NNS, oczekujący pokój wymuszony). Funkcja jest też wołana z cyklu HUD.
- Mechanizm: w stanie zablokowanym każdy tick cyklu z tą gałęzią daje wpis w konsoli,
  czyli do 2 wpisów/s (500 ms). Częstość w grze NIE ZMIERZONO (patrz sekcja 3).

## 2. Poprawka (zakres: tylko logi, zero zmian bramek)

- `canPlayerInitiateEndTurn(quiet = false)`. Każde `console.warn` w funkcji jest bramkowane
  `if (!quiet)`. Wynik funkcji i `healStaleEndTurnBlockers()` bez zmian.
- HUD `config.canEndTurn` przekazuje `quiet=true` (cykl i render).
- Klik gracza (`endActiveHumanTurn`, `advanceSeat`) wywołuje wersję głośną. Log przy kliknięciu zostaje.
- Test: `gra/tools/endturn-quiet-test.cjs` (statyczny, 6 asercji).
  - Przed poprawką (main.ts z 5d5a38a51): 3 PASS / 3 FAIL (czerwony).
  - Po poprawce: 6 PASS / 0 FAIL (zielony).

## 3. Pomiary

- PRZED / PO tabela stan × wpisy/30 s (stany a–d z dispatchu): NIE ZMIERZONO.
  Powód: pomiar wymaga przeglądarki z pełną grą (build vite poza repo, nowa gra na maksimum,
  sterowanie stanami). Nie wykonano w tej rundzie. Zmiana jest jednak deterministyczna
  (warunek `!quiet` na każdym wpisie), więc PO = 0 wpisów z cyklu wynika z kodu, a nie z pomiaru.
- Klik t2→t3 na żywo (seed 4242/7, do 3 prób co 5 s): NIE ZMIERZONO. Problem z ENDPERF
  (przejście t2→t3 nieobecne 120–240 s przy canEnd=true) pozostaje nierozstrzygnięty.
  Nie stwierdzono w kodzie przyczyny po stronie klikania: poprawka nie zmienia ścieżki kliku.
  Rozstrzygnięcie artefakt/błąd wymaga pomiaru live w następnej rundzie.

## 4. Bramki (surowe wyniki w tej rundzie)

- `npx tsc --noEmit`: exit 0.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/tech-tree-test.cjs`: 20 pass, 0 fail.
- `node tools/research-test.cjs`: PASSED 33 / FAILED 0 / TOTAL 33.
- `node tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21).
- `node tools/combat-test.cjs`: COMBAT TEST 6/6 pass.
- `node tools/ai-test.cjs`: 297 passed, 0 failed.
- `node tools/society-breakdown-test.cjs`: 56 OK, 0 FAIL.
- `node tools/ai-city-order-need-wiring-test.cjs`: 267 passed, 0 failed (of 267).
- `node tools/endturn-aria-sync-test.cjs`: 5 PASS / 0 FAIL (stan przycisku nadąża ≤500 ms).
- `node tools/endturn-quiet-test.cjs`: 6 PASS / 0 FAIL.

## 5. Otwarte

- Tabela PRZED/PO (pkt 1 dispatchu) i klik t2→t3 (pkt 3) do wykonania na żywo w osobnym temacie.
