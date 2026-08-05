# ZNALEZISKO-86 — panel „Szczegóły bitwy" (HP po bitwie)

**Status:** 🟢 **ZAMKNIĘTE**  
**Data:** 2026-07-27  
**Odpowiedź:** **A** — % HP + format jak `postBattleSummary` w „Szczegóły bitwy"

## Cytat Macieja

> ZNALEZISKO-86: **A** — % HP + format jak postBattleSummary w „Szczegóły bitwy".

## Implikacja

- Panel „Szczegóły bitwy" (`endDetails1E`) pokazuje przy każdej jednostce:
  - **procent HP** przed/po (jak `postBattleSummary`: np. `HP 62% → 41%`),
  - **pasek HP** (szerokość wg `hpAfterPct`),
  - odniesienie do maksimum (`maxHp`), nie same liczby bezwzględne bez kontekstu.

## Stan kodu (audyt 2026-08-05)

| Element | Stan | Dowód |
|---------|------|-------|
| `maxHp` w typie `EndDetailsUnitRow` | ✅ | `endDetails1E.ts` ~34 |
| Przekazanie `maxHp` z bitwy | ✅ | `battleScene.ts` (`_startAtkSnaps`) |
| **Procent HP** (`hpBeforePct → hpAfterPct`) | ✅ | `endDetails1E.ts` `hpText()` — np. `HP 62% → 41%` |
| **Pasek HP** w wierszu jednostki | ✅ | `endDetails1E.ts` `hpBarHtml()` + `unitRowHtml()` |
| Test regresji | ✅ | `gra/tools/end-details-hp-test.cjs` |

**Werdykt kodu:** **WDROŻONE** (FALA 37 + test 2026-08-05).
