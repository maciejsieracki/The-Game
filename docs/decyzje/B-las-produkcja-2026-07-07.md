# Las — bonus produkcji (+1 Praca)

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | +1 Praca na hex z lasem (2026-07-07) |
| **Status** | **WDROŻONE** |
| **Powiązane** | `terrain-yields.json` · `economy.ts` · `hexContextTooltip.ts` |

---

## Ustalenie

Hex z nakładką **Las** dostaje **+1 Praca** względem dotychczasowych wartości.

Modyfikator lasu w danych: **Praca 2 → 3** (addytywnie do terenu bazowego).

Przykład **Równina + Las**: Praca **3 → 4** (bazowa 1 + las 3).

---

## Pliki

| Plik | Zmiana |
|------|--------|
| `gra/data/terrain-yields.json` | `terrain_modifiers` → Las: Praca 3 |
| `gra/src/game/economy.ts` | `FOREST_MODIFIER.praca` = 3 |
| `gra/src/ui/hexContextTooltip.ts` | `FOREST_BONUS.praca` = 3 (tooltip mapy) |

---

*Maciej 2026-07-07 — balans plonów lasu*
