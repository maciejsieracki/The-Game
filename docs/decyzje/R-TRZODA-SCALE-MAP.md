# R-TRZODA-SCALE-MAP — zwierzęta pastwiska / trzody za małe na mapie

**Data:** 2026-08-04  
**Status:** 🟢 WDROŻONE w kodzie  
**Ekran:** Mapa świata — złoże / ulepszenie Trzoda + pastwisko

## ECHO decyzji Macieja (2026-08-04)

| ID | Litera | Znaczenie |
|----|--------|-----------|
| `R-TRZODA-SCALE-MAP-Q1` | **B** | ×**1,5** dla **krowy, świni, owcy i lamy** (wszystkie modele na `PASTWISKO_S`) |

> Rek. była A (tylko krowa+świnia). Maciej wybrał **B** — szerszy zakres.

## Sytuacja

`PASTWISKO_S = 2.05/3 ≈ 0,68` — za małe przy kamerze mapy.

## AC

1. Skala efektywna = `PASTWISKO_S * 1.5` (lub równoważny mnożnik) dla: `buildKrowa`, `buildSwinia`, `buildOwca`, `buildLama` / kompozycje `buildTrzoda` / pastwisko.
2. Środek heksa nadal wolny pod budynek (layout bez zmian pozycji slotów — tylko skala brył).
3. Bez redesignu meshów — tylko skala.

**Pliki:** `pastwisko-modele.ts`, `swinia-trzoda.ts` (+ ewentualnie `styleResources.ts` jeśli lokalna skala).
