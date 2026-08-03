# P-TRIUMPH-CS — triumf po zjednoczeniu miast-państw

**Status:** ZDEPLOYOWANE `5f529a24` (FALA 203)  
**Data decyzji:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **P-TRIUMPH-CS-Q1** | **B** | Po przejęciu przez gracza ostatniego żyjącego miasta-państwa **tej samej cywilizacji** (siostry w `typCityCopyOwners`) — **dłuższy komunikat triumfu** (`showHintMessage`, ~9–10 s). Nie pełny modal (A). Nie tylko po obcych cywilizacjach (C). |

## Implementacja

- `gra/src/game/triumph-city-state.ts` — `shouldShowPlayerTriumphCityStateUnification`, `buildTriumphCityStateUnificationMessage`
- Hook: `runCapitalCapturePlunder` w `main.ts`, gałąź eliminacji, **przed** `eliminateOwner(oldOwner)`
- Testy: `gra/tools/triumph-city-state-test.cjs`
