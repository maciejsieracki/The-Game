# P-AI-PROD-GATE-PER-OWNER — bramka produkcji AI vs trudność per owner

**Status:** 🔵 W TRAKCIE (ECHO 2026-08-05)  
**Powiązane:** `R-TRUDNOSC-1` · `effectiveGameDifficultyForOwner` · P-AI-014

## ECHO (Maciej 2026-08-05)

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **P-AI-PROD-GATE-Q1** | **A** | W `isProductionAllowed` użyj trudności **per owner** |

## AC

1. W `main.ts` callback `isProductionAllowed` (ścieżka AI): `difficulty: effectiveGameDifficultyForOwner(ownerId)` zamiast `_menuDifficulty`.
2. Semantyka: MP/defensiveCopy → suwak miast-państw; major AI → trudność gry (jak dziś dla majorów).
3. **ZAKAZ** zmiany formuły tech/epoki (już per-owner).
4. Test: celowany (np. MP easy vs global hard → koszty/bramka używa easy) **albo** rozszerzenie istniejącego harnessu AI production.
5. Edge: owner major → wynik identyczny jak przy `_menuDifficulty` (regresja zero dla major).
6. STRICT-SAVE: zero nowych pól sejwu.

## Po PASS

Batch z P-AI-MAJOR-ABSORB Faza 1 jeśli równolegle.
