STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-D-Q1
GOAL: Operator r2 (obrona) — odpowiedź na zarzuty Evaluatora r1 (Z1, Z2) dla partii UI-2-D (`P5-REPIN-UI-2.md` §6).

ZMIANY/COMMIT (branch `ui2d-q1-r2` od `ui2d-q1-r1` `423fcd741`; kod r1 `e0eef2b84` bez zmian):
- `10ec208db` `tools/dom-harness/mutate-cycles.mjs`: H11 zastąpiona (`  if (mag) {` → `  if (mag && false) {` — wiersz produkcji
  `cp-prod-line` w `formatImprovementDesc`); nowa H14 (`  if (terrainMagazyn.length > 0) {` → `… && false` — blok „Surowce z terenu
  (przy 👤)”). `mutate-c4.mjs`, `mutate-level2.mjs`: opcjonalne `--only <ID,…>` (jak w `mutate-cycles`), bez `--only` zachowanie bez zmian.
- `f012dc7d3` `P5-REPIN-UI-2.md` §6: punkt r2 z wynikami.
- Ten raport: commit z SHA w `git log`.

ODPOWIEDZI:
- Z1 — PRZYJMUJĘ. Odtworzone przed poprawką: `--only H11` → „BŁĄD wzorzec występuje 0× NIEWYKRYTA”, EXIT=1. Po poprawce
  `--only H11,H14`: H11 WYKRYTA (`hex(imp:stadnina@laka/brak)#0/false`), H14 WYKRYTA (`hex(laka/brak/false)#0/true`), EXIT=0.
  H11 nie usunięta — przecelowana na nową gałąź.
- Z2 — PRZYJMUJĘ. Pełne bramki uruchomione na nakładce (pin `edb8fb56` + `repin-ui2-overlay` z web `86d510c66`), w porcjach
  `--only` (limit 570 s/wywołanie, obciążenie hosta ~8):
  - mutate-cycles: 67/67 wykryte (H1–H14, S1–S2, B1–B5, N1–N3, T1–T26 bez T21, A1–A18).
  - mutate-c4: 20/20 wykryte (C1–C18 w pierwszym przebiegu, C19–C20 przez `--only`).
  - mutate-level2: 34/34 wykryte (L1–L34; L5–L7 = buildModeHud).
  Uwaga: A7 w jednym przebiegu dało EXIT=2 („Build failed”, przy 659 MB wolnego dysku); powtórzone osobno → EXIT=1 WYKRYTA.
  Porcje przerwane przez timeout zostawiły zmutowany plik (`preBattle.ts`, `diplomacyTradeBasket.ts`, `wonderAdapter.ts`) —
  każdy przywrócony `git checkout --` i sprawdzony `git status` przed kolejną porcją.

TESTY (po poprawce): `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (pin 433/0, UI-2 4/0, overlayPorts 3); `run-cycles` na
nakładce 6401/0, jsdomErrors 0, consoleErrors 0; `node --check` 3 skryptów OK; `git diff --check` czysty. `run-repin-ui2d`
nie powtarzany (kod portu bez zmian względem r1).

BLOKADY: brak. NIE_ZMIERZONO (bez zmian od r1): GPU/natywne okno Tauri; producent Rust nowych pól DTO.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-UI-2-D-Q1 r2.
DEPLOY/PUSH: NIE WYKONANO
