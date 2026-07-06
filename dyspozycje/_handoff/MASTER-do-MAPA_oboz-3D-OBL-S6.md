# MASTER → MAPA — Obóz oblężniczy 3D (OBL-S6, C3-Q10=C)

**Data:** 2026-06-27  
**Blokada:** wykonaj **po** SILNIK OBL-S5 (machiny w stanie gry)  
**Źródło:** `gra/src/siegepreview/` (podgląd HTML)

## Do zrobienia

1. Hook w `SiegeMarkerRenderer` — modele obozu + taran/katapulta/wieża per hex sąsiada.
2. Kontrakt stanu z SILNIK: `siegeMachines.ready[]`, `oblegajacyOwnerId`.
3. Bez zmiany logiki głodu/kapitulacji — tylko render.

## DoD

- [ ] Playtest: oblężenie Rzymu — widać obóz 3D (nie tylko pierścień)
- [ ] Handoff `MAPA-do-MASTER_oboz-3D-GOTOWE.md` → SILNIK wpina jeśli potrzeba 1 linii w main

**Status:** **→ INTEGRATOR: GOTOWE** (moduł MAPA 2026-06-29)
