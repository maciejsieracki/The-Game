# R-MP-ULEPSZENIA — ulepszenia terenu miast-państw (regres FALA 204)

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8`  
**Data:** 2026-08-04 · **PR:** #73

## Problem

Miasta-państwa (MP) przestały stawiać ulepszenia terenu (farma, kopalnia) — mimo wolnej Pracy w puli miasta.

## Przyczyna

Regres po scaleniu **FALA 204** (`R-AUTO-V2`): `pickAutoImprovements` dla AI wymagał rezerwy **30 Pracy PO koszcie** ulepszenia (`AUTO_ULEPSZENIA_PRACA_RESERVE`). Farma koszt 20 → min. 50 w puli; MP rzadko osiągają ten próg.

## Rozwiązanie

W `ai.ts` wywołanie pickera ulepszeń MP: **`pracaSurplusThreshold: 0`** (gracz nadal ma rezerwę 30 w `main.ts`).

## Pliki

`gra/src/game/ai.ts` · `gra/src/game/auto-improvements.ts` · `gra/tools/auto-improvements-test.cjs`
