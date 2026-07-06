# HANDOFF: CYWILIZACJE/MAPA → SILNIK — pełny klaster obcych typów

**Data:** 2026-06-27  
**Decyzja:** `docs/decyzje/D-START-miasta-kopie-typu.md`  
**Luka:** obcy typ spawnuje **1 stolica** zamiast klastra jak u gracza

## MAPA deliverable

- Rozszerzyć `cluster-spawn.ts` / generator: dla każdego obcego `ikonaId` na mapie → **N miast** z `nazwyKlastra[0..N]` (skala jak rywale menu lub pełne 10 — rekomendacja A z D-START-miasta-kopie-typu.md)
- API handoff do SILNIK: `{ typ, ownerIds[], positions[] }`

## CYWILIZACJE deliverable

- `ai.ts`: profil `kopia_typu_obronna` — zero `foundCity`, zero ekspansji
- `civ-ai.json` / arkusz AI-zachowanie: kolumna `profilMapy`

## SILNIK

- `applyClusterStartPlan` / spawn obcych: konsumować pełny klaster
- Test: start Standard → ≥2 chińskie miasta AI, ten sam typ, brak 3. miasta przez 20 tur

**Batch:** `MAP-P1-01` + `CYW-P1-01`
