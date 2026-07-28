# CIV-EPOCH-SPAWN-Q1 — pula typów na mapie = epoka startu

**Status:** WDROŻONA (2026-07-28)  
**Decydent:** Maciej

## Problem

Suwak „Liczba cywilizacji” mógł żądać 12–15 typów przy starcie w epoce kamienia, a `computeClusters()` brało typy z pełnego rosteru (15) bez filtra epoki — na mapę trafiały Celtowie, Germanie itd. z brązu/żelaza (brak jednostek/budynków epoki).

## Reguła

**Pula typów na mapie = wyłącznie cywilizacje dostępne w epoce startu gry** (kaskada `isCivAvailableAtGameEpoch` / D-CYW-EPOKA-WEJSCIA).

| Epoka startu | Max typów (stan 2026-07-28) |
|---|---|
| Kamień | 8 |
| Brąz | 14 (kamień + brąz) |
| Żelazo | 15 (pełna pula) |

- `nTypy = min(requested, availableAtStartEpoch)`
- Zakaz dublowania typów i wrzucania nacji z przyszłych epok
- Suwak kreatora: max i domyślna wartość clampowane do puli epoki; zmiana epoki → clamp suwaka

## Wdrożenie

- `gra/src/map/clusters.ts` — `rosterKluczeForStartEpoch`, `computeClusters({ startEpochId, civRoster })`
- `gra/src/map/cluster-spawn.ts`, `gra/src/game/cluster-start.ts` — przekazanie epoki
- `gra/src/main.ts` — `startEpochId: _menuEpochId`
- `gra/src/map/newGameMapDefaults.ts` — `maxCivTypesForStartEpoch`, clamp menu typów
- `gra/src/ui/newGameFlow.ts` — suwak zależny od `selEpoch`
- `gra/tools/cluster-start-test.cjs` — asercje kamień/brąz/żelazo
