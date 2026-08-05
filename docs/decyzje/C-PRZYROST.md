# C-PRZYROST — etykiety przyrostu budynków w panelu miasta

**Status:** 🟢 **WDROŻONA** (2026-08-05)  
**Decyzja Macieja:** **A** — naprawić UI, NIE ruszać silnika.

## Problem

Panel miasta pokazywał surowe pola JSON `baza` i `przyrost` (np. „+5 Kultura/turę (+3/turę/poz.)”), co myliło gracza — szczególnie przy Pałacu („+3, +5, +7” wyglądało jak bonus za awans tieru, a nie skalowanie z epoką miasta).

## Rozwiązanie

Wyłącznie warstwa prezentacji w `gra/src/ui/cityPanel.ts`:

- chipy i karty budynków używają `buildingEffectAtLevel(baza, przyrost, poziom)` — tej samej funkcji co silnik;
- poziom = `buildingLevelForEpoch` dla miasta (jak w ekonomii);
- zamiast „+X na poziom” pokazywana jest **realna wartość na turę** przy obecnym poziomie + opcjonalna skala L1…Ln.

## Formuła silnika (bez zmian)

`buildingEffectAtLevel` = `baza + przyrost × (poziom − 1)` (`gra/src/game/production.ts`).

## Dowód

- `formatBuildingYieldChipText` / `formatBuildingYieldDetailValue` — przeliczają przez `buildingEffectAtLevel`
- `buildingBonusChipsHtml`, `buildBuildingDetailCard`, `buildUpgradeBonusDetailCard` — przekazują poziom miasta
