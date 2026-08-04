# R-SCOUT-EXIT-AUTO — wyjście z auto-zwiedzania

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8`  
**Data:** 2026-08-04 · **PR:** #75

## Decyzja (bez pełnego ABC — doprecyzowanie UX)

Klik na zwiadowcę w trybie **Zwiedzaj** lub rozkaz marszu na heks **automatycznie wyłącza** `autoExplore` — bez ręcznego „Wyłącz zwiedzanie".

## Implementacja

| Akcja | Zachowanie |
|-------|------------|
| Zaznaczenie zwiadowcy z `autoExplore` | `clearScoutAutoExplore` → hint „Wyłączono zwiedzanie — ruch ręczny" |
| `planMarchTo` na zwiadowcy z auto | najpierw clear, potem marsz |

Helper: `clearScoutAutoExplore` w `scout-auto-explore.ts`.

## Powiązane

- Bazowy tryb: [`P-SCOUT-EXPLORE.md`](P-SCOUT-EXPLORE.md)
- Scoring kroków: [`R-SCOUT-BLACK-MAX.md`](R-SCOUT-BLACK-MAX.md)
