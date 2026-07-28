# CIV-MAP-EPOCH-Q1 — macierz mapa × epoka startu (typy cywilizacji)

**Status:** WDROŻONA (2026-07-28)  
**Decydent:** Maciej  
**Opcja:** **A** — pełna macierz mapa × epoka z min/default/max (±1), zawsze z miejscem na ruch w ramach puli epoki

## Pule epok (max typów w rosterze)

| Epoka | Pula |
|---|---|
| Kamień | 8 |
| Brąz | 14 |
| Żelazo | 15 |

## Macierz domyślnych typów cywilizacji

Reguła: `1 ≤ min < default < max ≤ pula_epoki` · `min = default − 1` · `max = default + 1` (clamp do puli).

| Mapa | Kamień def (min–max) | Brąz def (min–max) | Żelazo def (min–max) |
|---|---|---|---|
| Maleński | 3 (2–4) | 4 (3–5) | 4 (3–5) |
| Mały | 4 (3–5) | 5 (4–6) | 5 (4–6) |
| Standardowy | 5 (4–6) | 6 (5–7) | 6 (5–7) |
| Duży | 6 (5–7) | 9 (8–10) | 10 (9–11) |
| Ogromny | 7 (6–8) | 11 (10–12) | 12 (11–13) |
| Super Huge | 7 (6–8) | 13 (12–14) | 14 (13–15) |

## Powiązanie z CIV-EPOCH-SPAWN-Q1

Suwak kreatora bierze zakres z macierzy (mapa + epoka). Clamp do puli epoki (`maxCivTypesForStartEpoch`) zostaje jako bezpiecznik. Spawn (`computeClusters`) filtruje roster po epoce — bez zmian reguły.

## Wdrożenie

- `gra/data/e-start-params.json` — `typy_cywilizacji_per_epoka` per skala mapy
- `gra/src/data/e-start-params-loader.ts` — odczyt macierzy + kompatybilność `typy_cywilizacji`
- `gra/src/map/newGameMapDefaults.ts` — `civTypesTripleForMapLabel`, `civTypesMenuForMapLabel`, `defaultCivTypesFromMapLabel`
- `gra/src/ui/newGameFlow.ts` — przeładowanie suwaka przy zmianie mapy lub epoki (już `syncCivTypesOptions`)
- `gra/tools/map-scale-menu-test.cjs` — asercje macierzy + pul epok
