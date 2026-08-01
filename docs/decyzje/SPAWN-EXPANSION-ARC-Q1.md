# SPAWN-EXPANSION-ARC-Q1 — wolna strona na ekspansję gracza

**Status:** 🟢 WDROŻONE (kod + ROBOCZA FALA 142)  
**Data:** 2026-08-01  
**Decyzja Macieja:** **A**

## Pytanie
Czy generator ma ustawiać miasta-państwa tego samego typu tylko po jednej stronie stolicy gracza (zamiast pełnego pierścienia), żeby zostało miejsce na własne miasta?

## Opcje
- **A. Półpłaszczyzna (180°)** — wszystkie MP tego samego typu po jednej stronie; druga połowa wolna pod ekspansję
- **B. Klin ~120°**
- **C. Bez zmiany geometrii — tylko większy dystans / mniej MP**

## Odpowiedź Macieja
**A** (2026-08-01 ~22:28) — „a”. Potem „2” = działaj + deploy. Deploy all (~22:35) bez sceny Pangea.

## Wdrożenie
🟢 `computeSameTypeRivalHalfPlaneAxis` / `isInSameTypeRivalHalfPlane` w `clusters.ts` + pack kandydatów; oś ku środkowi mapy. ROBOCZA `2b1e072c`.
