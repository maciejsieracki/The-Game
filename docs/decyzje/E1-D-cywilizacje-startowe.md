# E1-D — Cywilizacje startowe (Grupa D)

**Ekran:** Menu / logika startu  
**Status:** **E1-D-Q1 ZAMKNIĘTE** · implementacja częściowa (moduł + handoff SILNIK)  
**Handoff Master:** `docs/grupa-e/handoff/E1-do-GRUPA-D_cywilizacje-startowe.md`

## Decyzje Macieja

| # | Pytanie | Decyzja | Data |
|---|---------|---------|------|
| **E1-D-Q1** | Które typy z rosteru 9 są na mapie? | **A** — losowo co grę, unikalne (seed); gracz zawsze w puli | 2026-06-27 |

### E1-D-Q1=A — reguła

1. `aktywneTypy` = cap z rozmiaru mapy (3/5/7/9) — `newGameMapDefaults.ts`.
2. Typów na mapie = `min(aktywneTypy, 1 + liczba AI)` — nie wymuszamy pełnych 7 na standardzie przy 4 rywalach.
3. Losujemy unikalny zestaw typów (seed gry) **zawierający nację gracza**.
4. Każdy AI owner dostaje **inny** typ niż gracz i inne AI.

## Implementacja

| Element | Plik | Status |
|---------|------|--------|
| Pure funkcje | `gra/src/game/civ-roster.ts` | **GOTOWE** |
| Testy | `gra/tools/civ-roster-test.cjs` | **GOTOWE** |
| Wpięcie main.ts | `assignAiCivTypes` + `aktywneTypyFromMapLabel` | **CZEKA SILNIK** |

Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_E1-roster-startowy.md`

## → SILNIK

**CZEKA** — zamiana round-robin w `main.ts` (2 miejsca) na `assignAiCivTypes`.
