# PYTANIE 21 — pole `odblokowuje` w buildings.json

**Status:** 🟢 **WDROŻONA**  
**Mapowanie:** decyzja **55B** (nie formalne PYTANIE-21 ABC — szkic miał rekom. B, wdrożono B)

## Decyzja

**B** — silnik czyta pole `odblokowuje` z danych budynku; koniec hardkodu `id === 'mury'` w `main.ts`.

## Dowód

- `gra/src/game/production.ts` (~615–634) — `applyBuildingUnlockFlags`
- `gra/src/data/loader.ts` — pole w typie `BuildingDef`
- `dyspozycje/WERSJE.md` — deploy z 55B
