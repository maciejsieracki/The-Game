# R-MAPGEN-KOLEJNOSC-Q1 — Zamknięcie kolejności lasu w generatorze mapy

**Status:** 🔵 W TRAKCIE (kod gotowy, bez deploy)  
**Grupa:** A (mapa świata / generator)  
**Ekran:** [TEMAT: Generator mapy — kolejność lasu, złóż i reliefu]

## Odpowiedź Macieja

> **R-MAPGEN-KOLEJNOSC-Q1: B** — zamknąć rejestr + usunąć pośredni las z `classifyTerrain` / `reapplyLandTerrain`.

## Wdrożenie (opcja B)

| Element | Zmiana |
|---------|--------|
| `classifyTerrain` | Tylko teren bazowy — **bez** `Nakladka.Las` |
| `classifyTerrainFlat` | Jak wyżej |
| `reapplyForestOverlay` | **Jedyny** moment lasu (po reliefie + rzekach, przed złożami) |
| `generator.ts` | Komentarz przebiegu 1; `forest` usunięty z `terrainTh` |
| Kolejność pipeline | teren → relief → rzeki → **las** → złoża (bez zmian kolejności kroków) |

## Testy

- `fair-play-grid-test.cjs`
- `relief-grid-coverage-test.cjs`
- `map-gen-regression-test.cjs`
