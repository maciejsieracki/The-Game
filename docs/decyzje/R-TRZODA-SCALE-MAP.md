# R-TRZODA-SCALE-MAP — krowa + świnia niewidoczne na mapie

**Data:** 2026-08-04  
**Status:** CZEKA-NA-DECYZJĘ  
**Ekran:** Mapa świata — złoże / ulepszenie **Trzoda** (bydło)

## Sytuacja

Modele krowy i świni na heksie używają skali `PASTWISKO_S = 2.05/3 ≈ 0,68` (`pastwisko-modele.ts` / `swinia-trzoda.ts`). Przy typowej kamerze są zbyt małe — Maciej: „niewidoczna na mapie”.

## Propozycja Macieja

Powiększyć symbole **trzody (świnia + krowa) o 50%** (mnożnik **×1,5**).

## Pliki (po decyzji)

- `gra/src/render/swinia-trzoda.ts` — skala kompozycji `buildTrzoda`
- `gra/src/render/pastwisko-modele.ts` / `styleResources.ts` — spójnie dla ścieżki bydło/krowa na mapie
- **Nie** ruszać owiec/lamy, chyba że Q1=B/C

## ABC

`R-TRZODA-SCALE-MAP-Q1` — zakres (rek. **A**: tylko krowa+świnia ×1,5).
