# MAP-SPAWN-Q1 — Spawn cywilizacji: kontynenty zamiast wysp

**Status:** 🟢 WDROŻONA w `gra/src` (2026-07-28) — bez deployu ROBOCZA  
**Decydent:** Maciej  
**Cytat:** „Spawn cywilizacji — kontynenty zamiast wysp **c+b**”  
**Dowód:** `clusters.ts` · `cluster-start-test.cjs` 106/106 · `tsc` OK

## Decyzja

**C + B** (łączone):

### C — Kontynenty pierwsze, wyspy tylko duże (fallback)
- Środki klastrów typów cywilizacji **wyłącznie na top N masach lądu** (N = liczba typów), posortowanych malejąco po rozmiarze flood-fill.
- **Usunąć fazę 2** „jeden typ na każdą wyspę ≥12 hexów”.
- Faza 3 (round-robin) tylko na **kwalifikujących** masach.
- **Miękki fallback:** jeśli po zapełnieniu kontynentów zostały wolne sloty typów — dopiero wtedy wyspa kwalifikuje się, gdy ma **≥25% rozmiaru największej masy lądu** na mapie (min. dotychczasowy próg 12 hexów).

### B — Próg 70% spójności regionu Voronoi
- Po podziale Voronoi, przed `buildClusterCities` dla typu obcego (i gracza): spawn miast **tylko** gdy spójna masa lądu zawierająca środek klastra stanowi **≥70%** lądu w regionie Voronoi tego typu.
- Region nie spełniający progu → **pomiń typ** (mniej aktywnych typów niż w kreatorze) lub przenieś środek na największą masę w regionie (implementacja: preferować przeniesienie środka, jeśli możliwe; inaczej pomiń).

## Pliki wdrożenia

- `gra/src/map/clusters.ts` — `placeClusterCentersAcrossLandmasses`, `computeClusters`
- `gra/tools/cluster-start-test.cjs` — testy regresji

## Warstwa

🟡 cross (generator startu gry, bez `main.ts`)
