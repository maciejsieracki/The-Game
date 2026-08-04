# R-BUDYNKI-NIEAKTYWNE — czerwona czcionka dla nieaktywnych budynków

**Status:** ZAPISANA · wdrożone w kodzie · czeka deploy  
**Data:** 2026-08-04  
**Decyzje Macieja:** Q1=A · Q2=A+C · Q3=A

## Decyzje

| ID | Wybór | Treść |
|----|-------|-------|
| R-BUDYNKI-NIEAKTYWNE-Q1 | **A** | Lista „Wybudowane”: **czerwona nazwa** + **tooltip** z przyczyną |
| R-BUDYNKI-NIEAKTYWNE-Q2 | **A+C** | Spichlerz I/II + każdy budynek z **runtime gate w kodzie** (`buildingRuntimeGateMet` / deposit-linked / Mennica) — bez wymyślania gate’ów z JSON |
| R-BUDYNKI-NIEAKTYWNE-Q3 | **A** | Tooltip: lista braków, np. `Brak: Ceramika` lub `Brak: Ceramika, Sól` |

## Implementacja

- **API:** `resolveOwnedBuildingInactiveStatus` w `gra/src/game/building-resource-gate.ts`
- **UI:** `appendOwnedBuildingRow` w `gra/src/ui/cityPanel.ts` — klasa `.bld-owned-name--inactive`, `title` z tooltipem
- **Spichlerz:** `paySpichlerzDrainForCity(..., dryRun=true)` — Ceramika (I/II), Sól (tylko II)
- **Mennica / deposit:** `missingRuntimeResourceLabels` + `filterRuntimeActiveBuiltIds` (jak silnik)
- **Test:** `gra/tools/owned-building-inactive-test.cjs`

Pełne ABC (pytanie): `docs/decyzje/R-BUDYNKI-NIEAKTYWNE-pytanie.md`
