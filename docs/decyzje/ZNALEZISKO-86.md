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

## Stan kodu (audyt 2026-07-27)

| Element | Stan | Dowód |
|---------|------|-------|
| `maxHp` w typie `EndDetailsUnitRow` | ✅ | `endDetails1E.ts` ~34 |
| Przekazanie `maxHp` z bitwy | ✅ | `battleScene.ts` ~8765–8768 (`_startAtkSnaps`) |
| Format tekstu `hpAfter/maxHp HP (−loss)` | ✅ częściowo | `endDetails1E.ts` `hpText()` ~90–95 |
| **Procent HP** (`hpBeforePct → hpAfterPct`) | ❌ | brak — inny format niż `postBattleSummary` |
| **Pasek HP** w wierszu jednostki | ❌ | `unitRowHtml` — tylko tekst, bez paska |

**Werdykt kodu:** **CZĘŚCIOWO** — `maxHp` już dociera; brakuje % i paska jak w `postBattleSummary.ts`.

## Co dalej

Wdrożenie na **`działaj`** (lane C): w `endDetails1E.ts` dodać obliczenie pct + mini-pasek (wzorzec z `postBattleSummary.ts` / `battle-summary.ts`).
