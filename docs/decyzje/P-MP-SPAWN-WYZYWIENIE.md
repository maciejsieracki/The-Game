# P-MP-SPAWN-WYZYWIENIE — spawn MP Wyżywienie start ~3 zamiast 4

**Status:** NAPRAWIONE (`cursor/fix-mp-spawn-wyzywienie-63a1`)  
**Kanon Wyżywienia:** `DEFAULT_POZIOM_RACJI = 4` (`population-growth-v85.ts`, `B-WYZYWIENIE-SLIDER-2026-07-30.md`)

## Problem

Miasta-państwa (MP) po spawnie klastra miały suwak Wyżywienie ~3 zamiast oczekiwanego **4**.

## Root cause

`foundCity` / `foundCityAt` (`cities.ts`) ustawiały tylko `procentRozwoj: 100`, bez `poziomRacji`.

Ścieżka runtime:

1. `getCityRationLevel` → `migrateProcentRozwojToPoziomRacji(100)` → **6** (max)
2. `autoBalanceRationsToSolvency` dla ownerów AI/MP przy słabej produkcji startowej obniża z 6 → gracz widzi ~3

## Fix (STRICT-PARITY)

Przy founding **wszystkich** ownerów (gracz, major AI, MP):

- `poziomRacji: DEFAULT_POZIOM_RACJI` (4)
- `procentRozwoj: 67` (legacy zgodny z poziomem 4; `poziomRacji` ma pierwszeństwo)

## Legacy (stare save)

Miasta tylko z `procentRozwoj: 100` bez `poziomRacji` nadal migrują do 6 — **nowe spawny nie idą tą ścieżką**.

## Testy

`gra/tools/mp-spawn-ration-test.cjs` — spawn MP/major/gracz → 4; legacy migrate 100→6.
