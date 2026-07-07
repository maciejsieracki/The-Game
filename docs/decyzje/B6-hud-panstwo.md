# B6-Q1 — HUD PAŃSTWO tylko gracz

**Decyzja:** A — sumy imperium = wyłącznie cywilizacja gracza (owner 0), nigdy suma mapy / AI.

**Wdrożenie (2026-07-07):**
- `getEmpireHud(oid)` w `main.ts` filtruje `cities.filter(c => c.ownerId === oid)`.
- Pasek W3 w widoku miasta (`buildCityOnlyW3StatItems`): główna liczba = stan imperium gracza (pula pracy, skarbiec, zapasy żywności, bank nauki); tooltip = wkład tego grodu.
- Naprawiono błędny fallback `resolveEmpireSnap` (pracaPool ≠ pracaRate).

**Status:** ✅ WDROŻONE
