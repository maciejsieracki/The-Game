# MP-ARMY-Q1 — Cap wojska miast-państw (łącznie z garnizonem)

| Pole | Wartość |
|------|---------|
| **ID** | MP-ARMY-Q1 |
| **Ekran** | Produkcja MP · armia na mapie · garnizon miasta |
| **Status** | 🟢 **WDROŻONE** — FALA 220 `8a3c6d6d` · commit `b47a2e8` |
| **Decyzja** | **A** |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> Cap = **łącznie żywe jednostki bojowe** (garnizon wliczony); **odbudowa do limitu** (nie jednorazowy blok).

---

## Reguła gameplay

| Trudność gry (`_menuDifficulty`) | Cap wojsk MP (owner łącznie) |
|----------------------------------|------------------------------|
| **Łatwy** | brak limitu (∞) |
| **Normalny** | max **1** jednostka bojowa |
| **Trudny** | **0** — zakaz nowej produkcji wojskowa |

- Licznik: `countOwnerMilitaryUnits` — wszystkie żywe jednostki **nie-cywilne** ownera (marsz + garnizon + pole).
- Po utratach MP może **odbudować** do capu (normal: z 0→1; easy: bez limitu).
- Skala = trudność **gry gracza**, nie suwak MP.

---

## Implementacja

- `city-state-difficulty.ts` → `cityStateMilitaryProductionCap`
- `ai.ts` → `chooseCityProduction` filtr wojskowy dla `defensiveCopy`
- Test: `ai-mp-military-cap-test.cjs` 16/16

---

## Powiązane

- `MP-GARRISON-Q1.md` — Hard: istniejące garnizony zostają, blokada tylko produkcji
- `R-AI-MP-WASAL-WCHLONIECIE.md` · `MP-DIPLO-Q1.md`
