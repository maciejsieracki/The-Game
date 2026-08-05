# P-AI-PROD-GATE-PER-OWNER — bramka produkcji AI vs trudność per owner

**Status:** 🟢 **ZDEPLOYOWANE FALA 240** `d1450398` · Q1=**A**  
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

## Evaluator (AutoBot warstwa 2 — 2026-08-05)

**Werdykt:** **PASS**  
**Tip:** `27ba681` · branch `cursor/feat-ai-absorb-prod-gate-63a1`

| # | Oś | Wynik |
|---|-----|-------|
| 1 | SCOPE — diff tylko per-owner difficulty + wiring produkcji AI | ✅ |
| 2 | NO-SIDE-EFFECT — brak zmian formuły tech/epoki; zero absorb/Faza2 | ✅ |
| 3 | REGRESSION — major parity (T1/T4); MP slider oddzielnie (T2/T3) | ✅ |
| 4 | COUPLING — pure helper wyciągnięty; `effectiveGameDifficultyForOwner` bez nowego stanu | ✅ |
| 5 | STRICT — celowany test `ai-prod-gate-difficulty-test.cjs` 8/8 | ✅ |
| 6 | STRICT-EDGE — edge odwrócone slidery (T3); parity major vs MP (T2) | ✅ |
| 7 | STRICT-PARITY — major=menu; MP=city-state slider (T1–T4) | ✅ |
| 8 | STRICT-SAVE — zero nowych pól sejwu | ✅ |
| 9 | Bramki — `tsc --noEmit` 0 · test tematu 8/8 | ✅ |

**Pliki:** `gra/src/game/effective-difficulty-for-owner.ts` (nowy), `gra/src/main.ts` (`isProductionAllowed` + 3 ścieżki produkcji AI), `gra/tools/ai-prod-gate-difficulty-test.cjs`.

## Po PASS

Batch z P-AI-MAJOR-ABSORB Faza 1 jeśli równolegle.
