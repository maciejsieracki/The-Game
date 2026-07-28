# MAP-SPAWN-Q1 — Spawn cywilizacji: kontynenty zamiast wysp

**Status:** 🟢 WDROŻONA w `gra/src` (2026-07-28) — bez deployu ROBOCZA  
**Decydent:** Maciej  
**Cytat:** „Spawn cywilizacji — kontynenty zamiast wysp **c+b**”  
**Dowód:** `clusters.ts` · `cluster-spawn.ts` · `startScoring.ts` · `cluster-start-test.cjs` · `tsc` OK

## Decyzja

**C + B** (łączone):

### C — Kontynenty pierwsze, wyspy tylko duże (fallback)
- Środki klastrów typów cywilizacji **wyłącznie na top N masach lądu** (N = liczba typów), posortowanych malejąco po rozmiarze flood-fill.
- **Usunąć fazę 2** „jeden typ na każdą wyspę ≥12 hexów”.
- Faza round-robin tylko na **kwalifikujących** masach (≥25% rozmiaru największej masy).
- **Miękki fallback:** dopiero po zapełnieniu kontynentów — wyspa kwalifikuje się, gdy ma **≥25% rozmiaru największej masy lądu** (min. próg 12 hexów).

### B — Próg 70% lokalnego lądu wokół stolicy (Maciej 2026-07-28, doprecyzowanie)

**NIE** (tylko) „masa lądu = 70% regionu Voronoi”.

**TAK:** w **okolicy hexu startu / stolicy** (promień **R = 3** hexy) udział lądu zamieszkiwalnego **≥ 70%** (morze, wybrzeże, góry nie liczą się). Cel: zero startowych miast na wysepkach otoczonych oceanem.

Dodatkowo dla **gracza** (twardsze):
- Środek klastra gracza (`centrumy[0]`) **zawsze** z `masses[0]` (największy kontynent), gdy spełnia bramki.
- `playerStartHex` — ten sam test co stolica; kandydaci tylko z lokalnym ≥70% **oraz** masa flood-fill ≥ **25 hex** (przy 70% lokalnym) **albo** ≥ **max(30, 8% największej masy)**.
- Wyspa ~16 hex → odpada (masa < 25 i < 30).
- Obcy typ: lokalny 70% w R=3; brak spełnienia → relokacja na większą masę lub pominięcie typu (nie spawn „na siłę” na złej wyspie).

Implementacja:
- `localLandFraction(map, q, r, R=3)` — dysk hexów mapy w promieniu R
- `passesPlayerStartMassGate` — gracz + stolica
- `pickPlayerClusterCenter` — preferencja `masses[0]`
- `findBestPlayerStartHex` (mgła przed miastem) — ta sama bramka
- `cluster-spawn.ts` — walidacja `playerStartHex` po `computeClusters`

## Pliki wdrożenia

- `gra/src/map/clusters.ts` — `placeClusterCentersAcrossLandmasses`, `computeClusters`, bramki B
- `gra/src/map/cluster-spawn.ts` — `playerStartHex` po walidacji
- `gra/src/map/startScoring.ts` — `findBestPlayerStartHex`
- `gra/tools/cluster-start-test.cjs` — testy regresji (7-hex + 16-hex wyspa, 8 typów standard)

## Warstwa

🟡 cross (generator startu gry, bez `main.ts`)
