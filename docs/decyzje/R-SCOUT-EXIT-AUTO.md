# R-SCOUT-EXIT-AUTO — wyjście z auto-zwiedzania

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8` · **korekta UX** `R-SCOUT-ZWIEDZAJ-HIGHLIGHT` 2026-08-04  
**Data:** 2026-08-04 · **PR:** #75

## Decyzja (bez pełnego ABC — doprecyzowanie UX)

Rozkaz marszu / ruch ręczny na heks **automatycznie wyłącza** `autoExplore` — bez ręcznego „Wyłącz zwiedzanie".

**Korekta 2026-08-04 (Maciej):** samo **zaznaczenie** zwiadowcy **nie** wyłącza Zwiedzaj — inaczej przycisk nigdy nie pokazuje stanu WŁ (złota ramka). Wyjście: toggle albo rozkaz ruchu. Patrz [`R-SCOUT-ZWIEDZAJ-HIGHLIGHT.md`](R-SCOUT-ZWIEDZAJ-HIGHLIGHT.md).

## Implementacja

| Akcja | Zachowanie |
|-------|------------|
| Zaznaczenie zwiadowcy z `autoExplore` | **bez zmian** flagi — widać tryb WŁ na pasku |
| `planMarchTo` / `beginMoveSelectedUnitTo` | `clearScoutAutoExplore` → ruch ręczny |
| Toggle „Wyłącz zwiedzanie” | `autoExplore = false` |

Helper: `clearScoutAutoExplore` w `scout-auto-explore.ts`.

## Powiązane

- Bazowy tryb: [`P-SCOUT-EXPLORE.md`](P-SCOUT-EXPLORE.md)
- Scoring kroków: [`R-SCOUT-BLACK-MAX.md`](R-SCOUT-BLACK-MAX.md)
- Highlight WŁ: [`R-SCOUT-ZWIEDZAJ-HIGHLIGHT.md`](R-SCOUT-ZWIEDZAJ-HIGHLIGHT.md)
