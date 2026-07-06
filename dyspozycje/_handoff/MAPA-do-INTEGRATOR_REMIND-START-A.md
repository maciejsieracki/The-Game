# MAPA → INTEGRATOR — REMIND-START-A (złoże rezerwuje hex)

| Pole | Wartość |
|------|---------|
| **Status handoff** | **GOTOWE** |
| **Decyzja** | REMIND-SUROWCE-ULEPSZENIA-START **A** (Maciej 2026-06-26) |
| **Lane** | Grupa A (MAPA) |

## Co przesyłam

- `gra/src/map/improvement-build.ts` — `hexHasDepositReserve()`, `depositAllowsPlayerImprovement()`, gate w `qualifies()`
- Test: `gra/tools/map-improvement-qualify-test.cjs` (REMIND-A asercje)

## Reguła

Hex ze złożem (`zloze` lub nakładka złoża) **blokuje** ulepszenia gracza, **wyjątek:** ulepszenie bezpośrednio wykorzystujące to złoże (glinianka, kopalnia, plantacja luksus, warzelnia soli, hodowla na pasującym złożu zwierzęcym, obóz łowiecki przy zwierzęcym złożu/lasie).

## Co Integrator ma zrobić

1. **Brak zmian w `main.ts` oczekiwany** — kwalifikacja idzie przez istniejące API `buildImprovementQualifier` / `createImprovementBuildApi`.
2. Self-test: `node tools/map-improvement-qualify-test.cjs` → 0 fail.
3. Po wpięciu w ROBOCZA: smoke budowy ulepszenia na hex bez złoża + odmowa farma/fort na hex ze złożem.

## DoD

- [ ] Test MAPA zielony
- [ ] Playtest: nie można postawić farmy/fortu na hex ze złożem mineralnym
- [ ] Glinianka/kopalnia/plantacja nadal działają na właściwym złożu
