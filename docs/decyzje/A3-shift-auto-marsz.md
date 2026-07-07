# A3-Q1 — Shift+click auto-marsz

**Decyzja:** A — Shift+click: podgląd trasy wielu tur + etykieta „X tur” + auto-marsz co turę do celu.

**Wdrożenie (2026-07-07):**
- `main.ts`: stan `autoMarch`, `estimatePathTurns`, `continueAutoMarchAfterTurn`, `beginMoveSelectedUnitTo(..., shiftHeld)`.
- `units.ts`: `setPathRoute` z opcjonalną etykietą tur przy celu.

**Status:** ⚪ **ZMIENIONA** — zastąpiona przez **A3-P0-REDESIGN** (`A3-marsz-sciezka-2026-07-07.md`, Maciej 2026-07-07 wieczór). MVP w kodzie do refactoru.
