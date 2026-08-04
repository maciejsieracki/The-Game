# R-NADMIAR-POOLS — FALA2 ×2 koszty (playtest)

**Status:** WDROŻONE (kod) — czeka deploy  
**Data decyzji:** 2026-08-04  
**Powiązane:** R-STAWKI-STROJENIE FALA1 (`R_STAWKI_KOSZT_MULT=2`)

## Decyzja Macieja

Dodatkowe **×2** na wybrane koszty (stacking z FALA1 tam, gdzie już było ×2). **Racje ludności** — tylko FALA1 (bez FALA2).

## FALA2 — obszary

| Obszar | Efekt łączny vs JSON |
|--------|----------------------|
| Utrzymanie budynków (gold/turę) | **×2** (nowe) |
| Koszt Pracy budynków | **×2** (po FALA1×0.5 global = 2.0 vs JSON) |
| `koszt_surowce` budynków | **×2** |
| Rekrutacja jednostek (Pieniądz) | **×2** |
| Utrzymanie jednostek | **×4** (FALA1+FALA2) |
| Żywność wojska | **×4** |
| Badania Kamień | **×2** (FALA1) |
| Badania Brąz + Żelazo | **×4** |
| Ulepszenia terenu `koszt_praca` (budowa) | **×2** |
| Cuda — Praca budowy | **×2** |
| Cuda — żywność przy starcie | = skalowana Praca, z `zapasyPanstwa` |

## Implementacja

Stałe i helpery: `gra/src/game/r-stawki-strojenie.ts` (`R_STAWKI_FALA2_MULT=2`).
