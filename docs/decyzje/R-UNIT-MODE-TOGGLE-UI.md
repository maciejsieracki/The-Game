# R-UNIT-MODE-TOGGLE-UI — pasek akcji: tryby WŁ/WYŁ

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8`  
**Data:** 2026-08-04 · **PR:** #77

## Problem

Przyciski trybu (Ufortyfikuj, Czuwaj, Zwiedzaj) wyglądały tak samo w stanie WŁ i WYŁ — trudno odróżnić aktywny tryb od zwykłego dostępnego lub zablokowanego.

## Rozwiązanie — trzy stany wizualne

| Stan | Klasa CSS | Wygląd |
|------|-----------|--------|
| **WYŁ** (dostępny) | `uc-act-btn` | Szary, neutralny |
| **WŁ** (aktywny tryb) | `uc-act-btn uc-act-btn--on` | Złoty gradient, `aria-pressed="true"` |
| **Zablokowany** | `uc-act-btn:disabled` | Opacity 0.38 |

Pole `active: boolean` na akcjach fortify / sentry / scout-explore w `main.ts` → `buildUnitActionBarHtml`.

## Pliki

`gra/src/ui/unitActionBarHtml.ts` · `gra/src/main.ts` (actions push z `active:`)
