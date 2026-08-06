# R-DESIGN-PANEL-MIASTA-Q4 — hover/v2 bez makiety Design

**Status:** 🟢 **WDROŻONE (kod)** · **B** (2026-08-06)  
**Cytat Macieja:** „R-DESIGN-PANEL-MIASTA-Q4 b"

## Decyzja

**B** — domknij hover/v2 **bez makiety Design**: na pigułce miasta (mapa świata) hover pokazuje kategorię produkcji + ostrzeżenie o braku surowców (jak Q2=C), rozsądny wygląd; Design może później tylko polish.

## Wdrożenie (2026-08-06)

- `gra/src/render/cityMapStatChip.ts` — drugi wiersz pigułki na hover: kategoria + nazwa frontu kolejki + ikona ostrzeżenia surowców.
- `gra/src/render/cities.ts` — `pickStatChipCityIdAt`, `hoverStatChipCityId`, ostrzeżenie z magazynu państwa.
- `gra/src/main.ts` — raycast hover + `productionItemStockCostForRender` / `ownerSurowcePoolFor`.

Always-on MUST bez regresji (nazwa, pop, obrona 3 stany, medalion cywu, glif produkcji lite).
