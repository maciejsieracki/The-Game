# R-MAPGEN-KOLEJNOSC-Q1 — Zamknięcie kolejności lasu w generatorze mapy

**Status:** 🟢 **WDROŻONA** — FALA 36 `a74c3797` (commit `2632156`)  
**Grupa:** A (mapa świata / generator)  
**Ekran:** [TEMAT: Generator mapy — kolejność lasu, złóż i reliefu]

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — temat obsługujemy tutaj; **nie** publishuj `gra-robocza/` |
| **Kod `gra/src`** | ✅ **GOTOWY** — `generator.ts` · jeden moment lasu |
| **Deploy `gra-robocza`** | ✅ **FALA 36** `a74c3797` (commit `2632156`) |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

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
