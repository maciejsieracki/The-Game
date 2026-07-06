# MAPA → INTEGRATOR — audit ulepszeń MAP-P1-04 (A4-D4)

**Data:** 2026-06-29  
**Status:** **→ INTEGRATOR: GOTOWE** (fixy lane; **bez** `main.ts`)

## Co dostarcza MAPA

| Plik | Zmiana |
|------|--------|
| `gra/data/terrain-improvements.json` | pastwisko `surowiecOdblokowany` tablica; warzelnia/plantacja teren zsynchronizowany z kodem |
| `gra/src/map/improvement-build.ts` | `buildImprovementQualifier()` export; cleanup martwego wpisu warzelnia |
| `gra/src/game/resource-access.ts` | parser tablicy + legacy JSON string |
| `gra/src/render/improvements.ts` | posterunek epoka 2 |
| `gra/src/placementpreview/main.ts` | kwalifikacja = kanon (sync) |
| `gra/src/mainview/main.ts` | j.w. |
| `gra/tools/map-improvement-qualify-test.cjs` | **18 pass** regresja kwalifikacji |

## INTEGRATOR

Tryb budowy + `createImprovementBuildApi` **już w main.ts** (F-HUD-2). Ten batch = **rebuild kanonu** po merge lane.

```bash
cd gra
node tools/map-improvement-qualify-test.cjs
node tools/map-deposits-era-test.cjs
npx vite build --outDir $env:TEMP\civ-dist
```

## Otwarte (nie blokuje)

| ID | Temat | Właściciel |
|----|-------|------------|
| R7 | Łodzie bez terytorium — ABC | Maciej |
| R11 | `Ulepszenie` enum pełny | SILNIK P2 |

## DoD

- [x] JSON ↔ `improvement-build.ts` zgodne (kwalifikacja)
- [x] Test regresji 18/18
- [x] Preview/mainview bez driftu warzelnia/pastwisko/plantacja
- [ ] Rebuild `Gra-podglad.html` po review Opus
