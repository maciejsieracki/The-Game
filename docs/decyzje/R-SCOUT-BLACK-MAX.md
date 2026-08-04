# R-SCOUT-BLACK-MAX — auto-zwiedzanie: max nowych czarnych heksów

**Status:** wdrożone (kod)  
**Data:** 2026-08-04

## Decyzje Macieja

| ID | Decyzja |
|----|---------|
| Q1 | **A** — każdy krok max **nowych czarnych** (nigdy odkrytych) heksów. Preferuj `newBlack > 0`; krok z zerem tylko gdy brak dodatniego. Nie preferuj FoW (odkryte, przyciemnione) dla samej mgły. |
| Q2 | **A** — chatka tylko gdy w **bieżącym widoku** lub **w zasięgu MP tej tury**. Po zebraniu (`istnieje=false`) — powrót do max czerni. |

## Implementacja

- `gra/src/game/scout-auto-explore.ts` — `scoreMarginalReveal`, `pickBestExploreStep`, `pickKnownVillageTarget` (widok + reachable)
- `gra/tools/scout-auto-explore-test.cjs`
