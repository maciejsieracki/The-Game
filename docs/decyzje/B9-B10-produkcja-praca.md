# B9-Q1 + B10-Q1 — Zebrana Praca i overflow

**B9:** B — `Math.round` tylko w UI „Zebrana Praca”; silnik zostaje float.

**B10:** A — nadwyżka pracy po ukończeniu ostatniego elementu kolejki przechodzi na następny w kolejce; pusta kolejka → `playerPracaPool`.

**Wdrożenie (2026-07-07):**
- UI: `Math.round(prod.postep)` w `renderProd`.
- Silnik: `production.ts` → `overflowToPool`; `main.ts` dodaje do puli gracza po `advanceProduction`.

**Status:** ✅ WDROŻONE
