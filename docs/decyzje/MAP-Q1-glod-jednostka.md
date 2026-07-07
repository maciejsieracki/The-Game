# MAP-Q1 — Chip głodu na tokenie jednostki

**Decyzja:** Mały chip (☠) na reprezentancie stosu gdy armia głoduje.

**Wdrożenie (2026-07-07):**
- `armyMerge.ts`: `starvingRepIds` w `StackDisplayInfo`.
- `main.ts`: `syncUnitsRender` ustawia głodujących (owner 0).
- `units.ts`: sprite chipa na stosie.

**Status:** ✅ WDROŻONE
